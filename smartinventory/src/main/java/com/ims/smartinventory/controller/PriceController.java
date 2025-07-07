package com.ims.smartinventory.controller;

import com.ims.common.config.StorageConditions;
import com.ims.smartinventory.dto.Response.PriceCalculationResponseDto;
import com.ims.smartinventory.service.PriceCalculationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/price")
public class PriceController {

    private final PriceCalculationService priceCalculationService;

    public PriceController(PriceCalculationService priceCalculationService) {
        this.priceCalculationService = priceCalculationService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<PriceCalculationResponseDto> calculatePrice(
            @RequestBody Map<String, Object> request) {

        log.info("Received price calculation request: {}", request);

        try {
            Integer slotCount = (Integer) request.get("slotCount");
            @SuppressWarnings("unchecked")
            List<String> storageConditionStrings = (List<String>) request.get("storageConditions");

            if (slotCount == null || slotCount <= 0) {
                log.warn("Invalid slot count in price calculation request: {}", slotCount);
                return ResponseEntity.badRequest().build();
            }

            if (storageConditionStrings == null) {
                log.warn("Null storage conditions in price calculation request");
                return ResponseEntity.badRequest().build();
            }

            List<StorageConditions> storageConditions = storageConditionStrings.stream()
                    .filter(s -> s != null && !s.trim().isEmpty())
                    .map(conditionStr -> {
                        try {
                            return StorageConditions.valueOf(conditionStr.trim().toUpperCase());
                        } catch (IllegalArgumentException e) {
                            log.warn("Unknown storage condition: {}", conditionStr);
                            return null;
                        }
                    })
                    .filter(condition -> condition != null)
                    .toList();

            log.info("Processing price calculation for {} slots with conditions: {}",
                    slotCount, storageConditions);

            PriceCalculationResponseDto response = priceCalculationService.calculatePrice(storageConditions, slotCount);

            log.info("Price calculation completed. Final price: ${} {} for {} slots",
                    response.getFinalPrice(), response.getCurrency(), response.getSlotCount());

            return ResponseEntity.ok(response);

        } catch (ClassCastException e) {
            log.error("Invalid request format for price calculation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            log.error("Invalid request for price calculation: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error calculating price", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
