package com.ims.smartinventory.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.ims.smartinventory.entity.storage.SectionEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "warehouse")
public class WarehouseEntity {
    @Id
    @Column(name = "id")
    private String id;

    private int totalSlots;
    private int usedSlots;

    @OneToMany(mappedBy = "warehouse", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<SectionEntity> sections;

    public boolean hasAvailableSlots(int requiredSlots) {
        return (totalSlots - usedSlots) >= requiredSlots;
    }
}
