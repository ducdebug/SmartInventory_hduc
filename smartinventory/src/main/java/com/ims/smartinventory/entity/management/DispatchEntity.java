package com.ims.smartinventory.entity.management;

import com.ims.smartinventory.config.DispatchStatus;
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

    @Enumerated(EnumType.STRING)
    private DispatchStatus status;
    
    @Column(length = 500)
    private String rejectionReason;
    
    @Temporal(TemporalType.TIMESTAMP)
    private Date completedAt;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

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
        
        if (newStatus == DispatchStatus.ACCEPTED) {
            this.completedAt = new Date();
        }
    }
    
    /**
     * Get the buyer ID from the user entity
     * @return the buyer ID
     */
    public String getBuyerId() {
        return user != null ? user.getId() : null;
    }
}