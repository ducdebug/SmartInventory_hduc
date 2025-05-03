package ims.com.dailycheck.runner;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Runner that executes on application startup
 */
@Component
public class ApplicationStartupRunner implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(ApplicationStartupRunner.class);
    
    @Value("${product.expiration.warning-days}")
    private int warningDays;
    
    @Value("${product.expiration.check-enabled}")
    private boolean checkEnabled;
    
    @Value("${product.expiration.check-cron}")
    private String checkCron;

    @Override
    public void run(ApplicationArguments args) {
        logger.info("Daily Product Expiration Check Service started successfully");
        logger.info("Configuration:");
        logger.info("Warning Days: {} days before expiration", warningDays);
        logger.info("Check Enabled: {}", checkEnabled);
        logger.info("Check Schedule: {}", checkCron);
    }
}
