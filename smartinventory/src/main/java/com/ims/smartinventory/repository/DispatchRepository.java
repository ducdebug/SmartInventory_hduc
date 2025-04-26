package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.management.DispatchEntity;
import com.ims.smartinventory.config.DispatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<DispatchEntity, String> {
    
    // Buyer-specific queries
    List<DispatchEntity> findByBuyerIdOrderByCreatedAtDesc(String buyerId);
    
    Optional<DispatchEntity> findByIdAndBuyerId(String id, String buyerId);
    
    // Admin-specific queries for export management
    List<DispatchEntity> findByStatusInOrderByCreatedAtDesc(List<DispatchStatus> statuses);
    
    List<DispatchEntity> findByStatusOrderByCreatedAtDesc(DispatchStatus status);
}
