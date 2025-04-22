package com.ims.smartinventory.dto.Response;

import lombok.Data;

import java.util.List;

@Data
public class LotDto {
    private String importDate;
    private String storageStrategy;
    private String username;
    private List<LotItemDto> items;
}