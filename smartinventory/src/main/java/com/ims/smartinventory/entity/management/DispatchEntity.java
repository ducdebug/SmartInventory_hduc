package com.ims.smartinventory.entity.management;

import com.ims.smartinventory.entity.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.Date;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "dispatch")
public class DispatchEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date exportDate;

    @Enumerated(EnumType.STRING)
    private DispatchStatus status;
    
    @Column(length = 500)
    private String rejectionReason;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    
    private String buyerId;

    @OneToMany(mappedBy = "dispatch", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DispatchItemEntity> items;
    
    @PrePersist
    protected void onCreate() {
        createdAt = new Date();
        if (status == null) {
            status = DispatchStatus.PENDING;
        }
    }
    
    public void setStatus(DispatchStatus newStatus) {
        this.status = newStatus;
        
        // Update timestamps based on status changes
        if (newStatus == DispatchStatus.COMPLETED) {
            this.completedAt = new Date();
        }
    }
}