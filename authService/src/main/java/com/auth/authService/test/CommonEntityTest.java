package com.auth.authService.test;

import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * This is a test class to verify if the common module UserEntity is properly integrated
 * in the authService service.
 */
@Component
public class CommonEntityTest {

    private static final Logger logger = LoggerFactory.getLogger(CommonEntityTest.class);

    @PostConstruct
    public void testCommonEntity() {
        try {
            // Create a test user using the common UserEntity
            UserEntity testUser = new UserEntity();
            testUser.setUsername("test_user");
            testUser.setPassword("test_password");
            testUser.setRole(UserRole.ADMIN);
            testUser.setEnabled(true);

            // Log success message
            logger.info("Successfully created UserEntity from common module with username: {} and role: {}",
                    testUser.getUsername(), testUser.getRole());

        } catch (Exception e) {
            // Log any errors that occur
            logger.error("Error testing common UserEntity: {}", e.getMessage(), e);
        }
    }
}