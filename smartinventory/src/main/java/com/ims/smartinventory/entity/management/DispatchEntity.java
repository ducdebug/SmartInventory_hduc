package com.ims.smartinventory.entity.management;

import com.ims.smartinventory.config.StorageStrategy;
import com.ims.smartinventory.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "dispatch")
public class DispatchEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private Date exportDate;

    @Enumerated(EnumType.STRING)
    private StorageStrategy storageStrategy;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @OneToMany(mappedBy = "dispatch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DispatchItemEntity> items;
}
