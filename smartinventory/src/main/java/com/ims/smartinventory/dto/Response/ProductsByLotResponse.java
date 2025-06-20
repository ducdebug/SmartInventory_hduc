package com.ims.smartinventory.dto.Response;

import com.ims.common.config.LotStatus;
import com.ims.common.entity.PriceEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductsByLotResponse {
    private String lotId;
    private String lotCode;
    private Date importDate;
    private String importedByUser;
    private LotStatus status;
    private List<ProductInLot> products;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductInLot {
        private String productId;
        private String productName;
        private String productType;
        private PriceDTO primaryPrice;
        private PriceDTO secondaryPrice;
        private Map<String, Object> details;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceDTO {
        private String id;
        private double value;
        private String currency;
    }
}
