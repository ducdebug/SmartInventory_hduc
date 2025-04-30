package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Request.SectionRequestDto;
import com.ims.smartinventory.entity.storage.SectionEntity;

import java.util.List;

public interface SectionService {
    SectionEntity createSection(SectionRequestDto sectionRequest);

    List<?> getSectionChildren(String sectionId);
}
