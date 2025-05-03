package ims.com.dailycheck.scheduler;

import ims.com.dailycheck.service.ProductExpirationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Scheduler for checking product expiration dates on a daily basis
 */
@Component
public class ProductExpirationScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ProductExpirationScheduler.class);
    private static final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    private final ProductExpirationService productExpirationService;

    @Autowired
    public ProductExpirationScheduler(ProductExpirationService productExpirationService) {
        this.productExpirationService = productExpirationService;
    }

    /**
     * Scheduled task to check product expirations daily at 9:00 AM
     * The cron expression "0 0 9 * * ?" means:
     * - 0 seconds
     * - 0 minutes
     * - 9 hours (9:00 AM)
     * - Every day of the month
     * - Every month
     * - Every day of the week
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void checkProductExpirations() {
        logger.info("Product expiration check started at {}", dateFormat.format(new Date()));
        
        try {
            productExpirationService.checkProductExpirations();
            logger.info("Product expiration check completed successfully");
        } catch (Exception e) {
            logger.error("Error during product expiration check: {}", e.getMessage(), e);
        }
    }
}
