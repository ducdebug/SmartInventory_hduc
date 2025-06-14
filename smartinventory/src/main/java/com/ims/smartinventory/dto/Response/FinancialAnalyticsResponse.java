package com.ims.smartinventory.dto.Response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FinancialAnalyticsResponse {
    private SupplierIncomeData supplierIncomeData;
    private BuyerSpendingData buyerSpendingData;
    private List<FinancialTrendData> monthlyTrends;
    private FinancialSummary financialSummary;

    @Getter
    @Setter
    public static class SupplierIncomeData {
        private double totalIncome;
        private double monthlyIncome;
        private int totalProductsSold;
        private int monthlyProductsSold;
        private double averageOrderValue;
        private List<TopSupplier> topSuppliers;
    }

    @Getter
    @Setter
    public static class BuyerSpendingData {
        private double totalSpending;
        private double monthlySpending;
        private int totalOrdersPlaced;
        private int monthlyOrdersPlaced;
        private double averageOrderValue;
        private List<TopBuyer> topBuyers;
    }

    @Getter
    @Setter
    public static class TopSupplier {
        private String supplierName;
        private String supplierId;
        private double totalIncome;
        private int productsSold;
    }

    @Getter
    @Setter
    public static class TopBuyer {
        private String buyerName;
        private String buyerId;
        private double totalSpending;
        private int ordersPlaced;
    }

    @Getter
    @Setter
    public static class FinancialTrendData {
        private String month;
        private double supplierIncome;
        private double buyerSpending;
        private int transactionCount;
    }

    @Getter
    @Setter
    public static class FinancialSummary {
        private double totalRevenue;
        private double totalCommissions;
        private double netProfit;
        private double growthRate;
    }
}
