package com.ims.smartinventory.dto.Request;

import com.ims.common.config.StorageConditions;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PriceCalculationRequestDto {
    private int slotCount;
    private List<StorageConditions> storageConditions;
}
