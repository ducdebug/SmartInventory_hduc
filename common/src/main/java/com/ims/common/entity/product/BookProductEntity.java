package com.ims.common.entity.product;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ims.common.entity.BaseProductEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@JsonIgnoreProperties({"slot", "lot"})
@Getter
@Setter
@Entity
@Table(name = "book")
public class BookProductEntity extends BaseProductEntity {
    private String author;
    private String publisher;
    private Date publicationDate;
    private String genre;
    private String description;

    @Override
    public boolean isExpired() {
        return false;
    }
}
