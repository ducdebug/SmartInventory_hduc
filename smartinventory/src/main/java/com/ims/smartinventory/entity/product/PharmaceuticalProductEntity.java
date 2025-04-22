package com.ims.smartinventory.entity.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ims.smartinventory.entity.BaseProductEntity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.Map;

@JsonIgnoreProperties({"slot", "lot"})
@Getter
@Setter
@Entity
@Table(name = "pharmaceutical")
public class PharmaceuticalProductEntity extends BaseProductEntity {
    private String brand;
    private String genericName;
    @ElementCollection
    private Map<String, String> activeIngredients;
    private String dosageForm;
    private String strength;
    private Date expirationDate;

    @Override
    public boolean isExpired() {
        return new Date().after(expirationDate);
    }
    @Override
    public Date getExpirationDate() {
        return expirationDate;
    }
}
