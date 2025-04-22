package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Request.ProductBatchRequestDto;
import com.ims.smartinventory.dto.Request.ProductExportRequestDto;
import com.ims.smartinventory.dto.Request.ProductGroupResponseDto;
import com.ims.smartinventory.dto.Response.ProductResponse;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.entity.storage.SlotEntity;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProductService {
    public List<SlotEntity> storeBatch(ProductBatchRequestDto batchRequest, UserEntity currentUser);
    List<ProductGroupResponseDto> getGroupedProducts();
    ProductResponse getProductResponseBySlotId(String slotId);

    @Transactional
    void exportGroupedProducts(ProductExportRequestDto request, UserEntity currentUser);
    
    /**
     * Check if the remaining volume of products after export is below a critical threshold
     * and send a notification if necessary
     *
     * @param productIds List of product IDs that have been exported
     * @return true if notification was sent, false otherwise
     */
    boolean checkProductVolumeAndNotify(List<String> productIds);
}
