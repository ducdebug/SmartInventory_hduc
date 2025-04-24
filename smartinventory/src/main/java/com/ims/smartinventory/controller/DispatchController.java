package com.ims.smartinventory.controller;

import com.ims.smartinventory.dto.Response.DispatchHistoryResponse;
import com.ims.smartinventory.dto.Response.DispatchDetailResponse;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.service.DispatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dispatches")
public class DispatchController {

    private final DispatchService dispatchService;

    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    @GetMapping("/buyer")
    public ResponseEntity<List<DispatchHistoryResponse>> getBuyerDispatches(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        // Debug log to check authentication details
        System.out.println("DispatchController - currentUser: " + (currentUser != null ? currentUser.getUsername() : "null"));
        System.out.println("DispatchController - user role: " + (currentUser != null ? currentUser.getRole() : "null"));
        
        if (currentUser == null) {
            System.out.println("DispatchController - No authenticated user found");
            return ResponseEntity.status(401).build(); // Unauthorized
        }
        
        if (!"BUYER".equals(currentUser.getRole().name())) {
            System.out.println("DispatchController - User does not have BUYER role: " + currentUser.getRole().name());
            return ResponseEntity.status(403).build(); // Forbidden
        }
        
        List<DispatchHistoryResponse> dispatches = dispatchService.getBuyerDispatches(currentUser.getId());
        return ResponseEntity.ok(dispatches);
    }

    @GetMapping("/{dispatchId}")
    public ResponseEntity<DispatchDetailResponse> getDispatchDetails(
            @PathVariable String dispatchId,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        DispatchDetailResponse dispatch = dispatchService.getDispatchDetails(dispatchId, currentUser.getId());
        
        if (dispatch == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(dispatch);
    }
}
