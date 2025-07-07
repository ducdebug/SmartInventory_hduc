package com.ims.smartinventory.repository;

import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.management.LotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<BaseProductEntity, String> {
    List<BaseProductEntity> findByNameContaining(String name);

    List<BaseProductEntity> findByNameAndLot(String name, LotEntity lot);

    boolean existsById(String id);

    Optional<BaseProductEntity> findByName(String name);

    List<BaseProductEntity> findByLotIdAndSlotShelfIsNullAndSlotSectionIsNull(String lotId);

    List<BaseProductEntity> findByLotId(String lotId);

    List<BaseProductEntity> findByLotIdAndDispatchIsNull(String lotId);

    List<BaseProductEntity> findByLotUserId(String userId);

    List<BaseProductEntity> findByLotUserIdAndDispatchIsNull(String userId);

}
