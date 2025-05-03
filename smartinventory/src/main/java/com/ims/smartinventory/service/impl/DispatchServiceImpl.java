package com.ims.smartinventory.service.impl;

import com.ims.common.config.DispatchStatus;
import com.ims.common.config.TransactionType;
import com.ims.common.entity.management.DispatchEntity;
import com.ims.common.entity.management.InventoryTransactionEntity;
import com.ims.smartinventory.dto.Response.DispatchDetailResponse;
import com.ims.smartinventory.dto.Response.DispatchHistoryResponse;
import com.ims.smartinventory.repository.DispatchRepository;
import com.ims.smartinventory.repository.InventoryTransactionRepository;
import com.ims.smartinventory.service.DispatchService;
import com.ims.smartinventory.service.NotificationProducerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DispatchServiceImpl implements DispatchService {

    private final DispatchRepository dispatchRepository;
    private final NotificationProducerService notificationProducerService;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    public DispatchServiceImpl(DispatchRepository dispatchRepository, NotificationProducerService notificationProducerService, InventoryTransactionRepository inventoryTransactionRepository) {
        this.dispatchRepository = dispatchRepository;
        this.notificationProducerService = notificationProducerService;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
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

    @Override
    public DispatchDetailResponse getDispatchDetailsAdmin(String dispatchId) {
        DispatchEntity dispatch = dispatchRepository.findById(dispatchId)
                .orElse(null);

        if (dispatch == null) {
            return null;
        }

        return DispatchDetailResponse.fromEntity(dispatch);
    }

    @Override
    public List<DispatchHistoryResponse> getPendingDispatches() {
        List<DispatchEntity> dispatches = dispatchRepository.findByStatusInOrderByCreatedAtDesc(
                List.of(DispatchStatus.PENDING)
        );
        return dispatches.stream()
                .map(DispatchHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<DispatchHistoryResponse> getCompletedDispatches() {
        List<DispatchEntity> dispatches = dispatchRepository.findByStatusInOrderByCreatedAtDesc(
                List.of(DispatchStatus.ACCEPTED, DispatchStatus.REJECTED)
        );
        return dispatches.stream()
                .map(DispatchHistoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DispatchDetailResponse acceptDispatch(String dispatchId) {
        DispatchEntity dispatch = dispatchRepository.findById(dispatchId).orElse(null);

        if (dispatch == null || dispatch.getStatus() != DispatchStatus.PENDING) {
            return null;
        }
        dispatch.setStatus(DispatchStatus.ACCEPTED);
        dispatch = dispatchRepository.save(dispatch);

        final DispatchEntity finalDispatch = dispatch;

        dispatch.getItems().forEach(item -> {
            if (item.getProduct() != null) {
                item.getProduct().setDispatch(finalDispatch);
                if (item.getProduct().getSlotShelf() != null) {
                    item.getProduct().getSlotShelf().setOccupied(false);
                    item.getProduct().getSlotShelf().setProduct(null);
                    item.getProduct().setSlotShelf(null);
                } else if (item.getProduct().getSlotSection() != null) {
                    item.getProduct().getSlotSection().setOccupied(false);
                    item.getProduct().getSlotSection().setProduct(null);
                    item.getProduct().setSlotSection(null);
                }
            }
        });

        InventoryTransactionEntity inventoryTransaction = new InventoryTransactionEntity();
        inventoryTransaction.setType(TransactionType.EXPORT);
        inventoryTransaction.setTimestamp(new Date());
        inventoryTransaction.setRelated_dispatch_lot_id(dispatch.getId());
        inventoryTransactionRepository.save(inventoryTransaction);

        // Send notification to the buyer (commented out for now)
        // notificationProducerService.sendNotification(
        //     dispatch.getBuyerId(),
        //     "Your dispatch request #" + dispatch.getId().substring(0, 8) + " has been accepted."
        // );

        return DispatchDetailResponse.fromEntity(dispatch);
    }

    @Override
    @Transactional
    public DispatchDetailResponse completeDispatch(String dispatchId) {
        DispatchEntity dispatch = dispatchRepository.findById(dispatchId).orElse(null);

        if (dispatch == null || dispatch.getStatus() != DispatchStatus.PENDING) {
            return null;
        }

        // Update dispatch status
        dispatch.setStatus(DispatchStatus.ACCEPTED);
        dispatch = dispatchRepository.save(dispatch);

        // Create a final copy of dispatch to use in lambda
        final DispatchEntity finalDispatch = dispatch;

        // Update products associated with this dispatch's items to have this dispatch entity
        dispatch.getItems().forEach(item -> {
            if (item.getProduct() != null) {
                item.getProduct().setDispatch(finalDispatch);
                // If the product has a slot, free it
                if (item.getProduct().getSlotShelf() != null) {
                    item.getProduct().getSlotShelf().setOccupied(false);
                    item.getProduct().getSlotShelf().setProduct(null);
                    item.getProduct().setSlotShelf(null);
                } else if (item.getProduct().getSlotSection() != null) {
                    item.getProduct().getSlotSection().setOccupied(false);
                    item.getProduct().getSlotSection().setProduct(null);
                    item.getProduct().setSlotSection(null);
                }
            }
        });

        // Note: Transaction record is already created in acceptDispatch, so not needed here

        notificationProducerService.sendNotification(
                dispatch.getBuyerId(),
                "Your dispatch request #" + dispatch.getId().substring(0, 8) + " has been accepted."
        );

        return DispatchDetailResponse.fromEntity(dispatch);
    }

    @Override
    @Transactional
    public DispatchDetailResponse rejectDispatch(String dispatchId, String reason) {
        DispatchEntity dispatch = dispatchRepository.findById(dispatchId).orElse(null);

        if (dispatch == null || dispatch.getStatus() != DispatchStatus.PENDING) {
            return null;
        }

        dispatch.setStatus(DispatchStatus.REJECTED);
        dispatch.setRejectionReason(reason);
        dispatch = dispatchRepository.save(dispatch);

        notificationProducerService.sendNotification(
                dispatch.getBuyerId(),
                "Your dispatch request #" + dispatch.getId().substring(0, 8) + " has been rejected. Reason: " +
                        (reason != null && !reason.isEmpty() ? reason : "No reason provided")
        );

        return DispatchDetailResponse.fromEntity(dispatch);
    }
}