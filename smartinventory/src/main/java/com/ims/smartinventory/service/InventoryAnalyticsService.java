package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.InventoryAnalyticsResponse;

/**
 * Service for inventory analytics and reporting
 */
public interface InventoryAnalyticsService {
    
    /**
     * Get comprehensive inventory analytics data
     * @return InventoryAnalyticsResponse containing various analytics metrics
     */
    InventoryAnalyticsResponse getInventoryAnalytics();
    
    /**
     * Get inventory volume trends over time
     * @param months Number of months to include in trend data (default: 12)
     * @return List of monthly volume data
     */
    InventoryAnalyticsResponse.MonthlyVolumeData[] getVolumeOverTime(int months);
    
    /**
     * Get product movement analysis data (imports vs exports)
     * @return List of product movement data by category
     */
    InventoryAnalyticsResponse.ProductMovementData[] getProductMovementAnalysis();
    
    /**
     * Get storage allocation data by product type
     * @return List of storage allocation data
     */
    InventoryAnalyticsResponse.StorageAllocationData[] getStorageAllocation();
    
    /**
     * Get section utilization data
     * @return List of section utilization data
     */
    InventoryAnalyticsResponse.SectionUtilizationData[] getSectionUtilization();
    
    /**
     * Get summary statistics for inventory
     * @return Summary statistics
     */
    InventoryAnalyticsResponse.SummaryStatistics getSummaryStatistics();
}