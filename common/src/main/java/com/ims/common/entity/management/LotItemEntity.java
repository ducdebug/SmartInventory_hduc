package com.ims.common.entity.management;

import com.ims.common.entity.BaseProductEntity;
import com.ims.common.entity.PriceEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Entity
@Table(name = "lot_item")
@Getter
@Setter
public class LotItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String productName;

    @ManyToOne(optional = true)
    @JoinColumn(name = "product_id")
    private BaseProductEntity product;

    @ManyToOne
    @JoinColumn(name = "lot_id", nullable = false)
    private LotEntity lot;

    @ManyToOne
    @JoinColumn(name = "price_id", nullable = true)
    private PriceEntity price;

    private int quantity;

    private Date importDate;
}
