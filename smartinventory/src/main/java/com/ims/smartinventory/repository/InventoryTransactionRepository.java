package com.ims.smartinventory.repository;

import com.ims.common.config.TransactionType;
import com.ims.common.entity.management.InventoryTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Date;
import java.util.List;

public interface InventoryTransactionRepository extends JpaRepository<InventoryTransactionEntity, String> {
    List<InventoryTransactionEntity> findByType(TransactionType type);
    List<InventoryTransactionEntity> findByTimestampBetween(Date startDate, Date endDate);
}
