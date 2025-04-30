package com.ims.smartinventory.entity.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ims.smartinventory.entity.BaseProductEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@JsonIgnoreProperties({"slot", "lot"})
@Getter
@Setter
@Entity
@Table(name = "cosmetic")
public class CosmeticProductEntity extends BaseProductEntity {
    private String brand;
    private String category;
    private Date expirationDate;
    private double volume;

    @Override
    public boolean isExpired() {
        return new Date().after(expirationDate);
    }

    @Override
    public Date getExpirationDate() {
        return expirationDate;
    }
}
