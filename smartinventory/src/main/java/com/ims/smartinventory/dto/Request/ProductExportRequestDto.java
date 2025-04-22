package com.ims.smartinventory.dto.Request;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ProductExportRequestDto {
    private List<ProductExportItem> products;

    @Data
    public static class ProductExportItem {
        private String productId;
        private String name;
        private Map<String, Object> detail;
        private int quantity;
    }
}
