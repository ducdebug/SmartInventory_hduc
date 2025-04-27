package com.ims.smartinventory.controller;

import com.ims.smartinventory.dto.Response.DispatchHistoryResponse;
import com.ims.smartinventory.dto.Response.DispatchDetailResponse;
import com.ims.smartinventory.entity.UserEntity;
import com.ims.smartinventory.service.DispatchService;
import lombok.Getter;
import lombok.Setter;
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
        if (currentUser == null) {
            System.out.println("DispatchController - No authenticated user found");
            return ResponseEntity.status(401).build();
        }
        
        if (!"BUYER".equals(currentUser.getRole().name())) {
            System.out.println("DispatchController - User does not have BUYER role: " + currentUser.getRole().name());
            return ResponseEntity.status(403).build();
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
        
        DispatchDetailResponse dispatch;
        
        // If the user is an admin, use the admin-specific method
        if ("ADMIN".equals(currentUser.getRole().name())) {
            dispatch = dispatchService.getDispatchDetailsAdmin(dispatchId);
        } else {
            // For buyers or other roles, use the regular method
            dispatch = dispatchService.getDispatchDetails(dispatchId, currentUser.getId());
        }
        
        if (dispatch == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(dispatch);
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<List<DispatchHistoryResponse>> getPendingDispatches(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (!"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).build();
        }
        
        List<DispatchHistoryResponse> dispatches = dispatchService.getPendingDispatches();
        return ResponseEntity.ok(dispatches);
    }

    @GetMapping("/admin/accepted-rejected")
    public ResponseEntity<List<DispatchHistoryResponse>> getCompletedDispatches(
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (!"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).build();
        }
        
        List<DispatchHistoryResponse> dispatches = dispatchService.getCompletedDispatches();
        return ResponseEntity.ok(dispatches);
    }

    @PostMapping("/{dispatchId}/accept")
    public ResponseEntity<DispatchDetailResponse> acceptDispatch(
            @PathVariable String dispatchId,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (!"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).build();
        }
        
        DispatchDetailResponse updatedDispatch = dispatchService.acceptDispatch(dispatchId);
        
        if (updatedDispatch == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedDispatch);
    }

    @PostMapping("/{dispatchId}/reject")
    public ResponseEntity<DispatchDetailResponse> rejectDispatch(
            @PathVariable String dispatchId,
            @RequestBody RejectRequest rejectRequest,
            @AuthenticationPrincipal UserEntity currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (!"ADMIN".equals(currentUser.getRole().name())) {
            return ResponseEntity.status(403).build();
        }
        
        DispatchDetailResponse updatedDispatch = dispatchService.rejectDispatch(dispatchId, rejectRequest.getReason());
        
        if (updatedDispatch == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(updatedDispatch);
    }
    
    @Setter
    @Getter
    static class RejectRequest {
        private String reason;

    }
}