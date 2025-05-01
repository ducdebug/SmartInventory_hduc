package com.ims.common.entity.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ims.common.config.ClothingSize;
import com.ims.common.entity.BaseProductEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@JsonIgnoreProperties({"slot", "lot"})
@Getter
@Setter
@Entity
@Table(name = "clothing")
public class ClothingProductEntity extends BaseProductEntity {
    private String material;
    @Enumerated(EnumType.STRING)
    private ClothingSize size;

    private String branch;

    @Override
    public boolean isExpired() {
        return false;
    }
}
