package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.entity.mongo.GraphEdge;
import org.example.backend.entity.mongo.GraphNode;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.service.ManualArchitectureService;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/architecture/projects/{projectId}/manual")
@RequiredArgsConstructor
public class ManualArchitectureController {

    private final ManualArchitectureService manualService;
    private final ProjectMemberRepository projectMemberRepository;
    private final StringRedisTemplate redisTemplate;

    private void requireMember(Long projectId, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new CustomException("Please login to continue", HttpStatus.UNAUTHORIZED);
        }
        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
    }

    private void clearCache(Long projectId) {
        String cacheKey = String.format("arch:graph:%d:all", projectId);
        redisTemplate.delete(cacheKey);
    }

    @PostMapping("/nodes")
    public ResponseEntity<ApiResponse<Void>> addNode(
            @PathVariable Long projectId,
            @RequestBody GraphNode node,
            HttpSession session) {
        requireMember(projectId, session);
        manualService.addNode(projectId, node);
        clearCache(projectId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã thêm phần tử thủ công thành công"));
    }

    @PutMapping("/nodes/{nodeId}")
    public ResponseEntity<ApiResponse<Void>> editNode(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            @RequestBody GraphNode node,
            HttpSession session) {
        requireMember(projectId, session);
        manualService.editNode(projectId, nodeId, node);
        clearCache(projectId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã cập nhật phần tử thủ công thành công"));
    }

    @DeleteMapping("/nodes/{nodeId}")
    public ResponseEntity<ApiResponse<Void>> deleteNode(
            @PathVariable Long projectId,
            @PathVariable String nodeId,
            HttpSession session) {
        requireMember(projectId, session);
        manualService.deleteNode(projectId, nodeId);
        clearCache(projectId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa phần tử thủ công thành công"));
    }

    @PostMapping("/edges")
    public ResponseEntity<ApiResponse<Void>> addEdge(
            @PathVariable Long projectId,
            @RequestBody GraphEdge edge,
            HttpSession session) {
        requireMember(projectId, session);
        manualService.addEdge(projectId, edge);
        clearCache(projectId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã thêm kết nối thủ công thành công"));
    }

    @DeleteMapping("/edges/{edgeId}")
    public ResponseEntity<ApiResponse<Void>> deleteEdge(
            @PathVariable Long projectId,
            @PathVariable String edgeId,
            HttpSession session) {
        requireMember(projectId, session);
        manualService.deleteEdge(projectId, edgeId);
        clearCache(projectId);
        return ResponseEntity.ok(ApiResponse.success(null, "Đã xóa kết nối thủ công thành công"));
    }
}
