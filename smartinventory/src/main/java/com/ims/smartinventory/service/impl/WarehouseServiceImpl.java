package com.ims.smartinventory.service.impl;

import com.ims.smartinventory.dto.Response.SectionInfoResponse;
import com.ims.smartinventory.entity.storage.SectionEntity;
import com.ims.smartinventory.repository.SectionRepository;
import com.ims.smartinventory.repository.SlotSectionRepository;
import com.ims.smartinventory.repository.SlotShelfRepository;
import com.ims.smartinventory.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WarehouseServiceImpl implements WarehouseService {

    private final SectionRepository sectionRepository;
    private final SlotShelfRepository slotShelfRepository;
    private final SlotSectionRepository slotSectionRepository;
    @Autowired
    public WarehouseServiceImpl(SectionRepository sectionRepository, SlotShelfRepository slotShelfRepository, SlotSectionRepository slotSectionRepository) {
        this.sectionRepository = sectionRepository;
        this.slotShelfRepository = slotShelfRepository;
        this.slotSectionRepository = slotSectionRepository;
    }


    @Override
    public List<SectionInfoResponse> getCurrentWarehouseSections() {
        return List.of();
    }

    @Override
    public List<SectionInfoResponse> getAllSection() {
        List<SectionEntity> sections = sectionRepository.findAll();

        return sections.stream().map(section -> {
            int totalSlots = section.getTotalSlots();

            int usedSlots = section.getShelves() != null && !section.getShelves().isEmpty()
                    ? slotShelfRepository.countUsedBySectionId(section.getId())
                    : slotSectionRepository.countUsedBySectionId(section.getId());
            List<SectionInfoResponse.StorageConditionDto> conditionDtos = section.getStorageConditions().stream()
                    .map(cond -> new SectionInfoResponse.StorageConditionDto(
                            cond.getConditionType().name(),
                            cond.getMinValue(),
                            cond.getMaxValue(),
                            cond.getUnit()
                    )).toList();

            return new SectionInfoResponse(
                    section.getId(),
                    section.getName(),
                    section.getX(),
                    section.getY(),
                    section.getNumShelves(),
                    totalSlots,
                    usedSlots,
                    conditionDtos
            );
        }).toList();
    }
}
