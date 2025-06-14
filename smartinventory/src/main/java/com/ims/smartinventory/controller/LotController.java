package com.ims.smartinventory.controller;

import com.ims.common.entity.UserEntity;
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

    @PostMapping("/{lotId}/withdraw")
    public ResponseEntity<?> withdrawLot(@PathVariable String lotId, @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Authentication required");
        }
        
        if (!"SUPPLIER".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).body("Only suppliers can withdraw lots");
        }

        try {
            boolean success = lotService.withdrawLot(lotId, currentUser.getId());
            return success ?
                    ResponseEntity.ok().build() :
                    ResponseEntity.badRequest().body("Cannot withdraw this lot");
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error processing withdrawal request");
        }
    }

    @PostMapping("/{lotId}/accept-withdrawal")
    public ResponseEntity<?> acceptWithdrawal(@PathVariable String lotId, @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).body("Only administrators can accept withdrawals");
        }

        boolean success = lotService.acceptWithdrawal(lotId);
        return success ?
                ResponseEntity.ok().build() :
                ResponseEntity.badRequest().body("Cannot accept withdrawal for this lot");
    }

    @PostMapping("/{lotId}/reject-withdrawal")
    public ResponseEntity<?> rejectWithdrawal(@PathVariable String lotId, @AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).body("Only administrators can reject withdrawals");
        }

        boolean success = lotService.rejectWithdrawal(lotId);
        return success ?
                ResponseEntity.ok().build() :
                ResponseEntity.badRequest().body("Cannot reject withdrawal for this lot");
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllLots(@AuthenticationPrincipal UserEntity currentUser) {
        if (currentUser == null || !"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).body("Only administrators can view all lots");
        }

        return ResponseEntity.ok(lotService.getAllLotsWithAllStatuses());
    }

    @GetMapping("/{lotId}")
    public ResponseEntity<?> getLotDetails(@PathVariable String lotId) {
        return ResponseEntity.ok(lotService.getLotDetails(lotId));
    }
}

