package com.ims.smartinventory.service;

import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.dto.Request.ProductBatchRequestDto;
import com.ims.smartinventory.dto.Request.ProductExportRequestDto;
import com.ims.smartinventory.dto.Request.ProductGroupResponseDto;
import com.ims.smartinventory.dto.Request.UpdateSecondaryPriceRequest;
import com.ims.smartinventory.dto.Response.ProductResponse;
import com.ims.smartinventory.dto.Response.ProductsByLotResponse;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ProductService {
    void storeBatch(ProductBatchRequestDto batchRequest, UserEntity currentUser);

    List<ProductGroupResponseDto> getGroupedProducts();

    ProductResponse getProductResponseBySlotId(String slotId);

    @Transactional
    String createRetrieveRequest(ProductExportRequestDto request, UserEntity currentUser);
    
    List<ProductsByLotResponse> getAllProductsByLot();
    
    List<ProductsByLotResponse> getProductsByLotForSupplier(UserEntity supplier);
    
    @Transactional
    void updateSecondaryPrices(UpdateSecondaryPriceRequest request);
}
