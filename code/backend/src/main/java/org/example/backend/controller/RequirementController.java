package org.example.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.dto.RequirementRequestDTO;
import org.example.backend.dto.RequirementResponseDTO;
import org.example.backend.service.RequirementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.backend.exception.CustomException;
import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/requirements")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For local frontend development
public class RequirementController {

    private final RequirementService requirementService;

    @PostMapping
    public ResponseEntity<RequirementResponseDTO> createRequirement(@Valid @RequestBody RequirementRequestDTO requestDTO, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Vui lòng đăng nhập để thực hiện thao tác này.", HttpStatus.UNAUTHORIZED);
        }
        RequirementResponseDTO responseDTO = requirementService.createRequirement(requestDTO, userId);
        return new ResponseEntity<>(responseDTO, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<PaginatedResponse<RequirementResponseDTO>> getRequirements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String tag) {
        return ResponseEntity.ok(requirementService.getRequirements(page, size, projectId, status, priority, tag));
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
