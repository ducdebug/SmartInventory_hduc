package com.ims.smartinventory.dto.Request;

import lombok.Getter;
import lombok.Setter;

import java.util.Collections;
import java.util.List;

@Getter
@Setter
public class SectionRequestDto {
    private String name;
    private int y_slot;
    private int shelf_height;
    private List<StorageConditionDto> storageConditions;

    public int getRequiredSlot() {
        return 6 * y_slot;
    }

    public List<StorageConditionDto> getStorageConditions() {
        return (storageConditions == null) ? Collections.emptyList() : storageConditions;
    }
}
