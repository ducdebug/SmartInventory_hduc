package com.ims.smartinventory.service;

import com.ims.common.config.StorageConditions;
import com.ims.smartinventory.dto.Request.PriceCalculationRequestDto;
import com.ims.smartinventory.dto.Response.PriceCalculationResponseDto;

import java.util.List;

public interface PriceCalculationService {
    /**
     * Calculates the price for given storage conditions and slot count
     * @param request The price calculation request containing slot count and storage conditions
     * @return PriceCalculationResponseDto with detailed price breakdown
     */
    PriceCalculationResponseDto calculatePrice(PriceCalculationRequestDto request);
    
    /**
     * Calculates the price for given storage conditions and slot count
     * @param storageConditions List of storage conditions
     * @param slotCount Number of slots
     * @return PriceCalculationResponseDto with detailed price breakdown
     */
    PriceCalculationResponseDto calculatePrice(List<StorageConditions> storageConditions, int slotCount);
}
