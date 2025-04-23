package com.ims.smartinventory.dto.Response;

import lombok.Data;

import java.util.List;

@Data
public class LotDto {
    private String id;
    private String importDate;
    private String storageStrategy;
    private String username;
    private boolean accepted;
    private List<LotItemDto> items;
}