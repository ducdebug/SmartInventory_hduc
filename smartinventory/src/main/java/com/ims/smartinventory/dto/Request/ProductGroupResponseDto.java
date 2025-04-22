package com.ims.smartinventory.dto.Request;

import lombok.Data;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
public class ProductGroupResponseDto {
    private String productId;
    private String productType;
    private String name;
    private Map<String, Object> detail = new LinkedHashMap<>();
    private int count;
}

