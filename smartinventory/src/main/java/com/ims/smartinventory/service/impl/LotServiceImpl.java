package com.ims.smartinventory.service.impl;

import com.ims.common.config.TransactionType;
import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.management.InventoryTransactionEntity;
import com.ims.common.entity.management.LotEntity;
import com.ims.common.entity.management.LotItemEntity;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.common.entity.storage.SlotEntity;
import com.ims.common.entity.storage.SlotSection;
import com.ims.common.entity.storage.SlotShelf;
import com.ims.smartinventory.dto.Response.LotDto;
import com.ims.smartinventory.dto.Response.LotItemDto;
import com.ims.smartinventory.exception.StorageException;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.LotService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class LotServiceImpl implements LotService {

    private final LotRepository lotRepository;
    private final SlotSectionRepository slotSectionRepository;
    private final SlotShelfRepository slotShelfRepository;
    private final ProductServiceImpl productService;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final ProductRepository productRepository;
    private final SectionRepository sectionRepository;

    public LotServiceImpl(LotRepository lotRepository, SlotSectionRepository slotSectionRepository, SlotShelfRepository slotShelfRepository,
                          ProductServiceImpl productService,
                          InventoryTransactionRepository inventoryTransactionRepository,
                          ProductRepository productRepository,
                          SectionRepository sectionRepository) {
        this.lotRepository = lotRepository;
        this.slotSectionRepository = slotSectionRepository;
        this.slotShelfRepository = slotShelfRepository;
        this.productService = productService;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.productRepository = productRepository;
        this.sectionRepository = sectionRepository;
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

        if (lotOpt.isPresent()) {
            LotEntity lot = lotOpt.get();

            if (lot.isAccepted()) {
                return true;
            }

            List<BaseProductEntity> products = productRepository.findByLotIdAndSlotShelfIsNullAndSlotSectionIsNull(lot.getId());

            for (BaseProductEntity product : products) {
                SectionEntity sectionEntity = product.getSection();
                boolean onShelf = product.isOnShelf();

                if (onShelf) {
                    allocateSlotInShelf(sectionEntity, product);
                } else {
                    allocateSlotInSection(sectionEntity, product);
                }
            }

            lot.setAccepted(true);
            lotRepository.save(lot);

            InventoryTransactionEntity inventoryTransaction = new InventoryTransactionEntity();
            inventoryTransaction.setType(TransactionType.IMPORT);
            inventoryTransaction.setRelated_dispatch_lot_id(lot.getId());
            inventoryTransaction.setTimestamp(new Date());
            inventoryTransactionRepository.save(inventoryTransaction);

            return true;
        }

        return false;
    }

    private SlotEntity allocateSlotInShelf(SectionEntity section, BaseProductEntity product) {
        List<SlotShelf> availableSlots = slotShelfRepository.findAll().stream()
                .filter(SlotEntity::isAvailable)
                .filter(slot -> slot.getShelf().getSection().equals(section) && slot.getProduct() == null)
                .sorted(
                        Comparator.comparing((SlotShelf s) -> s.getShelf().getId())
                                .thenComparingInt(SlotShelf::getX)
                                .thenComparingInt(SlotShelf::getY)
                )
                .toList();

        if (availableSlots.isEmpty()) {
            throw new StorageException("No available slot in shelf for section: " + section.getName());
        }

        SlotShelf selectedSlot = availableSlots.getFirst();
        selectedSlot.setOccupied(true);
        selectedSlot.setProduct(product);
        product.setSlotShelf(selectedSlot);

        slotShelfRepository.save(selectedSlot);
        productRepository.save(product);
        return selectedSlot;
    }

    private SlotEntity allocateSlotInSection(SectionEntity section, BaseProductEntity product) {
        List<SlotSection> availableSlots = slotSectionRepository.findAll().stream()
                .filter(SlotEntity::isAvailable)
                .filter(slot -> slot.getSection().equals(section) && slot.getProduct() == null)
                .sorted(Comparator.comparingInt(SlotSection::getXPosition).thenComparingInt(SlotSection::getYPosition))
                .toList();
        SlotSection selectedSlot = availableSlots.getFirst();
        selectedSlot.setOccupied(true);
        selectedSlot.setProduct(product);
        product.setSlotSection(selectedSlot);

        slotSectionRepository.save(selectedSlot);
        productRepository.save(product);
        return selectedSlot;
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