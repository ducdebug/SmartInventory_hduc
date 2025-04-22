package com.ims.smartinventory.dto.Response;

import lombok.Data;

@Data
public class ProductResponse {
    private String name;
    private String productType;
    private Object detail;
}
