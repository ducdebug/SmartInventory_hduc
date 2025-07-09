package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.AdvancedAnalyticsResponse;

import java.time.LocalDate;
import java.util.List;

public interface AdvancedAnalyticsService {
    AdvancedAnalyticsResponse getAdvancedAnalytics();

    List<AdvancedAnalyticsResponse.SupplierSpendData> getSupplierSpendingAnalysis();

    List<AdvancedAnalyticsResponse.SupplierSectionSpendData> getSupplierSectionSpending();

    List<AdvancedAnalyticsResponse.MonthlyRevenueData> getMonthlyRevenueData(int months);

    AdvancedAnalyticsResponse.WarehouseProfitabilityData getWarehouseProfitability();

    List<AdvancedAnalyticsResponse.SectionProfitabilityData> getSectionProfitabilityAnalysis();

    AdvancedAnalyticsResponse.SummaryMetrics getSummaryMetrics();

    List<AdvancedAnalyticsResponse.MonthlyRevenueData> getRevenueDataByDateRange(LocalDate startDate, LocalDate endDate);
}