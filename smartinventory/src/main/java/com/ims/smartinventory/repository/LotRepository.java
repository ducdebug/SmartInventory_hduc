package com.ims.smartinventory.repository;

import com.ims.common.entity.management.LotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LotRepository extends JpaRepository<LotEntity, String> {
    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price")
    List<LotEntity> findAllWithItemsAndUser();

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.accepted = false")
    List<LotEntity> findByAcceptedFalse();

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.accepted = true")
    List<LotEntity> findByAcceptedTrue();

    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price WHERE l.id = :id")
    Optional<LotEntity> findByIdWithItemsAndUser(@Param("id") String id);
}