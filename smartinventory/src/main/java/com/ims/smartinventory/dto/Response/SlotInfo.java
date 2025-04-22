package com.ims.smartinventory.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SlotInfo {
    private String id;
    private int x;
    private int y;
    private boolean occupied;
}

