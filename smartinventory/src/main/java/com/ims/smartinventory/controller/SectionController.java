package com.ims.smartinventory.controller;

import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.dto.Response.AdvancedAnalyticsResponse;
import com.ims.smartinventory.service.AdvancedAnalyticsService;
import com.ims.smartinventory.service.SectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/section")
public class SectionController {
    private final SectionService sectionService;
    private final AdvancedAnalyticsService advancedAnalyticsService;

    public SectionController(SectionService sectionService, AdvancedAnalyticsService advancedAnalyticsService) {
        this.sectionService = sectionService;
        this.advancedAnalyticsService = advancedAnalyticsService;
    }

    @GetMapping("/{sectionId}/children")
    public ResponseEntity<List<?>> getSectionChildren(@PathVariable String sectionId) {
        try {
            List<?> response = sectionService.getSectionChildren(sectionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/{sectionId}/terminate")
    public ResponseEntity<SectionEntity> terminateSection(@PathVariable String sectionId) {
        SectionEntity terminatedSection = sectionService.terminateSection(sectionId);
        return ResponseEntity.ok(terminatedSection);
    }

    @PutMapping("/{sectionId}/activate")
    public ResponseEntity<SectionEntity> activateSection(@PathVariable String sectionId) {
        SectionEntity activatedSection = sectionService.activateSection(sectionId);
        return ResponseEntity.ok(activatedSection);
    }

    // Advanced Analytics Methods
    @GetMapping("/analytics/test")
    public ResponseEntity<String> testAnalyticsEndpoint() {
        System.out.println("=== ANALYTICS TEST ENDPOINT CALLED ===");
        return ResponseEntity.ok("Analytics service is running");
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdvancedAnalyticsResponse> getAdvancedAnalytics() {
        System.out.println("=== ANALYTICS ENDPOINT CALLED ===");
        System.out.println("getAdvancedAnalytics endpoint reached!");
        try {
            System.out.println("About to call advancedAnalyticsService.getAdvancedAnalytics()");
            AdvancedAnalyticsResponse analytics = advancedAnalyticsService.getAdvancedAnalytics();
            System.out.println("Analytics data retrieved successfully");
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            System.err.println("Error in getAdvancedAnalytics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/analytics/supplier-spending")
    public ResponseEntity<List<AdvancedAnalyticsResponse.SupplierSpendData>> getSupplierSpendingAnalysis() {
        try {
            List<AdvancedAnalyticsResponse.SupplierSpendData> analysis = advancedAnalyticsService.getSupplierSpendingAnalysis();
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            System.err.println("Error in getSupplierSpendingAnalysis: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/analytics/supplier-section-spending")
    public ResponseEntity<List<AdvancedAnalyticsResponse.SupplierSectionSpendData>> getSupplierSectionSpending() {
        try {
            List<AdvancedAnalyticsResponse.SupplierSectionSpendData> analysis = advancedAnalyticsService.getSupplierSectionSpending();
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            System.err.println("Error in getSupplierSectionSpending: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/analytics/monthly-revenue")
    public ResponseEntity<List<AdvancedAnalyticsResponse.MonthlyRevenueData>> getMonthlyRevenueData(
            @RequestParam(defaultValue = "12") int months) {
        try {
            List<AdvancedAnalyticsResponse.MonthlyRevenueData> data = advancedAnalyticsService.getMonthlyRevenueData(months);
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            System.err.println("Error in getMonthlyRevenueData: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/analytics/warehouse-profitability")
    public ResponseEntity<AdvancedAnalyticsResponse.WarehouseProfitabilityData> getWarehouseProfitability() {
        try {
            AdvancedAnalyticsResponse.WarehouseProfitabilityData data = advancedAnalyticsService.getWarehouseProfitability();
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            System.err.println("Error in getWarehouseProfitability: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/analytics/section-profitability")
    public ResponseEntity<List<AdvancedAnalyticsResponse.SectionProfitabilityData>> getSectionProfitabilityAnalysis() {
        try {
            List<AdvancedAnalyticsResponse.SectionProfitabilityData> analysis = advancedAnalyticsService.getSectionProfitabilityAnalysis();
            return ResponseEntity.ok(analysis);
        } catch (Exception e) {
            System.err.println("Error in getSectionProfitabilityAnalysis: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/analytics/summary-metrics")
    public ResponseEntity<AdvancedAnalyticsResponse.SummaryMetrics> getSummaryMetrics() {
        try {
            AdvancedAnalyticsResponse.SummaryMetrics metrics = advancedAnalyticsService.getSummaryMetrics();
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            System.err.println("Error in getSummaryMetrics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/analytics/revenue-by-date-range")
    public ResponseEntity<List<AdvancedAnalyticsResponse.MonthlyRevenueData>> getRevenueDataByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            List<AdvancedAnalyticsResponse.MonthlyRevenueData> data =
                    advancedAnalyticsService.getRevenueDataByDateRange(
                            java.time.LocalDate.parse(startDate),
                            java.time.LocalDate.parse(endDate)
                    );
            return ResponseEntity.ok(data);
        } catch (Exception e) {
            System.err.println("Error in getRevenueDataByDateRange: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}