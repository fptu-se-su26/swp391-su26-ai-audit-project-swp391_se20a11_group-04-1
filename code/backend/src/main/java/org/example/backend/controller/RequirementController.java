package org.example.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.service.RequirementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requirements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For local frontend development
public class RequirementController {

    private final RequirementService requirementService;

    @PostMapping
    public ResponseEntity<RequirementResponseDTO> createRequirement(@Valid @RequestBody RequirementRequestDTO requestDTO) {
        RequirementResponseDTO responseDTO = requirementService.createRequirement(requestDTO);
        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<RequirementResponseDTO>> getAllRequirements() {
        return ResponseEntity.ok(requirementService.getAllRequirements());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RequirementResponseDTO> getRequirementById(@PathVariable Long id) {
        return ResponseEntity.ok(requirementService.getRequirementById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RequirementResponseDTO> updateRequirement(
            @PathVariable Long id,
            @Valid @RequestBody RequirementRequestDTO requestDTO) {
        return ResponseEntity.ok(requirementService.updateRequirement(id, requestDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequirement(@PathVariable Long id) {
        requirementService.deleteRequirement(id);
        return ResponseEntity.noContent().build();
    }
}
