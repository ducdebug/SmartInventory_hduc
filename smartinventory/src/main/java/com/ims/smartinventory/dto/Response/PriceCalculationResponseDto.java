package com.ims.smartinventory.dto.Response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PriceCalculationResponseDto {
    private double basePrice;
    private double finalPrice;
    private double multiplier;
    private String currency;
    private int slotCount;
    private String breakdown;
    
    public PriceCalculationResponseDto(double basePrice, double finalPrice, double multiplier, 
                                     String currency, int slotCount, String breakdown) {
        this.basePrice = basePrice;
        this.finalPrice = finalPrice;
        this.multiplier = multiplier;
        this.currency = currency;
        this.slotCount = slotCount;
        this.breakdown = breakdown;
    }
}
