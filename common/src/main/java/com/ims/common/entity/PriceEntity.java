package com.ims.common.entity;

import com.ims.common.config.TransactionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "price")
public class PriceEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private double value;
    private String currency;

    @Enumerated(EnumType.STRING)
    private TransactionType transactionType;

    @OneToMany(mappedBy = "primaryPrice", cascade = CascadeType.ALL)
    private List<BaseProductEntity> primaryProducts;
    
    @OneToMany(mappedBy = "secondaryPrice", cascade = CascadeType.ALL)
    private List<BaseProductEntity> secondaryProducts;
}
