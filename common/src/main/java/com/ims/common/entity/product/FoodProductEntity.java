package com.ims.common.entity.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ims.common.entity.BaseProductEntity;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@JsonIgnoreProperties({"slot", "lot"})
@Getter
@Setter
@Entity
@Table(name = "food")
public class FoodProductEntity extends BaseProductEntity {
    private Date expirationDate;
    @ElementCollection
    private List<String> ingredients;
    private double weight;

    @Override
    public boolean isExpired() {
        return new Date().after(expirationDate);
    }

    @Override
    public Date getExpirationDate() {
        return expirationDate;
    }
}
