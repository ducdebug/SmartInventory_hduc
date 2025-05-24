package com.ims.smartinventory.service.impl;

import com.ims.common.config.ProductType;
import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.management.DispatchEntity;
import com.ims.common.entity.management.DispatchItemEntity;
import com.ims.common.entity.management.LotEntity;
import com.ims.common.entity.management.LotItemEntity;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.dto.Response.InventoryAnalyticsResponse;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.InventoryAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class InventoryAnalyticsServiceImpl implements InventoryAnalyticsService {

    private final ProductRepository productRepository;
    private final LotRepository lotRepository;
    private final DispatchRepository dispatchRepository;
    private final SectionRepository sectionRepository;
    private final SlotSectionRepository slotSectionRepository;
    private final SlotShelfRepository slotShelfRepository;

    @Autowired
    public InventoryAnalyticsServiceImpl(
            ProductRepository productRepository,
            LotRepository lotRepository,
            DispatchRepository dispatchRepository,
            SectionRepository sectionRepository,
            SlotSectionRepository slotSectionRepository,
            SlotShelfRepository slotShelfRepository) {
        this.productRepository = productRepository;
        this.lotRepository = lotRepository;
        this.dispatchRepository = dispatchRepository;
        this.sectionRepository = sectionRepository;
        this.slotSectionRepository = slotSectionRepository;
        this.slotShelfRepository = slotShelfRepository;
    }

    @Override
    public InventoryAnalyticsResponse getInventoryAnalytics() {
        InventoryAnalyticsResponse response = new InventoryAnalyticsResponse();

        // Populate all analytics data
        response.setVolumeTrends(Arrays.asList(getVolumeOverTime(12)));
        response.setMovementAnalysis(Arrays.asList(getProductMovementAnalysis()));
        response.setStorageAllocation(Arrays.asList(getStorageAllocation()));
        response.setSectionUtilization(Arrays.asList(getSectionUtilization()));
        response.setSummaryStats(getSummaryStatistics());

        return response;
    }

    @Override
    public InventoryAnalyticsResponse.MonthlyVolumeData[] getVolumeOverTime(int months) {
        List<InventoryAnalyticsResponse.MonthlyVolumeData> result = new ArrayList<>();

        LocalDate currentDate = LocalDate.now();
        LocalDate startDate = currentDate.minusMonths(months - 1).withDayOfMonth(1);

        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");

        for (int i = 0; i < months; i++) {
            LocalDate date = startDate.plusMonths(i);
            InventoryAnalyticsResponse.MonthlyVolumeData monthData = new InventoryAnalyticsResponse.MonthlyVolumeData();
            monthData.setMonth(date.format(monthFormatter));
            Map<String, Integer> volumeByCategory = new HashMap<>();
            for (ProductType type : ProductType.values()) {
                volumeByCategory.put(type.name(), 0);
            }

            Date monthStart = Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date monthEnd = Date.from(date.plusMonths(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

            List<LotEntity> lotsInMonth = lotRepository.findAll().stream()
                    .filter(lot -> lot.getImportDate().after(monthStart) && lot.getImportDate().before(monthEnd))
                    .collect(Collectors.toList());

            List<DispatchEntity> dispatchesInMonth = dispatchRepository.findAll().stream()
                    .filter(dispatch -> dispatch.getCompletedAt() != null &&
                            dispatch.getCompletedAt().after(monthStart) &&
                            dispatch.getCompletedAt().before(monthEnd))
                    .collect(Collectors.toList());

            for (LotEntity lot : lotsInMonth) {
                for (LotItemEntity item : lot.getItems()) {
                    if (item.getProduct() != null) {
                        String productType = getProductTypeName(item.getProduct());
                        volumeByCategory.put(productType, volumeByCategory.getOrDefault(productType, 0) + 1);
                    }
                }
            }

            for (DispatchEntity dispatch : dispatchesInMonth) {
                for (DispatchItemEntity item : dispatch.getItems()) {
                    if (item.getProduct() != null) {
                        String productType = getProductTypeName(item.getProduct());
                        volumeByCategory.put(productType, volumeByCategory.getOrDefault(productType, 0) - 1);
                    }
                }
            }

            monthData.setVolumeByCategory(volumeByCategory);
            result.add(monthData);
        }

        return result.toArray(new InventoryAnalyticsResponse.MonthlyVolumeData[0]);
    }

    @Override
    public InventoryAnalyticsResponse.ProductMovementData[] getProductMovementAnalysis() {
        Map<String, InventoryAnalyticsResponse.ProductMovementData> movementMap = new HashMap<>();

        for (ProductType type : ProductType.values()) {
            InventoryAnalyticsResponse.ProductMovementData data = new InventoryAnalyticsResponse.ProductMovementData();
            data.setCategory(type.name());
            data.setImports(0);
            data.setExports(0);
            data.setRatio(0.0);
            movementMap.put(type.name(), data);
        }

        List<LotItemEntity> allLotItems = new ArrayList<>();
        lotRepository.findAll().forEach(lot -> allLotItems.addAll(lot.getItems()));

        for (LotItemEntity item : allLotItems) {
            if (item.getProduct() != null) {
                String productType = getProductTypeName(item.getProduct());
                InventoryAnalyticsResponse.ProductMovementData data = movementMap.get(productType);
                if (data != null) {
                    data.setImports(data.getImports() + 1);
                }
            }
        }

        List<DispatchItemEntity> allDispatchItems = new ArrayList<>();
        dispatchRepository.findAll().forEach(dispatch -> allDispatchItems.addAll(dispatch.getItems()));

        for (DispatchItemEntity item : allDispatchItems) {
            if (item.getProduct() != null) {
                String productType = getProductTypeName(item.getProduct());
                InventoryAnalyticsResponse.ProductMovementData data = movementMap.get(productType);
                if (data != null) {
                    data.setExports(data.getExports() + 1);
                }
            }
        }
        for (InventoryAnalyticsResponse.ProductMovementData data : movementMap.values()) {
            if (data.getImports() > 0) {
                data.setRatio((double) data.getExports() / data.getImports());
            }
        }

        return movementMap.values().toArray(new InventoryAnalyticsResponse.ProductMovementData[0]);
    }

    @Override
    public InventoryAnalyticsResponse.StorageAllocationData[] getStorageAllocation() {
        List<InventoryAnalyticsResponse.StorageAllocationData> result = new ArrayList<>();
        Map<String, Integer> productTypeCounts = new HashMap<>();

        List<BaseProductEntity> activeProducts = productRepository.findAll().stream()
                .filter(p -> p.getDispatch() == null) // Not exported
                .toList();

        for (BaseProductEntity product : activeProducts) {
            String productType = getProductTypeName(product);
            productTypeCounts.put(productType, productTypeCounts.getOrDefault(productType, 0) + 1);
        }

        int totalProducts = activeProducts.size();

        for (Map.Entry<String, Integer> entry : productTypeCounts.entrySet()) {
            InventoryAnalyticsResponse.StorageAllocationData data = new InventoryAnalyticsResponse.StorageAllocationData();
            data.setProductType(entry.getKey());
            data.setValue(entry.getValue());
            data.setPercentage(totalProducts > 0 ? (double) entry.getValue() / totalProducts : 0);
            result.add(data);
        }

        return result.toArray(new InventoryAnalyticsResponse.StorageAllocationData[0]);
    }

    @Override
    public InventoryAnalyticsResponse.SectionUtilizationData[] getSectionUtilization() {
        List<InventoryAnalyticsResponse.SectionUtilizationData> result = new ArrayList<>();

        List<SectionEntity> sections = sectionRepository.findAllWithStorageConditions();

        for (SectionEntity section : sections) {
            InventoryAnalyticsResponse.SectionUtilizationData data = new InventoryAnalyticsResponse.SectionUtilizationData();
            data.setSectionName(section.getName());

            String conditionStr = section.getStorageConditions().isEmpty() ?
                    "Regular" :
                    section.getStorageConditions().get(0).getConditionType().name();
            data.setSectionCondition(conditionStr);

            int totalSlots = section.getTotalSlots();
            int usedSlots;

            if (section.getNumShelves() > 0) {
                usedSlots = slotShelfRepository.countUsedBySectionId(section.getId());
            } else {
                usedSlots = slotSectionRepository.countUsedBySectionId(section.getId());
            }

            data.setTotalSlots(totalSlots);
            data.setUsedSlots(usedSlots);
            data.setUtilizationPercentage(totalSlots > 0 ? (double) usedSlots / totalSlots : 0);

            result.add(data);
        }

        return result.toArray(new InventoryAnalyticsResponse.SectionUtilizationData[0]);
    }

    @Override
    public InventoryAnalyticsResponse.SummaryStatistics getSummaryStatistics() {
        InventoryAnalyticsResponse.SummaryStatistics stats = new InventoryAnalyticsResponse.SummaryStatistics();
        List<BaseProductEntity> activeProducts = productRepository.findAll().stream()
                .filter(p -> p.getDispatch() == null)
                .toList();
        stats.setTotalProducts(activeProducts.size());

        int totalSlots = 0;
        int usedSlots = 0;

        List<SectionEntity> sections = sectionRepository.findAllWithStorageConditions();
        for (SectionEntity section : sections) {
            totalSlots += section.getTotalSlots();

            if (section.getNumShelves() > 0) {
                usedSlots += slotShelfRepository.countUsedBySectionId(section.getId());
            } else {
                usedSlots += slotSectionRepository.countUsedBySectionId(section.getId());
            }
        }

        stats.setOverallUtilization(totalSlots > 0 ? (double) usedSlots / totalSlots : 0);

        int totalImports = 0;
        List<LotEntity> lots = lotRepository.findAll();
        for (LotEntity lot : lots) {
            totalImports += lot.getItems().size();
        }

        int totalExports = 0;
        List<DispatchEntity> dispatches = dispatchRepository.findAll();
        for (DispatchEntity dispatch : dispatches) {
            totalExports += dispatch.getItems().size();
        }

        stats.setOverallTurnoverRate(totalImports > 0 ? (double) totalExports / totalImports : 0);

        LocalDate thirtyDaysLater = LocalDate.now().plusDays(30);
        Date thirtyDaysLaterDate = Date.from(thirtyDaysLater.atStartOfDay(ZoneId.systemDefault()).toInstant());

        int expiringCount = 0;
        for (BaseProductEntity product : activeProducts) {
            Date expDate = product.getExpirationDate();
            if (expDate != null && expDate.before(thirtyDaysLaterDate)) {
                expiringCount++;
            }
        }
        stats.setExpiringProductsCount(expiringCount);
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate prevMonth = currentMonth.minusMonths(1);

        Date currentMonthDate = Date.from(currentMonth.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date prevMonthDate = Date.from(prevMonth.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date nextMonthDate = Date.from(currentMonth.plusMonths(1).atStartOfDay(ZoneId.systemDefault()).toInstant());

        int currentMonthImports = (int) lots.stream()
                .filter(lot -> lot.getImportDate().after(currentMonthDate) && lot.getImportDate().before(nextMonthDate))
                .mapToLong(lot -> lot.getItems().size())
                .sum();

        int prevMonthImports = (int) lots.stream()
                .filter(lot -> lot.getImportDate().after(prevMonthDate) && lot.getImportDate().before(currentMonthDate))
                .mapToLong(lot -> lot.getItems().size())
                .sum();

        if (prevMonthImports > 0) {
            stats.setMonthlyGrowthRate((double) (currentMonthImports - prevMonthImports) / prevMonthImports);
        } else {
            stats.setMonthlyGrowthRate(0);
        }

        return stats;
    }

    private String getProductTypeName(BaseProductEntity product) {
        String className = product.getClass().getSimpleName();
        return className.replace("ProductEntity", "").toUpperCase();
    }
}