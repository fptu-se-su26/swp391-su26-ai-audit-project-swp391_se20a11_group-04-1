package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.service.SystemAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public ResponseEntity<?> getGrowth(@RequestParam(defaultValue = "2026") int year) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getPlatformGrowth(year)
        ));
    }

    @GetMapping("/activities")
    public ResponseEntity<?> getActivities() {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getRecentActivities()
        ));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "All") String type,
            @RequestParam(defaultValue = "All Time") String timeFilter) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getAuditLogs(page, size, search, type, timeFilter)
        ));
    }

    @GetMapping("/project-health")
    public ResponseEntity<?> getProjectHealth(@RequestParam(defaultValue = "2026") int year) {
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", systemAdminService.getProjectHealth(year)
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
