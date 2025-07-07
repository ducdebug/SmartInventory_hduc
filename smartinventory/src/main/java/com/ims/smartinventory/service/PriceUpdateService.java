package com.ims.smartinventory.service;

public interface PriceUpdateService {
    void updateMonthlyPrices();

    void updateSectionPrice(String sectionId);
}
