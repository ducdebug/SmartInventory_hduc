package com.ims.common.entity.management;

import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.PriceEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "dispatch_item")
public class DispatchItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String productName;

    @Column(name = "product_ref_id")
    private String productId;

    @ManyToOne(optional = true)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private BaseProductEntity product;
    
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_item_id")
    private List<BaseProductEntity> products = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "dispatch_id", nullable = false)
    private DispatchEntity dispatch;

    @ManyToOne
    @JoinColumn(name = "price_id", nullable = true)
    private PriceEntity price;

    private int quantity;

    @Temporal(TemporalType.TIMESTAMP)
    private Date exportDate;
}