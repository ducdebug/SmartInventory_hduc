package com.ims.smartinventory.repository;

import com.ims.common.entity.storage.ShelfEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShelfRepository extends JpaRepository<ShelfEntity, String> {
}
