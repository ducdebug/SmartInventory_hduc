package com.ims.smartinventory.entity.management;

import com.ims.smartinventory.config.TransactionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@Table(name = "inventory_transaction")
public class InventoryTransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    private TransactionType type;

    private Date timestamp;

    private String related_dispatch_lot_id;
}
