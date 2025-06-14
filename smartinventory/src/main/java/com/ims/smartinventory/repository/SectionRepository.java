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
//
//    // NEW: Find sections by warehouse ID
//    @Query("SELECT s FROM SectionEntity s WHERE s.warehouse.id = :warehouseId")
//    List<SectionEntity> findByWarehouseId(@Param("warehouseId") String warehouseId);
//
//    // NEW: Find sections that need maintenance cost updates
//    @Query("SELECT s FROM SectionEntity s WHERE s.lastMaintenanceUpdate IS NULL OR s.lastMaintenanceUpdate < :cutoffDate")
//    List<SectionEntity> findSectionsNeedingMaintenanceUpdate(@Param("cutoffDate") LocalDateTime cutoffDate);
//
//    // NEW: Find sections with specific storage conditions
//    @Query("SELECT s FROM SectionEntity s JOIN s.storageConditions sc WHERE sc.conditionType = :conditionType")
//    List<SectionEntity> findByStorageConditionType(@Param("conditionType") String conditionType);
//
//    // NEW: Find sections with maintenance cost above threshold
//    @Query("SELECT s FROM SectionEntity s WHERE s.maintenanceCost.value > :threshold")
//    List<SectionEntity> findHighMaintenanceCostSections(@Param("threshold") double threshold);
//
//    // NEW: Get sections ordered by maintenance cost (highest first)
//    @Query("SELECT s FROM SectionEntity s WHERE s.maintenanceCost IS NOT NULL ORDER BY s.maintenanceCost.value DESC")
//    List<SectionEntity> findAllOrderByMaintenanceCostDesc();
}
