package com.ims.smartinventory.controller;

import com.ims.smartinventory.dto.Response.SlotInfo;
import com.ims.smartinventory.service.ShelfService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
@RestController
@RequestMapping("/shelf")
public class ShelfController {

    private final ShelfService shelfService;

    public ShelfController(ShelfService shelfService) {
        this.shelfService = shelfService;
    }

    @GetMapping("/shelves/{shelfId}/slots")
    public ResponseEntity<List<SlotInfo>> getSlotsByShelf(@PathVariable String shelfId) {
        List<SlotInfo> slots = shelfService.getSlotsByShelf(shelfId);
        return ResponseEntity.ok(slots);
    }
}
