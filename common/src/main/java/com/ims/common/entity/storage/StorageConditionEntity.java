package com.ims.common.entity.storage;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.ims.common.config.StorageConditions;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "storage_condition")
public class StorageConditionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StorageConditions conditionType;

    private double minValue;
    private double maxValue;
    private String unit;

    @ManyToOne
    @JoinColumn(name = "section_id", nullable = false)
    @JsonBackReference
    private SectionEntity section;
}
