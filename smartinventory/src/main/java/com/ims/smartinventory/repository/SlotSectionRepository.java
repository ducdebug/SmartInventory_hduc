package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.storage.SlotSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SlotSectionRepository extends JpaRepository<SlotSection, String> {
    @Query("SELECT COUNT(s) FROM SlotSection s WHERE s.section.id = :sectionId AND s.occupied = true")
    int countUsedBySectionId(@Param("sectionId") String sectionId);
}
