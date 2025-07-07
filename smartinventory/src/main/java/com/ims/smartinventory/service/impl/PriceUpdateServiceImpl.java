package com.ims.smartinventory.service.impl;

import com.ims.common.config.SectionStatus;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.repository.SectionRepository;
import com.ims.smartinventory.service.PriceUpdateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class PriceUpdateServiceImpl implements PriceUpdateService {

    private final SectionRepository sectionRepository;

    private static final double MONTHLY_INCREASE_RATE = 0.05;

    public PriceUpdateServiceImpl(SectionRepository sectionRepository) {
        this.sectionRepository = sectionRepository;
    }

    // runs on the 1st day of every month at 00:00
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    @Override
    public void updateMonthlyPrices() {
        log.info("Starting monthly price update for all active sections");

        try {
            List<SectionEntity> activeSections = sectionRepository.findByStatus(SectionStatus.ACTIVE);

            int updatedCount = 0;
            for (SectionEntity section : activeSections) {
                if (section.getPrice() != null) {
                    double currentPrice = section.getPrice().getValue();
                    double newPrice = currentPrice * (1 + MONTHLY_INCREASE_RATE);

                    section.getPrice().setValue(newPrice);
                    sectionRepository.save(section);
                    updatedCount++;

                    log.debug("Updated price for section {} from {} to {}",
                            section.getName(), currentPrice, newPrice);
                }
            }

            log.info("Monthly price update completed. Updated {} sections", updatedCount);

        } catch (Exception e) {
            log.error("Error during monthly price update", e);
        }
    }

    @Transactional
    @Override
    public void updateSectionPrice(String sectionId) {
        log.info("Updating price for section with ID: {}", sectionId);

        try {
            SectionEntity section = sectionRepository.findById(sectionId)
                    .orElseThrow(() -> new RuntimeException("Section not found with ID: " + sectionId));

            if (section.getStatus() != SectionStatus.ACTIVE) {
                log.warn("Cannot update price for inactive section: {}", sectionId);
                return;
            }

            if (section.getPrice() != null) {
                double currentPrice = section.getPrice().getValue();
                double newPrice = currentPrice * (1 + MONTHLY_INCREASE_RATE);

                section.getPrice().setValue(newPrice);
                sectionRepository.save(section);

                log.info("Updated price for section {} from {} to {}",
                        section.getName(), currentPrice, newPrice);
            } else {
                log.warn("Section {} has no price entity", sectionId);
            }

        } catch (Exception e) {
            log.error("Error updating price for section {}", sectionId, e);
            throw new RuntimeException("Failed to update section price", e);
        }
    }
}
