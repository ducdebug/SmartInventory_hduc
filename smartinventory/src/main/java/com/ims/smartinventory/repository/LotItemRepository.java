package com.ims.smartinventory.repository;

import com.ims.common.entity.management.LotItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LotItemRepository extends JpaRepository<LotItemEntity, String> {
}
