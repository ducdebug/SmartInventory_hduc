package com.ims.smartinventory.service.impl;

import com.ims.common.entity.UserEntity;
import com.ims.common.entity.management.InventoryTransactionEntity;
import com.ims.common.entity.management.LotEntity;
import com.ims.common.entity.management.LotItemEntity;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.dto.Response.SectionInfoResponse;
import com.ims.smartinventory.dto.Response.WarehouseRevenueResponse;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class WarehouseServiceImpl implements WarehouseService {

    private final SectionRepository sectionRepository;
    private final SlotShelfRepository slotShelfRepository;
    private final SlotSectionRepository slotSectionRepository;
    private final ProductRepository productRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final LotItemRepository lotItemRepository;

    @Autowired
    public WarehouseServiceImpl(SectionRepository sectionRepository, SlotShelfRepository slotShelfRepository,
                                SlotSectionRepository slotSectionRepository, ProductRepository productRepository,
                                InventoryTransactionRepository inventoryTransactionRepository,
                                LotItemRepository lotItemRepository) {
        this.sectionRepository = sectionRepository;
        this.slotShelfRepository = slotShelfRepository;
        this.slotSectionRepository = slotSectionRepository;
        this.productRepository = productRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.lotItemRepository = lotItemRepository;
    }


    @Override
    public List<SectionInfoResponse> getCurrentWarehouseSections() {
        return List.of();
    }

    @Override
    public List<SectionInfoResponse> getAllSection() {
        List<SectionEntity> sections = sectionRepository.findAll();

        return sections.stream().map(section -> {
            int totalSlots = section.getTotalSlots();

            int usedSlots = section.getShelves() != null && !section.getShelves().isEmpty()
                    ? slotShelfRepository.countUsedBySectionId(section.getId())
                    : slotSectionRepository.countUsedBySectionId(section.getId());

            List<SectionInfoResponse.StorageConditionDto> conditionDtos = section.getStorageConditions().stream()
                    .map(cond -> new SectionInfoResponse.StorageConditionDto(
                            cond.getConditionType().name(),
                            cond.getMinValue(),
                            cond.getMaxValue(),
                            cond.getUnit()
                    )).toList();

            SectionInfoResponse.PriceInfoDto priceInfo = null;
            if (section.getPrice() != null) {
                double monthlyPrice = section.getPrice().getValue();
                String currency = section.getPrice().getCurrency();
                double pricePerSlot = totalSlots > 0 ? monthlyPrice / totalSlots : 0.0;

                priceInfo = new SectionInfoResponse.PriceInfoDto(
                        monthlyPrice,
                        currency,
                        pricePerSlot
                );
            }

            return new SectionInfoResponse(
                    section.getId(),
                    section.getName(),
                    section.getX(),
                    section.getY(),
                    section.getNumShelves(),
                    totalSlots,
                    usedSlots,
                    section.getStatus(),
                    conditionDtos,
                    priceInfo
            );
        }).toList();
    }

    @Override
    public WarehouseRevenueResponse calculateWarehouseRevenue() {
        // Get all dispatched transactions
        List<InventoryTransactionEntity> dispatchedTransactions = inventoryTransactionRepository.findAll()
                .stream()
                .filter(transaction -> transaction.getRelated_dispatch_lot_id() != null)
                .toList();

        // Get all lot items from lots that have been dispatched and have prices set at lot level
        List<LotItemEntity> paidLotItems = lotItemRepository.findAll()
                .stream()
                .filter(lotItem ->
                        // Check if lot has price (not lot item)
                        lotItem.getLot().getPrice() != null &&
                                // Check if lot has been dispatched
                                dispatchedTransactions.stream()
                                        .anyMatch(transaction -> transaction.getRelated_dispatch_lot_id().equals(lotItem.getLot().getId())))
                .toList();

        // Calculate total storage revenue using lot-level pricing
        BigDecimal totalStorageRevenue = paidLotItems.stream()
                .map(lotItem -> {
                    // Use price from lot, not from lot item
                    BigDecimal lotPrice = BigDecimal.valueOf(lotItem.getLot().getPrice().getValue());
                    BigDecimal itemRevenue = lotPrice.multiply(BigDecimal.valueOf(lotItem.getQuantity()));
                    return itemRevenue;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate maintenance costs
        List<SectionEntity> activeSections = sectionRepository.findAll();
        LocalDateTime now = LocalDateTime.now();
        BigDecimal totalMaintenanceCosts = BigDecimal.ZERO;

        for (SectionEntity section : activeSections) {
            if (section.getCreatedAt() != null && section.getPrice() != null) {
                LocalDateTime activatedSince = section.getCreatedAt();
                long monthsActive = ChronoUnit.MONTHS.between(activatedSince, now);
                if (monthsActive < 1) monthsActive = 1;

                BigDecimal monthlyFee = BigDecimal.valueOf(section.getPrice().getValue());
                BigDecimal sectionMaintenanceCost = monthlyFee.multiply(BigDecimal.valueOf(monthsActive));
                totalMaintenanceCosts = totalMaintenanceCosts.add(sectionMaintenanceCost);
            }
        }

        BigDecimal netProfit = totalStorageRevenue.subtract(totalMaintenanceCosts);

        // Calculate section details with corrected pricing
        List<WarehouseRevenueResponse.SectionRevenueDetail> sectionDetails = new ArrayList<>();
        Map<String, BigDecimal> sectionRevenueMap = new HashMap<>();

        for (LotItemEntity lotItem : paidLotItems) {
            if (lotItem.getProduct() != null && lotItem.getProduct().getSection() != null) {
                String sectionId = lotItem.getProduct().getSection().getId();
                // Use lot-level price
                BigDecimal lotPrice = BigDecimal.valueOf(lotItem.getLot().getPrice().getValue());
                BigDecimal itemRevenue = lotPrice.multiply(BigDecimal.valueOf(lotItem.getQuantity()));
                sectionRevenueMap.merge(sectionId, itemRevenue, BigDecimal::add);
            }
        }

        for (SectionEntity section : activeSections) {
            BigDecimal sectionStorageRevenue = sectionRevenueMap.getOrDefault(section.getId(), BigDecimal.ZERO);

            LocalDateTime activatedSince = section.getCreatedAt() != null ? section.getCreatedAt() : now;
            long monthsActive = ChronoUnit.MONTHS.between(activatedSince, now);
            if (monthsActive < 1) monthsActive = 1;

            BigDecimal monthlyMaintenanceFee = section.getPrice() != null ?
                    BigDecimal.valueOf(section.getPrice().getValue()) : BigDecimal.ZERO;
            BigDecimal sectionMaintenanceCost = monthlyMaintenanceFee.multiply(BigDecimal.valueOf(monthsActive));

            int totalProducts = (int) productRepository.findAll().stream()
                    .filter(product -> product.getSection() != null &&
                            product.getSection().getId().equals(section.getId()))
                    .count();

            List<String> topUserIds = paidLotItems.stream()
                    .filter(lotItem -> lotItem.getProduct() != null &&
                            lotItem.getProduct().getSection() != null &&
                            lotItem.getProduct().getSection().getId().equals(section.getId()))
                    .map(lotItem -> lotItem.getLot().getUser().getId())
                    .distinct()
                    .limit(3)
                    .toList();

            sectionDetails.add(new WarehouseRevenueResponse.SectionRevenueDetail(
                    section.getId(),
                    section.getName(),
                    activatedSince,
                    monthlyMaintenanceFee,
                    sectionStorageRevenue,
                    monthsActive,
                    totalProducts,
                    topUserIds
            ));
        }

        // Calculate user revenues with corrected pricing
        Map<String, BigDecimal> userPaymentMap = new HashMap<>();
        Map<String, UserEntity> userMap = new HashMap<>();
        Map<String, Set<String>> userLotMap = new HashMap<>();
        Map<String, Integer> userProductCountMap = new HashMap<>();

        for (LotItemEntity lotItem : paidLotItems) {
            UserEntity user = lotItem.getLot().getUser();
            String userId = user.getId();
            userMap.put(userId, user);

            // Use lot-level price
            BigDecimal lotPrice = BigDecimal.valueOf(lotItem.getLot().getPrice().getValue());
            BigDecimal payment = lotPrice.multiply(BigDecimal.valueOf(lotItem.getQuantity()));
            userPaymentMap.merge(userId, payment, BigDecimal::add);

            userLotMap.computeIfAbsent(userId, k -> new HashSet<>()).add(lotItem.getLot().getId());
            userProductCountMap.merge(userId, lotItem.getQuantity(), Integer::sum);
        }

        List<WarehouseRevenueResponse.UserRevenueDetail> userRevenues = userPaymentMap.entrySet().stream()
                .map(entry -> {
                    String userId = entry.getKey();
                    BigDecimal totalPaid = entry.getValue();
                    UserEntity user = userMap.get(userId);

                    List<LotEntity> userLots = paidLotItems.stream()
                            .filter(lotItem -> lotItem.getLot().getUser().getId().equals(userId))
                            .map(LotItemEntity::getLot)
                            .distinct()
                            .toList();

                    LocalDateTime firstLotDate = userLots.stream()
                            .map(LotEntity::getImportDate)
                            .filter(Objects::nonNull)
                            .map(date -> date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                            .min(LocalDateTime::compareTo)
                            .orElse(null);

                    LocalDateTime lastLotDate = userLots.stream()
                            .map(LotEntity::getImportDate)
                            .filter(Objects::nonNull)
                            .map(date -> date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                            .max(LocalDateTime::compareTo)
                            .orElse(null);

                    // Create lot revenue details with corrected pricing
                    List<WarehouseRevenueResponse.LotRevenueDetail> lotDetails = userLots.stream()
                            .map(lot -> {
                                int lotProductCount = paidLotItems.stream()
                                        .filter(item -> item.getLot().getId().equals(lot.getId()))
                                        .mapToInt(LotItemEntity::getQuantity)
                                        .sum();

                                String sectionName = paidLotItems.stream()
                                        .filter(item -> item.getLot().getId().equals(lot.getId()))
                                        .findFirst()
                                        .map(item -> item.getProduct() != null && item.getProduct().getSection() != null ?
                                                item.getProduct().getSection().getName() : "Unknown")
                                        .orElse("Unknown");

                                BigDecimal lotTotalCost = BigDecimal.valueOf(lot.getPrice().getValue())
                                        .multiply(BigDecimal.valueOf(lotProductCount));

                                LocalDateTime importDateTime = lot.getImportDate() != null ?
                                        lot.getImportDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime() : null;

                                return new WarehouseRevenueResponse.LotRevenueDetail(
                                        lot.getId(),
                                        lot.getLotCode(),
                                        importDateTime,
                                        lotTotalCost,
                                        sectionName,
                                        lotProductCount
                                );
                            })
                            .toList();

                    return new WarehouseRevenueResponse.UserRevenueDetail(
                            userId,
                            user.getUsername(),
                            user.getRole().toString(),
                            totalPaid,
                            userLotMap.get(userId).size(),
                            userProductCountMap.getOrDefault(userId, 0),
                            firstLotDate,
                            lastLotDate,
                            lotDetails
                    );
                })
                .sorted((a, b) -> b.getTotalSpent().compareTo(a.getTotalSpent()))
                .toList();

        // Create breakdown
        BigDecimal profitMargin = totalStorageRevenue.compareTo(BigDecimal.ZERO) > 0 ?
                netProfit.divide(totalStorageRevenue, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)) :
                BigDecimal.ZERO;

        WarehouseRevenueResponse.RevenueBreakdown breakdown = new WarehouseRevenueResponse.RevenueBreakdown();
        breakdown.setTotalMaintenanceCosts(totalMaintenanceCosts);
        breakdown.setTotalStorageFees(totalStorageRevenue);
        breakdown.setSpecialConditionSurcharges(BigDecimal.ZERO);
        breakdown.setTotalActiveSections(activeSections.size());
        breakdown.setTotalActiveProducts(productRepository.findAll().size());
        breakdown.setTotalUsers(userMap.size());
        breakdown.setProfitMargin(profitMargin);

        WarehouseRevenueResponse response = new WarehouseRevenueResponse();
        response.setTotalRevenue(netProfit);
        response.setTotalStorageFees(totalStorageRevenue);
        response.setTotalMaintenanceCosts(totalMaintenanceCosts);
        response.setCurrency("USD");
        response.setCalculatedAt(now);
        response.setSectionDetails(sectionDetails);
        response.setUserRevenues(userRevenues);
        response.setBreakdown(breakdown);

        return response;
    }
}
