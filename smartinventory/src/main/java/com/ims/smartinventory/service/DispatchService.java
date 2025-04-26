package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.DispatchDetailResponse;
import com.ims.smartinventory.dto.Response.DispatchHistoryResponse;
import com.ims.smartinventory.entity.management.DispatchEntity;
import com.ims.smartinventory.repository.DispatchRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public interface DispatchService {
    List<DispatchHistoryResponse> getBuyerDispatches(String buyerId);

    DispatchDetailResponse getDispatchDetails(String dispatchId, String buyerId);
    
    List<DispatchHistoryResponse> getPendingDispatches();
    
    List<DispatchHistoryResponse> getCompletedDispatches();
    
    DispatchDetailResponse acceptDispatch(String dispatchId);
    
    DispatchDetailResponse completeDispatch(String dispatchId);
    
    DispatchDetailResponse rejectDispatch(String dispatchId, String reason);
}