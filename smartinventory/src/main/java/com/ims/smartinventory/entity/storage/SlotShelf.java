package com.ims.smartinventory.entity.storage;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.ims.smartinventory.entity.BaseProductEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "slot_shelf")
public class SlotShelf extends SlotEntity {
    private int x;
    private int y;

    @ManyToOne
    @JoinColumn(name = "shelf_id", nullable = false)
    @JsonBackReference
    private ShelfEntity shelf;

    @OneToOne
    @JsonManagedReference
    @JoinColumn(name = "product_id", nullable = true)
    private BaseProductEntity product;
}