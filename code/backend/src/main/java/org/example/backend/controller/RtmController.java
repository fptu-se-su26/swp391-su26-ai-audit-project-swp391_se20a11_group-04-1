package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.RtmMatrixResponse;
import org.example.backend.dto.RtmSnapshotRequest;
import org.example.backend.dto.RtmSnapshotResponse;
import org.example.backend.dto.RtmSummaryResponse;
import org.example.backend.exception.CustomException;
import org.example.backend.service.RtmService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/rtm")
@RequiredArgsConstructor
public class RtmController {

    private final RtmService rtmService;

    @GetMapping
    public ResponseEntity<ApiResponse<RtmMatrixResponse>> getMatrix(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        RtmMatrixResponse response = rtmService.getMatrix(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Requirement traceability matrix loaded"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<RtmSummaryResponse>> getSummary(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        RtmSummaryResponse response = rtmService.getSummary(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "RTM summary loaded"));
    }

    @PostMapping("/snapshots")
    public ResponseEntity<ApiResponse<RtmSnapshotResponse>> saveSnapshot(
            @PathVariable Long projectId,
            @RequestBody(required = false) RtmSnapshotRequest request,
            HttpSession session) {
        Long userId = requireUser(session);
        Long sprintId = request != null ? request.sprintId() : null;
        RtmSnapshotResponse response = rtmService.saveSnapshot(projectId, sprintId, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "RTM snapshot saved"));
    }

    @GetMapping("/snapshots")
    public ResponseEntity<ApiResponse<List<RtmSnapshotResponse>>> getSnapshots(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        List<RtmSnapshotResponse> response = rtmService.getSnapshots(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "RTM snapshots loaded"));
    }

    @PutMapping("/migrate-snapshots")
    public ResponseEntity<ApiResponse<String>> migrateSnapshots() {
        rtmService.migrateSnapshotsToProjectScopedCode();
        return ResponseEntity.ok(ApiResponse.success("Success", "Historical RTM snapshots migrated successfully."));
    }

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please log in to use the traceability matrix.", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }
}
