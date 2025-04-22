package com.ims.smartinventory.controller;

import com.ims.smartinventory.service.LotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/lot")
public class LotController {
    private final LotService lotService;

    public LotController(LotService lotService) {
        this.lotService = lotService;
    }

    @GetMapping("/history")
    public ResponseEntity<?> getLotHistory() {
        return ResponseEntity.ok(lotService.getLotHistory());
    }
}

