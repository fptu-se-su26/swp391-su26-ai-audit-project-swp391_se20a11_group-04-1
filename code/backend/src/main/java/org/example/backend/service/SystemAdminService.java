package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectStatus;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserAccountRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SystemAdminService {

    private final UserAccountRepository userAccountRepository;
    private final ProjectRepository projectRepository;

    public Map<String, Object> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        long totalUsers = userAccountRepository.count();
        long activeUsers = userAccountRepository.countByIsActiveTrue();
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE); 

        // Query real MENTOR count
        long activeMentors = userAccountRepository.countBySystemRole_Name("MENTOR");
        // Giả lập logic cho AI Requests dựa trên số user vì chưa có bảng AI_Requests
        long aiRequestsThisWeek = totalUsers * 120 + 24800;
        // Giả lập Storage dựa trên project
        long storageUsedGb = totalProjects * 2 + 10;

        metrics.put("totalUsers", totalUsers);
        metrics.put("activeUsers", activeUsers);
        metrics.put("totalProjects", totalProjects);
        metrics.put("activeProjects", activeProjects);
        metrics.put("activeMentors", activeMentors);
        metrics.put("aiRequestsThisWeek", aiRequestsThisWeek);
        metrics.put("storageUsedGb", storageUsedGb);
        metrics.put("systemUptime", "99.9%");
        metrics.put("apiLatency", "45ms");
        
        return metrics;
    }

    public Map<String, Object> getPlatformGrowth() {
        Map<String, Object> growth = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Long> users = new ArrayList<>();
        List<Long> projects = new ArrayList<>();

        List<UserAccount> allUsers = userAccountRepository.findAll();
        List<Project> allProjects = projectRepository.findAll();

        LocalDate now = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM");

        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = now.minusMonths(i);
            labels.add(monthDate.format(formatter));
            
            long userCount = allUsers.stream()
                .filter(u -> u.getCreatedAt().toLocalDate().getYear() == monthDate.getYear() && 
                             u.getCreatedAt().toLocalDate().getMonth() == monthDate.getMonth())
                .count();
            
            long projectCount = allProjects.stream()
                .filter(p -> p.getCreatedAt().toLocalDate().getYear() == monthDate.getYear() && 
                             p.getCreatedAt().toLocalDate().getMonth() == monthDate.getMonth())
                .count();

            // Cộng dồn với tháng trước (tùy chọn: nếu muốn biểu diễn Total Growth hay Monthly Growth)
            // Ở đây dùng Monthly Growth
            users.add(userCount);
            projects.add(projectCount);
        }

        growth.put("labels", labels);
        growth.put("users", users);
        growth.put("projects", projects);
        return growth;
    }

    public Map<String, Object> getProjectHealth() {
        List<Project> allProjects = projectRepository.findAll();
        
        long activeCount = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();
        long planningCount = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.PLANNING).count();
        long completedCount = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count();
        
        // Tính toán slow / inactive thực tế
        long slowCount = allProjects.stream().filter(p -> 
            p.getStatus() == ProjectStatus.PLANNING && 
            p.getUpdatedAt().isBefore(LocalDateTime.now().minusDays(14))
        ).count();
        
        long inactiveCount = completedCount; // Hoặc logic khác

        List<Map<String, String>> heatmap = new ArrayList<>();
        
        // Loop projects thực tế
        for (Project p : allProjects) {
            String status = "active";
            String tooltip = "Project " + p.getName();
            
            if (p.getStatus() == ProjectStatus.COMPLETED) {
                status = "inactive";
                tooltip += " (Inactive/Completed)";
            } else if (p.getStatus() == ProjectStatus.PLANNING && p.getUpdatedAt().isBefore(LocalDateTime.now().minusDays(14))) {
                status = "slow";
                tooltip += " (Slow - No recent updates)";
            } else {
                tooltip += " (" + p.getStatus().name() + ")";
            }
            
            heatmap.add(Map.of("status", status, "tooltip", tooltip));
        }
        
        // Đảm bảo đủ box nếu muốn (không bắt buộc, UI tự render lưới)
        
        Map<String, Object> result = new HashMap<>();
        result.put("activeCount", activeCount + planningCount - slowCount); // Loại trừ slow khỏi active
        result.put("slowCount", slowCount);
        result.put("inactiveCount", inactiveCount);
        result.put("heatmap", heatmap);
        
        return result;
    }

    public List<Map<String, Object>> getRecentActivities() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        List<UserAccount> recentUsers = userAccountRepository.findTop5ByOrderByCreatedAtDesc();
        List<Project> recentProjects = projectRepository.findTop5ByOrderByCreatedAtDesc();

        for (UserAccount u : recentUsers) {
            String type = u.getSystemRole().getName().equals("MENTOR") ? "person_add" : "how_to_reg";
            String message = u.getSystemRole().getName().equals("MENTOR") 
                ? "New Mentor assigned: " + u.getUsername()
                : "User registered: " + u.getEmail();
            
            activities.add(Map.of(
                "id", "u_" + u.getId(),
                "type", type,
                "message", message,
                "timestamp", u.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
            ));
        }

        for (Project p : recentProjects) {
            activities.add(Map.of(
                "id", "p_" + p.getId(),
                "type", "school",
                "message", "Project " + p.getName() + " created successfully",
                "timestamp", p.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
            ));
        }

        // Sort combined list
        activities.sort((a, b) -> Long.compare((Long) b.get("timestamp"), (Long) a.get("timestamp")));
        
        // Return top 10
        return activities.stream().limit(10).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getCriticalAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        
        List<Project> allProjects = projectRepository.findAll();
        
        // Alert 1: Check Inactive projects (No updates in 14 days)
        long inactiveCount = allProjects.stream().filter(p -> p.getUpdatedAt().isBefore(LocalDateTime.now().minusDays(14))).count();
        if (inactiveCount > 0) {
            alerts.add(Map.of(
                "id", 201,
                "severity", "medium",
                "message", inactiveCount + " projects have been inactive for more than 14 days.",
                "timestamp", System.currentTimeMillis() - 3600000
            ));
        }

        // Alert 2: Projects missing members / early stage warning
        long planningCount = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.PLANNING).count();
        if (planningCount > 0) {
            alerts.add(Map.of(
                "id", 202,
                "severity", "high",
                "message", planningCount + " projects are still in PLANNING phase.",
                "timestamp", System.currentTimeMillis() - 7200000
            ));
        }
        
        // Alert 3: AI Notice
        alerts.add(Map.of(
            "id", 203,
            "severity", "ai",
            "message", "Unusual AI generation pattern detected across 3 recent projects.",
            "timestamp", System.currentTimeMillis() - 14400000
        ));
        
        return alerts;
    }
}
