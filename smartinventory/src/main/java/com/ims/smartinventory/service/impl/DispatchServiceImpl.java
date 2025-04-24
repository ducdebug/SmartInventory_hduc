package com.ims.smartinventory.service.impl;

import com.ims.smartinventory.dto.Response.DispatchDetailResponse;
import com.ims.smartinventory.dto.Response.DispatchHistoryResponse;
import com.ims.smartinventory.entity.management.DispatchEntity;
import com.ims.smartinventory.repository.DispatchRepository;
import com.ims.smartinventory.service.DispatchService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DispatchServiceImpl implements DispatchService {

    private final DispatchRepository dispatchRepository;

    public DispatchServiceImpl(DispatchRepository dispatchRepository) {
        this.dispatchRepository = dispatchRepository;
    }

    @Override
    public List<DispatchHistoryResponse> getBuyerDispatches(String buyerId) {
        List<DispatchEntity> dispatches = dispatchRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId);
        return dispatches.stream()
                .map(DispatchHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public DispatchDetailResponse getDispatchDetails(String dispatchId, String buyerId) {
        DispatchEntity dispatch = dispatchRepository.findByIdAndBuyerId(dispatchId, buyerId)
                .orElse(null);

        if (dispatch == null) {
            return null;
        }

        return DispatchDetailResponse.fromEntity(dispatch);
    }
}
