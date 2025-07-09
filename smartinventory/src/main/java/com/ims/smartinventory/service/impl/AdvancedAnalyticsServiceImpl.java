package com.ims.smartinventory.service.impl;

import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.UserEntity;
import com.ims.common.entity.management.LotEntity;
import com.ims.common.entity.management.LotItemEntity;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.dto.Response.AdvancedAnalyticsResponse;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.AdvancedAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdvancedAnalyticsServiceImpl implements AdvancedAnalyticsService {

    private final ProductRepository productRepository;
    private final LotRepository lotRepository;
    private final DispatchRepository dispatchRepository;
    private final SectionRepository sectionRepository;
    private final UserRepository userRepository;

    @Autowired
    public AdvancedAnalyticsServiceImpl(
            ProductRepository productRepository,
            LotRepository lotRepository,
            DispatchRepository dispatchRepository,
            SectionRepository sectionRepository,
            UserRepository userRepository) {
        this.productRepository = productRepository;
        this.lotRepository = lotRepository;
        this.dispatchRepository = dispatchRepository;
        this.sectionRepository = sectionRepository;
        this.userRepository = userRepository;
    }

    @Override
    public AdvancedAnalyticsResponse getAdvancedAnalytics() {
        AdvancedAnalyticsResponse response = new AdvancedAnalyticsResponse();

        response.setSupplierSpending(getSupplierSpendingAnalysis());
        response.setSupplierSectionSpending(getSupplierSectionSpending());
        response.setMonthlyRevenue(getMonthlyRevenueData(12));
        response.setWarehouseProfitability(getWarehouseProfitability());
        response.setSectionProfitability(getSectionProfitabilityAnalysis());
        response.setSummaryMetrics(getSummaryMetrics());

        return response;
    }

    @Override
    public List<AdvancedAnalyticsResponse.SupplierSpendData> getSupplierSpendingAnalysis() {
        List<AdvancedAnalyticsResponse.SupplierSpendData> result = new ArrayList<>();

        Map<String, List<LotEntity>> lotsBySupplier = lotRepository.findAll().stream()
                .collect(Collectors.groupingBy(lot -> lot.getUser().getUsername()));

        for (Map.Entry<String, List<LotEntity>> entry : lotsBySupplier.entrySet()) {
            String supplierUsername = entry.getKey();
            List<LotEntity> supplierLots = entry.getValue();

            AdvancedAnalyticsResponse.SupplierSpendData data = new AdvancedAnalyticsResponse.SupplierSpendData();
            data.setSupplierUsername(supplierUsername);

            Optional<UserEntity> supplier = userRepository.findByUsername(supplierUsername);
            data.setSupplierId(supplier.map(UserEntity::getId).orElse("Unknown"));

            BigDecimal totalSpent = BigDecimal.ZERO;
            int productCount = 0;
            Set<String> sectionsUsed = new HashSet<>();

            for (LotEntity lot : supplierLots) {
                for (LotItemEntity item : lot.getItems()) {
                    BaseProductEntity product = item.getProduct();
                    if (product != null) {
                        productCount++;

                        if (product.getSection() != null) {
                            sectionsUsed.add(product.getSection().getName());
                            totalSpent = totalSpent.add(calculateProductStorageCost(product));
                        }
                    }
                }
            }

            data.setTotalSpent(totalSpent);
            data.setProductCount(productCount);
            data.setAverageSpendPerProduct(productCount > 0 ?
                    totalSpent.divide(BigDecimal.valueOf(productCount), 2, RoundingMode.HALF_UP) :
                    BigDecimal.ZERO);
            data.setTopSections(new ArrayList<>(sectionsUsed));
            data.setActiveLots(supplierLots.size());

            result.add(data);
        }

        result.sort((a, b) -> b.getTotalSpent().compareTo(a.getTotalSpent()));
        return result;
    }

    @Override
    public List<AdvancedAnalyticsResponse.SupplierSectionSpendData> getSupplierSectionSpending() {
        List<AdvancedAnalyticsResponse.SupplierSectionSpendData> result = new ArrayList<>();

        List<BaseProductEntity> allProducts = productRepository.findAll();
        Map<String, Map<String, List<BaseProductEntity>>> supplierSectionProducts = new HashMap<>();

        for (BaseProductEntity product : allProducts) {
            // Get supplier from lot through lot items
            String supplier = getSupplierFromProduct(product);
            if (supplier != null && product.getSection() != null) {
                String sectionName = product.getSection().getName();

                supplierSectionProducts
                        .computeIfAbsent(supplier, k -> new HashMap<>())
                        .computeIfAbsent(sectionName, k -> new ArrayList<>())
                        .add(product);
            }
        }

        for (Map.Entry<String, Map<String, List<BaseProductEntity>>> supplierEntry : supplierSectionProducts.entrySet()) {
            String supplier = supplierEntry.getKey();

            for (Map.Entry<String, List<BaseProductEntity>> sectionEntry : supplierEntry.getValue().entrySet()) {
                String sectionName = sectionEntry.getKey();
                List<BaseProductEntity> products = sectionEntry.getValue();

                AdvancedAnalyticsResponse.SupplierSectionSpendData data = new AdvancedAnalyticsResponse.SupplierSectionSpendData();
                data.setSupplierUsername(supplier);
                data.setSectionName(sectionName);
                data.setProductCount(products.size());

                BigDecimal totalSpent = products.stream()
                        .map(this::calculateProductStorageCost)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                data.setTotalSpent(totalSpent);

                Optional<SectionEntity> sectionEntity = sectionRepository.findFirstByName(sectionName);
                if (sectionEntity.isPresent()) {
                    BigDecimal maintenanceFee = getSectionMaintenanceFee(sectionEntity.get());
                    data.setMonthlyMaintenanceFee(maintenanceFee);

                    int usedSlots = products.size();
                    int totalSlots = sectionEntity.get().getTotalSlots();
                    data.setUtilizationPercentage(totalSlots > 0 ? (double) usedSlots / totalSlots * 100 : 0.0);
                } else {
                    data.setMonthlyMaintenanceFee(BigDecimal.ZERO);
                    data.setUtilizationPercentage(0.0);
                }

                result.add(data);
            }
        }

        result.sort((a, b) -> b.getTotalSpent().compareTo(a.getTotalSpent()));
        return result;
    }

    @Override
    public List<AdvancedAnalyticsResponse.MonthlyRevenueData> getMonthlyRevenueData(int months) {
        List<AdvancedAnalyticsResponse.MonthlyRevenueData> result = new ArrayList<>();

        LocalDate currentDate = LocalDate.now();
        LocalDate startDate = currentDate.minusMonths(months - 1).withDayOfMonth(1);

        for (int i = 0; i < months; i++) {
            LocalDate monthStart = startDate.plusMonths(i);
            LocalDate monthEnd = monthStart.plusMonths(1);

            AdvancedAnalyticsResponse.MonthlyRevenueData monthData = new AdvancedAnalyticsResponse.MonthlyRevenueData();
            monthData.setMonth(monthStart.format(DateTimeFormatter.ofPattern("MMM")));
            monthData.setYear(monthStart.getYear());

            BigDecimal supplierSpend = calculateSupplierSpendForMonth(monthStart, monthEnd);
            monthData.setTotalSupplierSpend(supplierSpend);

            BigDecimal maintenanceFees = calculateMaintenanceFeesForMonth(monthStart, monthEnd);
            monthData.setTotalMaintenanceFees(maintenanceFees);

            BigDecimal netRevenue = supplierSpend.subtract(maintenanceFees);
            monthData.setNetRevenue(netRevenue);

            if (supplierSpend.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal profitMargin = netRevenue.divide(supplierSpend, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
                monthData.setProfitMargin(profitMargin);
            } else {
                monthData.setProfitMargin(BigDecimal.ZERO);
            }

            int productCount = countProductsForMonth(monthStart, monthEnd);
            monthData.setTotalProducts(productCount);

            Map<String, BigDecimal> spendBySection = calculateSpendBySectionForMonth(monthStart, monthEnd);
            monthData.setSpendBySection(spendBySection);

            result.add(monthData);
        }

        return result;
    }

    @Override
    public AdvancedAnalyticsResponse.WarehouseProfitabilityData getWarehouseProfitability() {
        AdvancedAnalyticsResponse.WarehouseProfitabilityData data = new AdvancedAnalyticsResponse.WarehouseProfitabilityData();

        List<AdvancedAnalyticsResponse.MonthlyRevenueData> monthlyData = getMonthlyRevenueData(12);

        BigDecimal totalRevenue = monthlyData.stream()
                .map(AdvancedAnalyticsResponse.MonthlyRevenueData::getTotalSupplierSpend)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCosts = monthlyData.stream()
                .map(AdvancedAnalyticsResponse.MonthlyRevenueData::getTotalMaintenanceFees)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = totalRevenue.subtract(totalCosts);

        data.setTotalRevenue(totalRevenue);
        data.setTotalCosts(totalCosts);
        data.setNetProfit(netProfit);

        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal profitMargin = netProfit.divide(totalRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
            data.setProfitMargin(profitMargin);
        } else {
            data.setProfitMargin(BigDecimal.ZERO);
        }

        data.setAverageMonthlyRevenue(totalRevenue.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP));

        Set<String> activeSuppliers = lotRepository.findAll().stream()
                .map(lot -> lot.getUser().getUsername())
                .collect(Collectors.toSet());
        data.setTotalActiveSuppliers(activeSuppliers.size());

        data.setTotalActiveSections((int) sectionRepository.count());

        return data;
    }

    @Override
    public List<AdvancedAnalyticsResponse.SectionProfitabilityData> getSectionProfitabilityAnalysis() {
        List<AdvancedAnalyticsResponse.SectionProfitabilityData> result = new ArrayList<>();

        List<SectionEntity> sections = sectionRepository.findAllWithStorageConditions();

        for (SectionEntity section : sections) {
            AdvancedAnalyticsResponse.SectionProfitabilityData data = new AdvancedAnalyticsResponse.SectionProfitabilityData();

            data.setSectionName(section.getName());
            data.setSectionId(section.getId());

            BigDecimal maintenanceFee = getSectionMaintenanceFee(section);
            data.setMonthlyMaintenanceFee(maintenanceFee);

            List<BaseProductEntity> sectionProducts = productRepository.findAll().stream()
                    .filter(p -> p.getSection() != null && p.getSection().getId().equals(section.getId()))
                    .collect(Collectors.toList());

            BigDecimal supplierRevenue = sectionProducts.stream()
                    .map(this::calculateProductStorageCost)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            data.setSupplierRevenue(supplierRevenue);

            BigDecimal netProfit = supplierRevenue.subtract(maintenanceFee);
            data.setNetProfit(netProfit);

            int usedSlots = sectionProducts.size();
            int totalSlots = section.getTotalSlots();
            double utilizationRate = totalSlots > 0 ? (double) usedSlots / totalSlots * 100 : 0.0;
            data.setUtilizationRate(utilizationRate);

            Set<String> activeSuppliers = sectionProducts.stream()
                    .map(this::getSupplierFromProduct)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            data.setActiveSuppliers(activeSuppliers.size());

            data.setTotalProducts(sectionProducts.size());

            String storageCondition = section.getStorageConditions().isEmpty() ?
                    "Regular" :
                    section.getStorageConditions().get(0).getConditionType().name();
            data.setStorageCondition(storageCondition);

            result.add(data);
        }

        result.sort((a, b) -> b.getNetProfit().compareTo(a.getNetProfit()));
        return result;
    }

    @Override
    public AdvancedAnalyticsResponse.SummaryMetrics getSummaryMetrics() {
        AdvancedAnalyticsResponse.SummaryMetrics metrics = new AdvancedAnalyticsResponse.SummaryMetrics();

        AdvancedAnalyticsResponse.WarehouseProfitabilityData profitability = getWarehouseProfitability();
        metrics.setTotalWarehouseRevenue(profitability.getTotalRevenue());
        metrics.setTotalMaintenanceCosts(profitability.getTotalCosts());
        metrics.setNetProfit(profitability.getNetProfit());

        if (profitability.getTotalRevenue().compareTo(BigDecimal.ZERO) > 0) {
            double profitMarginPercentage = profitability.getNetProfit()
                    .divide(profitability.getTotalRevenue(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
            metrics.setProfitMarginPercentage(profitMarginPercentage);
        } else {
            metrics.setProfitMarginPercentage(0.0);
        }

        List<AdvancedAnalyticsResponse.SupplierSpendData> supplierSpending = getSupplierSpendingAnalysis();
        if (!supplierSpending.isEmpty()) {
            metrics.setTopSpendingSupplier(supplierSpending.get(0).getSupplierUsername());
        }

        List<AdvancedAnalyticsResponse.SectionProfitabilityData> sectionProfitability = getSectionProfitabilityAnalysis();
        if (!sectionProfitability.isEmpty()) {
            metrics.setMostProfitableSection(sectionProfitability.get(0).getSectionName());
        }

        if (profitability.getTotalActiveSuppliers() > 0) {
            BigDecimal avgRevenuePerSupplier = profitability.getTotalRevenue()
                    .divide(BigDecimal.valueOf(profitability.getTotalActiveSuppliers()), 2, RoundingMode.HALF_UP);
            metrics.setAverageRevenuePerSupplier(avgRevenuePerSupplier);
        } else {
            metrics.setAverageRevenuePerSupplier(BigDecimal.ZERO);
        }

        int totalExported = dispatchRepository.findAll().stream()
                .mapToInt(dispatch -> dispatch.getItems().size())
                .sum();
        metrics.setTotalExportedProducts(totalExported);

        List<AdvancedAnalyticsResponse.MonthlyRevenueData> monthlyData = getMonthlyRevenueData(2);
        if (monthlyData.size() >= 2) {
            BigDecimal currentMonth = monthlyData.get(1).getTotalSupplierSpend();
            BigDecimal previousMonth = monthlyData.get(0).getTotalSupplierSpend();

            if (previousMonth.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal growthRate = currentMonth.subtract(previousMonth)
                        .divide(previousMonth, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                metrics.setRevenueGrowthRate(growthRate);
            } else {
                metrics.setRevenueGrowthRate(BigDecimal.ZERO);
            }
        } else {
            metrics.setRevenueGrowthRate(BigDecimal.ZERO);
        }

        return metrics;
    }

    @Override
    public List<AdvancedAnalyticsResponse.MonthlyRevenueData> getRevenueDataByDateRange(LocalDate startDate, LocalDate endDate) {
        List<AdvancedAnalyticsResponse.MonthlyRevenueData> result = new ArrayList<>();

        LocalDate current = startDate.withDayOfMonth(1);
        LocalDate end = endDate.withDayOfMonth(1);

        while (!current.isAfter(end)) {
            LocalDate monthEnd = current.plusMonths(1);

            AdvancedAnalyticsResponse.MonthlyRevenueData monthData = new AdvancedAnalyticsResponse.MonthlyRevenueData();
            monthData.setMonth(current.format(DateTimeFormatter.ofPattern("MMM")));
            monthData.setYear(current.getYear());

            BigDecimal supplierSpend = calculateSupplierSpendForMonth(current, monthEnd);
            BigDecimal maintenanceFees = calculateMaintenanceFeesForMonth(current, monthEnd);

            monthData.setTotalSupplierSpend(supplierSpend);
            monthData.setTotalMaintenanceFees(maintenanceFees);
            monthData.setNetRevenue(supplierSpend.subtract(maintenanceFees));

            if (supplierSpend.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal profitMargin = monthData.getNetRevenue()
                        .divide(supplierSpend, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                monthData.setProfitMargin(profitMargin);
            } else {
                monthData.setProfitMargin(BigDecimal.ZERO);
            }

            monthData.setTotalProducts(countProductsForMonth(current, monthEnd));
            monthData.setSpendBySection(calculateSpendBySectionForMonth(current, monthEnd));

            result.add(monthData);
            current = current.plusMonths(1);
        }

        return result;
    }

    private String getSupplierFromProduct(BaseProductEntity product) {
        List<LotEntity> allLots = lotRepository.findAll();
        for (LotEntity lot : allLots) {
            for (LotItemEntity item : lot.getItems()) {
                if (item.getProduct() != null && item.getProduct().getId().equals(product.getId())) {
                    return lot.getUser().getUsername();
                }
            }
        }
        return null;
    }

    private BigDecimal calculateProductStorageCost(BaseProductEntity product) {
        if (product.getSection() != null) {
            BigDecimal sectionMonthlyFee = getSectionMaintenanceFee(product.getSection());
            return sectionMonthlyFee.divide(BigDecimal.valueOf(Math.max(product.getSection().getTotalSlots(), 1)), 2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal getSectionMaintenanceFee(SectionEntity section) {
        return section.getPrice() != null ? BigDecimal.valueOf(section.getPrice().getValue()) : BigDecimal.ZERO;
    }

    private BigDecimal calculateSupplierSpendForMonth(LocalDate monthStart, LocalDate monthEnd) {
        Date startDate = Date.from(monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date endDate = Date.from(monthEnd.atStartOfDay(ZoneId.systemDefault()).toInstant());

        return lotRepository.findAll().stream()
                .filter(lot -> lot.getImportDate().after(startDate) && lot.getImportDate().before(endDate))
                .flatMap(lot -> lot.getItems().stream())
                .filter(item -> item.getProduct() != null)
                .map(item -> calculateProductStorageCost(item.getProduct()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculateMaintenanceFeesForMonth(LocalDate monthStart, LocalDate monthEnd) {
        return sectionRepository.findAll().stream()
                .map(this::getSectionMaintenanceFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private int countProductsForMonth(LocalDate monthStart, LocalDate monthEnd) {
        Date startDate = Date.from(monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date endDate = Date.from(monthEnd.atStartOfDay(ZoneId.systemDefault()).toInstant());

        return lotRepository.findAll().stream()
                .filter(lot -> lot.getImportDate().after(startDate) && lot.getImportDate().before(endDate))
                .mapToInt(lot -> lot.getItems().size())
                .sum();
    }

    private Map<String, BigDecimal> calculateSpendBySectionForMonth(LocalDate monthStart, LocalDate monthEnd) {
        Date startDate = Date.from(monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date endDate = Date.from(monthEnd.atStartOfDay(ZoneId.systemDefault()).toInstant());

        Map<String, BigDecimal> spendBySection = new HashMap<>();

        lotRepository.findAll().stream()
                .filter(lot -> lot.getImportDate().after(startDate) && lot.getImportDate().before(endDate))
                .flatMap(lot -> lot.getItems().stream())
                .filter(item -> item.getProduct() != null && item.getProduct().getSection() != null)
                .forEach(item -> {
                    String sectionName = item.getProduct().getSection().getName();
                    BigDecimal cost = calculateProductStorageCost(item.getProduct());
                    spendBySection.merge(sectionName, cost, BigDecimal::add);
                });

        return spendBySection;
    }
}