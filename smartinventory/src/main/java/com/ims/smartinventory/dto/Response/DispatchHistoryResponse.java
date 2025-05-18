package com.ims.smartinventory.dto.Response;

import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.PriceEntity;
import com.ims.common.entity.management.DispatchEntity;
import com.ims.common.entity.management.DispatchItemEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchHistoryResponse {
    private String id;
    private Date createdAt;
    private String status;
    private int totalItems;
    private DispatchDetailResponse.PriceDTO totalPrice;

    public static DispatchHistoryResponse fromEntity(DispatchEntity entity) {
        DispatchDetailResponse.PriceDTO totalPrice = calculateTotalPrice(entity.getItems());

        return DispatchHistoryResponse.builder()
                .id(entity.getId())
                .createdAt(entity.getCreatedAt())
                .status(entity.getStatus().name())
                .totalItems(entity.getItems() != null ? entity.getItems().size() : 0)
                .totalPrice(totalPrice)
                .build();
    }

    private static DispatchDetailResponse.PriceDTO calculateTotalPrice(List<DispatchItemEntity> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }

        double totalValue = 0;
        String currency = "VND";

        for (DispatchItemEntity item : items) {
            if (item.getProducts() != null && !item.getProducts().isEmpty()) {
                BaseProductEntity product = item.getProducts().getFirst();
                PriceEntity price = null;

                if (product.getSecondaryPrice() != null) {
                    price = product.getSecondaryPrice();
                } else if (product.getPrimaryPrice() != null) {
                    price = product.getPrimaryPrice();
                }

                if (price != null) {
                    totalValue += price.getValue() * item.getQuantity();
                    currency = price.getCurrency();
                }
            } else if (item.getProduct() != null) {
                PriceEntity price = null;
                if (item.getProduct().getSecondaryPrice() != null) {
                    price = item.getProduct().getSecondaryPrice();
                } else if (item.getProduct().getPrimaryPrice() != null) {
                    price = item.getProduct().getPrimaryPrice();
                }

                if (price != null) {
                    totalValue += price.getValue() * item.getQuantity();
                    currency = price.getCurrency();
                }
            }
        }

        return DispatchDetailResponse.PriceDTO.builder()
                .value(totalValue)
                .currency(currency)
                .build();
    }
}