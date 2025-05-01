package com.ims.smartinventory.service.impl;

import com.ims.smartinventory.config.TransactionType;
import com.ims.smartinventory.dto.Response.LotDto;
import com.ims.smartinventory.dto.Response.LotItemDto;
import com.ims.smartinventory.entity.management.InventoryTransactionEntity;
import com.ims.smartinventory.entity.management.LotEntity;
import com.ims.smartinventory.entity.management.LotItemEntity;
import com.ims.smartinventory.repository.InventoryTransactionRepository;
import com.ims.smartinventory.repository.LotRepository;
import com.ims.smartinventory.service.LotService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class LotServiceImpl implements LotService {

    private final LotRepository lotRepository;
    private final ProductServiceImpl productService;
    private final InventoryTransactionRepository inventoryTransactionRepository;

    public LotServiceImpl(LotRepository lotRepository, ProductServiceImpl productService, InventoryTransactionRepository inventoryTransactionRepository) {
        this.lotRepository = lotRepository;
        this.productService = productService;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
    }

    @Override
    public List<LotDto> getLotHistory() {
        List<LotEntity> lots = lotRepository.findAllWithItemsAndUser();
        return convertLotEntitiesToDtos(lots);
    }

    @Override
    public List<LotDto> getPendingLots() {
        List<LotEntity> pendingLots = lotRepository.findByAcceptedFalse();
        return convertLotEntitiesToDtos(pendingLots);
    }

    @Override
    public List<LotDto> getAcceptedLots() {
        List<LotEntity> acceptedLots = lotRepository.findByAcceptedTrue();
        return convertLotEntitiesToDtos(acceptedLots);
    }

    @Override
    @Transactional
    public boolean acceptLot(String lotId) {
        Optional<LotEntity> lotOpt = lotRepository.findById(lotId);
        InventoryTransactionEntity inventoryTransaction = new InventoryTransactionEntity();
        if (lotOpt.isPresent()) {
            LotEntity lot = lotOpt.get();
            lot.setAccepted(true);
            lotRepository.save(lot);
            inventoryTransaction.setType(TransactionType.IMPORT);
            inventoryTransaction.setRelated_dispatch_lot_id(lot.getId());
            inventoryTransaction.setTimestamp(new Date());
            inventoryTransactionRepository.save(inventoryTransaction);
            return true;
        }

        return false;
    }

    @Override
    public LotDto getLotDetails(String lotId) {
        Optional<LotEntity> lotOpt = lotRepository.findById(lotId);

        if (lotOpt.isPresent()) {
            List<LotEntity> singleLot = List.of(lotOpt.get());
            List<LotDto> dtos = convertLotEntitiesToDtos(singleLot);
            return dtos.isEmpty() ? null : dtos.get(0);
        }
        return null;
    }

    private List<LotDto> convertLotEntitiesToDtos(List<LotEntity> lots) {
        return lots.stream().map(lot -> {
            LotDto dto = new LotDto();
            dto.setId(lot.getId());
            dto.setImportDate(lot.getImportDate().toString());
            dto.setStorageStrategy(lot.getStorageStrategy().name());
            dto.setUsername(lot.getUser().getUsername());
            dto.setAccepted(lot.isAccepted());

            List<LotItemDto> groupedItems = new ArrayList<>();
            List<Map<String, Object>> groupedDetails = new ArrayList<>();

            for (LotItemEntity item : lot.getItems()) {
                if (item.getProduct() == null) continue;

                Map<String, Object> currentDetail = productService.extractDetail(item.getProduct());
                boolean merged = false;

                for (int i = 0; i < groupedItems.size(); i++) {
                    LotItemDto existing = groupedItems.get(i);
                    Map<String, Object> existingDetail = groupedDetails.get(i);

                    boolean sameName = existing.getProductName().equals(item.getProductName());
                    boolean samePrice = Objects.equals(existing.getPrice(), item.getPrice() != null ? item.getPrice().getValue() : null);
                    boolean sameCurrency = Objects.equals(existing.getCurrency(), item.getPrice() != null ? item.getPrice().getCurrency() : null);
                    boolean sameDetail = productService.matchesDetail(item.getProduct(), existingDetail);

                    if (sameName && samePrice && sameCurrency && sameDetail) {
                        existing.setQuantity(existing.getQuantity() + item.getQuantity());
                        merged = true;
                        break;
                    }
                }

                if (!merged) {
                    LotItemDto itemDto = new LotItemDto();
                    itemDto.setProductName(item.getProductName());
                    itemDto.setQuantity(item.getQuantity());
                    itemDto.setImportDate(item.getImportDate().toString());

                    if (item.getPrice() != null) {
                        itemDto.setPrice(item.getPrice().getValue());
                        itemDto.setCurrency(item.getPrice().getCurrency());
                    }

                    groupedItems.add(itemDto);
                    groupedDetails.add(currentDetail);
                }
            }

            dto.setItems(groupedItems);
            return dto;
        }).toList();
    }
}
