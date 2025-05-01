package com.ims.common.entity.storage;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.ims.common.entity.WarehouseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "section")
@Getter
@Setter
public class SectionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "section", orphanRemoval = true)
    @JsonManagedReference
    private List<ShelfEntity> shelves;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "section", orphanRemoval = true)
    @JsonManagedReference
    private List<StorageConditionEntity> storageConditions;

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "section", orphanRemoval = true)
    @Column(nullable = true)
    private List<SlotSection> slotSections;

    private int numShelves;
    private int y_slot;
    private int x;
    private int y;
    @ManyToOne
    @JoinColumn(name = "warehouse_id")
    @JsonBackReference
    private WarehouseEntity warehouse;

    public int getTotalSlots() {
        return (numShelves > 0 && shelves != null && !shelves.isEmpty())
                ? numShelves * shelves.getFirst().getHeight() * 6
                : 6 * y_slot;
    }
}
