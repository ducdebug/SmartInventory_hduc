package com.ims.smartinventory.controller;

import com.ims.common.entity.storage.SectionEntity;
import com.ims.smartinventory.service.SectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        try {
            List<?> response = sectionService.getSectionChildren(sectionId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @PutMapping("/{sectionId}/terminate")
    public ResponseEntity<SectionEntity> terminateSection(@PathVariable String sectionId) {
        SectionEntity terminatedSection = sectionService.terminateSection(sectionId);
        return ResponseEntity.ok(terminatedSection);
    }

    @PutMapping("/{sectionId}/activate")
    public ResponseEntity<SectionEntity> activateSection(@PathVariable String sectionId) {
        SectionEntity activatedSection = sectionService.activateSection(sectionId);
        return ResponseEntity.ok(activatedSection);
    }
}
