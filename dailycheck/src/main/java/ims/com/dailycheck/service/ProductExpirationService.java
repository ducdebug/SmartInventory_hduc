package ims.com.dailycheck.service;

import com.ims.common.entity.BaseProductEntity;
import ims.com.dailycheck.repository.ProductExpirationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for checking product expiration dates and sending notifications
 */
@Service
public class ProductExpirationService {

    private final ProductExpirationRepository productRepository;
    private final NotificationService notificationService;

    @Value("${product.expiration.warning-days:30}")
    private int daysBeforeExpirationWarning;

    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

    @Autowired
    public ProductExpirationService(
            ProductExpirationRepository productRepository,
            NotificationService notificationService) {
        this.productRepository = productRepository;
        this.notificationService = notificationService;
    }

    public void checkProductExpirations() {
        Date today = new Date();

        List<BaseProductEntity> expiredProducts = productRepository.findExpiredProducts(today);

        Date warningDate = Date.from(LocalDate.now().plusDays(daysBeforeExpirationWarning)
                .atStartOfDay(ZoneId.systemDefault()).toInstant());
        List<BaseProductEntity> soonToExpireProducts = productRepository.findProductsExpiringBefore(warningDate, today);

        if (!expiredProducts.isEmpty()) {
            notifyAboutExpiredProducts(expiredProducts);
        }

        if (!soonToExpireProducts.isEmpty()) {
            notifyAboutSoonToExpireProducts(soonToExpireProducts);
        }
    }

    /**
     * Notify administrators about expired products
     */
    private void notifyAboutExpiredProducts(List<BaseProductEntity> expiredProducts) {
        String productList = formatProductList(expiredProducts);
        String message = "ALERT: " + expiredProducts.size() + " products have expired and need immediate attention!\n" +
                "Expired Products:\n" + productList;

        notificationService.notifyAdmin(message);
    }

    /**
     * Notify administrators about products that will expire soon
     */

    private void notifyAboutSoonToExpireProducts(List<BaseProductEntity> soonToExpireProducts) {
        String productList = formatProductList(soonToExpireProducts);
        String message = "WARNING: " + soonToExpireProducts.size() + " products will expire within " +
                daysBeforeExpirationWarning + " days.\n" +
                "Products expiring soon:\n" + productList;

        notificationService.notifyAdmin(message);
    }

    /**
     * Format a list of products for notification messages
     */
    private String formatProductList(List<BaseProductEntity> products) {
        return products.stream()
                .map(product -> String.format("- %s (ID: %s, Expiration: %s)",
                        product.getName(),
                        product.getId(),
                        product.getExpirationDate() != null ? dateFormat.format(product.getExpirationDate()) : "N/A"))
                .collect(Collectors.joining("\n"));
    }
}
