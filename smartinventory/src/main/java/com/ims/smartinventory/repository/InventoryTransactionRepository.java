package com.ims.smartinventory.repository;

import com.ims.common.entity.management.InventoryTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransactionEntity, String> {
}
