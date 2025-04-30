package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.SectionInfoResponse;

import java.util.List;

public interface WarehouseService {
    List<SectionInfoResponse> getCurrentWarehouseSections();

    List<SectionInfoResponse> getAllSection();
}
