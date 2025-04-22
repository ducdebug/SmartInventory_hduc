package com.ims.smartinventory.repository;

import com.ims.smartinventory.entity.PriceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriceRepository extends JpaRepository<PriceEntity, String> {
}
