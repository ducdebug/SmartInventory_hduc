package com.ims.smartinventory.controller;

import com.ims.smartinventory.service.SectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/section")
public class SectionController {
    private final SectionService sectionService;

    public SectionController(SectionService sectionService) {
        this.sectionService = sectionService;
    }

    @GetMapping("/{sectionId}/children")
    public ResponseEntity<List<?>> getSectionChildren(@PathVariable String sectionId) {
        List<?> response = sectionService.getSectionChildren(sectionId);
        return ResponseEntity.ok(response);
    }
}
