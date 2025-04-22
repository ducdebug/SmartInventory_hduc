package com.ims.smartinventory.service.impl;

import com.ims.smartinventory.config.ProductType;
import com.ims.smartinventory.config.StorageStrategy;
import com.ims.smartinventory.dto.Response.InventoryAnalyticsResponse;
import com.ims.smartinventory.entity.BaseProductEntity;
import com.ims.smartinventory.entity.management.DispatchEntity;
import com.ims.smartinventory.entity.management.DispatchItemEntity;
import com.ims.smartinventory.entity.management.LotEntity;
import com.ims.smartinventory.entity.management.LotItemEntity;
import com.ims.smartinventory.entity.storage.SectionEntity;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.InventoryAnalyticsService;
import com.ims.smartinventory.util.VolumeCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
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
        response.setStrategyPerformance(Arrays.asList(getStrategyPerformance()));
        response.setSummaryStats(getSummaryStatistics());
        
        return response;
    }
    
    @Override
    public InventoryAnalyticsResponse.MonthlyVolumeData[] getVolumeOverTime(int months) {
        List<InventoryAnalyticsResponse.MonthlyVolumeData> result = new ArrayList<>();
        
        // Get current date and calculate start date (months ago)
        LocalDate currentDate = LocalDate.now();
        LocalDate startDate = currentDate.minusMonths(months - 1).withDayOfMonth(1);
        
        // Format for month display
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");
        
        // Create a map for each month
        for (int i = 0; i < months; i++) {
            LocalDate date = startDate.plusMonths(i);
            InventoryAnalyticsResponse.MonthlyVolumeData monthData = new InventoryAnalyticsResponse.MonthlyVolumeData();
            monthData.setMonth(date.format(monthFormatter));
            
            // Initialize with zero counts for each product type
            Map<String, Integer> volumeByCategory = new HashMap<>();
            for (ProductType type : ProductType.values()) {
                volumeByCategory.put(type.name(), 0);
            }
            
            // Calculate volume for this month based on import and export data
            Date monthStart = Date.from(date.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date monthEnd = Date.from(date.plusMonths(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
            
            // Find all lots created during this month
            List<LotEntity> lotsInMonth = lotRepository.findAll().stream()
                    .filter(lot -> lot.getImportDate().after(monthStart) && lot.getImportDate().before(monthEnd))
                    .collect(Collectors.toList());
            
            // Find all dispatches created during this month
            List<DispatchEntity> dispatchesInMonth = dispatchRepository.findAll().stream()
                    .filter(dispatch -> dispatch.getExportDate().after(monthStart) && dispatch.getExportDate().before(monthEnd))
                    .collect(Collectors.toList());
            
            // Count products per type for each lot
            for (LotEntity lot : lotsInMonth) {
                for (LotItemEntity item : lot.getItems()) {
                    if (item.getProduct() != null) {
                        String productType = getProductTypeName(item.getProduct());
                        volumeByCategory.put(productType, volumeByCategory.getOrDefault(productType, 0) + 1);
                    }
                }
            }
            
            // Subtract products per type for each dispatch
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
        
        // Initialize for each product type
        for (ProductType type : ProductType.values()) {
            InventoryAnalyticsResponse.ProductMovementData data = new InventoryAnalyticsResponse.ProductMovementData();
            data.setCategory(type.name());
            data.setImports(0);
            data.setExports(0);
            data.setRatio(0.0);
            movementMap.put(type.name(), data);
        }
        
        // Get import data from lot items
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
        
        // Get export data from dispatch items
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
        
        // Calculate ratios
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
        
        // Count current products by type
        List<BaseProductEntity> activeProducts = productRepository.findAll().stream()
                .filter(p -> p.getDispatch() == null) // Not exported
                .collect(Collectors.toList());
        
        // Count by product type
        for (BaseProductEntity product : activeProducts) {
            String productType = getProductTypeName(product);
            productTypeCounts.put(productType, productTypeCounts.getOrDefault(productType, 0) + 1);
        }
        
        // Calculate total
        int totalProducts = activeProducts.size();
        
        // Create response objects
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
        
        // Get all sections
        List<SectionEntity> sections = sectionRepository.findAllWithStorageConditions();
        
        for (SectionEntity section : sections) {
            InventoryAnalyticsResponse.SectionUtilizationData data = new InventoryAnalyticsResponse.SectionUtilizationData();
            data.setSectionName(section.getName());
            
            // Get condition string (simplifying for display)
            String conditionStr = section.getStorageConditions().isEmpty() ? 
                    "Regular" : 
                    section.getStorageConditions().get(0).getConditionType().name();
            data.setSectionCondition(conditionStr);
            
            // Calculate utilization
            int totalSlots = section.getTotalSlots();
            int usedSlots;
            
            if (section.getNumShelves() > 0) {
                // Section with shelves
                usedSlots = slotShelfRepository.countUsedBySectionId(section.getId());
            } else {
                // Section without shelves
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
    public InventoryAnalyticsResponse.StrategyPerformanceData[] getStrategyPerformance() {
        Map<StorageStrategy, InventoryAnalyticsResponse.StrategyPerformanceData> strategyMap = new HashMap<>();
        
        // Initialize strategy data
        for (StorageStrategy strategy : StorageStrategy.values()) {
            InventoryAnalyticsResponse.StrategyPerformanceData data = new InventoryAnalyticsResponse.StrategyPerformanceData();
            data.setStrategy(strategy.name());
            data.setAvgDaysInInventory(0);
            data.setTurnoverRate(0);
            strategyMap.put(strategy, data);
        }
        
        // Get all dispatches with their associated products
        List<DispatchEntity> dispatches = dispatchRepository.findAll();
        
        // Calculate metrics for each strategy
        Map<StorageStrategy, List<Long>> daysByStrategy = new HashMap<>();
        Map<StorageStrategy, Integer> exportCountByStrategy = new HashMap<>();
        Map<StorageStrategy, Integer> importCountByStrategy = new HashMap<>();
        
        // Initialize counters
        for (StorageStrategy strategy : StorageStrategy.values()) {
            daysByStrategy.put(strategy, new ArrayList<>());
            exportCountByStrategy.put(strategy, 0);
            importCountByStrategy.put(strategy, 0);
        }
        
        // Calculate days in inventory for dispatched products
        for (DispatchEntity dispatch : dispatches) {
            StorageStrategy strategy = dispatch.getStorageStrategy();
            
            for (DispatchItemEntity item : dispatch.getItems()) {
                if (item.getProduct() != null && item.getProduct().getLot() != null) {
                    // Calculate days between import and export
                    Date importDate = item.getProduct().getLot().getImportDate();
                    Date exportDate = dispatch.getExportDate();
                    
                    if (importDate != null && exportDate != null) {
                        long days = ChronoUnit.DAYS.between(
                                importDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate(),
                                exportDate.toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
                        );
                        
                        daysByStrategy.get(strategy).add(days);
                        exportCountByStrategy.put(strategy, exportCountByStrategy.get(strategy) + 1);
                    }
                }
            }
        }
        
        // Count total imports by strategy
        List<LotEntity> lots = lotRepository.findAll();
        for (LotEntity lot : lots) {
            StorageStrategy strategy = lot.getStorageStrategy();
            importCountByStrategy.put(strategy, importCountByStrategy.get(strategy) + lot.getItems().size());
        }
        
        // Calculate averages and turnover rates
        for (StorageStrategy strategy : StorageStrategy.values()) {
            InventoryAnalyticsResponse.StrategyPerformanceData data = strategyMap.get(strategy);
            
            // Calculate average days in inventory
            List<Long> days = daysByStrategy.get(strategy);
            if (!days.isEmpty()) {
                double avgDays = days.stream().mapToLong(Long::longValue).average().orElse(0);
                data.setAvgDaysInInventory(avgDays);
            }
            
            // Calculate turnover rate
            int imports = importCountByStrategy.get(strategy);
            int exports = exportCountByStrategy.get(strategy);
            if (imports > 0) {
                data.setTurnoverRate((double) exports / imports);
            }
        }
        
        return strategyMap.values().toArray(new InventoryAnalyticsResponse.StrategyPerformanceData[0]);
    }
    
    @Override
    public InventoryAnalyticsResponse.SummaryStatistics getSummaryStatistics() {
        InventoryAnalyticsResponse.SummaryStatistics stats = new InventoryAnalyticsResponse.SummaryStatistics();
        
        // Count total active products
        List<BaseProductEntity> activeProducts = productRepository.findAll().stream()
                .filter(p -> p.getDispatch() == null) // Not exported
                .collect(Collectors.toList());
        stats.setTotalProducts(activeProducts.size());
        
        // Calculate overall utilization
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
        
        // Calculate overall turnover rate
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
        
        // Count expiring products (within 30 days)
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
        
        // Calculate monthly growth rate (comparing current month to previous month)
        LocalDate currentMonth = LocalDate.now().withDayOfMonth(1);
        LocalDate prevMonth = currentMonth.minusMonths(1);
        
        Date currentMonthDate = Date.from(currentMonth.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date prevMonthDate = Date.from(prevMonth.atStartOfDay(ZoneId.systemDefault()).toInstant());
        Date nextMonthDate = Date.from(currentMonth.plusMonths(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
        
        // Count imports in current month
        int currentMonthImports = (int) lots.stream()
                .filter(lot -> lot.getImportDate().after(currentMonthDate) && lot.getImportDate().before(nextMonthDate))
                .flatMap(lot -> lot.getItems().stream())
                .count();
        
        // Count imports in previous month
        int prevMonthImports = (int) lots.stream()
                .filter(lot -> lot.getImportDate().after(prevMonthDate) && lot.getImportDate().before(currentMonthDate))
                .flatMap(lot -> lot.getItems().stream())
                .count();
        
        // Calculate growth rate
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
