package com.ims.smartinventory.controller;

import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.service.LotService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
    
    @GetMapping("/pending")
    public ResponseEntity<?> getPendingLots() {
        return ResponseEntity.ok(lotService.getPendingLots());
    }
    
    @GetMapping("/accepted")
    public ResponseEntity<?> getAcceptedLots() {
        return ResponseEntity.ok(lotService.getAcceptedLots());
    }
    
    @PostMapping("/{lotId}/accept")
    public ResponseEntity<?> acceptLot(@PathVariable String lotId, @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser != null && "ADMIN".equals(currentUser.getRole().name())) {
            boolean success = lotService.acceptLot(lotId);
            return success ? 
                ResponseEntity.ok().build() : 
                ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(403).body("Only administrators can accept lots");
    }
    
    @GetMapping("/{lotId}")
    public ResponseEntity<?> getLotDetails(@PathVariable String lotId) {
        return ResponseEntity.ok(lotService.getLotDetails(lotId));
    }
}

