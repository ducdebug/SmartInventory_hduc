package com.ims.smartinventory.dto.Response;

import com.ims.common.config.LotStatus;
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
        private Map<String, Object> details;
        
        // Enhanced location tracking
        private String sectionId;
        private String sectionName;
        private String shelfId;
        private String slotId;
        private String locationPath; // e.g., "Section A → Shelf 2 → Slot 15"
        
        // Enhanced dispatch tracking
        private String dispatchId;
        private String dispatchStatus; // "IN_WAREHOUSE" or "EXPORTED"
        private Date dispatchDate;
        private String buyerUsername;
        private String buyerId;
        
        // Additional tracking info
        private Date expirationDate;
        private boolean onShelf;
    }
}
