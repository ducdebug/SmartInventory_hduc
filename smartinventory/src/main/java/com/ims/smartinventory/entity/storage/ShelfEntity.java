package com.ims.smartinventory.entity.storage;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Table(name = "shelf")
@Getter
@Setter
public class ShelfEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private int height;
    private int width;

    private int slotsPerShelf;

    @ManyToOne
    @JoinColumn(name = "section_id", nullable = false)
    @JsonBackReference
    private SectionEntity section;

    @OneToMany(mappedBy = "shelf", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<SlotShelf> slotShelves;

}
