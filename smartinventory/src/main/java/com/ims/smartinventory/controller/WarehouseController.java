package com.ims.smartinventory.controller;

import com.ims.smartinventory.dto.Response.SectionInfoResponse;
import com.ims.smartinventory.service.WarehouseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/warehouse")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @Autowired
    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping("/sections/info")
    public ResponseEntity<List<SectionInfoResponse>> getSection() {
        return ResponseEntity.ok(warehouseService.getAllSection());
    }

}
