package ims.com.dailycheck.scheduler;

import ims.com.dailycheck.service.ProductExpirationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler to run product expiration checks at regular intervals
 */
@Component
public class ExpirationCheckScheduler {

    private static final Logger logger = LoggerFactory.getLogger(ExpirationCheckScheduler.class);
    
    private final ProductExpirationService productExpirationService;
    
    @Value("${product.expiration.check-enabled:true}")
    private boolean checkEnabled;

    @Autowired
    public ExpirationCheckScheduler(ProductExpirationService productExpirationService) {
        this.productExpirationService = productExpirationService;
    }

    /**
     * Scheduled task that runs daily at 8:00 AM to check for expired and soon-to-expire products
     * Uses cron expression: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "${product.expiration.check-cron:0 0 8 * * ?}")
    public void scheduledExpirationCheck() {
        if (!checkEnabled) {
            logger.info("Product expiration check is disabled");
            return;
        }
        
        logger.info("Starting scheduled product expiration check");
        try {
            productExpirationService.checkProductExpirations();
            logger.info("Completed product expiration check successfully");
        } catch (Exception e) {
            logger.error("Error during product expiration check: {}", e.getMessage(), e);
        }
    }
}
