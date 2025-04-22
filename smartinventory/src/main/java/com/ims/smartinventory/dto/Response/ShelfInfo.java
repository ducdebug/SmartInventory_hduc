package com.ims.smartinventory.dto.Response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ShelfInfo {
    private String id;
    private int width;
    private int height;
    private int slotsPerShelf;
}

