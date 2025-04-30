package com.ims.smartinventory.util;

import com.ims.smartinventory.entity.BaseProductEntity;
import com.ims.smartinventory.entity.product.*;

/**
 * Utility class to calculate product volumes using logistic formulas
 */
public class VolumeCalculator {

    private static final double MIN_VOLUME_THRESHOLD = 10.0; // Minimum volume threshold in cubic units
    private static final double DEFAULT_VOLUME = 1.0; // Default volume for unknown product types

    /**
     * Calculate the volume of a product based on its type and properties
     *
     * @param product The product to calculate volume for
     * @return The calculated volume in cubic units
     */
    public static double calculateProductVolume(BaseProductEntity product) {
        return switch (product) {
            case BookProductEntity book -> calculateBookVolume(book);
            case FoodProductEntity food -> calculateFoodVolume(food);
            case ClothingProductEntity clothing -> calculateClothingVolume(clothing);
            case CosmeticProductEntity cosmetic -> calculateCosmeticVolume(cosmetic);
            case ElectronicsProductEntity electronics -> calculateElectronicsVolume(electronics);
            case RawMaterialProductEntity rawMaterial -> calculateRawMaterialVolume(rawMaterial);
            case PharmaceuticalProductEntity pharma -> calculatePharmaceuticalVolume(pharma);
            default -> DEFAULT_VOLUME;
        };
    }

    private static double calculateBookVolume(BookProductEntity book) {
        // Standard book dimensions if not specified
        double length = 24.0; // cm
        double width = 17.0; // cm
        double height = 2.0; // cm

        // Calculate volume in cubic centimeters
        return length * width * height / 1000.0; // Convert to liters
    }

    private static double calculateFoodVolume(FoodProductEntity food) {
        // Calculate based on weight
        // Assume average density of 0.8 g/cm³
        double weight = food.getWeight();
        double density = 0.8;

        // Convert weight (g) to volume (L)
        return weight / density / 1000.0;
    }

    private static double calculateClothingVolume(ClothingProductEntity clothing) {
        // Calculate based on size
        double baseVolume = 1.0;

        switch (clothing.getSize()) {
            case XS -> baseVolume = 1.0;
            case S -> baseVolume = 1.5;
            case M -> baseVolume = 2.0;
            case L -> baseVolume = 2.5;
            case XL -> baseVolume = 3.0;
        }

        return baseVolume;
    }

    private static double calculateCosmeticVolume(CosmeticProductEntity cosmetic) {
        return cosmetic.getVolume() > 0 ? cosmetic.getVolume() / 1000.0 : 0.2; // Convert to liters
    }

    private static double calculateElectronicsVolume(ElectronicsProductEntity electronics) {
        String type = electronics.getType().toLowerCase();

        if (type.contains("phone")) {
            return 0.2;
        } else if (type.contains("laptop")) {
            return 3.0;
        } else if (type.contains("tv") || type.contains("monitor")) {
            return 15.0;
        } else {
            return 1.0;
        }
    }

    private static double calculateRawMaterialVolume(RawMaterialProductEntity material) {
        return 2.0;
    }

    private static double calculatePharmaceuticalVolume(PharmaceuticalProductEntity pharma) {
        return 0.1;
    }


    public static boolean isVolumeBelowThreshold(double totalVolume) {
        return totalVolume < MIN_VOLUME_THRESHOLD;
    }
}