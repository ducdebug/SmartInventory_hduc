package com.ims.smartinventory.dto.Response;

import com.ims.common.entity.management.DispatchEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchHistoryResponse {
    private String id;
    private Date createdAt;
    private String status;
    private int totalItems;

    public static DispatchHistoryResponse fromEntity(DispatchEntity entity) {
        return DispatchHistoryResponse.builder()
                .id(entity.getId())
                .createdAt(entity.getCreatedAt())
                .status(entity.getStatus().name())
                .totalItems(entity.getItems() != null ? entity.getItems().size() : 0)
                .build();
    }
}