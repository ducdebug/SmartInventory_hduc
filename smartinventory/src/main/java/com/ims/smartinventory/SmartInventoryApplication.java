package com.ims.smartinventory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;

@SpringBootApplication
@EntityScan("com.ims.smartinventory.entity")
public class SmartInventoryApplication {
	public static void main(String[] args) {
		SpringApplication.run(SmartInventoryApplication.class, args);
	}
}
