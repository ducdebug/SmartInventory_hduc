package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.InventoryAnalyticsResponse;


public interface InventoryAnalyticsService {
    InventoryAnalyticsResponse getInventoryAnalytics();

    InventoryAnalyticsResponse.MonthlyVolumeData[] getVolumeOverTime(int months);

    InventoryAnalyticsResponse.ProductMovementData[] getProductMovementAnalysis();

    InventoryAnalyticsResponse.StorageAllocationData[] getStorageAllocation();

    InventoryAnalyticsResponse.SectionUtilizationData[] getSectionUtilization();

    InventoryAnalyticsResponse.SummaryStatistics getSummaryStatistics();
}