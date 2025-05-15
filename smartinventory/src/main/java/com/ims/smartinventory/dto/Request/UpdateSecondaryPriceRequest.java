package com.ims.smartinventory.dto.Request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSecondaryPriceRequest {
    private List<ProductPrice> productPrices;
    private Double bulkPrice; // Optional field for setting same price across multiple products
    private String currency;  // Currency for bulk update
    private Double bulkMarkupPercentage; // Optional field for percentage markup
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductPrice {
        private String productId;
        private double price;
        private String currency;
    }
}
