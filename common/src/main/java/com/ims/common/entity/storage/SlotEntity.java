package com.ims.common.entity.storage;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class SlotEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private boolean occupied;

    public boolean isAvailable() {
        return !occupied;
    }
}
