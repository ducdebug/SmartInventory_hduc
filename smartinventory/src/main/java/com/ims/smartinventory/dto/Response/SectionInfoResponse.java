package com.ims.smartinventory.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SectionInfoResponse {
    private String id;
    private String name;
    private int x;
    private int y;
    private int numShelves;
    private int totalSlots;
    private int usedSlots;
    private List<StorageConditionDto> storageConditions;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StorageConditionDto {
        private String conditionType;
        private Double minValue;
        private Double maxValue;
        private String unit;
    }
}
