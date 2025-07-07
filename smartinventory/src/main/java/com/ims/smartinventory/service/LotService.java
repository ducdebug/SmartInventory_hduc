package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.LotDto;

import java.util.List;

public interface LotService {
    List<LotDto> getLotHistory();

    List<LotDto> getPendingLots();

    List<LotDto> getAcceptedLots();

    List<LotDto> getAllLotsWithAllStatuses();

    boolean acceptLot(String lotId);

    LotDto getLotDetails(String lotId);
}
