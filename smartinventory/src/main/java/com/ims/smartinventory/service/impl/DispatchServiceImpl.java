package com.ims.smartinventory.service.impl;

import com.ims.common.config.DispatchStatus;
import com.ims.common.config.TransactionType;
import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.PriceEntity;
import com.ims.common.entity.management.DispatchEntity;
import com.ims.common.entity.management.DispatchItemEntity;
import com.ims.common.entity.management.InventoryTransactionEntity;
import com.ims.common.entity.storage.SlotSection;
import com.ims.common.entity.storage.SlotShelf;
import com.ims.smartinventory.dto.Response.DispatchDetailResponse;
import com.ims.smartinventory.dto.Response.DispatchHistoryResponse;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.DispatchService;
import com.ims.smartinventory.service.NotificationProducerService;
import com.ims.smartinventory.util.VolumeCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class DispatchServiceImpl implements DispatchService {

    private final DispatchRepository dispatchRepository;
    private final NotificationProducerService notificationProducerService;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;
    private final SlotSectionRepository slotSectionRepository;
    private final SlotShelfRepository slotShelfRepository;

    public DispatchServiceImpl(DispatchRepository dispatchRepository, NotificationProducerService notificationProducerService, InventoryTransactionRepository inventoryTransactionRepository, ProductRepository productRepository, SlotSectionRepository slotSectionRepository, SlotShelfRepository slotShelfRepository) {
        this.dispatchRepository = dispatchRepository;
        this.notificationProducerService = notificationProducerService;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productRepository = productRepository;
        this.slotSectionRepository = slotSectionRepository;
        this.slotShelfRepository = slotShelfRepository;
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

        return addPricingInfoToDispatchResponse(dispatch);
    }

    @Override
    public DispatchDetailResponse getDispatchDetailsAdmin(String dispatchId) {
        DispatchEntity dispatch = dispatchRepository.findById(dispatchId)
                .orElse(null);

        if (dispatch == null) {
            return null;
        }

        return addPricingInfoToDispatchResponse(dispatch);
    }

    private DispatchDetailResponse addPricingInfoToDispatchResponse(DispatchEntity dispatch) {
        DispatchDetailResponse response = DispatchDetailResponse.fromEntity(dispatch);

        double totalValue = 0;
        String currency = "VND";

        for (int i = 0; i < response.getItems().size(); i++) {
            DispatchDetailResponse.DispatchItemResponse itemResponse = response.getItems().get(i);
            DispatchItemEntity itemEntity = dispatch.getItems().get(i);

            double itemSubtotal = 0;

            if (itemEntity.getProducts() != null && !itemEntity.getProducts().isEmpty()) {
                BaseProductEntity firstProduct = itemEntity.getProducts().get(0);
                PriceEntity price = getProductPrice(firstProduct);
                if (price != null) {
                    currency = price.getCurrency();

                    double unitPrice = price.getValue();
                    DispatchDetailResponse.PriceDTO unitPriceDTO = DispatchDetailResponse.PriceDTO.builder()
                            .value(unitPrice)
                            .currency(currency)
                            .build();

                    if (itemResponse.getProduct() != null) {
                        itemResponse.getProduct().setUnitPrice(unitPriceDTO);
                    }
                    itemSubtotal = unitPrice * itemEntity.getQuantity();
                }
            } else if (itemEntity.getProductId() != null) {
                BaseProductEntity product = productRepository.findById(itemEntity.getProductId()).orElse(null);
                if (product != null) {
                    PriceEntity price = getProductPrice(product);
                    if (price != null) {
                        currency = price.getCurrency();
                        double unitPrice = price.getValue();
                        DispatchDetailResponse.PriceDTO unitPriceDTO = DispatchDetailResponse.PriceDTO.builder()
                                .value(unitPrice)
                                .currency(currency)
                                .build();
                        if (itemResponse.getProduct() != null) {
                            itemResponse.getProduct().setUnitPrice(unitPriceDTO);
                        }
                        itemSubtotal = unitPrice * itemEntity.getQuantity();
                    }
                }
            }
            DispatchDetailResponse.PriceDTO subtotalDTO = DispatchDetailResponse.PriceDTO.builder()
                    .value(itemSubtotal)
                    .currency(currency)
                    .build();

            itemResponse.setSubtotal(subtotalDTO);
            totalValue += itemSubtotal;
        }

        DispatchDetailResponse.PriceDTO totalPrice = DispatchDetailResponse.PriceDTO.builder()
                .value(totalValue)
                .currency(currency)
                .build();

        response.setTotalPrice(totalPrice);

        return response;
    }

    private PriceEntity getProductPrice(BaseProductEntity product) {
        if (product.getSecondaryPrice() != null) {
            return product.getSecondaryPrice();
        } else if (product.getPrimaryPrice() != null) {
            return product.getPrimaryPrice();
        }
        return null;
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

        List<SlotShelf> slotShelvesToUpdate = new ArrayList<>();
        List<SlotSection> slotSectionsToUpdate = new ArrayList<>();
        List<BaseProductEntity> productsToUpdate = new ArrayList<>();

        for (DispatchItemEntity item : dispatch.getItems()) {
            if (item.getProducts() != null) {
                for (BaseProductEntity product : item.getProducts()) {
                    product.setDispatch(dispatch);

                    if (product.getSlotShelf() != null) {
                        SlotShelf slotShelf = product.getSlotShelf();
                        slotShelf.setOccupied(false);
                        slotShelf.setProduct(null);
                        slotShelvesToUpdate.add(slotShelf);
                        product.setSlotShelf(null);
                    }

                    if (product.getSlotSection() != null) {
                        SlotSection slotSection = product.getSlotSection();
                        slotSection.setOccupied(false);
                        slotSection.setProduct(null);
                        slotSectionsToUpdate.add(slotSection);
                        product.setSlotSection(null);
                    }

                    productsToUpdate.add(product);
                }
            }
        }

        if (!productsToUpdate.isEmpty()) {
            productRepository.saveAll(productsToUpdate);
        }

        if (!slotShelvesToUpdate.isEmpty()) {
            slotShelfRepository.saveAll(slotShelvesToUpdate);
        }

        if (!slotSectionsToUpdate.isEmpty()) {
            slotSectionRepository.saveAll(slotSectionsToUpdate);
        }

        InventoryTransactionEntity inventoryTransaction = new InventoryTransactionEntity();
        inventoryTransaction.setType(TransactionType.EXPORT);
        inventoryTransaction.setTimestamp(new Date());
        inventoryTransaction.setRelated_dispatch_lot_id(dispatch.getId());
        inventoryTransactionRepository.save(inventoryTransaction);
//        checkProductVolumeAndNotify(exportedProductIds);

        // Send notification to the buyer (commented out for now)
        // notificationProducerService.sendNotification(
        //     dispatch.getBuyerId(),
        //     "Your dispatch request #" + dispatch.getId().substring(0, 8) + " has been accepted."
        // );

        return addPricingInfoToDispatchResponse(dispatch);
    }

    public void checkProductVolumeAndNotify(List<String> exportedProductIds) {
        List<BaseProductEntity> remainingProducts = productRepository.findAll().stream()
                .filter(p -> p.getDispatch() == null)
                .toList();

        Map<String, List<BaseProductEntity>> productsByType = new HashMap<>();

        for (BaseProductEntity product : remainingProducts) {
            String type = product.getClass().getSimpleName();
            productsByType.computeIfAbsent(type, k -> new ArrayList<>()).add(product);
        }
        Map<String, Double> volumeByType = new HashMap<>();
        double totalRemainingVolume = 0.0;

        for (Map.Entry<String, List<BaseProductEntity>> entry : productsByType.entrySet()) {
            String type = entry.getKey();
            double typeVolume = entry.getValue().stream()
                    .mapToDouble(VolumeCalculator::calculateProductVolume)
                    .sum();

            volumeByType.put(type, typeVolume);
            totalRemainingVolume += typeVolume;
        }

        if (VolumeCalculator.isVolumeBelowThreshold(totalRemainingVolume)) {
            StringBuilder messageBuilder = new StringBuilder();
            messageBuilder.append("WARNING: Low inventory volume detected after export. ");
            messageBuilder.append("Total remaining volume: ").append(String.format("%.2f", totalRemainingVolume)).append(" units. ");
            messageBuilder.append("Breakdown by product type: ");

            for (Map.Entry<String, Double> entry : volumeByType.entrySet()) {
                String type = entry.getKey().replace("ProductEntity", "");
                double volume = entry.getValue();
                messageBuilder.append(type).append(": ").append(String.format("%.2f", volume)).append(" units, ");
            }

            notificationProducerService.sendNotification("admin", messageBuilder.toString());
        }

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

        return addPricingInfoToDispatchResponse(dispatch);
    }
}