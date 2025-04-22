package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.management.LotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LotRepository extends JpaRepository<LotEntity, String> {
    @Query("SELECT l FROM LotEntity l JOIN FETCH l.user LEFT JOIN FETCH l.items i LEFT JOIN FETCH i.price")
    List<LotEntity> findAllWithItemsAndUser();
}
