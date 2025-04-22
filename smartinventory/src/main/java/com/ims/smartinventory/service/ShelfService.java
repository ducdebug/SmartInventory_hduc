package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.SlotInfo;

import java.util.List;

public interface ShelfService {
    List<SlotInfo> getSlotsByShelf(String shelfId);
}
