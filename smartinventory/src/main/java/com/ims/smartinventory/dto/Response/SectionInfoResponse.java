package com.ims.smartinventory.dto.Response;

import com.ims.common.config.SectionStatus;
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
    private SectionStatus status;
    private List<StorageConditionDto> storageConditions;
    private PriceInfoDto priceInfo;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StorageConditionDto {
        private String conditionType;
        private Double minValue;
        private Double maxValue;
        private String unit;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PriceInfoDto {
        private Double monthlyPrice;
        private String currency;
        private Double pricePerSlot;
    }
}
