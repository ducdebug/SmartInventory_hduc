package com.ims.common.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ims.common.entity.management.DispatchEntity;
import com.ims.common.entity.management.LotEntity;
import com.ims.common.entity.storage.SectionEntity;
import com.ims.common.entity.storage.SlotSection;
import com.ims.common.entity.storage.SlotShelf;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "product")
public abstract class BaseProductEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @ManyToOne
    @JoinColumn(name = "dispatch_id")
    private DispatchEntity dispatch;

    @ManyToOne
    @JoinColumn(name = "lot_id", nullable = false)
    private LotEntity lot;

    @ManyToOne
    @JoinColumn(name = "price_id")
    private PriceEntity price;

    @OneToOne
    @JsonBackReference
    @JoinColumn(name = "slot_shelf_id", referencedColumnName = "id", nullable = true)
    private SlotShelf slotShelf;

    @OneToOne
    @JsonBackReference
    @JoinColumn(name = "slot_section_id", referencedColumnName = "id", nullable = true)
    private SlotSection slotSection;

    private boolean onShelf;

    @ManyToOne
    @JoinColumn(name = "section_id")
    private SectionEntity section;

    public abstract boolean isExpired();

    public Date getExpirationDate() {
        return null;
    }
}