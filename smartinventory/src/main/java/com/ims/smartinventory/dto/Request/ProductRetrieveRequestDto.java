package com.ims.smartinventory.dto.Request;

import com.ims.smartinventory.config.StorageStrategy;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ProductRetrieveRequestDto {

    private List<ProductRetrieveItem> products;

    @Getter
    @Setter
    public static class ProductRetrieveItem {
        private String productName;
        private int quantity;
        private StorageStrategy storageStrategy;
    }
}
