package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.WarehouseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<WarehouseEntity, String> {
}
