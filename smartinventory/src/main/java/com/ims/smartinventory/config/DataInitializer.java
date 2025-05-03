package com.ims.smartinventory.config;

import com.ims.common.config.UserRole;
import com.ims.common.entity.UserEntity;
import com.ims.common.entity.WarehouseEntity;
import com.ims.smartinventory.repository.UserRepository;
import com.ims.smartinventory.repository.WarehouseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final WarehouseRepository warehouseRepository;

    @Autowired
    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder, WarehouseRepository warehouseRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (warehouseRepository.findAll().isEmpty()) {
            WarehouseEntity warehouseEntity = new WarehouseEntity();
            warehouseEntity.setTotalSlots(10000);
            warehouseEntity.setId("unique_warehouse");
            warehouseEntity.setUsedSlots(0);
            warehouseRepository.save(warehouseEntity);
        }
        if (userRepository.findByUsername("admin").isEmpty()) {
            UserEntity adminUser = new UserEntity();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("1"));
            adminUser.setRole(UserRole.ADMIN);
            adminUser.setEnabled(true);
            adminUser.setDeleted(false);
            userRepository.save(adminUser);
            System.out.println("Admin user created successfully");
        }
    }
}
