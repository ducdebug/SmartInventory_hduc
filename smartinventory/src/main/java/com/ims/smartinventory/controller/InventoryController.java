package com.ims.smartinventory.controller;

import com.ims.smartinventory.dto.Request.ProductBatchRequestDto;
import com.ims.smartinventory.dto.Request.ProductExportRequestDto;
import com.ims.smartinventory.dto.Request.ProductGroupResponseDto;
import com.ims.smartinventory.dto.Request.SectionRequestDto;
import com.ims.smartinventory.dto.Response.InventoryAnalyticsResponse;
import com.ims.smartinventory.dto.Response.ProductResponse;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.entity.storage.SectionEntity;
import com.ims.smartinventory.entity.storage.SlotEntity;
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

    public InventoryController(SectionService sectionService, ProductService productService, InventoryAnalyticsService inventoryAnalyticsService) {
        this.sectionService = sectionService;
        this.productService = productService;
        this.inventoryAnalyticsService = inventoryAnalyticsService;
    }

    @PostMapping("/section")
    public ResponseEntity<SectionEntity> createSection(@RequestBody SectionRequestDto sectionRequest,  @AuthenticationPrincipal UserEntity currentUser) {
        SectionEntity newSection = sectionService.createSection(sectionRequest);
        return ResponseEntity.ok(newSection);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<SlotEntity>> storeBatch(@RequestBody ProductBatchRequestDto batchRequest,  @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null) {
            throw new IllegalStateException("User is null. Check authentication setup.");
        }
        List<SlotEntity> allocatedSlots = productService.storeBatch(batchRequest, currentUser);

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

    @PostMapping("/export")
    public ResponseEntity<?> exportGroupedProducts(
            @RequestBody ProductExportRequestDto request,
            @AuthenticationPrincipal UserEntity currentUser) {
        productService.exportGroupedProducts(request, currentUser);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/retrieve-request")
    public ResponseEntity<?> createRetrieveRequest(
            @RequestBody ProductExportRequestDto request,
            @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !"BUYER".equals(currentUser.getRole().name())) {
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

}
