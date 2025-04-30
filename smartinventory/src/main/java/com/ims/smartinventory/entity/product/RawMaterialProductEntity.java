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
@Table(name = "rawmaterial")
public class RawMaterialProductEntity extends BaseProductEntity {
    private String materialType;
    private String unitOfMeasurement;
    private String supplier;
    private Date deliveryDate;
    private Date expirationDate;

    @Override
    public boolean isExpired() {
        return expirationDate != null && new Date().after(expirationDate);
    }

    @Override
    public Date getExpirationDate() {
        return expirationDate;
    }
}
