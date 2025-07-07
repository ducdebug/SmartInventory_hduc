package com.ims.smartinventory.service.impl;

import com.ims.common.config.StorageConditions;
import com.ims.smartinventory.dto.Request.PriceCalculationRequestDto;
import com.ims.smartinventory.dto.Response.PriceCalculationResponseDto;
import com.ims.smartinventory.service.PriceCalculationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class PriceCalculationServiceImpl implements PriceCalculationService {

    private static final double BASE_PRICE_PER_SLOT = 10.0;
    private static final String CURRENCY = "VND";

    @Override
    public PriceCalculationResponseDto calculatePrice(PriceCalculationRequestDto request) {
        return calculatePrice(request.getStorageConditions(), request.getSlotCount());
    }

    @Override
    public PriceCalculationResponseDto calculatePrice(List<StorageConditions> storageConditions, int slotCount) {
        log.debug("Calculating price for {} slots with {} storage conditions",
                slotCount, storageConditions.size());

        if (slotCount <= 0) {
            throw new IllegalArgumentException("Slot count must be greater than 0");
        }

        double basePrice = BASE_PRICE_PER_SLOT * slotCount;
        double multiplier = 1.0;
        List<String> appliedConditions = new ArrayList<>();

        for (StorageConditions condition : storageConditions) {
            switch (condition) {
                case TEMPERATURE_CONTROLLED:
                    multiplier += 0.5;
                    appliedConditions.add("Temperature Control (+50%)");
                    break;
                case HUMIDITY_CONTROLLED:
                    multiplier += 0.3;
                    appliedConditions.add("Humidity Control (+30%)");
                    break;
                case HAZARDOUS_MATERIALS:
                    multiplier += 1.0;
                    appliedConditions.add("Hazardous Materials (+100%)");
                    break;
                default:
                    break;
            }
        }

        double finalPrice = basePrice * multiplier;

        StringBuilder breakdown = new StringBuilder();
        breakdown.append(String.format("Base price: $%.2f/slot × %d slots = $%.2f%n",
                BASE_PRICE_PER_SLOT, slotCount, basePrice));

        if (!appliedConditions.isEmpty()) {
            breakdown.append("Applied conditions:%n");
            for (String condition : appliedConditions) {
                breakdown.append("  - ").append(condition).append("%n");
            }
            breakdown.append(String.format("Total multiplier: %.1fx%n", multiplier));
        }

        breakdown.append(String.format("Final price: $%.2f × %.1f = $%.2f per month",
                basePrice, multiplier, finalPrice));

        return new PriceCalculationResponseDto(
                basePrice,
                finalPrice,
                multiplier,
                CURRENCY,
                slotCount,
                breakdown.toString()
        );
    }
}
