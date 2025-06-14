package com.ims.smartinventory.dto.Response;

import com.ims.common.config.LotStatus;
import lombok.Data;

import java.util.List;

@Data
public class LotDto {
    private String id;
    private String importDate;
    private String storageStrategy;
    private String username;
    private LotStatus status;
    private List<LotItemDto> items;
}