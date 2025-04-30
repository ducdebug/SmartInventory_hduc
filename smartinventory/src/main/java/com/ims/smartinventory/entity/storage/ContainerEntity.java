package com.ims.smartinventory.entity.storage;

import com.ims.smartinventory.config.BoxSize;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "containers")
public class ContainerEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    private BoxSize size;

    private Integer maxQuantity;
    private Integer currentQuantity;

//    @ManyToOne
//    @JoinColumn(name = "slot_section_id")
//    private SlotSection slotSection;
//
//    @ManyToOne
//    @JoinColumn(name = "slot_shelf_id")
//    private SlotShelf slotShelf;
//
//    @OneToMany(mappedBy = "container", cascade = CascadeType.ALL)
//    private List<BaseProductEntity> products;

    public int getMaxQuantity() {
        if (size == BoxSize.BIG) return 25;
        if (size == BoxSize.MEDIUM) return 15;
        if (size == BoxSize.SMALL) return 10;
        return 5;
    }

    public boolean hasAvailableCapacity(int quantityToAdd) {
        if (maxQuantity == null) {
            return true;
        }
        return (currentQuantity + quantityToAdd) <= maxQuantity;
    }

    public boolean isEmpty() {
        return currentQuantity == null || currentQuantity == 0;
    }

    public void addProducts(int quantity) {
        if (currentQuantity == null) {
            currentQuantity = 0;
        }
        this.currentQuantity += quantity;
    }

    public void removeProducts(int quantity) {
        if (currentQuantity == null || currentQuantity < quantity) {
            throw new IllegalStateException("Cannot remove more products than are in the container");
        }
        this.currentQuantity -= quantity;
    }
}