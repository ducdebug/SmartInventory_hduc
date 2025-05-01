package com.ims.common.entity.storage;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.ims.common.entity.BaseProductEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "slot_section")
public class SlotSection extends SlotEntity {

    private int xPosition;
    private int yPosition;

    @ManyToOne
    @JoinColumn(name = "section_id", nullable = false)
    @JsonBackReference
    private SectionEntity section;

    @OneToOne
    @JsonManagedReference
    @JoinColumn(name = "product_id", unique = true)
    private BaseProductEntity product;
}