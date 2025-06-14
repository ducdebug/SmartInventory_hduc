package com.ims.smartinventory.service.impl;

import com.ims.common.config.*;
import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.PriceEntity;
import com.ims.common.entity.UserEntity;
import com.ims.common.entity.management.DispatchEntity;
import com.ims.common.entity.management.DispatchItemEntity;
import com.ims.common.entity.management.LotEntity;
import com.ims.common.entity.management.LotItemEntity;
import com.ims.common.entity.product.*;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.common.entity.storage.SlotShelf;
import com.ims.common.entity.storage.StorageConditionEntity;
import com.ims.smartinventory.dto.Request.ProductBatchRequestDto;
import com.ims.smartinventory.dto.Request.ProductExportRequestDto;
import com.ims.smartinventory.dto.Request.ProductGroupResponseDto;
import com.ims.smartinventory.dto.Request.UpdateSecondaryPriceRequest;
import com.ims.smartinventory.dto.Response.ProductResponse;
import com.ims.smartinventory.dto.Response.ProductsByLotResponse;
import com.ims.smartinventory.exception.NoSuitableSectionException;
import com.ims.smartinventory.exception.StorageException;
import com.ims.smartinventory.repository.*;
import com.ims.smartinventory.service.ProductService;
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

    @Transactional
    @Override
    public void storeBatch(ProductBatchRequestDto batchRequest, UserEntity currentUser) {
        LotEntity lot = new LotEntity();
        lot.setImportDate(new Date());
        lot.setUser(currentUser);
        lot.setStorageStrategy(batchRequest.getStorageStrategy());
        lot.setStatus(LotStatus.PENDING);
        lot = lotRepository.save(lot);

        List<Map<String, Object>> productDetails = batchRequest.getProductDetails();

        for (Map<String, Object> productData : productDetails) {
            boolean onShelf = (boolean) productData.getOrDefault("onShelf", false);
            int quantity = ((Number) productData.getOrDefault("quantity", 1)).intValue();
            List<SectionEntity> sections = sectionRepository.findAllWithStorageConditions();

            SectionEntity suitableSection = sections.stream()
                    .filter(section -> (section.getNumShelves() != 0) == onShelf)
                    .filter(section -> {
                        int totalSlots = section.getTotalSlots();
                        int usedSlots = onShelf
                                ? slotShelfRepository.countUsedBySectionId(section.getId())
                                : slotSectionRepository.countUsedBySectionId(section.getId());
                        return totalSlots - usedSlots >= quantity;
                    })
                    .filter(section -> isSuitableForConditions(section, batchRequest.getStorageConditions()))
                    .findFirst()
                    .orElse(null);

            if (suitableSection == null) {
                throw new NoSuitableSectionException("No suitable section found for storage conditions. Please contact administrator to create appropriate sections.");
            }

            PriceEntity price = new PriceEntity();
            price.setValue(((Number) productData.getOrDefault("price", 0)).doubleValue());
            price.setCurrency((String) productData.getOrDefault("currency", "VND"));
            price.setTransactionType(TransactionType.IMPORT);
            price = priceRepository.save(price);

            for (int i = 0; i < quantity; i++) {
                BaseProductEntity product = createProduct(batchRequest, productData, onShelf, suitableSection);
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
            }
        }
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
                if (product.getPrimaryPrice() != null) {
                    newDto.getDetail().put("primaryPrice", product.getPrimaryPrice().getValue());
                    newDto.getDetail().put("primaryCurrency", product.getPrimaryPrice().getCurrency());
                }
                if (product.getSecondaryPrice() != null) {
                    newDto.getDetail().put("secondaryPrice", product.getSecondaryPrice().getValue());
                    newDto.getDetail().put("secondaryCurrency", product.getSecondaryPrice().getCurrency());
                }
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
    private BaseProductEntity createProduct(ProductBatchRequestDto batchRequest, Map<String, Object> productData, boolean onShelf, SectionEntity sectionEntity) {
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
        product.setOnShelf(onShelf);
        product.setSection(sectionEntity);
        PriceEntity price = new PriceEntity();
        price.setValue(((Number) productData.getOrDefault("price", 0)).doubleValue());
        price.setCurrency((String) productData.getOrDefault("currency", "VND"));
        price.setTransactionType(TransactionType.IMPORT);
        price = priceRepository.save(price);
        product.setPrimaryPrice(price);
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

        for (ProductExportRequestDto.ProductExportItem item : request.getProducts()) {
            int quantity = item.getQuantity();

            BaseProductEntity reference = productRepository.findById(item.getProductId()).orElseThrow();
            StorageStrategy strategy = reference.getLot().getStorageStrategy();
            List<BaseProductEntity> candidates = new ArrayList<>(productRepository.findAll().stream()
                    .filter(p -> p.getDispatch() == null)
                    .filter(p -> matchesDetail(p, extractDetail(reference)))
                    .toList());

            if (candidates.size() < quantity) {
                throw new StorageException("Not enough products to export for: " + reference.getName());
            }

            // Sort candidates based on storage strategy
            switch (strategy) {
                case FIFO -> candidates.sort(Comparator.comparing(p -> p.getLot().getImportDate()));
                case LIFO ->
                        candidates.sort(Comparator.comparing((BaseProductEntity p) -> p.getLot().getImportDate()).reversed());
                case FEFO -> candidates.sort(Comparator.comparing(BaseProductEntity::getExpirationDate));
                case RANDOM -> Collections.shuffle(candidates);
            }

            List<BaseProductEntity> selectedProducts = candidates.subList(0, quantity);

            String productName = reference.getName();
            DispatchItemEntity dispatchItem = new DispatchItemEntity();
            dispatchItem.setDispatch(dispatch);
            dispatchItem.setProductName(productName);
            dispatchItem.setQuantity(quantity);
            dispatchItem.setExportDate(new Date());
            dispatchItem.setProductId(reference.getId());
            dispatchItem.setProducts(selectedProducts);

            PriceEntity exportPrice = new PriceEntity();
            exportPrice.setTransactionType(TransactionType.EXPORT);
            exportPrice.setCurrency(reference.getSecondaryPrice().getCurrency());
            exportPrice = priceRepository.save(exportPrice);
            dispatchItem.setPrice(exportPrice);

            dispatchItemRepository.save(dispatchItem);
        }

        // Send notification to admin
//        notificationProducerService.sendNotification("admin",
//                "New retrieval request created by " + currentUser.getUsername() +
//                        ". Request ID: " + dispatch.getId());

        return dispatch.getId();
    }

    @Override
    public List<ProductsByLotResponse> getAllProductsByLot() {
        List<LotEntity> allLots = lotRepository.findAll();
        return allLots.stream().map(lot -> {
            List<BaseProductEntity> products = productRepository.findByLotId(lot.getId());

            ProductsByLotResponse response = new ProductsByLotResponse();
            response.setLotId(lot.getId());
            response.setLotCode(lot.getLotCode());
            response.setImportDate(lot.getImportDate());
            response.setImportedByUser(lot.getUser() != null ? lot.getUser().getUsername() : "Unknown");
            response.setStatus(lot.getStatus());

            List<ProductsByLotResponse.ProductInLot> productList = products.stream().map(product -> {
                ProductsByLotResponse.ProductInLot productItem = new ProductsByLotResponse.ProductInLot();
                productItem.setProductId(product.getId());
                productItem.setProductName(product.getName());
                productItem.setProductType(product.getClass().getSimpleName().replace("ProductEntity", ""));

                if (product.getPrimaryPrice() != null) {
                    ProductsByLotResponse.PriceDTO primaryPriceDTO = new ProductsByLotResponse.PriceDTO(
                            product.getPrimaryPrice().getId(),
                            product.getPrimaryPrice().getValue(),
                            product.getPrimaryPrice().getCurrency()
                    );
                    productItem.setPrimaryPrice(primaryPriceDTO);
                }

                if (product.getSecondaryPrice() != null) {
                    ProductsByLotResponse.PriceDTO secondaryPriceDTO = new ProductsByLotResponse.PriceDTO(
                            product.getSecondaryPrice().getId(),
                            product.getSecondaryPrice().getValue(),
                            product.getSecondaryPrice().getCurrency()
                    );
                    productItem.setSecondaryPrice(secondaryPriceDTO);
                }

                productItem.setDetails(extractDetail(product));

                return productItem;
            }).toList();

            response.setProducts(productList);
            return response;
        }).toList();
    }

    @Override
    public List<ProductsByLotResponse> getProductsByLotForSupplier(UserEntity supplier) {
        // Return all lots imported by the supplier, regardless of their status
        List<LotEntity> supplierLots = lotRepository.findByUserId(supplier.getId());
        return supplierLots.stream().map(lot -> {
            List<BaseProductEntity> products = productRepository.findByLotId(lot.getId());

            ProductsByLotResponse response = new ProductsByLotResponse();
            response.setLotId(lot.getId());
            response.setLotCode(lot.getLotCode());
            response.setImportDate(lot.getImportDate());
            response.setImportedByUser(lot.getUser() != null ? lot.getUser().getUsername() : "Unknown");
            response.setStatus(lot.getStatus());

            List<ProductsByLotResponse.ProductInLot> productList = products.stream().map(product -> {
                ProductsByLotResponse.ProductInLot productItem = new ProductsByLotResponse.ProductInLot();
                productItem.setProductId(product.getId());
                productItem.setProductName(product.getName());
                productItem.setProductType(product.getClass().getSimpleName().replace("ProductEntity", ""));

                if (product.getPrimaryPrice() != null) {
                    ProductsByLotResponse.PriceDTO primaryPriceDTO = new ProductsByLotResponse.PriceDTO(
                            product.getPrimaryPrice().getId(),
                            product.getPrimaryPrice().getValue(),
                            product.getPrimaryPrice().getCurrency()
                    );
                    productItem.setPrimaryPrice(primaryPriceDTO);
                }

                if (product.getSecondaryPrice() != null) {
                    ProductsByLotResponse.PriceDTO secondaryPriceDTO = new ProductsByLotResponse.PriceDTO(
                            product.getSecondaryPrice().getId(),
                            product.getSecondaryPrice().getValue(),
                            product.getSecondaryPrice().getCurrency()
                    );
                    productItem.setSecondaryPrice(secondaryPriceDTO);
                }

                productItem.setDetails(extractDetail(product));

                return productItem;
            }).toList();

            response.setProducts(productList);
            return response;
        }).toList();
    }

    @Override
    @Transactional
    public void updateSecondaryPrices(UpdateSecondaryPriceRequest request) {
        if (request.getProductPrices() == null || request.getProductPrices().isEmpty()) {
            if (request.getBulkPrice() == null) {
                throw new IllegalArgumentException("Either product prices or bulk price must be provided");
            }
            return;
        }
        for (UpdateSecondaryPriceRequest.ProductPrice productPrice : request.getProductPrices()) {
            BaseProductEntity product = productRepository.findById(productPrice.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + productPrice.getProductId()));

            PriceEntity secondaryPrice;
            if (product.getSecondaryPrice() == null) {
                secondaryPrice = new PriceEntity();
                secondaryPrice.setTransactionType(TransactionType.EXPORT);
            } else {
                secondaryPrice = product.getSecondaryPrice();
            }

            if (request.getBulkPrice() != null) {
                secondaryPrice.setValue(request.getBulkPrice());
                secondaryPrice.setCurrency(request.getCurrency());
            } else if (request.getBulkMarkupPercentage() != null) {
                if (product.getPrimaryPrice() != null) {
                    double primaryValue = product.getPrimaryPrice().getValue();
                    double markup = 1 + (request.getBulkMarkupPercentage() / 100.0);
                    secondaryPrice.setValue(primaryValue * markup);
                    secondaryPrice.setCurrency(product.getPrimaryPrice().getCurrency());
                } else {
                    secondaryPrice.setValue(productPrice.getPrice());
                    secondaryPrice.setCurrency(productPrice.getCurrency());
                }
            } else {
                secondaryPrice.setValue(productPrice.getPrice());
                secondaryPrice.setCurrency(productPrice.getCurrency());
            }

            secondaryPrice = priceRepository.save(secondaryPrice);

            product.setSecondaryPrice(secondaryPrice);
            productRepository.save(product);
        }
    }
}