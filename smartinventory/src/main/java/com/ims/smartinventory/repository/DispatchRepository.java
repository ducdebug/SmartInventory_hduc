package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.management.DispatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DispatchRepository extends JpaRepository<DispatchEntity, String> {
}
