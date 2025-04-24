package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.management.DispatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<DispatchEntity, String> {
    
    List<DispatchEntity> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
    
    Optional<DispatchEntity> findByIdAndBuyerId(String id, String buyerId);
}
