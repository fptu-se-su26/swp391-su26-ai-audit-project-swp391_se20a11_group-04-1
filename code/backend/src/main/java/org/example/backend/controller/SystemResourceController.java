package org.example.backend.controller;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.example.backend.dto.ApiResponse;
import org.example.backend.dto.admin.resource.KafkaStatusResponse;
import org.example.backend.dto.admin.resource.KubernetesStatusResponse;
import org.example.backend.service.SystemResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/resources")
@RequiredArgsConstructor
public class SystemResourceController {

    private final SystemResourceService systemResourceService;

    private <T> ResponseEntity<ApiResponse<T>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
    }

    @GetMapping("/kubernetes")
    public ResponseEntity<ApiResponse<KubernetesStatusResponse>> getKubernetesStatus(HttpSession session) {
        if (session.getAttribute("userId") == null || !"ADMIN".equals(session.getAttribute("userRole"))) return unauthorized();
        KubernetesStatusResponse response = systemResourceService.getKubernetesStatus();
        return ResponseEntity.ok(ApiResponse.success(response, "Success"));
    }

    @GetMapping("/kafka")
    public ResponseEntity<ApiResponse<KafkaStatusResponse>> getKafkaStatus(HttpSession session) {
        if (session.getAttribute("userId") == null || !"ADMIN".equals(session.getAttribute("userRole"))) return unauthorized();
        KafkaStatusResponse response = systemResourceService.getKafkaStatus();
        return ResponseEntity.ok(ApiResponse.success(response, "Success"));
    }
}
