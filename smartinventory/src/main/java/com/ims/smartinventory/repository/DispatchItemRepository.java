// DispatchItemRepository.java
package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.management.DispatchItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DispatchItemRepository extends JpaRepository<DispatchItemEntity, String> {
}
