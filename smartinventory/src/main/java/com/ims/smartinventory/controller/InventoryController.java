package com.ims.smartinventory.controller;

import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.dto.Request.*;
import com.ims.smartinventory.dto.Response.InventoryAnalyticsResponse;
import com.ims.smartinventory.dto.Response.ProductResponse;
import com.ims.smartinventory.dto.Response.ProductsByLotResponse;
import com.ims.smartinventory.service.FinancialAnalyticsService;
import com.ims.smartinventory.service.InventoryAnalyticsService;
import com.ims.smartinventory.service.ProductService;
import com.ims.smartinventory.service.SectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {
    private final SectionService sectionService;
    private final ProductService productService;
    private final InventoryAnalyticsService inventoryAnalyticsService;
    private final FinancialAnalyticsService financialAnalyticsService;

    public InventoryController(SectionService sectionService, ProductService productService,
                               InventoryAnalyticsService inventoryAnalyticsService,
                               FinancialAnalyticsService financialAnalyticsService) {
        this.sectionService = sectionService;
        this.productService = productService;
        this.inventoryAnalyticsService = inventoryAnalyticsService;
        this.financialAnalyticsService = financialAnalyticsService;
    }

    @PostMapping("/section")
    public ResponseEntity<SectionEntity> createSection(@RequestBody SectionRequestDto sectionRequest,
                                                       @AuthenticationPrincipal UserEntity currentUser) {
        SectionEntity newSection = sectionService.createSection(sectionRequest);
        return ResponseEntity.ok(newSection);
    }

    @PostMapping("/batch")
    public ResponseEntity<?> storeBatch(@RequestBody ProductBatchRequestDto batchRequest,
                                        @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("User is null. Check authentication setup.");
        }
        productService.storeBatch(batchRequest, currentUser);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/retrieveAll")
    public ResponseEntity<List<ProductGroupResponseDto>> retrieveGroupedProducts() {
        return ResponseEntity.ok(productService.getGroupedProducts());
    }

    @GetMapping("/{slotId}/product")
    public ResponseEntity<?> getProductBySlot(@PathVariable String slotId) {
        ProductResponse response = productService.getProductResponseBySlotId(slotId);
        return response != null ? ResponseEntity.ok(response) : ResponseEntity.notFound().build();
    }

    @PostMapping("/retrieve-request")
    public ResponseEntity<?> createRetrieveRequest(
            @RequestBody ProductExportRequestDto request,
            @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !UserRole.BUYER.equals(currentUser.getRole())) {
            return ResponseEntity.status(403).body("Only buyers can create retrieval requests");
        }

        String requestId = productService.createRetrieveRequest(request, currentUser);
        return ResponseEntity.ok(requestId);
    }

    @GetMapping("/product-type-distribution")
    public ResponseEntity<InventoryAnalyticsResponse.StorageAllocationData[]> getProductTypeDistribution() {
        InventoryAnalyticsResponse.StorageAllocationData[] distribution = inventoryAnalyticsService.getStorageAllocation();
        return ResponseEntity.ok(distribution);
    }

    @GetMapping("/analytics")
    public ResponseEntity<InventoryAnalyticsResponse> getInventoryAnalytics() {
        InventoryAnalyticsResponse analytics = inventoryAnalyticsService.getInventoryAnalytics();
        return ResponseEntity.ok(analytics);
    }

    @GetMapping("/admin/products")
    public ResponseEntity<List<ProductsByLotResponse>> getProductsByLotForAdmin(@AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !UserRole.ADMIN.equals(currentUser.getRole())) {
            return ResponseEntity.status(403).body(null);
        }

        List<ProductsByLotResponse> products = productService.getAllProductsByLot();
        return ResponseEntity.ok(products);
    }

    @GetMapping("/supplier/products")
    public ResponseEntity<List<ProductsByLotResponse>> getProductsByLotForSupplier(@AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !UserRole.SUPPLIER.equals(currentUser.getRole())) {
            return ResponseEntity.status(403).body(null);
        }

        List<ProductsByLotResponse> products = productService.getProductsByLotForSupplier(currentUser);
        return ResponseEntity.ok(products);
    }

    @PostMapping("/admin/products/prices")
    public ResponseEntity<?> updateSecondaryPricesAsAdmin(
            @RequestBody UpdateSecondaryPriceRequest request,
            @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !UserRole.ADMIN.equals(currentUser.getRole())) {
            return ResponseEntity.status(403).body("Only admins can update secondary prices");
        }

        productService.updateSecondaryPrices(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/supplier/products/prices")
    public ResponseEntity<?> updateSecondaryPrices(
            @RequestBody UpdateSecondaryPriceRequest request,
            @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !UserRole.SUPPLIER.equals(currentUser.getRole())) {
            return ResponseEntity.status(403).body("Only suppliers can update secondary prices");
        }

        productService.updateSecondaryPrices(request);
        return ResponseEntity.ok().build();
    }
//
//    @GetMapping("/financial-analytics")
//    public ResponseEntity<FinancialAnalyticsResponse> getFinancialAnalytics(@AuthenticationPrincipal UserEntity currentUser) {
//        if (currentUser == null || !UserRole.ADMIN.equals(currentUser.getRole())) {
//            return ResponseEntity.status(403).body(null);
//        }
//
//        FinancialAnalyticsResponse analytics = financialAnalyticsService.getFinancialAnalytics();
//        return ResponseEntity.ok(analytics);
//    }
//
//    @GetMapping("/top-suppliers")
//    public ResponseEntity<List<FinancialAnalyticsResponse.TopSupplier>> getTopSuppliers(
//            @RequestParam(defaultValue = "10") int limit,
//            @AuthenticationPrincipal UserEntity currentUser) {
//        if (currentUser == null || !UserRole.ADMIN.equals(currentUser.getRole())) {
//            return ResponseEntity.status(403).body(null);
//        }
//
//        List<FinancialAnalyticsResponse.TopSupplier> topSuppliers = financialAnalyticsService.getTopSuppliersByRevenue(limit);
//        return ResponseEntity.ok(topSuppliers);
//    }
//
//    @GetMapping("/top-buyers")
//    public ResponseEntity<List<FinancialAnalyticsResponse.TopBuyer>> getTopBuyers(
//            @RequestParam(defaultValue = "10") int limit,
//            @AuthenticationPrincipal UserEntity currentUser) {
//        if (currentUser == null || !UserRole.ADMIN.equals(currentUser.getRole())) {
//            return ResponseEntity.status(403).body(null);
//        }
//
//        List<FinancialAnalyticsResponse.TopBuyer> topBuyers = financialAnalyticsService.getTopBuyersBySpending(limit);
//        return ResponseEntity.ok(topBuyers);
//    }
}
