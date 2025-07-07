package com.ims.smartinventory.service;

import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.dto.Request.SectionRequestDto;

import java.util.List;

public interface SectionService {
    SectionEntity createSection(SectionRequestDto sectionRequest);

    List<?> getSectionChildren(String sectionId);

    SectionEntity terminateSection(String sectionId);

    SectionEntity activateSection(String sectionId);
}
