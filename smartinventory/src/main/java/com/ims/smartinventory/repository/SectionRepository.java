package com.ims.smartinventory.repository;

import com.ims.common.config.SectionStatus;
import com.ims.common.entity.WarehouseEntity;
import com.ims.common.entity.storage.SectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface SectionRepository extends JpaRepository<SectionEntity, String> {
    @Query("SELECT s FROM SectionEntity s LEFT JOIN FETCH s.storageConditions")
    List<SectionEntity> findAllWithStorageConditions();

    List<SectionEntity> findByWarehouse(WarehouseEntity warehouse);
    
    // Find sections by status (for price updates)
    List<SectionEntity> findByStatus(SectionStatus status);
    
    // Find section by name
    Optional<SectionEntity> findByName(String name);
    
    // Find first section by name (to handle duplicates)
    Optional<SectionEntity> findFirstByName(String name);
}
