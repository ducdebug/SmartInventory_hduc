package com.ims.smartinventory.service;

import com.ims.smartinventory.dto.Response.DispatchDetailResponse;
import com.ims.smartinventory.dto.Response.DispatchHistoryResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface DispatchService {
    List<DispatchHistoryResponse> getBuyerDispatches(String buyerId);

    DispatchDetailResponse getDispatchDetails(String dispatchId, String buyerId);

    DispatchDetailResponse getDispatchDetailsAdmin(String dispatchId);

    List<DispatchHistoryResponse> getPendingDispatches();

    List<DispatchHistoryResponse> getCompletedDispatches();

    DispatchDetailResponse acceptDispatch(String dispatchId);

    DispatchDetailResponse rejectDispatch(String dispatchId, String reason);
}