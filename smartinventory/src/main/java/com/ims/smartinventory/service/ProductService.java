package com.ims.smartinventory.service;

import com.ims.common.entity.UserEntity;
import com.ims.common.entity.storage.SlotEntity;
import com.ims.smartinventory.dto.Request.ProductBatchRequestDto;
import com.ims.smartinventory.dto.Request.ProductExportRequestDto;
import com.ims.smartinventory.dto.Request.ProductGroupResponseDto;
import com.ims.smartinventory.dto.Response.ProductResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProductService {
    public List<SlotEntity> storeBatch(ProductBatchRequestDto batchRequest, UserEntity currentUser);

    List<ProductGroupResponseDto> getGroupedProducts();

    ProductResponse getProductResponseBySlotId(String slotId);

    @Transactional
    void exportGroupedProducts(ProductExportRequestDto request, UserEntity currentUser);

    @Transactional
    String createRetrieveRequest(ProductExportRequestDto request, UserEntity currentUser);

    boolean checkProductVolumeAndNotify(List<String> productIds);
}
