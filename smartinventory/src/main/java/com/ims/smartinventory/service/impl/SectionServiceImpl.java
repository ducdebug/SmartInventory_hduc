package com.ims.smartinventory.service.impl;

import com.ims.smartinventory.dto.Request.SectionRequestDto;
import com.ims.smartinventory.dto.Response.ShelfInfo;
import com.ims.smartinventory.dto.Response.SlotInfo;
import com.ims.smartinventory.entity.WarehouseEntity;
import com.ims.smartinventory.entity.storage.*;
import com.ims.smartinventory.repository.SectionRepository;
import com.ims.smartinventory.repository.WarehouseRepository;
import com.ims.smartinventory.service.SectionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class SectionServiceImpl implements SectionService {
    private final SectionRepository sectionRepository;
    private final WarehouseRepository warehouseRepository;

    public SectionServiceImpl(SectionRepository sectionRepository, WarehouseRepository warehouseRepository) {
        this.sectionRepository = sectionRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional
    @Override
    public SectionEntity createSection(SectionRequestDto sectionRequest) {
        WarehouseEntity warehouse = warehouseRepository.findById("unique_warehouse")
                .orElseThrow(() -> new RuntimeException("Warehouse with ID 'unique_warehouse' not found"));

        int requiredSlots = sectionRequest.getRequiredSlot();

        if (!warehouse.hasAvailableSlots(requiredSlots)) {
            throw new RuntimeException("Not enough slots in the warehouse");
        }

        List<SectionEntity> existingSections = sectionRepository.findByWarehouse(warehouse);

        Set<String> usedCoords = existingSections.stream()
                .map(s -> s.getX() + "," + s.getY())
                .collect(Collectors.toSet());

        int newX = 0, newY = 0;
        boolean found = false;

        outer:
        for (int y = 0; y < 100; y++) {
            for (int x = 0; x <= 1; x++) {
                String key = x + "," + y;
                if (!usedCoords.contains(key)) {
                    newX = x;
                    newY = y;
                    found = true;
                    break outer;
                }
            }
        }

        if (!found) {
            throw new RuntimeException("No available position found in warehouse");
        }

        SectionEntity section = new SectionEntity();
        section.setName(sectionRequest.getName());
        section.setWarehouse(warehouse);
        section.setX(newX);
        section.setY(newY);
        section.setY_slot(sectionRequest.getY_slot());

        List<StorageConditionEntity> storageConditions = sectionRequest.getStorageConditions().stream()
                .map(cond -> {
                    StorageConditionEntity newCond = new StorageConditionEntity();
                    newCond.setConditionType(cond.getConditionType());
                    newCond.setMinValue(cond.getMinValue());
                    newCond.setMaxValue(cond.getMaxValue());
                    newCond.setUnit(cond.getUnit());
                    newCond.setSection(section);
                    return newCond;
                }).toList();
        section.setStorageConditions(storageConditions);

        if (sectionRequest.getShelf_height() > 0) {
            section.setNumShelves(sectionRequest.getY_slot());
            List<ShelfEntity> shelves = new ArrayList<>();

            for (int i = 0; i < sectionRequest.getY_slot(); i++) {
                ShelfEntity shelf = new ShelfEntity();
                shelf.setSection(section);
                shelf.setWidth(6);
                shelf.setHeight(sectionRequest.getShelf_height());
                shelf.setSlotsPerShelf(6 * sectionRequest.getShelf_height());

                List<SlotShelf> slotShelves = new ArrayList<>();
                for (int x = 0; x < sectionRequest.getShelf_height(); x++) {
                    for (int y = 0; y < 6; y++) {
                        SlotShelf slot = new SlotShelf();
                        slot.setShelf(shelf);
                        slot.setX(x);
                        slot.setY(y);
                        slot.setOccupied(false);
                        slotShelves.add(slot);
                    }
                }

                shelf.setSlotShelves(slotShelves);
                shelves.add(shelf);
            }

            section.setShelves(shelves);
            section.setSlotSections(null);
        } else {
            List<SlotSection> slotSections = new ArrayList<>();
            for (int i = 0; i < requiredSlots; i++) {
                SlotSection slot = new SlotSection();
                slot.setSection(section);
                slot.setXPosition(i % 6);
                slot.setYPosition(i / 6);
                slot.setOccupied(false);
                slotSections.add(slot);
            }
            section.setSlotSections(slotSections);
            section.setShelves(null);
            section.setNumShelves(0);
        }
        warehouse.setUsedSlots(warehouse.getUsedSlots() + requiredSlots);

        warehouseRepository.save(warehouse);
        return sectionRepository.save(section);
    }

    @Override
    public List<?> getSectionChildren(String sectionId) {
        SectionEntity section = sectionRepository.findById(sectionId)
                .orElseThrow(() -> new RuntimeException("Section not found"));

        if (section.getNumShelves() > 0) {
            return section.getShelves().stream()
                    .map(shelf -> new ShelfInfo(
                            shelf.getId(),
                            shelf.getWidth(),
                            shelf.getHeight(),
                            shelf.getSlotsPerShelf()
                    )).toList();
        } else {
            return section.getSlotSections().stream()
                    .map(slot -> new SlotInfo(
                            slot.getId(),
                            slot.getXPosition(),
                            slot.getYPosition(),
                            slot.isOccupied()
                    )).toList();
        }
    }
}
