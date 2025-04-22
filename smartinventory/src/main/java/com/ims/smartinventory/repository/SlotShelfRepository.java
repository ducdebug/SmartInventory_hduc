package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.storage.SlotShelf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SlotShelfRepository extends JpaRepository<SlotShelf, String> {
    @Query("SELECT COUNT(s) FROM SlotShelf s WHERE s.shelf.section.id = :sectionId AND s.occupied = true")
    int countUsedBySectionId(@Param("sectionId") String sectionId);
}

