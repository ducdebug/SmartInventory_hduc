package com.ims.smartinventory.entity.management;

import com.ims.smartinventory.entity.BaseProductEntity;
import com.ims.smartinventory.entity.PriceEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;

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