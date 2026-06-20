package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.service.SystemAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SystemAdminController {

    private final SystemAdminService systemAdminService;

    @GetMapping("/metrics")
    public ResponseEntity<?> getMetrics() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getSystemMetrics()
        ));
    }

    @GetMapping("/growth")
    public ResponseEntity<?> getGrowth() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getPlatformGrowth()
        ));
    }

    @GetMapping("/activities")
    public ResponseEntity<?> getActivities() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getRecentActivities()
        ));
    }

    @GetMapping("/project-health")
    public ResponseEntity<?> getProjectHealth() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getProjectHealth()
        ));
    }

    @GetMapping("/alerts")
    public ResponseEntity<?> getAlerts() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getCriticalAlerts()
        ));
    }
}
