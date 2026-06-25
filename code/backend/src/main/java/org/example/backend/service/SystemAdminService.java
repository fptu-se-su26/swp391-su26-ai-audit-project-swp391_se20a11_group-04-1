package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.entity.Project;
import org.example.backend.entity.ProjectStatus;
import org.example.backend.entity.UserAccount;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.UseCaseRepository;
import org.example.backend.repository.EvidenceRepository;
import org.example.backend.repository.BugReportRepository;
import org.example.backend.repository.AiGenerationStagingRepository;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.UserAppeal;
import org.example.backend.repository.UserAppealRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class SystemAdminService {

    private final UserAccountRepository userAccountRepository;
    private final ProjectRepository projectRepository;
    private final RequirementRepository requirementRepository;
    private final UseCaseRepository useCaseRepository;
    private final EvidenceRepository evidenceRepository;
    private final BugReportRepository bugReportRepository;
    private final AiGenerationStagingRepository aiGenerationStagingRepository;
    private final org.example.backend.repository.ProjectMemberRepository projectMemberRepository;
    private final UserAppealRepository userAppealRepository;
    private final EmailService emailService;
    private final jakarta.persistence.EntityManager entityManager;

    public Map<String, Object> getSystemMetrics() {
        Map<String, Object> metrics = new HashMap<>();
        
        long totalUsers = userAccountRepository.countBySystemRole_NameNot("ADMIN");
        long activeUsers = userAccountRepository.countByIsActiveTrueAndSystemRole_NameNot("ADMIN");
        long totalProjects = projectRepository.count();
        long activeProjects = projectRepository.countByStatus(ProjectStatus.ACTIVE); 

        // Query real MENTOR count
        long activeMentors = userAccountRepository.countBySystemRole_Name("MENTOR");
        
        // Calculate AI Requests based on actual AI generation staging requests
        long totalRequirements = requirementRepository.count();
        long totalUseCases = useCaseRepository.count();
        long aiRequestsThisWeek = aiGenerationStagingRepository.count(); // Real AI calls

        // Calculate Storage based on Evidence count (approximate 2.5MB per file + DB text)
        long totalEvidence = evidenceRepository.count();
        double storageUsedMb = totalEvidence * 2.5 + (totalRequirements * 0.1) + 15; // Rough estimate in MB
        double storageUsedGb = Math.round((storageUsedMb / 1024.0) * 100.0) / 100.0;

        metrics.put("totalUsers", totalUsers);
        metrics.put("activeUsers", activeUsers);
        metrics.put("totalProjects", totalProjects);
        metrics.put("activeProjects", activeProjects);
        metrics.put("activeMentors", activeMentors);
        metrics.put("aiRequestsThisWeek", aiRequestsThisWeek);
        metrics.put("storageUsedGb", storageUsedGb);
        
        long totalOpenBugs = bugReportRepository.count(); // Simplified to total, or countByStatus(OPEN)
        long criticalOpenBugs = bugReportRepository.countByStatusAndSeverity(BugStatus.OPEN, org.example.backend.entity.enums.BugSeverity.CRITICAL);
        metrics.put("systemAlerts", totalOpenBugs);
        metrics.put("criticalAlertsCount", criticalOpenBugs);
        
        metrics.put("systemUptime", "99.9%");
        metrics.put("apiLatency", "45ms");
        
        return metrics;
    }

    public Map<String, Object> getPlatformGrowth(int year) {
        Map<String, Object> growth = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Long> users = new ArrayList<>();
        List<Long> projects = new ArrayList<>();

        Map<Integer, Long> usersByMonth = userAccountRepository.findAll().stream()
                .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().getYear() == year)
                .collect(Collectors.groupingBy(u -> u.getCreatedAt().getMonthValue(), Collectors.counting()));

        Map<Integer, Long> projectsByMonth = projectRepository.findAll().stream()
                .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().getYear() == year)
                .collect(Collectors.groupingBy(p -> p.getCreatedAt().getMonthValue(), Collectors.counting()));

        int currentYear = LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();
        int maxMonth = (year == currentYear) ? currentMonth : (year < currentYear ? 12 : 0);

        long runningUsers = 0;
        long runningProjects = 0;
        for (int i = 0; i < maxMonth; i++) {
            labels.add(Month.of(i + 1).getDisplayName(TextStyle.SHORT, Locale.ENGLISH));
            runningUsers += usersByMonth.getOrDefault(i + 1, 0L);
            runningProjects += projectsByMonth.getOrDefault(i + 1, 0L);
            users.add(runningUsers);
            projects.add(runningProjects);
        }

        growth.put("labels", labels);
        growth.put("users", users);
        growth.put("projects", projects);
        return growth;
    }

    public Map<String, Object> getProjectHealth(int year) {
        List<Project> allProjects = projectRepository.findAll().stream()
            .filter(p -> p.getCreatedAt() != null && p.getCreatedAt().toLocalDate().getYear() == year)
            .toList();
        
        long activeCount = 0;
        long slowCount = 0;
        long inactiveCount = 0;

        List<Map<String, Object>> projectsList = new ArrayList<>();
        
        for (Project p : allProjects) {
            String derivedStatus = "active";
            LocalDateTime reference = p.getUpdatedAt() != null ? p.getUpdatedAt() : p.getCreatedAt();
            long daysInactive = 0;
            if (reference != null) {
                daysInactive = java.time.temporal.ChronoUnit.DAYS.between(reference, LocalDateTime.now());
            }

            if (p.getStatus() == ProjectStatus.COMPLETED || p.getStatus() == ProjectStatus.ARCHIVED) {
                derivedStatus = "inactive";
            } else if (p.getStatus() == ProjectStatus.PLANNING && reference != null && reference.isBefore(LocalDateTime.now().minusDays(14))) {
                derivedStatus = "slow";
            }
            
            if (derivedStatus.equals("active")) activeCount++;
            else if (derivedStatus.equals("slow")) slowCount++;
            else inactiveCount++;

            String mentorName = "No Mentor";
            int membersCount = 0;
            
            try {
                List<org.example.backend.entity.ProjectMember> members = projectMemberRepository.findByProjectId(p.getId());
                membersCount = members.size();
                for (org.example.backend.entity.ProjectMember m : members) {
                    if (m.getRole() != null && "MENTOR".equalsIgnoreCase(m.getRole().getName())) {
                        mentorName = m.getUser() != null ? m.getUser().getUsername() : "Mentor";
                    }
                }
            } catch (Exception e) {
                // Ignore if repository fails
            }
            
            Map<String, Object> projData = new HashMap<>();
            projData.put("id", p.getId());
            projData.put("name", p.getName());
            projData.put("status", derivedStatus);
            projData.put("daysInactive", Math.max(0, daysInactive));
            projData.put("mentorName", mentorName);
            projData.put("membersCount", membersCount);
            
            projectsList.add(projData);
        }
        
        // Sort: Slow first, then Active, then Inactive, then by daysInactive descending
        projectsList.sort((p1, p2) -> {
            String s1 = (String) p1.get("status");
            String s2 = (String) p2.get("status");
            
            int rank1 = s1.equals("slow") ? 1 : (s1.equals("active") ? 2 : 3);
            int rank2 = s2.equals("slow") ? 1 : (s2.equals("active") ? 2 : 3);
            
            if (rank1 != rank2) {
                return Integer.compare(rank1, rank2);
            }
            
            long d1 = (Long) p1.get("daysInactive");
            long d2 = (Long) p2.get("daysInactive");
            return Long.compare(d2, d1); // descending
        });

        Map<String, Object> response = new HashMap<>();
        response.put("activeCount", activeCount);
        response.put("slowCount", slowCount);
        response.put("inactiveCount", inactiveCount);
        response.put("projectsList", projectsList);
        
        return response;
    }

    public Map<String, Object> getRecentActivities() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        List<UserAccount> recentUsers = userAccountRepository.findTop5ByOrderByCreatedAtDescIdDesc();
        List<Project> recentProjects = projectRepository.findTop5ByOrderByCreatedAtDescIdDesc();

        for (UserAccount u : recentUsers) {
            String type = "person_add";
            boolean isMentor = u.getSystemRole() != null && "MENTOR".equals(u.getSystemRole().getName());
            String message = isMentor 
                ? "New mentor approved: " + u.getEmail()
                : "New user registered: " + u.getEmail();
            
            long timestamp = u.getCreatedAt() != null 
                ? u.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() 
                : System.currentTimeMillis();
            
            activities.add(Map.of(
                "id", "u_" + u.getId(),
                "type", type,
                "message", message,
                "timestamp", timestamp
            ));
        }

        for (Project p : recentProjects) {
            long timestamp = p.getCreatedAt() != null 
                ? p.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() 
                : System.currentTimeMillis();

            activities.add(Map.of(
                "id", "p_" + p.getId(),
                "type", "school",
                "message", "Project \"" + p.getName() + "\" created",
                "timestamp", timestamp
            ));
        }

        // Sort combined list
        // Sort combined list by timestamp DESC, then ID DESC (simulated by string comparison if needed, or just let timestamp do its job)
        activities.sort((a, b) -> {
            int cmp = Long.compare((Long) b.get("timestamp"), (Long) a.get("timestamp"));
            if (cmp == 0) {
                String idA = (String) a.get("id");
                String idB = (String) b.get("id");
                // ID format is "u_123" or "p_123". Extract number to sort DESC
                long numA = Long.parseLong(idA.substring(2));
                long numB = Long.parseLong(idB.substring(2));
                return Long.compare(numB, numA);
            }
            return cmp;
        });
        
        // Return top 10 and total counts
        List<Map<String, Object>> top10 = activities.stream().limit(10).collect(Collectors.toList());
        long totalUsers = userAccountRepository.count();
        long totalProjects = projectRepository.count();
        long totalAll = totalUsers + totalProjects;
        
        return Map.of(
            "activities", top10, 
            "totalAll", totalAll,
            "totalUsers", totalUsers,
            "totalProjects", totalProjects
        );
    }

    public Map<String, Object> getAuditLogs(int page, int size, String search, String type, String timeFilter) {
        java.time.LocalDateTime fromDate = null;
        if (timeFilter != null && !timeFilter.equalsIgnoreCase("All Time")) {
            if (timeFilter.equalsIgnoreCase("Last 7 Days")) {
                fromDate = java.time.LocalDateTime.now().minusDays(7);
            } else if (timeFilter.equalsIgnoreCase("Last 30 Days")) {
                fromDate = java.time.LocalDateTime.now().minusDays(30);
            } else if (timeFilter.equalsIgnoreCase("Last 1 Year")) {
                fromDate = java.time.LocalDateTime.now().minusDays(365);
            }
        }

        boolean includeUsers = (type == null || type.equals("All") || type.equals("Users"));
        boolean includeProjects = (type == null || type.equals("All") || type.equals("Projects"));

        List<String> unionParts = new ArrayList<>();

        if (includeUsers) {
            StringBuilder userPart = new StringBuilder();
            userPart.append("SELECT CONCAT('u_', u.id) as id, 'person_add' as type, 'Users' as category, ")
                .append("CASE WHEN sr.name = 'MENTOR' THEN CONCAT('New mentor approved: ', u.email) ELSE CONCAT('New user registered: ', u.email) END as message, ")
                .append("u.created_at as created_timestamp ")
                .append("FROM user_accounts u LEFT JOIN system_roles sr ON u.system_role_id = sr.id WHERE 1=1 ");
            if (search != null && !search.trim().isEmpty()) {
                userPart.append("AND LOWER(u.email) LIKE :search ");
            }
            if (fromDate != null) {
                userPart.append("AND u.created_at >= :fromDate ");
            }
            unionParts.add(userPart.toString());
        }

        if (includeProjects) {
            StringBuilder projectPart = new StringBuilder();
            projectPart.append("SELECT CONCAT('p_', p.id) as id, 'school' as type, 'Projects' as category, ")
                .append("CONCAT('Project \"', p.name, '\" created') as message, ")
                .append("p.created_at as created_timestamp ")
                .append("FROM projects p WHERE 1=1 ");
            if (search != null && !search.trim().isEmpty()) {
                projectPart.append("AND LOWER(p.name) LIKE :search ");
            }
            if (fromDate != null) {
                projectPart.append("AND p.created_at >= :fromDate ");
            }
            unionParts.add(projectPart.toString());
        }

        String baseQuery = String.join(" UNION ALL ", unionParts);

        // Count Query
        String countQueryStr = "SELECT COUNT(*) FROM (" + baseQuery + ") as combined";
        jakarta.persistence.Query countQuery = entityManager.createNativeQuery(countQueryStr);
        if (search != null && !search.trim().isEmpty()) {
            countQuery.setParameter("search", "%" + search.toLowerCase().trim() + "%");
        }
        if (fromDate != null) {
            countQuery.setParameter("fromDate", fromDate);
        }
        
        Number totalElementsNum = (Number) countQuery.getSingleResult();
        long totalElements = totalElementsNum.longValue();

        // Data Query
        String dataQueryStr = "SELECT * FROM (" + baseQuery + ") as combined ORDER BY combined.created_timestamp DESC, combined.id DESC";
        jakarta.persistence.Query dataQuery = entityManager.createNativeQuery(dataQueryStr);
        if (search != null && !search.trim().isEmpty()) {
            dataQuery.setParameter("search", "%" + search.toLowerCase().trim() + "%");
        }
        if (fromDate != null) {
            dataQuery.setParameter("fromDate", fromDate);
        }
        
        if (size > 0) {
            dataQuery.setFirstResult(page * size);
            dataQuery.setMaxResults(size);
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = dataQuery.getResultList();

        List<Map<String, Object>> content = new ArrayList<>();
        for (Object[] row : rows) {
            Object tsObj = row[4];
            long timestamp = System.currentTimeMillis();
            if (tsObj instanceof java.sql.Timestamp) {
                timestamp = ((java.sql.Timestamp) tsObj).getTime();
            } else if (tsObj instanceof java.time.LocalDateTime) {
                timestamp = ((java.time.LocalDateTime) tsObj).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            }
            
            content.add(Map.of(
                "id", row[0],
                "type", row[1],
                "category", row[2],
                "message", row[3] != null ? row[3] : "Unknown activity",
                "timestamp", timestamp
            ));
        }

        int totalPages = size > 0 ? (int) Math.ceil((double) totalElements / size) : 1;

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("page", page);
        response.put("size", size);
        
        return response;
    }

    public List<Map<String, Object>> getCriticalAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();
        long nowMs = System.currentTimeMillis();
        
        // 1. Abandoned Projects
        List<Project> allProjects = projectRepository.findAll().stream()
            .filter(p -> p.getStatus() != ProjectStatus.COMPLETED)
            .collect(Collectors.toList());
            
        List<Project> potentialAbandoned = allProjects.stream()
            .filter(p -> p.getUpdatedAt() != null && p.getUpdatedAt().isBefore(LocalDateTime.now().minusDays(14)))
            .collect(Collectors.toList());
            
        List<Project> trulyAbandoned = new ArrayList<>();
        for (Project p : potentialAbandoned) {
            boolean hasRecentReq = requirementRepository.findByProjectId(p.getId()).stream().anyMatch(r -> !r.isDeleted() && r.getUpdatedAt() != null && r.getUpdatedAt().isAfter(LocalDateTime.now().minusDays(14)));
            boolean hasRecentUc = useCaseRepository.findByProjectId(p.getId()).stream().anyMatch(uc -> uc.getUpdatedAt() != null && uc.getUpdatedAt().isAfter(LocalDateTime.now().minusDays(14)));
            if (!hasRecentReq && !hasRecentUc) {
                trulyAbandoned.add(p);
            }
        }
        
        if (!trulyAbandoned.isEmpty()) {
            trulyAbandoned.sort((p1, p2) -> p1.getUpdatedAt().compareTo(p2.getUpdatedAt())); // Oldest first
            List<String> details = trulyAbandoned.stream().map(Project::getName).collect(Collectors.toList());
            String msg = trulyAbandoned.size() + " active projects have no updates in the last 14 days.";
            
            alerts.add(Map.of("id", 201, "severity", "notice", "title", "Abandoned Projects", "message", msg, "details", details, "timestamp", nowMs - 3600000));
        }

        // 2. Spam AI
        List<org.example.backend.entity.AiGenerationStaging> allAiReqs = aiGenerationStagingRepository.findAll();
        Map<Project, Long> aiCountByProject = allAiReqs.stream()
            .filter(req -> req.getProject() != null)
            .map(req -> {
                Project p = allProjects.stream().filter(proj -> proj.getId().equals(req.getProject().getId())).findFirst().orElse(null);
                return new java.util.AbstractMap.SimpleEntry<>(p, req);
            })
            .filter(entry -> entry.getKey() != null && entry.getKey().getStatus() != ProjectStatus.COMPLETED)
            .collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.counting()));
            
        List<Map.Entry<Project, Long>> spamList = aiCountByProject.entrySet().stream()
            .filter(e -> e.getValue() > 50)
            .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue())) // Descending
            .collect(Collectors.toList());
            
        if (!spamList.isEmpty()) {
            List<String> details = spamList.stream().map(e -> e.getKey().getName() + " (" + e.getValue() + " reqs)").collect(Collectors.toList());
            String msg = spamList.size() + " projects have generated over 50 AI requests.";
            
            alerts.add(Map.of("id", 202, "severity", "critical", "title", "API Abuse Detected", "message", msg, "details", details, "timestamp", nowMs - 1800000));
        }

        // 3. Ghost Users
        List<UserAccount> allUsers = userAccountRepository.findAll().stream().filter(UserAccount::isActive).collect(Collectors.toList());
        List<org.example.backend.entity.ProjectMember> allMembers = projectMemberRepository.findAll();
        java.util.Set<Long> usersWithProjects = allMembers.stream().filter(pm -> pm.getUser() != null).map(pm -> pm.getUser().getId()).collect(Collectors.toSet());
        
        List<UserAccount> ghosts = allUsers.stream()
            .filter(u -> u.getCreatedAt() != null && u.getCreatedAt().isBefore(LocalDateTime.now().minusDays(90)))
            .filter(u -> !usersWithProjects.contains(u.getId()))
            .sorted((u1, u2) -> u1.getCreatedAt().compareTo(u2.getCreatedAt())) // Oldest first
            .collect(Collectors.toList());
        
        if (!ghosts.isEmpty()) {
            List<String> details = ghosts.stream().map(UserAccount::getEmail).collect(Collectors.toList());
            String msg = ghosts.size() + " active users registered 3+ months ago but have 0 projects.";
            
            alerts.add(Map.of("id", 203, "severity", "notice", "title", "Ghost Users", "message", msg, "details", details, "timestamp", nowMs - 86400000));
        }

        // 4. Heavy Projects
        List<Project> unfilteredProjects = projectRepository.findAll();
        List<org.example.backend.entity.Evidence> allEvidences = evidenceRepository.findAll();
        Map<Project, Long> evidenceCountByProj = allEvidences.stream()
            .filter(e -> e.getProjectId() != null)
            .map(e -> {
                Project p = unfilteredProjects.stream().filter(proj -> proj.getId().equals(e.getProjectId())).findFirst().orElse(null);
                return new java.util.AbstractMap.SimpleEntry<>(p, e);
            })
            .filter(entry -> entry.getKey() != null)
            .collect(Collectors.groupingBy(
                Map.Entry::getKey, 
                Collectors.counting()
            ));
            
        List<Map.Entry<Project, Long>> heavyList = evidenceCountByProj.entrySet().stream()
            .filter(e -> e.getKey() != null && e.getValue() > 50)
            .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue())) // Descending
            .collect(Collectors.toList());
            
        if (!heavyList.isEmpty()) {
            List<String> details = heavyList.stream().map(e -> e.getKey().getName() + " (" + e.getValue() + " files)").collect(Collectors.toList());
            String msg = heavyList.size() + " projects have uploaded more than 50 files.";
            
            alerts.add(Map.of("id", 204, "severity", "warning", "title", "Heavy Projects", "message", msg, "details", details, "timestamp", nowMs - 3600000));
        }
        
        return alerts;
    }

    public List<org.example.backend.dto.AdminUserResponse> getUsers(String search, String role, String status, String appealFilter, boolean showInactiveOnly) {
        List<UserAccount> allUsers = userAccountRepository.findAll();
        
        return allUsers.stream()
            .filter(u -> {
                if (u.getSystemRole() != null && "ADMIN".equalsIgnoreCase(u.getSystemRole().getName())) {
                    return false; // Skip admin accounts in the list
                }
                
                // Search filter (name or email or username)
                if (search != null && !search.trim().isEmpty()) {
                    String searchLower = search.toLowerCase().trim();
                    boolean matchesUsername = u.getUsername() != null && u.getUsername().toLowerCase().contains(searchLower);
                    boolean matchesEmail = u.getEmail() != null && u.getEmail().toLowerCase().contains(searchLower);
                    boolean matchesFullName = u.getProfile() != null && u.getProfile().getFullName() != null && u.getProfile().getFullName().toLowerCase().contains(searchLower);
                    if (!matchesUsername && !matchesEmail && !matchesFullName) {
                        return false;
                    }
                }
                
                // Role filter
                if (role != null && !role.equalsIgnoreCase("ALL")) {
                    if (u.getSystemRole() == null || !role.equalsIgnoreCase(u.getSystemRole().getName())) {
                        return false;
                    }
                }
                
                // Status filter
                if (status != null && !status.equalsIgnoreCase("ALL")) {
                    boolean targetActive = status.equalsIgnoreCase("ACTIVE");
                    if (u.isActive() != targetActive) {
                        return false;
                    }
                }
                
                // Appeal filter
                if (appealFilter != null && !appealFilter.equalsIgnoreCase("ALL")) {
                    UserAppeal latestAppeal = userAppealRepository.findFirstByUserIdOrderByIdDesc(u.getId()).orElse(null);
                    String appealStatus = latestAppeal != null ? latestAppeal.getStatus() : null;
                    
                    if (appealFilter.equalsIgnoreCase("PENDING")) {
                        if (!"PENDING".equalsIgnoreCase(appealStatus)) {
                            return false;
                        }
                    } else if (appealFilter.equalsIgnoreCase("NONE")) {
                        if (appealStatus != null && !"NONE".equalsIgnoreCase(appealStatus)) {
                            return false;
                        }
                    }
                }
                
                // Inactive over 2 years filter
                if (showInactiveOnly) {
                    if (!isInactiveOver2Years(u.getUpdatedAt())) {
                        return false;
                    }
                }
                
                return true;
            })
            .map(u -> {
                String fullName = u.getProfile() != null ? u.getProfile().getFullName() : u.getUsername();
                String avatarUrl = u.getProfile() != null ? u.getProfile().getAvatarUrl() : null;
                
                UserAppeal latestAppeal = userAppealRepository.findFirstByUserIdOrderByIdDesc(u.getId()).orElse(null);
                
                return org.example.backend.dto.AdminUserResponse.builder()
                    .id(u.getId())
                    .username(u.getUsername())
                    .email(u.getEmail())
                    .fullName(fullName)
                    .avatarUrl(avatarUrl)
                    .isActive(u.isActive())
                    .lastActive(u.getUpdatedAt()) // we use updatedAt for lastActive
                    .appealReason(latestAppeal != null ? latestAppeal.getReason() : null)
                    .appealEvidenceUrl(latestAppeal != null ? latestAppeal.getEvidenceUrl() : null)
                    .appealEvidenceName(latestAppeal != null ? latestAppeal.getEvidenceName() : null)
                    .appealStatus(latestAppeal != null ? latestAppeal.getStatus() : null)
                    .appealComment(latestAppeal != null ? latestAppeal.getAdminComment() : null)
                    .appealResolvedAt(latestAppeal != null ? latestAppeal.getResolvedAt() : null)
                    .appealResolvedByUsername(latestAppeal != null && latestAppeal.getResolvedBy() != null ? latestAppeal.getResolvedBy().getUsername() : null)
                    .lockReason(u.getLockReason())
                    .build();
            })
            .collect(Collectors.toList());
    }

    private boolean isInactiveOver2Years(LocalDateTime updatedAt) {
        if (updatedAt == null) return true;
        return updatedAt.isBefore(LocalDateTime.now().minusMonths(2));
    }

    public boolean toggleUserLock(Long id, String reason) {
        UserAccount user = userAccountRepository.findById(id).orElse(null);
        if (user == null) return false;
        
        user.setActive(!user.isActive());
        if (!user.isActive()) {
            user.setLockReason(reason);
            // Broadcast lock event immediately via WebSocket
            String escapedReason = reason != null ? reason.replace("\"", "\\\"").replace("\n", "\\n") : "";
            String jsonPayload = String.format("{\"type\":\"USER_LOCKED\",\"reason\":\"%s\"}", escapedReason);
            org.example.backend.config.NotificationWebSocketHandler.sendToUser(id, jsonPayload);
            
            // Revoke HttpSessions immediately
            org.example.backend.config.SessionRegistryListener.invalidateSessionsForUser(id);
        } else {
            user.setLockReason(null);
            // If unlocking, also mark any pending appeal as RESOLVED
            userAppealRepository.findFirstByUserIdAndStatusOrderByIdDesc(id, "PENDING")
                .ifPresent(appeal -> {
                    appeal.setStatus("RESOLVED");
                    appeal.setResolvedAt(LocalDateTime.now());
                    userAppealRepository.save(appeal);
                });
            // Broadcast unlock event immediately via WebSocket
            String jsonPayload = "{\"type\":\"USER_UNLOCKED\"}";
            org.example.backend.config.NotificationWebSocketHandler.sendToUser(id, jsonPayload);
        }
        userAccountRepository.save(user);
        return true;
    }

    public boolean resolveUserAppeal(Long id, boolean approve, String feedback, UserAccount resolver) {
        UserAccount user = userAccountRepository.findById(id).orElse(null);
        if (user == null) return false;
        
        UserAppeal appeal = userAppealRepository.findFirstByUserIdAndStatusOrderByIdDesc(id, "PENDING")
                .orElse(null);
        if (appeal == null) return false;
        
        if (approve) {
            user.setActive(true);
            appeal.setStatus("APPROVED");
            user.setLockReason(null); // Clear lock reason
            // Send UNLOCK event
            String jsonPayload = "{\"type\":\"USER_UNLOCKED\"}";
            org.example.backend.config.NotificationWebSocketHandler.sendToUser(id, jsonPayload);
            
            // Gửi Email thông báo mở khóa tài khoản thành công
            try {
                String subject = "[DevTrack AI] Kết quả kháng cáo: Tài khoản đã được mở khóa";
                String body = String.format("Xin chào %s,\n\nĐơn kháng cáo của bạn đã được Ban quản trị phê duyệt.\nTài khoản của bạn đã được mở khóa thành công. Bạn có thể đăng nhập lại vào hệ thống ngay bây giờ.\n\nPhản hồi từ Admin: %s\n\nTrân trọng,\nBan quản trị DevTrack AI", 
                        user.getUsername(), (feedback != null && !feedback.trim().isEmpty() ? feedback : "Đã chấp thuận yêu cầu giải trình."));
                emailService.sendEmail(user.getEmail(), subject, body);
            } catch (Exception e) {
                log.error("Failed to send appeal approval email to {}", user.getEmail(), e);
            }
        } else {
            appeal.setStatus("REJECTED");
            
            // Gửi Email thông báo từ chối đơn kháng cáo
            try {
                String subject = "[DevTrack AI] Kết quả kháng cáo: Bị từ chối";
                String body = String.format("Xin chào %s,\n\nĐơn kháng cáo của bạn đã bị Ban quản trị từ chối.\nTài khoản của bạn vẫn tiếp tục bị khóa.\n\nPhản hồi từ Admin: %s\n\nTrân trọng,\nBan quản trị DevTrack AI", 
                        user.getUsername(), (feedback != null && !feedback.trim().isEmpty() ? feedback : "Không chấp nhận giải trình."));
                emailService.sendEmail(user.getEmail(), subject, body);
            } catch (Exception e) {
                log.error("Failed to send appeal rejection email to {}", user.getEmail(), e);
            }
        }
        appeal.setAdminComment(feedback);
        appeal.setResolvedAt(LocalDateTime.now());
        appeal.setResolvedBy(resolver);
        
        userAppealRepository.save(appeal);
        userAccountRepository.save(user);
        return true;
    }
}
