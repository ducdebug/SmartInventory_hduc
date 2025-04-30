package com.ims.smartinventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = {"com.ims.smartinventory.entity", "com.ims.common.entity"})
@EnableJpaRepositories(basePackages = {"com.ims.smartinventory.repository"})
public class SmartInventoryApplication {
    public static void main(String[] args) {
        SpringApplication.run(SmartInventoryApplication.class, args);
    }
}
