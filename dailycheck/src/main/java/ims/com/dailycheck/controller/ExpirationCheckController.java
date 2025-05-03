package ims.com.dailycheck.controller;

import ims.com.dailycheck.service.ProductExpirationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller to manually trigger product expiration checks
 */
@RestController
@RequestMapping("/api/expiration")
public class ExpirationCheckController {

    private static final Logger logger = LoggerFactory.getLogger(ExpirationCheckController.class);
    
    private final ProductExpirationService productExpirationService;

    @Autowired
    public ExpirationCheckController(ProductExpirationService productExpirationService) {
        this.productExpirationService = productExpirationService;
    }

    /**
     * Endpoint to manually trigger a product expiration check
     */
    @PostMapping("/check")
    public ResponseEntity<String> triggerExpirationCheck() {
        logger.info("Manual product expiration check triggered");
        
        try {
            productExpirationService.checkProductExpirations();
            logger.info("Manual product expiration check completed successfully");
            return ResponseEntity.ok("Product expiration check completed successfully");
        } catch (Exception e) {
            logger.error("Error during manual product expiration check: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body("Error during product expiration check: " + e.getMessage());
        }
    }
}
