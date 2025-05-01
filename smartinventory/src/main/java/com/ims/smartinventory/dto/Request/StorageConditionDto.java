package com.ims.smartinventory.dto.Request;

import com.ims.common.config.StorageConditions;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class StorageConditionDto {
    private StorageConditions conditionType;
    private Double minValue;
    private Double maxValue;
    private String unit;
}
