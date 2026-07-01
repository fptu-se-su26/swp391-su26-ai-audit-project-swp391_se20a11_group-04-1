package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.entity.ArchitectureSync;
import org.example.backend.entity.mongo.ArchitectureGraph;
import org.example.backend.exception.CustomException;
import org.example.backend.service.ArchitectureSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/architecture/projects/{projectId}")
@RequiredArgsConstructor
@org.example.backend.annotation.PreAuthorizeProjectMember
public class ArchitectureController {

    private final ArchitectureSyncService architectureSyncService;

    private Long requireUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        return userId;
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<ArchitectureSync>> triggerSync(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        ArchitectureSync syncStatus = architectureSyncService.triggerSync(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(syncStatus, "Đã bắt đầu tiến trình phân tích kiến trúc mã nguồn"));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<ArchitectureSync>> getSyncStatus(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        ArchitectureSync syncStatus = architectureSyncService.getSyncStatus(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(syncStatus, "Lấy trạng thái phân tích kiến trúc thành công"));
    }

    @GetMapping("/graph")
    public ResponseEntity<ApiResponse<ArchitectureGraph>> getGraphData(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        ArchitectureGraph graph = architectureSyncService.getGraphData(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(graph, "Lấy dữ liệu đồ thị kiến trúc thành công"));
    }

    @PutMapping("/positions")
    public ResponseEntity<ApiResponse<Void>> saveNodePositions(
            @PathVariable Long projectId,
            @RequestBody java.util.Map<String, org.example.backend.entity.mongo.ArchitectureGraph.Position2D> positions,
            HttpSession session) {
        Long userId = requireUser(session);
        architectureSyncService.saveNodePositions(projectId, positions, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Lưu vị trí các node thành công"));
    }

    @DeleteMapping("/positions")
    public ResponseEntity<ApiResponse<Void>> resetNodePositions(
            @PathVariable Long projectId,
            HttpSession session) {
        Long userId = requireUser(session);
        architectureSyncService.resetNodePositions(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Khôi phục bố cục mặc định thành công"));
    }
}
