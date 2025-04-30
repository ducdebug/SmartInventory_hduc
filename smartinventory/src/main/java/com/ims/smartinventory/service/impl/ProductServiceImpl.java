package com.ims.smartinventory.service.impl;

import com.ims.common.entity.UserEntity;
import com.ims.smartinventory.config.*;
import com.ims.smartinventory.dto.Request.ProductBatchRequestDto;
import com.ims.smartinventory.dto.Request.ProductExportRequestDto;
import com.ims.smartinventory.dto.Request.ProductGroupResponseDto;
import com.ims.smartinventory.dto.Response.ProductResponse;
import com.ims.smartinventory.entity.BaseProductEntity;
import com.ims.smartinventory.entity.PriceEntity;
import com.ims.smartinventory.entity.management.*;
import com.ims.smartinventory.entity.product.*;
import com.ims.smartinventory.entity.storage.*;
import com.ims.smartinventory.exception.StorageException;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.ProductService;
import com.ims.smartinventory.util.VolumeCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class ProductServiceImpl implements ProductService {
    private final LotRepository lotRepository;
    private final ProductRepository productRepository;
    private final SlotShelfRepository slotShelfRepository;
    private final SlotSectionRepository slotSectionRepository;
    private final SectionRepository sectionRepository;
    private final PriceRepository priceRepository;
    private final LotItemRepository lotItemRepository;
    private final DispatchItemRepository dispatchItemRepository;
    private final DispatchRepository dispatchRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final NotificationProducerServiceImpl notificationProducerService;

    public ProductServiceImpl(LotRepository lotRepository, ProductRepository productRepository,
                              SlotShelfRepository slotShelfRepository, SlotSectionRepository slotSectionRepository,
                              SectionRepository sectionRepository, PriceRepository priceRepository,
                              LotItemRepository lotItemRepository, DispatchItemRepository dispatchItemRepository,
                              DispatchRepository dispatchRepository, InventoryTransactionRepository inventoryTransactionRepository,
                              NotificationProducerServiceImpl notificationProducerService) {
        this.lotRepository = lotRepository;
        this.productRepository = productRepository;
        this.slotShelfRepository = slotShelfRepository;
        this.slotSectionRepository = slotSectionRepository;
        this.sectionRepository = sectionRepository;
        this.priceRepository = priceRepository;
        this.lotItemRepository = lotItemRepository;
        this.dispatchItemRepository = dispatchItemRepository;
        this.dispatchRepository = dispatchRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.notificationProducerService = notificationProducerService;
    }
//
//    @Transactional
//    @Override
//    public void newBatch(ProductBatchRequestDto batchRequest, UserEntity currentUser){
//
//    }

    @Transactional
    @Override
    public List<SlotEntity> storeBatch(ProductBatchRequestDto batchRequest, UserEntity currentUser) {
        boolean onShelf = batchRequest.isOnShelf();
        System.out.println(onShelf);
        int totalQuantity = batchRequest.getTotalQuantity();

        List<SectionEntity> sections = sectionRepository.findAllWithStorageConditions();

        SectionEntity suitableSection = sections.stream()
                .filter(section -> (section.getNumShelves() != 0) == onShelf)
                .filter(section -> {
                    int totalSlots = section.getTotalSlots();
                    int usedSlots = onShelf
                            ? slotShelfRepository.countUsedBySectionId(section.getId())
                            : slotSectionRepository.countUsedBySectionId(section.getId());
                    return totalSlots - usedSlots >= totalQuantity;
                })
                .filter(section -> isSuitableForConditions(section, batchRequest.getStorageConditions()))
                .findFirst()
                .orElse(null);

        if (suitableSection == null) {
            throw new StorageException("No suitable section found for: " + batchRequest.getProductType());
        }

        LotEntity lot = new LotEntity();
        lot.setImportDate(new Date());
        lot.setUser(currentUser);
        lot.setStorageStrategy(batchRequest.getStorageStrategy());
        lot.setAccepted(false);
        lot = lotRepository.save(lot);

        List<Map<String, Object>> productDetails = batchRequest.getProductDetails();
        List<SlotEntity> allocatedSlots = new ArrayList<>();

        for (Map<String, Object> productData : productDetails) {
            int quantity = ((Number) productData.getOrDefault("quantity", 1)).intValue();

            PriceEntity price = new PriceEntity();
            price.setValue(((Number) productData.getOrDefault("price", 0)).doubleValue());
            price.setCurrency((String) productData.getOrDefault("currency", "VND"));
            price.setTransactionType(TransactionType.IMPORT);
            price = priceRepository.save(price);

            for (int i = 0; i < quantity; i++) {
                BaseProductEntity product = createProduct(batchRequest, productData);
                product.setLot(lot);
                product = productRepository.save(product);

                LotItemEntity lotItem = new LotItemEntity();
                lotItem.setLot(lot);
                lotItem.setProduct(product);
                lotItem.setProductName(product.getName());
                lotItem.setPrice(price);
                lotItem.setQuantity(1);
                lotItem.setImportDate(new Date());
                lotItemRepository.save(lotItem);

                SlotEntity slot = onShelf
                        ? allocateSlotInShelf(suitableSection, product)
                        : allocateSlotInSection(suitableSection, product);

                allocatedSlots.add(slot);
            }
        }
        return allocatedSlots;
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
    public List<ProductGroupResponseDto> getGroupedProducts() {
        List<BaseProductEntity> all = productRepository.findAll();
        Map<String, ProductGroupResponseDto> grouped = new LinkedHashMap<>();

        for (BaseProductEntity product : all) {
            if (product.getSlotShelf() == null && product.getSlotSection() == null) continue;

            String key = generateGroupKey(product);
            ProductGroupResponseDto dto = grouped.computeIfAbsent(key, k -> {
                ProductGroupResponseDto newDto = new ProductGroupResponseDto();
                newDto.setProductId(product.getId());
                newDto.setProductType(product.getClass().getSimpleName().replace("ProductEntity", "").toUpperCase());
                newDto.setName(product.getName());
                newDto.setDetail(extractDetail(product));
                newDto.setCount(0);
                return newDto;
            });

            dto.setCount(dto.getCount() + 1);
        }

        return new ArrayList<>(grouped.values());
    }

    private String generateGroupKey(BaseProductEntity p) {
        String base = p.getClass().getSimpleName() + "|" + p.getName();

        if (p instanceof FoodProductEntity food) {
            base += "|" + food.getExpirationDate() + "|" + food.getIngredients() + "|" + food.getWeight();
        } else if (p instanceof BookProductEntity book) {
            base += "|" + book.getAuthor() + "|" + book.getPublisher();
        }

        return base;
    }

    Map<String, Object> extractDetail(BaseProductEntity p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("name", p.getName());
        switch (p) {
            case BookProductEntity book -> {
                map.put("author", book.getAuthor());
                map.put("publisher", book.getPublisher());
                map.put("publicationDate", book.getPublicationDate());
                map.put("genre", book.getGenre());
                map.put("description", book.getDescription());
            }
            case FoodProductEntity food -> {
                map.put("expirationDate", food.getExpirationDate());
                map.put("ingredients", food.getIngredients());
                map.put("weight", food.getWeight());
            }
            case ClothingProductEntity clothing -> {
                map.put("material", clothing.getMaterial());
                map.put("size", clothing.getSize());
                map.put("branch", clothing.getBranch());
            }
            case CosmeticProductEntity cosmetic -> {
                map.put("brand", cosmetic.getBrand());
                map.put("category", cosmetic.getCategory());
                map.put("expirationDate", cosmetic.getExpirationDate());
                map.put("volume", cosmetic.getVolume());
            }
            case ElectronicsProductEntity electronics -> {
                map.put("brand", electronics.getBrand());
                map.put("type", electronics.getType());
                map.put("warrantyPeriod", electronics.getWarrantyPeriod());
                map.put("specifications", electronics.getSpecifications());
            }
            case RawMaterialProductEntity rawMaterial -> {
                map.put("materialType", rawMaterial.getMaterialType());
                map.put("unitOfMeasurement", rawMaterial.getUnitOfMeasurement());
                map.put("supplier", rawMaterial.getSupplier());
                map.put("deliveryDate", rawMaterial.getDeliveryDate());
                map.put("expirationDate", rawMaterial.getExpirationDate());
            }
            case PharmaceuticalProductEntity pharma -> {
                map.put("brand", pharma.getBrand());
                map.put("genericName", pharma.getGenericName());
                map.put("dosageForm", pharma.getDosageForm());
                map.put("strength", pharma.getStrength());
                map.put("expirationDate", pharma.getExpirationDate());
                map.put("activeIngredients", pharma.getActiveIngredients());
            }
            default -> map.put("id", p.getId());
        }
        return map;
    }

    private boolean isSuitableForConditions(SectionEntity section, List<ProductBatchRequestDto.StorageConditionDto> requiredConditions) {
        List<StorageConditionEntity> sectionConditions = section.getStorageConditions();

        if (requiredConditions == null || requiredConditions.isEmpty()) return true;

        for (ProductBatchRequestDto.StorageConditionDto required : requiredConditions) {
            boolean matched = sectionConditions.stream().anyMatch(actual ->
                            actual.getConditionType() == required.getConditionType()
                                    && required.getMinValue() >= actual.getMinValue()
                                    && required.getMaxValue() <= actual.getMaxValue()
                    //cần thêm điều kiện về unit
            );

            if (!matched) {
                return false;
            }
        }

        return true;
    }

    @SuppressWarnings("unchecked")
    private BaseProductEntity createProduct(ProductBatchRequestDto batchRequest, Map<String, Object> productData) {
        BaseProductEntity product = switch (batchRequest.getProductType()) {
            case BOOKS -> {
                BookProductEntity book = new BookProductEntity();
                book.setAuthor((String) productData.getOrDefault("author", "Unknown Author"));
                book.setPublisher((String) productData.getOrDefault("publisher", "Unknown Publisher"));
                book.setPublicationDate(parseDate((String) productData.get("publicationDate")));
                book.setGenre((String) productData.getOrDefault("genre", "Unknown Genre"));
                book.setDescription((String) productData.getOrDefault("description", ""));
                yield book;
            }
            case FOOD -> {
                FoodProductEntity food = new FoodProductEntity();
                food.setExpirationDate(parseDate((String) productData.get("expirationDate")));
                food.setIngredients((List<String>) productData.getOrDefault("ingredients", List.of()));
                food.setWeight(((Number) productData.getOrDefault("weight", 0)).doubleValue());
                yield food;
            }
            case ELECTRONICS -> {
                ElectronicsProductEntity electronic = new ElectronicsProductEntity();
                electronic.setBrand((String) productData.getOrDefault("brand", "Unknown"));
                electronic.setType((String) productData.getOrDefault("type", "General"));
                electronic.setWarrantyPeriod((String) productData.getOrDefault("warrantyPeriod", "N/A"));
                electronic.setSpecifications((Map<String, String>) productData.getOrDefault("specifications", Map.of()));
                yield electronic;
            }
            case CLOTHING -> {
                ClothingProductEntity clothing = new ClothingProductEntity();
                clothing.setMaterial((String) productData.getOrDefault("material", "Cotton"));
                clothing.setSize(ClothingSize.valueOf(((String) productData.getOrDefault("size", "M")).toUpperCase()));
                clothing.setBranch((String) productData.getOrDefault("branch", "Default"));
                yield clothing;
            }
            case RAW_MATERIAL -> {
                RawMaterialProductEntity raw = new RawMaterialProductEntity();
                raw.setMaterialType((String) productData.getOrDefault("materialType", "Generic"));
                raw.setUnitOfMeasurement((String) productData.getOrDefault("unitOfMeasurement", "kg"));
                raw.setSupplier((String) productData.getOrDefault("supplier", "Unknown"));
                raw.setDeliveryDate(parseDate((String) productData.get("deliveryDate")));
                raw.setExpirationDate(parseDate((String) productData.get("expirationDate")));
                yield raw;
            }
            case PHARMACEUTICALS -> {
                PharmaceuticalProductEntity pharma = new PharmaceuticalProductEntity();
                pharma.setBrand((String) productData.getOrDefault("brand", "Generic"));
                pharma.setGenericName((String) productData.getOrDefault("genericName", "N/A"));
                pharma.setDosageForm((String) productData.getOrDefault("dosageForm", "Tablet"));
                pharma.setStrength((String) productData.getOrDefault("strength", "500mg"));
                pharma.setExpirationDate(parseDate((String) productData.get("expirationDate")));
                pharma.setActiveIngredients((Map<String, String>) productData.getOrDefault("activeIngredients", Map.of()));
                yield pharma;
            }
            case COSMETICS -> {
                CosmeticProductEntity cosmetic = new CosmeticProductEntity();
                cosmetic.setBrand((String) productData.getOrDefault("brand", "Generic"));
                cosmetic.setCategory((String) productData.getOrDefault("category", "Skincare"));
                cosmetic.setExpirationDate(parseDate((String) productData.get("expirationDate")));
                cosmetic.setVolume(((Number) productData.getOrDefault("volume", 0)).doubleValue());
                yield cosmetic;
            }
            default -> throw new RuntimeException("Unknown product type: " + batchRequest.getProductType());
        };

        product.setName((String) productData.getOrDefault("name", "Unknown Product"));
        PriceEntity price = new PriceEntity();
        price.setValue(((Number) productData.getOrDefault("price", 0)).doubleValue());
        price.setCurrency((String) productData.getOrDefault("currency", "VND"));
        price.setTransactionType(TransactionType.IMPORT);
        price = priceRepository.save(price);
        product.setPrice(price);
        return product;
    }

    private Date parseDate(String dateStr) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        try {
            if (dateStr.contains("T")) {
                return new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").parse(dateStr);
            } else {
                return new SimpleDateFormat("yyyy-MM-dd").parse(dateStr);
            }
        } catch (ParseException e) {
            throw new RuntimeException("Invalid date format: " + dateStr, e);
        }
    }

    @Override
    public ProductResponse getProductResponseBySlotId(String slotId) {
        return slotShelfRepository.findById(slotId)
                .map(SlotShelf::getProduct)
                .map(this::toResponse)
                .orElse(null);
    }

    public ProductResponse toResponse(BaseProductEntity product) {
        ProductResponse response = new ProductResponse();
        response.setName(product.getName());

        switch (product) {
            case BookProductEntity book -> {
                book.setDispatch(null);
                book.setLot(null);
                response.setProductType(ProductType.BOOKS.name());
                response.setDetail(book);
            }
            case FoodProductEntity food -> {
                food.setDispatch(null);
                food.setLot(null);
                response.setProductType(ProductType.FOOD.name());
                response.setDetail(food);
            }
            case ClothingProductEntity clothing -> {
                clothing.setDispatch(null);
                clothing.setLot(null);
                response.setProductType(ProductType.CLOTHING.name());
                response.setDetail(clothing);
            }
            case CosmeticProductEntity cosmetic -> {
                cosmetic.setDispatch(null);
                cosmetic.setLot(null);
                response.setProductType(ProductType.COSMETICS.name());
                response.setDetail(cosmetic);
            }
            case ElectronicsProductEntity electronics -> {
                electronics.setDispatch(null);
                electronics.setLot(null);
                response.setProductType(ProductType.ELECTRONICS.name());
                response.setDetail(electronics);
            }
            case RawMaterialProductEntity rawMaterial -> {
                rawMaterial.setDispatch(null);
                rawMaterial.setLot(null);
                response.setProductType(ProductType.RAW_MATERIAL.name());
                response.setDetail(rawMaterial);
            }
            case PharmaceuticalProductEntity pharma -> {
                pharma.setDispatch(null);
                pharma.setLot(null);
                response.setProductType(ProductType.PHARMACEUTICALS.name());
                response.setDetail(pharma);
            }
            default -> {
                response.setProductType("UNKNOWN");
                response.setDetail(null);
            }
        }

        return response;
    }

    @Transactional
    @Override
    public void exportGroupedProducts(ProductExportRequestDto request, UserEntity currentUser) {
        DispatchEntity dispatch = new DispatchEntity();
        dispatch.setStatus(DispatchStatus.ACCEPTED);
        dispatch.setCompletedAt(new Date()); // Using completedAt for export date
        dispatch.setUser(currentUser);
        dispatch = dispatchRepository.save(dispatch);

        List<String> exportedProductIds = new ArrayList<>();

        for (ProductExportRequestDto.ProductExportItem item : request.getProducts()) {
            int quantity = item.getQuantity();
            String productId = item.getProductId();

            BaseProductEntity reference = productRepository.findById(productId)
                    .orElseThrow(() -> new StorageException("Reference product not found: " + productId));

            StorageStrategy strategy = reference.getLot().getStorageStrategy();
            List<BaseProductEntity> candidates = new ArrayList<>(productRepository.findAll().stream()
                    .filter(p -> p.getDispatch() == null)
                    .filter(p -> matchesDetail(p, extractDetail(reference)))
                    .limit(quantity)
                    .toList());

            if (candidates.size() < quantity) {
                throw new StorageException("Not enough products to export for: " + reference.getName());
            }
            switch (strategy) {
                case FIFO -> candidates.sort(Comparator.comparing(p -> p.getLot().getImportDate()));
                case LIFO ->
                        candidates.sort(Comparator.comparing((BaseProductEntity p) -> p.getLot().getImportDate()).reversed());
                case FEFO -> candidates.sort(Comparator.comparing(BaseProductEntity::getExpirationDate));
                case RANDOM -> Collections.shuffle(candidates);
            }
            for (BaseProductEntity product : candidates) {
                exportedProductIds.add(product.getId());

                product.setDispatch(dispatch);
                if (product.getSlotShelf() != null) {
                    SlotShelf shelf = product.getSlotShelf();
                    product.setSlotShelf(null);
                    shelf.setOccupied(false);
                    slotShelfRepository.save(shelf);
                } else if (product.getSlotSection() != null) {
                    SlotSection section = product.getSlotSection();
                    product.setSlotSection(null);
                    section.setOccupied(false);
                    slotSectionRepository.save(section);
                }
                productRepository.save(product);

                DispatchItemEntity dispatchItem = new DispatchItemEntity();
                dispatchItem.setDispatch(dispatch);
                dispatchItem.setProduct(product);
                dispatchItem.setProductName(product.getName());
                dispatchItem.setQuantity(1);
                dispatchItem.setExportDate(new Date());

                if (product.getPrice() != null) {
                    PriceEntity exportPrice = new PriceEntity();
                    exportPrice.setTransactionType(TransactionType.EXPORT);
                    exportPrice.setValue(product.getPrice().getValue());
                    exportPrice.setCurrency(product.getPrice().getCurrency());
                    exportPrice = priceRepository.save(exportPrice);
                    dispatchItem.setPrice(exportPrice);
                }

                dispatchItemRepository.save(dispatchItem);
                InventoryTransactionEntity tx = new InventoryTransactionEntity();
                tx.setType(TransactionType.EXPORT);
                tx.setTimestamp(new Date());
                tx.setRelated_dispatch_lot_id(dispatch.getId());
                inventoryTransactionRepository.save(tx);
            }
        }

        checkProductVolumeAndNotify(exportedProductIds);
    }

    boolean matchesDetail(BaseProductEntity product, Map<String, Object> detail) {
        Map<String, Object> actual = extractDetail(product);
        if (actual.size() != detail.size()) return false;

        for (Map.Entry<String, Object> entry : detail.entrySet()) {
            Object actualVal = actual.get(entry.getKey());
            if (actualVal == null || !actualVal.toString().equals(entry.getValue().toString())) {
                return false;
            }
        }
        return true;
    }

    @Transactional
    @Override
    public String createRetrieveRequest(ProductExportRequestDto request, UserEntity currentUser) {
        DispatchEntity dispatch = new DispatchEntity();
        dispatch.setCreatedAt(new Date());
        dispatch.setUser(currentUser);
        dispatch.setStatus(DispatchStatus.PENDING);
        dispatch = dispatchRepository.save(dispatch);

        // Process each product in the retrieval request
        for (ProductExportRequestDto.ProductExportItem item : request.getProducts()) {
            int quantity = item.getQuantity();

            BaseProductEntity reference = null;
            if (item.getProductId() != null) {
                reference = productRepository.findById(item.getProductId()).orElse(null);
            }

            String productName = reference != null ? reference.getName() : item.getName();

            // Create a dispatch item
            DispatchItemEntity dispatchItem = new DispatchItemEntity();
            dispatchItem.setDispatch(dispatch);
            dispatchItem.setProductName(productName);
            dispatchItem.setQuantity(quantity);
            dispatchItem.setExportDate(new Date());

            if (reference != null) {
                dispatchItem.setProductId(reference.getId());
            }

            if (reference != null && reference.getPrice() != null) {
                PriceEntity exportPrice = new PriceEntity();
                exportPrice.setTransactionType(TransactionType.EXPORT);
                exportPrice.setValue(reference.getPrice().getValue());
                exportPrice.setCurrency(reference.getPrice().getCurrency());
                exportPrice = priceRepository.save(exportPrice);
                dispatchItem.setPrice(exportPrice);
            }

            dispatchItemRepository.save(dispatchItem);
        }

        // Send notification to admin
//        notificationProducerService.sendNotification("admin",
//                "New retrieval request created by " + currentUser.getUsername() +
//                        ". Request ID: " + dispatch.getId());

        return dispatch.getId();
    }

    @Override
    public boolean checkProductVolumeAndNotify(List<String> exportedProductIds) {
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
            return true;
        }

        return false;
    }
}