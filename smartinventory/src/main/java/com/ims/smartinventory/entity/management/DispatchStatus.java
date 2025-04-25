package com.ims.smartinventory.entity.management;

/**
 * Enum representing the possible statuses of a dispatch request
 */
public enum DispatchStatus {
    /**
     * The dispatch request has been created but not yet processed
     */
    PENDING,
    
    /**
     * The dispatch request has been accepted by an admin and is being processed
     */
    ACCEPTED,
    
    /**
     * The dispatch request has been rejected by an admin
     */
    REJECTED,
    
    /**
     * The dispatch request has been fully processed and completed
     */
    COMPLETED
}