package com.ims.smartinventory.dto.Response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class InventoryAnalyticsResponse {
    private List<MonthlyVolumeData> volumeTrends;
    private List<ProductMovementData> movementAnalysis;
    private List<StorageAllocationData> storageAllocation;
    private List<SectionUtilizationData> sectionUtilization;
    private List<StrategyPerformanceData> strategyPerformance;
    private SummaryStatistics summaryStats;
    
    @Data
    @NoArgsConstructor
    public static class MonthlyVolumeData {
        private String month;
        private Map<String, Integer> volumeByCategory;
    }
    
    @Data
    @NoArgsConstructor
    public static class ProductMovementData {
        private String category;
        private int imports;
        private int exports;
        private double ratio;
    }
    
    @Data
    @NoArgsConstructor
    public static class StorageAllocationData {
        private String productType;
        private int value;
        private double percentage;
    }
    
    @Data
    @NoArgsConstructor
    public static class SectionUtilizationData {
        private String sectionName;
        private String sectionCondition;
        private int totalSlots;
        private int usedSlots;
        private double utilizationPercentage;
    }
    
    @Data
    @NoArgsConstructor
    public static class StrategyPerformanceData {
        private String strategy;
        private double avgDaysInInventory;
        private double turnoverRate;
    }
    
    @Data
    @NoArgsConstructor
    public static class SummaryStatistics {
        private int totalProducts;
        private double overallUtilization;
        private double overallTurnoverRate;
        private int expiringProductsCount;
        private double monthlyGrowthRate;
    }
}
