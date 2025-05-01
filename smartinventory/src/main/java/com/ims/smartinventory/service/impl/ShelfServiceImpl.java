package com.ims.smartinventory.service.impl;

import com.ims.common.entity.storage.ShelfEntity;
import com.ims.smartinventory.dto.Response.SlotInfo;
import com.ims.smartinventory.repository.ShelfRepository;
import com.ims.smartinventory.service.ShelfService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ShelfServiceImpl implements ShelfService {

    private final ShelfRepository shelfRepository;

    public ShelfServiceImpl(ShelfRepository shelfRepository) {
        this.shelfRepository = shelfRepository;
    }

    @Override
    public List<SlotInfo> getSlotsByShelf(String shelfId) {
        ShelfEntity shelf = shelfRepository.findById(shelfId)
                .orElseThrow(() -> new RuntimeException("Shelf not found"));

        return shelf.getSlotShelves().stream()
                .map(slot -> new SlotInfo(
                        slot.getId(),
                        slot.getX(),
                        slot.getY(),
                        slot.isOccupied()
                )).toList();
    }

}
