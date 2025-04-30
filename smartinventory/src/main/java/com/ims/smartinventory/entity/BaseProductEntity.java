package com.ims.smartinventory.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ims.smartinventory.entity.management.DispatchEntity;
import com.ims.smartinventory.entity.management.LotEntity;
import com.ims.smartinventory.entity.storage.SlotSection;
import com.ims.smartinventory.entity.storage.SlotShelf;
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


    public abstract boolean isExpired();

    public Date getExpirationDate() {
        return null;
    }
}