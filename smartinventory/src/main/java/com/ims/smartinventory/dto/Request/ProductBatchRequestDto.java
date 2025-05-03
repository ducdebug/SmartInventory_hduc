package com.ims.smartinventory.dto.Request;

import com.ims.common.config.ProductType;
import com.ims.common.config.StorageConditions;
import com.ims.common.config.StorageStrategy;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class ProductBatchRequestDto {
    private ProductType productType;
    private StorageStrategy storageStrategy;
    private List<StorageConditionDto> storageConditions;
    private List<Map<String, Object>> productDetails;

    @Getter
    @Setter
    @AllArgsConstructor
    public static class StorageConditionDto {
        private StorageConditions conditionType;
        private double minValue;
        private double maxValue;
        private String unit;
    }
}
