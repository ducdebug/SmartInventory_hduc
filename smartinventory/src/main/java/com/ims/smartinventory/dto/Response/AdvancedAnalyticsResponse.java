package com.ims.smartinventory.dto.Response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class AdvancedAnalyticsResponse {
    private List<SupplierSpendData> supplierSpending;
    private List<SupplierSectionSpendData> supplierSectionSpending;
    private List<MonthlyRevenueData> monthlyRevenue;
    private WarehouseProfitabilityData warehouseProfitability;
    private List<SectionProfitabilityData> sectionProfitability;
    private SummaryMetrics summaryMetrics;

    @Data
    @NoArgsConstructor
    public static class SupplierSpendData {
        private String supplierUsername;
        private String supplierId;
        private BigDecimal totalSpent;
        private int productCount;
        private BigDecimal averageSpendPerProduct;
        private List<String> topSections;
        private int activeLots;
    }

    @Data
    @NoArgsConstructor
    public static class SupplierSectionSpendData {
        private String supplierUsername;
        private String sectionName;
        private BigDecimal totalSpent;
        private int productCount;
        private BigDecimal monthlyMaintenanceFee;
        private double utilizationPercentage;
    }

    @Data
    @NoArgsConstructor
    public static class MonthlyRevenueData {
        private String month;
        private int year;
        private BigDecimal totalSupplierSpend;
        private BigDecimal totalMaintenanceFees;
        private BigDecimal netRevenue;
        private BigDecimal profitMargin;
        private int totalProducts;
        private Map<String, BigDecimal> spendBySection;
    }

    @Data
    @NoArgsConstructor
    public static class WarehouseProfitabilityData {
        private BigDecimal totalRevenue;
        private BigDecimal totalCosts;
        private BigDecimal netProfit;
        private BigDecimal profitMargin;
        private BigDecimal averageMonthlyRevenue;
        private int totalActiveSuppliers;
        private int totalActiveSections;
    }

    @Data
    @NoArgsConstructor
    public static class SectionProfitabilityData {
        private String sectionName;
        private String sectionId;
        private BigDecimal monthlyMaintenanceFee;
        private BigDecimal supplierRevenue;
        private BigDecimal netProfit;
        private double utilizationRate;
        private int activeSuppliers;
        private int totalProducts;
        private String storageCondition;
    }

    @Data
    @NoArgsConstructor
    public static class SummaryMetrics {
        private BigDecimal totalWarehouseRevenue;
        private BigDecimal totalMaintenanceCosts;
        private BigDecimal netProfit;
        private double profitMarginPercentage;
        private String topSpendingSupplier;
        private String mostProfitableSection;
        private BigDecimal averageRevenuePerSupplier;
        private int totalExportedProducts;
        private BigDecimal revenueGrowthRate;
    }
}