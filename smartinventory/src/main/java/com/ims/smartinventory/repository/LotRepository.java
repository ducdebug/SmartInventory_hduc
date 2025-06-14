package com.ims.smartinventory.repository;

import com.ims.common.config.LotStatus;
import com.ims.common.entity.management.LotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface LotRepository extends JpaRepository<LotEntity, String> {
    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price")
    List<LotEntity> findAllWithItemsAndUser();

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.status = :status")
    List<LotEntity> findByStatus(@Param("status") LotStatus status);

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.status = 'PENDING'")
    List<LotEntity> findByStatusPending();

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.status = 'ACCEPTED'")
    List<LotEntity> findByStatusAccepted();

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.user.id = :userId")
    List<LotEntity> findByUserId(@Param("userId") String userId);

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.id = :id")
    Optional<LotEntity> findByIdWithItemsAndUser(@Param("id") String id);

    List<LotEntity> findByImportDateBetween(Date startDate, Date endDate);

    // Backward compatibility methods (deprecated)
    @Deprecated
    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.status != 'ACCEPTED'")
    List<LotEntity> findByAcceptedFalse();

    @Deprecated
    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.status = 'ACCEPTED'")
    List<LotEntity> findByAcceptedTrue();
}