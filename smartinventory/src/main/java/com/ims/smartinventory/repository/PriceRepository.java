package com.ims.smartinventory.repository;

import com.ims.common.entity.PriceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PriceRepository extends JpaRepository<PriceEntity, String> {
}
