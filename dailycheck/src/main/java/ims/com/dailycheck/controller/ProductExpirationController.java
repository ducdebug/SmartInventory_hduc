package ims.com.dailycheck.controller;

import ims.com.dailycheck.service.ProductExpirationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for manually triggering product expiration checks
 */
@RestController
@RequestMapping("/api/dailycheck")
public class ProductExpirationController {

    private final ProductExpirationService productExpirationService;

    @Autowired
    public ProductExpirationController(ProductExpirationService productExpirationService) {
        this.productExpirationService = productExpirationService;
    }

    /**
     * Endpoint to manually trigger a product expiration check
     * This is useful for testing or for running checks outside of the scheduled time
     */
    @PostMapping("/run-expiration-check")
    public ResponseEntity<String> runExpirationCheck() {
        productExpirationService.checkProductExpirations();
        return ResponseEntity.ok("Product expiration check completed successfully");
    }
}
