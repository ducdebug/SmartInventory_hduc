package com.ims.smartinventory.repository;

import com.ims.common.entity.WarehouseEntity;
import com.ims.common.entity.storage.SectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SectionRepository extends JpaRepository<SectionEntity, String> {
    @Query("SELECT s FROM SectionEntity s LEFT JOIN FETCH s.storageConditions")
    List<SectionEntity> findAllWithStorageConditions();

    List<SectionEntity> findByWarehouse(WarehouseEntity warehouse);
}
