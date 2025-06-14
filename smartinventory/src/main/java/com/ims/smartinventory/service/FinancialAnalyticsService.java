package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.FinancialAnalyticsResponse;

import java.util.List;

public interface FinancialAnalyticsService {
    FinancialAnalyticsResponse getFinancialAnalytics();
    List<FinancialAnalyticsResponse.TopSupplier> getTopSuppliersByRevenue(int limit);
    List<FinancialAnalyticsResponse.TopBuyer> getTopBuyersBySpending(int limit);
}
