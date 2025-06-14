package com.ims.common.entity.management;

import com.ims.common.config.LotStatus;
import com.ims.common.config.StorageStrategy;
import com.ims.common.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "lot")
public class LotEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String lotCode;

    private Date importDate;

    @Enumerated(EnumType.STRING)
    private LotStatus status;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    private StorageStrategy storageStrategy;

    @OneToMany(mappedBy = "lot", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LotItemEntity> items;

    @PrePersist
    protected void onCreate() {
        if (lotCode == null || lotCode.isEmpty()) {
            lotCode = "LOT-" + System.currentTimeMillis();
        }
    }
}