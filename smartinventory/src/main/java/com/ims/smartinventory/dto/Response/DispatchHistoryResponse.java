package com.ims.smartinventory.dto.Response;

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

        return DispatchDetailResponse.PriceDTO.builder()
                .value(0)
                .currency("")
                .build();
    }
}