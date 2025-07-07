package com.ims.smartinventory.dto.Response;

import com.ims.common.config.SectionStatus;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SectionDetailsDto {
    private String id;
    private String name;
    private SectionStatus status;
    private int numShelves;
    private int y_slot;
    private int x;
    private int y;
    private int totalSlots;

    private PriceInfo price;

    private List<StorageConditionInfo> storageConditions;

    @Getter
    @Setter
    public static class PriceInfo {
        private String id;
        private double value;
        private String currency;
        private String transactionType;
    }

    @Getter
    @Setter
    public static class StorageConditionInfo {
        private String id;
        private String conditionType;
        private double minValue;
        private double maxValue;
        private String unit;
    }
}
