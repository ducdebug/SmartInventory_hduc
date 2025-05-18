package com.ims.smartinventory.dto.Response;

import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.management.DispatchEntity;
import com.ims.common.entity.management.DispatchItemEntity;
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
    private PriceDTO totalPrice;

    public static DispatchDetailResponse fromEntity(DispatchEntity entity) {
        List<DispatchItemResponse> itemResponses = entity.getItems().stream()
                .map(DispatchDetailResponse::mapToItemResponse)
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

        if (item.getProducts() != null && !item.getProducts().isEmpty()) {
            BaseProductEntity representativeProduct = item.getProducts().get(0);
            productDetails = ProductDetailsResponse.builder()
                    .id(representativeProduct.getId())
                    .name(representativeProduct.getName())
                    .lotCode(representativeProduct.getLot() != null ? representativeProduct.getLot().getLotCode() : null)
                    .expirationDate(representativeProduct.getExpirationDate())
                    .build();
        }
        // Fallback to the single product reference for backward compatibility
        else if (item.getProduct() != null) {
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DispatchItemResponse {
        private String id;
        private String productId;
        private int quantity;
        private ProductDetailsResponse product;
        private PriceDTO subtotal;
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
        private PriceDTO unitPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceDTO {
        private double value;
        private String currency;
    }
}