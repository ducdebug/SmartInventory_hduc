package com.ims.smartinventory.service.impl;

import com.ims.common.config.TransactionType;
import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.UserEntity;
import com.ims.common.entity.management.InventoryTransactionEntity;
import com.ims.common.entity.management.LotEntity;
import com.ims.smartinventory.dto.Response.FinancialAnalyticsResponse;
import com.ims.smartinventory.repository.InventoryTransactionRepository;
import com.ims.smartinventory.repository.LotRepository;
import com.ims.smartinventory.repository.ProductRepository;
import com.ims.smartinventory.repository.UserRepository;
import com.ims.smartinventory.service.FinancialAnalyticsService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FinancialAnalyticsServiceImpl implements FinancialAnalyticsService {

    private final ProductRepository productRepository;
    private final LotRepository lotRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public FinancialAnalyticsServiceImpl(ProductRepository productRepository,
                                         LotRepository lotRepository,
                                         InventoryTransactionRepository transactionRepository,
                                         UserRepository userRepository) {
        this.productRepository = productRepository;
        this.lotRepository = lotRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    @Override
    public FinancialAnalyticsResponse getFinancialAnalytics() {
        FinancialAnalyticsResponse response = new FinancialAnalyticsResponse();
        response.setSupplierIncomeData(calculateSupplierIncomeData());
        response.setBuyerSpendingData(calculateBuyerSpendingData());
        response.setMonthlyTrends(calculateMonthlyTrends());
        response.setFinancialSummary(calculateFinancialSummary());

        return response;
    }

    private FinancialAnalyticsResponse.SupplierIncomeData calculateSupplierIncomeData() {
        FinancialAnalyticsResponse.SupplierIncomeData data = new FinancialAnalyticsResponse.SupplierIncomeData();
        List<BaseProductEntity> soldProducts = productRepository.findBySecondaryPriceIsNotNull();
        double totalIncome = soldProducts.stream()
                .mapToDouble(p -> p.getSecondaryPrice() != null ? p.getSecondaryPrice().getValue() : 0.0)
                .sum();

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        List<BaseProductEntity> monthlySoldProducts = soldProducts.stream()
                .filter(p -> p.getLot() != null && p.getLot().getImportDate() != null &&
                        p.getLot().getImportDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime().isAfter(oneMonthAgo))
                .toList();

        double monthlyIncome = monthlySoldProducts.stream()
                .mapToDouble(p -> p.getSecondaryPrice() != null ? p.getSecondaryPrice().getValue() : 0.0)
                .sum();

        data.setTotalIncome(totalIncome);
        data.setMonthlyIncome(monthlyIncome);
        data.setTotalProductsSold(soldProducts.size());
        data.setMonthlyProductsSold(monthlySoldProducts.size());
        data.setAverageOrderValue(soldProducts.isEmpty() ? 0.0 : totalIncome / soldProducts.size());

        Map<String, Double> supplierIncomes = new HashMap<>();
        Map<String, Integer> supplierProductCounts = new HashMap<>();

        for (BaseProductEntity product : soldProducts) {
            if (product.getLot() != null && product.getLot().getUser() != null) {
                String supplierId = product.getLot().getUser().getId();
                double income = product.getSecondaryPrice() != null ? product.getSecondaryPrice().getValue() : 0.0;

                supplierIncomes.merge(supplierId, income, Double::sum);
                supplierProductCounts.merge(supplierId, 1, Integer::sum);
            }
        }

        List<FinancialAnalyticsResponse.TopSupplier> topSuppliers = supplierIncomes.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(10)
                .map(entry -> {
                    FinancialAnalyticsResponse.TopSupplier supplier = new FinancialAnalyticsResponse.TopSupplier();
                    String supplierId = entry.getKey();
                    UserEntity user = userRepository.findById(supplierId).orElse(null);

                    supplier.setSupplierId(supplierId);
                    supplier.setSupplierName(user != null ? user.getUsername() : "Unknown");
                    supplier.setTotalIncome(entry.getValue());
                    supplier.setProductsSold(supplierProductCounts.get(supplierId));

                    return supplier;
                })
                .collect(Collectors.toList());

        data.setTopSuppliers(topSuppliers);

        return data;
    }

    private FinancialAnalyticsResponse.BuyerSpendingData calculateBuyerSpendingData() {
        FinancialAnalyticsResponse.BuyerSpendingData data = new FinancialAnalyticsResponse.BuyerSpendingData();
        List<InventoryTransactionEntity> exportTransactions = transactionRepository.findByType(TransactionType.EXPORT);
        List<BaseProductEntity> purchasedProducts = productRepository.findBySecondaryPriceIsNotNull();

        double totalSpending = purchasedProducts.stream()
                .mapToDouble(p -> p.getSecondaryPrice() != null ? p.getSecondaryPrice().getValue() : 0.0)
                .sum();

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
        List<BaseProductEntity> monthlyPurchases = purchasedProducts.stream()
                .filter(p -> p.getLot() != null && p.getLot().getImportDate() != null &&
                        p.getLot().getImportDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime().isAfter(oneMonthAgo))
                .toList();

        double monthlySpending = monthlyPurchases.stream()
                .mapToDouble(p -> p.getSecondaryPrice() != null ? p.getSecondaryPrice().getValue() : 0.0)
                .sum();

        data.setTotalSpending(totalSpending);
        data.setMonthlySpending(monthlySpending);
        data.setTotalOrdersPlaced(exportTransactions.size());
        data.setMonthlyOrdersPlaced((int) exportTransactions.stream()
                .filter(t -> t.getTimestamp().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime().isAfter(oneMonthAgo))
                .count());
        data.setAverageOrderValue(exportTransactions.isEmpty() ? 0.0 : totalSpending / exportTransactions.size());

        // Calculate real top buyers based on actual spending
        List<FinancialAnalyticsResponse.TopBuyer> topBuyers = getTopBuyersBySpending(10);
        data.setTopBuyers(topBuyers);

        return data;
    }

    private List<FinancialAnalyticsResponse.FinancialTrendData> calculateMonthlyTrends() {
        List<FinancialAnalyticsResponse.FinancialTrendData> trends = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime monthStart = LocalDateTime.now().minusMonths(i).withDayOfMonth(1);
            LocalDateTime monthEnd = monthStart.plusMonths(1).minusDays(1);
            List<LotEntity> monthlyLots = lotRepository.findByImportDateBetween(
                    Date.from(monthStart.atZone(ZoneId.systemDefault()).toInstant()),
                    Date.from(monthEnd.atZone(ZoneId.systemDefault()).toInstant())
            );

            List<BaseProductEntity> monthlyProducts = new ArrayList<>();
            for (LotEntity lot : monthlyLots) {
                monthlyProducts.addAll(productRepository.findByLotId(lot.getId()));
            }

            double supplierIncome = monthlyProducts.stream()
                    .filter(p -> p.getSecondaryPrice() != null)
                    .mapToDouble(p -> p.getSecondaryPrice().getValue())
                    .sum();

            List<InventoryTransactionEntity> monthlyTransactions = transactionRepository.findByTimestampBetween(
                    Date.from(monthStart.atZone(ZoneId.systemDefault()).toInstant()),
                    Date.from(monthEnd.atZone(ZoneId.systemDefault()).toInstant())
            );

            FinancialAnalyticsResponse.FinancialTrendData trend = new FinancialAnalyticsResponse.FinancialTrendData();
            trend.setMonth(monthStart.getMonth().toString() + " " + monthStart.getYear());
            trend.setSupplierIncome(supplierIncome);
            trend.setBuyerSpending(supplierIncome); // For demo, buyer spending equals supplier income
            trend.setTransactionCount(monthlyTransactions.size());

            trends.add(trend);
        }

        return trends;
    }

    @Override
    public List<FinancialAnalyticsResponse.TopBuyer> getTopBuyersBySpending(int limit) {
        List<BaseProductEntity> purchasedProducts = productRepository.findBySecondaryPriceIsNotNull()
                .stream()
                .filter(p -> p.getDispatch() != null)
                .toList();

        Map<String, Double> buyerSpending = new HashMap<>();
        Map<String, Integer> buyerOrderCounts = new HashMap<>();

        for (BaseProductEntity product : purchasedProducts) {
            if (product.getDispatch() != null && product.getDispatch().getUser() != null) {
                String buyerId = product.getDispatch().getBuyerId();
                double spending = product.getSecondaryPrice() != null ? product.getSecondaryPrice().getValue() : 0.0;

                buyerSpending.merge(buyerId, spending, Double::sum);
                buyerOrderCounts.merge(buyerId, 1, Integer::sum);
            }
        }

        return buyerSpending.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    FinancialAnalyticsResponse.TopBuyer buyer = new FinancialAnalyticsResponse.TopBuyer();
                    String buyerId = entry.getKey();
                    UserEntity user = userRepository.findById(buyerId).orElse(null);

                    buyer.setBuyerId(buyerId);
                    buyer.setBuyerName(user != null ? user.getUsername() : "Unknown");
                    buyer.setTotalSpending(entry.getValue());
                    buyer.setOrdersPlaced(buyerOrderCounts.get(buyerId));

                    return buyer;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<FinancialAnalyticsResponse.TopSupplier> getTopSuppliersByRevenue(int limit) {
        List<BaseProductEntity> soldProducts = productRepository.findBySecondaryPriceIsNotNull();

        Map<String, Double> supplierIncomes = new HashMap<>();
        Map<String, Integer> supplierProductCounts = new HashMap<>();

        for (BaseProductEntity product : soldProducts) {
            if (product.getLot() != null && product.getLot().getUser() != null) {
                String supplierId = product.getLot().getUser().getId();
                double income = product.getSecondaryPrice() != null ? product.getSecondaryPrice().getValue() : 0.0;

                supplierIncomes.merge(supplierId, income, Double::sum);
                supplierProductCounts.merge(supplierId, 1, Integer::sum);
            }
        }

        return supplierIncomes.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    FinancialAnalyticsResponse.TopSupplier supplier = new FinancialAnalyticsResponse.TopSupplier();
                    String supplierId = entry.getKey();
                    UserEntity user = userRepository.findById(supplierId).orElse(null);

                    supplier.setSupplierId(supplierId);
                    supplier.setSupplierName(user != null ? user.getUsername() : "Unknown");
                    supplier.setTotalIncome(entry.getValue());
                    supplier.setProductsSold(supplierProductCounts.get(supplierId));

                    return supplier;
                })
                .collect(Collectors.toList());
    }

    private FinancialAnalyticsResponse.FinancialSummary calculateFinancialSummary() {
        FinancialAnalyticsResponse.FinancialSummary summary = new FinancialAnalyticsResponse.FinancialSummary();

        List<BaseProductEntity> allProducts = productRepository.findBySecondaryPriceIsNotNull();
        double totalRevenue = allProducts.stream()
                .mapToDouble(p -> p.getSecondaryPrice() != null ? p.getSecondaryPrice().getValue() : 0.0)
                .sum();

        double totalCommissions = totalRevenue * 0.05;

        LocalDateTime currentMonth = LocalDateTime.now().withDayOfMonth(1);
        LocalDateTime previousMonth = currentMonth.minusMonths(1);
        List<LotEntity> currentMonthLots = lotRepository.findByImportDateBetween(
                Date.from(currentMonth.atZone(ZoneId.systemDefault()).toInstant()),
                new Date()
        );
        List<LotEntity> previousMonthLots = lotRepository.findByImportDateBetween(
                Date.from(previousMonth.atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(currentMonth.atZone(ZoneId.systemDefault()).toInstant())
        );
        List<BaseProductEntity> currentMonthProducts = new ArrayList<>();
        for (LotEntity lot : currentMonthLots) {
            currentMonthProducts.addAll(productRepository.findByLotId(lot.getId()));
        }
        List<BaseProductEntity> previousMonthProducts = new ArrayList<>();
        for (LotEntity lot : previousMonthLots) {
            previousMonthProducts.addAll(productRepository.findByLotId(lot.getId()));
        }

        double currentMonthRevenue = currentMonthProducts.stream()
                .filter(p -> p.getSecondaryPrice() != null)
                .mapToDouble(p -> p.getSecondaryPrice().getValue())
                .sum();

        double previousMonthRevenue = previousMonthProducts.stream()
                .filter(p -> p.getSecondaryPrice() != null)
                .mapToDouble(p -> p.getSecondaryPrice().getValue())
                .sum();

        double growthRate = previousMonthRevenue > 0 ?
                ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0.0;

        summary.setTotalRevenue(totalRevenue);
        summary.setTotalCommissions(totalCommissions);
        summary.setNetProfit(totalCommissions);
        summary.setGrowthRate(growthRate);

        return summary;
    }
}
