package com.chitmanager.backend.controllers;

import com.chitmanager.backend.dto.CollectionDTO;
import com.chitmanager.backend.services.CollectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/collections")
public class CollectionController {

    @Autowired
    private CollectionService collectionService;

    @PostMapping
    public ResponseEntity<CollectionDTO> recordCollection(@RequestBody CollectionDTO collectionDTO) {
        return ResponseEntity.ok(collectionService.recordCollection(collectionDTO));
    }

    @GetMapping("/chit/{chitGroupId}/month/{forMonth}")
    public ResponseEntity<List<CollectionDTO>> getCollectionsForChitAndMonth(
            @PathVariable Long chitGroupId, @PathVariable Integer forMonth) {
        return ResponseEntity.ok(collectionService.getCollectionsForChitAndMonth(chitGroupId, forMonth));
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<CollectionDTO>> getCollectionsForMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(collectionService.getCollectionsForMember(memberId));
    }

    @GetMapping("/chit/{chitGroupId}")
    public ResponseEntity<List<CollectionDTO>> getCollectionsForChit(@PathVariable Long chitGroupId) {
        return ResponseEntity.ok(collectionService.getCollectionsForChit(chitGroupId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCollection(@PathVariable Long id) {
        collectionService.deleteCollection(id);
        return ResponseEntity.ok().build();
    }
}
