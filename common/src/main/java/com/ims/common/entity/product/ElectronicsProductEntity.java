package com.ims.common.entity.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ims.common.entity.BaseProductEntity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@JsonIgnoreProperties({"slot", "lot"})
@Getter
@Setter
@Entity
@Table(name = "electronics")
public class ElectronicsProductEntity extends BaseProductEntity {
    private String brand;
    private String type;
    private String warrantyPeriod;

    @ElementCollection
    private Map<String, String> specifications;

    @Override
    public boolean isExpired() {
        return false;
    }
}
