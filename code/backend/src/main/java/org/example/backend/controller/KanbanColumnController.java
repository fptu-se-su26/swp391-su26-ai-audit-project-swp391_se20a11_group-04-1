package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.KanbanColumnRequest;
import org.example.backend.dto.KanbanColumnResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.KanbanColumnService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/kanban-columns")
@RequiredArgsConstructor
public class KanbanColumnController {

    private final KanbanColumnService kanbanColumnService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<KanbanColumnResponse>>> getColumns(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(kanbanColumnService.getProjectColumns(projectId, userId), "Kanban columns retrieved"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<KanbanColumnResponse>> createColumn(
            @PathVariable Long projectId,
            @RequestBody KanbanColumnRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(kanbanColumnService.createColumn(projectId, request, userId), "Kanban column created"));
    }

    @PutMapping("/{columnId}")
    public ResponseEntity<ApiResponse<KanbanColumnResponse>> updateColumn(
            @PathVariable Long projectId,
            @PathVariable Long columnId,
            @RequestBody KanbanColumnRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        return ResponseEntity.ok(ApiResponse.success(kanbanColumnService.updateColumn(projectId, columnId, request, userId), "Kanban column updated"));
    }

    @DeleteMapping("/{columnId}")
    public ResponseEntity<ApiResponse<Void>> archiveColumn(
            @PathVariable Long projectId,
            @PathVariable Long columnId,
            HttpSession session) {
        Long userId = requireUser(session);
        kanbanColumnService.archiveColumn(projectId, columnId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Kanban column archived"));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
