package com.ims.smartinventory.repository;

import com.ims.smartinventory.config.DispatchStatus;
import com.ims.smartinventory.entity.management.DispatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DispatchRepository extends JpaRepository<DispatchEntity, String> {

    // Buyer-specific queries
    @Query("SELECT d FROM DispatchEntity d WHERE d.user.id = :buyerId ORDER BY d.createdAt DESC")
    List<DispatchEntity> findByBuyerIdOrderByCreatedAtDesc(@Param("buyerId") String buyerId);

    @Query("SELECT d FROM DispatchEntity d WHERE d.id = :id AND d.user.id = :buyerId")
    Optional<DispatchEntity> findByIdAndBuyerId(@Param("id") String id, @Param("buyerId") String buyerId);

    // Admin-specific queries for export management
    List<DispatchEntity> findByStatusInOrderByCreatedAtDesc(List<DispatchStatus> statuses);

    List<DispatchEntity> findByStatusOrderByCreatedAtDesc(DispatchStatus status);
}
