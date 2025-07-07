package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.SectionInfoResponse;
import com.ims.smartinventory.dto.Response.WarehouseRevenueResponse;

import java.util.List;

public interface WarehouseService {
    List<SectionInfoResponse> getCurrentWarehouseSections();

    List<SectionInfoResponse> getAllSection();

    WarehouseRevenueResponse calculateWarehouseRevenue();
}
