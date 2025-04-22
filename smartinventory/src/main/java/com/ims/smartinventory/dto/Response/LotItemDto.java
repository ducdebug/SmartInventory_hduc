package com.ims.smartinventory.dto.Response;

import lombok.Data;

@Data
public class LotItemDto {
    private String productName;
    private int quantity;
    private String importDate;
    private Double price;
    private String currency;
}