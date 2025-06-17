package com.ims.common.entity;

import com.ims.common.config.TransactionType;
import com.ims.common.entity.storage.SectionEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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

    @OneToOne(mappedBy = "price")
    private SectionEntity section;

}
