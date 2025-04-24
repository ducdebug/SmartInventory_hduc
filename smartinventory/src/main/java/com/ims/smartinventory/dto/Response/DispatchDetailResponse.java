package com.ims.smartinventory.dto.Response;

import com.ims.smartinventory.entity.management.DispatchEntity;
import com.ims.smartinventory.entity.management.DispatchItemEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchDetailResponse {
    private String id;
    private Date createdAt;
    private String status;
    private List<DispatchItemResponse> items;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DispatchItemResponse {
        private String id;
        private String productId;
        private int quantity;
        private ProductDetailsResponse product;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductDetailsResponse {
        private String id;
        private String name;
        private String lotCode;
        private Date expirationDate;
    }
    
    public static DispatchDetailResponse fromEntity(DispatchEntity entity) {
        List<DispatchItemResponse> itemResponses = entity.getItems().stream()
                .map(item -> mapToItemResponse(item))
                .collect(Collectors.toList());
        
        return DispatchDetailResponse.builder()
                .id(entity.getId())
                .createdAt(entity.getCreatedAt())
                .status(entity.getStatus().name())
                .items(itemResponses)
                .build();
    }
    
    private static DispatchItemResponse mapToItemResponse(DispatchItemEntity item) {
        ProductDetailsResponse productDetails = null;
        
        if (item.getProduct() != null) {
            productDetails = ProductDetailsResponse.builder()
                    .id(item.getProduct().getId())
                    .name(item.getProduct().getName())
                    .lotCode(item.getProduct().getLot() != null ? item.getProduct().getLot().getLotCode() : null)
                    .expirationDate(item.getProduct().getExpirationDate())
                    .build();
        }
        
        return DispatchItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .quantity(item.getQuantity())
                .product(productDetails)
                .build();
    }
}