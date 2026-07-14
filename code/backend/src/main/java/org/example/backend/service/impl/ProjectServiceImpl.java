package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ProjectClosureCheckResponse;
import org.example.backend.dto.ProjectCloseRequest;
import org.example.backend.dto.ProjectReopenRequest;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.ProjectDashboardResponse;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.entity.*;
import org.example.backend.config.SessionRegistryListener;
import org.example.backend.exception.CustomException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.exception.BadRequestException;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.repository.AuditLogRepository;
import org.example.backend.repository.BugReportRepository;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRoleRepository;
import org.example.backend.repository.SprintRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.ProjectInvitationRepository;
import org.example.backend.repository.NotificationRepository;
import org.example.backend.repository.RequirementRepository;
import org.example.backend.repository.TestCaseRepository;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.ManualEvidenceLinkRepository;
import org.example.backend.service.ProjectService;
import org.example.backend.service.EmailService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRoleRepository projectRoleRepository;
    private final UserAccountRepository userAccountRepository;
    private final ProjectInvitationRepository projectInvitationRepository;
    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;
    private final TransactionTemplate transactionTemplate;
    private final ObjectMapper objectMapper;
    private final org.example.backend.service.github.GitHubApiService gitHubApiService;
    private final org.example.backend.config.NotificationWebSocketHandler notificationWebSocketHandler;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final BugReportRepository bugReportRepository;
    private final AuditLogRepository auditLogRepository;
    private final org.example.backend.service.event.OutboxEventService outboxEventService;
    private final RequirementRepository requirementRepository;
    private final TestCaseRepository testCaseRepository;
    private final CodeInsightEvidenceLinkRepository codeInsightEvidenceLinkRepository;
    private final ManualEvidenceLinkRepository manualEvidenceLinkRepository;

    @org.springframework.beans.factory.annotation.Value("${app.redis.lock.project-join-prefix:lock:project_join:}")
    private String projectJoinLockPrefix;



    @org.springframework.beans.factory.annotation.Value("${app.base-url:http://localhost:5173}")
    private String appBaseUrl;

    private static final String CACHE_PREFIX = "projects:user:";
    private static final long CACHE_TTL_MINUTES = 10;

    @PersistenceContext
    private EntityManager entityManager;

    @org.springframework.beans.factory.annotation.Value("${github.webhook-url}")
    private String githubWebhookUrl;

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ProjectResponse> getProjectsForUser(
            Long userId,
            int page,
            int size,
            String status,
            String search,
            String sortBy) {

        log.info("🔍 Querying projects for user ID: {} | Page: {}, Size: {}, Status: {}, Search: {}, Sort: {}",
                userId, page, size, status, search, sortBy);

        // 0. Check Redis cache first
        String cacheKey = buildCacheKey(userId, page, size, status, search, sortBy);
        String cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            try {
                PaginatedResponse<ProjectResponse> hit = objectMapper.readValue(
                        cached, new TypeReference<PaginatedResponse<ProjectResponse>>() {});
                log.info("💾 Cache HIT for key: {}", cacheKey);
                
                // Re-evaluate online status for cached members
                if (hit.getItems() != null) {
                    for (ProjectResponse pr : hit.getItems()) {
                        if (pr.getMembers() != null) {
                            for (ProjectResponse.MemberDto member : pr.getMembers()) {
                                member.setIsOnline(org.example.backend.config.SessionRegistryListener.isUserOnline(member.getId()));
                            }
                        }
                    }
                }
                
                return hit;
            } catch (Exception e) {
                log.warn("⚠️ Cache deserialization failed, falling through to DB query. Key: {}", cacheKey);
            }
        }

        // 1. Ánh xạ trạng thái nếu có lọc
        ProjectStatus projectStatus = null;
        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
            try {
                projectStatus = ProjectStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("⚠️ Invalid status string received: {}. Ignoring status filter.", status);
            }
        }

        // 2. Thiết lập đối tượng sắp xếp (Sorting)
        Sort sort = Sort.by(Sort.Direction.DESC, "updatedAt");
        if ("name".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "name");
        } else if ("deadline".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "deadline");
        }

        Pageable pageable = PageRequest.of(page, size, sort);

        // 3. Thực hiện truy vấn chuyên biệt tương ứng
        Page<Project> projectPage;
        boolean hasStatus = (projectStatus != null);
        boolean hasSearch = (search != null && !search.trim().isEmpty());

        if (hasStatus && hasSearch) {
            projectPage = projectRepository.findProjectsByUserIdAndStatusAndSearch(userId, projectStatus, search.trim(), pageable);
        } else if (hasStatus) {
            projectPage = projectRepository.findProjectsByUserIdAndStatus(userId, projectStatus, pageable);
        } else if (hasSearch) {
            projectPage = projectRepository.findProjectsByUserIdAndSearch(userId, search.trim(), pageable);
        } else {
            projectPage = projectRepository.findProjectsByUserId(userId, pageable);
        }

        List<ProjectResponse> responses = new ArrayList<>();

        // 4. Lặp map dữ liệu. Nhờ @BatchSize(size = 20) trên Project.members,
        // Hibernate sẽ nạp toàn bộ thành viên của trang này chỉ với 1 câu lệnh SQL duy nhất!
        for (Project project : projectPage.getContent()) {
            responses.add(mapToProjectResponse(project, userId));
        }

        log.info("✨ Successfully loaded {} projects on page {} (Total: {}) for user ID: {}",
                responses.size(), page, projectPage.getTotalElements(), userId);

        PaginatedResponse<ProjectResponse> result = PaginatedResponse.<ProjectResponse>builder()
                .items(responses)
                .currentPage(projectPage.getNumber())
                .pageSize(projectPage.getSize())
                .totalItems(projectPage.getTotalElements())
                .totalPages(projectPage.getTotalPages())
                .hasMore(projectPage.hasNext())
                .build();

        // 5. Ghi vào Redis cache (TTL: 10 phút)
        try {
            String json = objectMapper.writeValueAsString(result);
            redisTemplate.opsForValue().set(cacheKey, json, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.info("✅ Cache MISS — stored to Redis. Key: {} (TTL: {}min)", cacheKey, CACHE_TTL_MINUTES);
        } catch (Exception e) {
            log.warn("⚠️ Failed to write to Redis cache. Key: {}", cacheKey, e);
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId, Long userId) {
        log.info("🔍 Request to fetch project details for project ID: {} by user ID: {}", projectId, userId);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại."));

        // Kiểm tra xem user có phải là thành viên của dự án không
        boolean isMember = false;
        if (project.getMembers() != null) {
            for (ProjectMember pm : project.getMembers()) {
                if (pm.getUser().getId().equals(userId)) {
                    isMember = true;
                    break;
                }
            }
        }

        // Cho phép truy cập nếu là Mentor (Owner) của lớp học chứa dự án này
        boolean isClassroomOwner = false;
        if (project.getAcademicContext() != null && project.getAcademicContext().getOwner() != null) {
            if (project.getAcademicContext().getOwner().getId().equals(userId)) {
                isClassroomOwner = true;
            }
        }

        // Cho phép truy cập nếu là Người tạo dự án (createdBy)
        boolean isCreator = false;
        if (project.getCreatedBy() != null && project.getCreatedBy().getId().equals(userId)) {
            isCreator = true;
        }

        if (!isMember && !isClassroomOwner && !isCreator) {
            throw new CustomException("Bạn không có quyền truy cập dự án này.", HttpStatus.FORBIDDEN);
        }

        return mapToProjectResponse(project, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDashboardResponse getProjectDashboard(Long projectId, Long userId) {
        // Removed spammy log for Live Polling

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại."));

        // Basic permission check
        boolean isMember = project.getMembers() != null && project.getMembers().stream()
                .anyMatch(pm -> pm.getUser().getId().equals(userId));
        boolean isClassroomOwner = project.getAcademicContext() != null &&
                project.getAcademicContext().getOwner() != null &&
                project.getAcademicContext().getOwner().getId().equals(userId);
        boolean isCreator = project.getCreatedBy() != null && project.getCreatedBy().getId().equals(userId);

        if (!isMember && !isClassroomOwner && !isCreator) {
            throw new CustomException("Bạn không có quyền truy cập dashboard dự án này.", HttpStatus.FORBIDDEN);
        }

        long reqCount = requirementRepository.countByProjectId(projectId);
        long taskCount = taskRepository.countByProjectId(projectId);
        long bugCount = bugReportRepository.countByProjectId(projectId);
        int activeSprints = sprintRepository.countByProjectIdAndStatus(projectId, SprintStatus.ACTIVE);
        int upcomingSprints = sprintRepository.countByProjectIdAndStatus(projectId, SprintStatus.PLANNED);
        long testCaseCount = testCaseRepository.countByProjectId(projectId);
        long evidenceCount = codeInsightEvidenceLinkRepository.countByProjectId(projectId)
                           + manualEvidenceLinkRepository.countByProjectId(projectId);

        // Simple RTM coverage calculation (prevent div by 0)
        double rtmCoverage = 0.0;
        if (reqCount > 0) {
            // Rough estimation: assuming testcases provide coverage. 
            // In a real system, we'd query distinct requirements linked to test cases.
            // For now, we cap it at 100%.
            rtmCoverage = Math.min(100.0, ((double) testCaseCount / reqCount) * 100.0);
        }

        // Fetch actual recent activities from AuditLog, excluding generic HTTP GET/POST/PUT/DELETE
        List<org.example.backend.entity.AuditLog> logs = auditLogRepository.findBusinessLogsByProjectId(projectId, PageRequest.of(0, 50));
        List<ProjectDashboardResponse.ActivityDto> recentActivities = logs.stream().map(log -> {
            String icon = "history";
            String iconColor = "text-gray-500";
            String bg = "bg-gray-500/10";
            
            String action = log.getAction() != null ? log.getAction().toUpperCase() : "";
            
            if (action.contains("CREATE") || action.contains("ADD") || action.contains("JOIN") || action.contains("INVITE")) {
                icon = "add_circle";
                iconColor = "text-emerald-500";
                bg = "bg-emerald-500/10";
            } else if (action.contains("UPDATE") || action.contains("EDIT")) {
                icon = "edit";
                iconColor = "text-blue-500";
                bg = "bg-blue-500/10";
            } else if (action.contains("DELETE") || action.contains("REMOVE")) {
                icon = "delete";
                iconColor = "text-rose-500";
                bg = "bg-rose-500/10";
            } else if (action.contains("RESOLVE") || action.contains("FIX")) {
                icon = "check_circle";
                iconColor = "text-indigo-500";
                bg = "bg-indigo-500/10";
            }

            return ProjectDashboardResponse.ActivityDto.builder()
                    .text(log.getAction() != null ? log.getAction() : action)
                    .time(log.getCreatedAt() != null ? log.getCreatedAt().toString() : "")
                    .icon(icon)
                    .iconColor(iconColor)
                    .bg(bg)
                    .username(log.getUsername())
                    .build();
        }).toList();

        // Calculate active sprint data
        List<org.example.backend.entity.Sprint> sprints = sprintRepository.findByProjectIdOrderByStartDateAscIdAsc(projectId);
        ProjectDashboardResponse.SprintInfoDto sprintInfoDto = null;
        
        if (!sprints.isEmpty()) {
            org.example.backend.entity.Sprint activeSprint = sprints.stream()
                    .filter(s -> org.example.backend.entity.SprintStatus.ACTIVE.equals(s.getStatus()))
                    .findFirst()
                    .orElse(null);
            
            if (activeSprint != null) {
                sprintInfoDto = buildSprintInfoDto(activeSprint, "IN_PROGRESS");
            } else {
                org.example.backend.entity.Sprint upcomingSprint = sprints.stream()
                        .filter(s -> org.example.backend.entity.SprintStatus.PLANNED.equals(s.getStatus()))
                        .findFirst()
                        .orElse(null);
                
                if (upcomingSprint != null) {
                    sprintInfoDto = buildSprintInfoDto(upcomingSprint, "UPCOMING");
                } else {
                    org.example.backend.entity.Sprint completedSprint = sprints.stream()
                            .filter(s -> org.example.backend.entity.SprintStatus.COMPLETED.equals(s.getStatus()))
                            .reduce((first, second) -> second) // get the last completed sprint
                            .orElse(null);
                    
                    if (completedSprint != null) {
                        sprintInfoDto = buildSprintInfoDto(completedSprint, "COMPLETED");
                    }
                }
            }
        }
        
        if (sprintInfoDto == null) {
            sprintInfoDto = ProjectDashboardResponse.SprintInfoDto.builder()
                    .status("NO_SPRINTS")
                    .build();
        }

        return ProjectDashboardResponse.builder()
                .reqCount(reqCount)
                .taskCount(taskCount)
                .bugCount(bugCount)
                .testCaseCount(testCaseCount)
                .evidenceCount(evidenceCount)
                .rtmCoveragePercent(rtmCoverage)
                .recentActivities(recentActivities)
                .activeSprint(sprintInfoDto)
                .deadline(project.getEndDate())
                .build();
    }
    
    private ProjectDashboardResponse.SprintInfoDto buildSprintInfoDto(org.example.backend.entity.Sprint sprint, String status) {
        long totalTasks = taskRepository.countBySprintId(sprint.getId());
        long doneTasks = taskRepository.countBySprintIdAndStatus(sprint.getId(), org.example.backend.entity.TaskStatus.DONE);
        int progress = 0;
        if (totalTasks > 0) {
            progress = (int) Math.round(((double) doneTasks / totalTasks) * 100);
        }
        return ProjectDashboardResponse.SprintInfoDto.builder()
                .name(sprint.getName())
                .status(status)
                .startDate(sprint.getStartDate())
                .endDate(sprint.getEndDate())
                .progressPercent(progress)
                .build();
    }

    @Override
    @Transactional
    public ProjectResponse createProject(ProjectResponse.CreateProjectRequest request, Long userId) {
        log.info("🚀 Service request to create a new project: {} by user ID: {}", request.getName(), userId);

        // 1. Tìm tài khoản người tạo
        UserAccount creator = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản người tạo không tồn tại trong hệ thống."));

        // Evict cache ngay khi có mutation
        evictUserProjectsCache(userId);

        // 2. Tìm hoặc tự động tạo mới AcademicContext dựa trên major (subject) cho Personal Project
        AcademicContext academicContext = null;
        if (request.getClassroomId() != null) {
            academicContext = entityManager.find(AcademicContext.class, request.getClassroomId());
            if (academicContext == null) {
                throw new ResourceNotFoundException("Lớp học không tồn tại.");
            }
        } else {
            AcademicSeason semester = AcademicSeason.PERSONAL;
            String academicYear = String.valueOf(java.time.LocalDate.now().getYear());
            String subject = request.getMajor() != null ? request.getMajor().trim() : "Software Engineering";

            TypedQuery<AcademicContext> query = entityManager.createQuery(
                    "SELECT ac FROM AcademicContext ac WHERE ac.subject = :subject AND ac.semester = :semester AND ac.academicYear = :academicYear",
                    AcademicContext.class
            );
            query.setParameter("subject", subject);
            query.setParameter("semester", semester);
            query.setParameter("academicYear", academicYear);

            List<AcademicContext> academicContexts = query.getResultList();
            if (academicContexts.isEmpty()) {
                try {
                    academicContext = AcademicContext.builder()
                            .subject(subject)
                            .semester(semester)
                            .academicYear(academicYear)
                            .build();
                    entityManager.persist(academicContext);
                    entityManager.flush();
                    log.info("🌱 Created new AcademicContext: subject={}, semester={}, year={}", subject, semester, academicYear);
                } catch (Exception e) {
                    // Race condition: another request already inserted this row
                    log.warn("⚡ AcademicContext already exists (concurrent insert), re-querying...");
                    entityManager.clear();
                    academicContexts = query.getResultList();
                    if (academicContexts.isEmpty()) {
                        throw new CustomException("Không thể tạo ngữ cảnh học thuật. Vui lòng thử lại.", HttpStatus.CONFLICT);
                    }
                    academicContext = academicContexts.get(0);
                }
            } else {
                academicContext = academicContexts.get(0);
            }
        }

        // 3. Phân tích loại dự án (ProjectType)
        ProjectType projectType = ProjectType.WEB_APP;
        if (request.getType() != null) {
            try {
                projectType = ProjectType.valueOf(request.getType().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("⚠️ Invalid project type received: {}. Falling back to WEB_APP.", request.getType());
            }
        }

        LocalDate deadline = request.getDeadline();
        LocalDate startDate = request.getStartDate();
        
        // Use academic context dates if it's a classroom
        if (request.getClassroomId() != null && academicContext != null) {
            startDate = academicContext.getStartDate() != null ? academicContext.getStartDate() : java.time.LocalDate.now();
            deadline = academicContext.getEndDate() != null ? academicContext.getEndDate() : startDate.plusMonths(3);
        } else {
            org.example.backend.util.DateValidationUtils.validateDateRange(startDate, deadline, "Project");
        }

        // 4. Tạo và lưu thực thể Project
        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .type(projectType)
                .academicContext(academicContext)
                .startDate(startDate)
                .deadline(deadline)
                .status(ProjectStatus.PLANNING)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        project = projectRepository.save(project);
        log.info("📁 Saved new Project entity with ID: {}", project.getId());

        // 5. Xác định và gán vai trò cho người tạo và Mentor của lớp học
        List<ProjectMember> initialMembers = new ArrayList<>();

        ProjectRole leaderRole = findLeaderRole();
        ProjectRole mentorRole = projectRoleRepository.findByName("MENTOR")
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò MENTOR không tồn tại trong hệ thống."));

        boolean isCreatorMentor = academicContext != null && academicContext.getOwner() != null 
                && academicContext.getOwner().getId().equals(creator.getId());

        if (isCreatorMentor) {
            // Nếu chính mentor tạo dự án
            ProjectMember mentorMember = ProjectMember.builder()
                    .project(project)
                    .user(creator)
                    .role(mentorRole)
                    .joinedAt(LocalDateTime.now())
                    .invitedBy(creator)
                    .build();
            projectMemberRepository.save(mentorMember);
            initialMembers.add(mentorMember);
            log.info("👑 Assigned user ID: {} as MENTOR for project ID: {}", userId, project.getId());
        } else {
            // Nếu sinh viên tạo dự án -> sinh viên làm LEADER
            ProjectMember leaderMember = ProjectMember.builder()
                    .project(project)
                    .user(creator)
                    .role(leaderRole)
                    .joinedAt(LocalDateTime.now())
                    .invitedBy(creator)
                    .build();
            projectMemberRepository.save(leaderMember);
            initialMembers.add(leaderMember);
            log.info("👑 Assigned user ID: {} as PROJECT_LEADER for project ID: {}", userId, project.getId());

            // Tự động add Mentor của lớp học vào dự án
            if (academicContext != null && academicContext.getOwner() != null) {
                ProjectMember mentorMember = ProjectMember.builder()
                        .project(project)
                        .user(academicContext.getOwner())
                        .role(mentorRole)
                        .joinedAt(LocalDateTime.now())
                        .invitedBy(creator)
                        .build();
                projectMemberRepository.save(mentorMember);
                initialMembers.add(mentorMember);
                log.info("🎓 Automatically added classroom owner ID: {} as MENTOR for project ID: {}", 
                        academicContext.getOwner().getId(), project.getId());
            }
        }

        // Auto configure GitHub Integration if provided
        if (request.getRepoOwner() != null && !request.getRepoOwner().trim().isEmpty()
                && request.getRepoName() != null && !request.getRepoName().trim().isEmpty()) {
            try {
                log.info("⚙️ Automatically configuring GitHub Integration for project {} with repo: {}/{}", 
                        project.getId(), request.getRepoOwner(), request.getRepoName());
                
                Map<String, Object> configRequest = new java.util.HashMap<>();
                configRequest.put("repoOwner", request.getRepoOwner().trim());
                configRequest.put("repoName", request.getRepoName().trim());
                
                // Generate a random 24-char webhook secret
                String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
                java.security.SecureRandom random = new java.security.SecureRandom();
                StringBuilder secretSb = new StringBuilder();
                for (int i = 0; i < 24; i++) {
                    secretSb.append(chars.charAt(random.nextInt(chars.length())));
                }
                String webhookSecret = secretSb.toString();
                configRequest.put("webhookSecret", webhookSecret);

                // Save integration configuration
                gitHubApiService.saveIntegration(project.getId(), configRequest, userId);

                // Auto configure webhook on GitHub post-commit using the backend-configured webhook URL
                if (githubWebhookUrl != null && !githubWebhookUrl.trim().isEmpty()) {
                    final Long projectId = project.getId();
                    final String webhookUrl = githubWebhookUrl.trim();
                    final String finalSecret = webhookSecret;
                    final List<String> events = List.of("issues", "push", "pull_request", "workflow_run", "check_run");
                    
                    if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
                        org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                            new org.springframework.transaction.support.TransactionSynchronization() {
                                @Override
                                public void afterCommit() {
                                    try {
                                        log.info("🚀 Transaction committed. Registering GitHub webhook post-commit for project: {}", projectId);
                                        gitHubApiService.autoConfigureWebhook(projectId, userId, webhookUrl, events, finalSecret);
                                    } catch (Exception e) {
                                        log.error("❌ Failed to automatically configure GitHub webhook post-commit", e);
                                    }
                                }
                            }
                        );
                    } else {
                        gitHubApiService.autoConfigureWebhook(projectId, userId, webhookUrl, events, finalSecret);
                    }
                }
            } catch (Exception e) {
                log.error("❌ Failed to automatically configure GitHub integration during project creation", e);
            }
        }

        // Do project được query lại hoặc refresh để lấy members list đầy đủ cho việc mapping
        project.setMembers(initialMembers);

        return mapToProjectResponse(project, userId);
    }

    @Override
    @Transactional
    public void inviteMember(Long projectId, String email, Long invitedByUserId) {
        log.info("📩 Service request to invite member by email: {} to project ID: {} by user ID: {}", email, projectId, invitedByUserId);

        // 1. Kiểm tra dự án tồn tại
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Dự án không tồn tại."));

        // 2. Tìm tài khoản người mời
        UserAccount inviter = userAccountRepository.findById(invitedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản người mời không tồn tại."));

        // 3. Tìm tài khoản người được mời bằng email
        UserAccount invitedUser = userAccountRepository.findByEmail(email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng có email này không tồn tại trong hệ thống."));

        // Không tự mời chính mình
        if (invitedUser.getId().equals(inviter.getId())) {
            throw new BadRequestException("Bạn không thể tự mời chính mình tham gia dự án.");
        }

        // 4. Kiểm tra xem người dùng đã là thành viên trong dự án chưa
        Optional<ProjectMember> existingMember = projectMemberRepository.findByProjectIdAndUserId(projectId, invitedUser.getId());
        if (existingMember.isPresent()) {
            throw new BadRequestException("Người dùng đã là thành viên của dự án này.");
        }

        // Kiểm tra xem đã có lời mời pending chưa (DB)
        Optional<ProjectInvitation> existingInvite = projectInvitationRepository.findByProjectIdAndInviteeIdAndStatus(
                projectId, invitedUser.getId(), ProjectInvitationStatus.PENDING);
        if (existingInvite.isPresent()) {
            throw new BadRequestException("Người dùng này đã nhận được lời mời trước đó và đang chờ xác nhận.");
        }

        // Tạo token
        String token = UUID.randomUUID().toString();

        // 5. Tạo bản ghi Invitation (DB)
        ProjectInvitation invitation = ProjectInvitation.builder()
                .project(project)
                .inviter(inviter)
                .invitee(invitedUser)
                .token(token)
                .status(ProjectInvitationStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusDays(7))
                .build();
        invitation = projectInvitationRepository.save(invitation);

        // 6. Gửi Notification (DB)
        String title = "Lời mời tham gia dự án";
        String message = inviter.getProfile().getFullName() + " đã mời bạn tham gia dự án " + project.getName() + ".";
        Notification notification = Notification.builder()
                .recipient(invitedUser)
                .project(project)
                .entityType(org.example.backend.entity.NotificationEntityType.PROJECT_INVITATION)
                .title(title)
                .message(message)
                .type(NotificationType.INVITATION)
                .relatedId(invitation.getId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        Notification savedNotification = notificationRepository.save(notification);

        // Phát WebSocket notification real-time tới người nhận
        String jsonPayload = String.format(
            "{\"type\":\"NOTIFICATION\",\"data\":{\"id\":%d,\"title\":\"%s\",\"message\":\"%s\",\"type\":\"INVITATION\",\"relatedId\":%d,\"projectId\":%d,\"entityType\":\"PROJECT_INVITATION\",\"isRead\":false,\"createdAt\":\"%s\",\"invitationStatus\":\"PENDING\"}}",
            savedNotification.getId(),
            savedNotification.getTitle(),
            savedNotification.getMessage(),
            savedNotification.getRelatedId(),
            project.getId(),
            savedNotification.getCreatedAt().toString()
        );
        notificationWebSocketHandler.sendToUser(invitedUser.getId(), jsonPayload);

        // 7. Gửi Email
        String acceptLink = appBaseUrl + "/invite/accept?token=" + token;
        String emailBody = "<h3>Xin chào " + invitedUser.getProfile().getFullName() + "</h3>"
                + "<p>Bạn vừa nhận được một lời mời tham gia dự án <b>" + project.getName() + "</b> từ " + inviter.getProfile().getFullName() + ".</p>"
                + "<p>Vui lòng click vào đường dẫn bên dưới để đồng ý tham gia:</p>"
                + "<a href=\"" + acceptLink + "\" style=\"display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;\">Đồng ý tham gia</a>"
                + "<p>Lời mời sẽ hết hạn sau 7 ngày.</p>";
        emailService.sendEmail(invitedUser.getEmail(), "DevTrack - Lời mời tham gia dự án", emailBody);

        log.info("✨ Successfully sent invitation to member ID: {} for project ID: {}", invitedUser.getId(), projectId);
    }

    @Override
    @Transactional
    public void acceptInvitation(Long invitationId, String token, Long userId) {
        ProjectInvitation invitation;
        if (invitationId != null) {
            invitation = projectInvitationRepository.findById(invitationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lời mời không tồn tại."));
        } else if (token != null && !token.trim().isEmpty()) {
            invitation = projectInvitationRepository.findByToken(token)
                    .orElseThrow(() -> new ResourceNotFoundException("Đường dẫn không hợp lệ hoặc không tồn tại."));
        } else {
            throw new BadRequestException("Thiếu thông tin lời mời.");
        }

        if (!invitation.getInvitee().getId().equals(userId)) {
            throw new CustomException("Bạn không có quyền thực hiện thao tác này.", HttpStatus.FORBIDDEN);
        }

        if (invitation.getStatus() != ProjectInvitationStatus.PENDING) {
            throw new BadRequestException("Lời mời này đã được xử lý.");
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Lời mời đã hết hạn.");
        }

        // Thay đổi trạng thái
        invitation.setStatus(ProjectInvitationStatus.ACCEPTED);
        projectInvitationRepository.save(invitation);

        // Đánh dấu thông báo đã đọc và đổi nội dung
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        notifications.stream()
                .filter(n -> n.getRelatedId() != null && n.getRelatedId().equals(invitation.getId()) && n.getType() == NotificationType.INVITATION)
                .findFirst()
                .ifPresent(n -> {
                    n.setMessage("Bạn đã đồng ý tham gia dự án " + invitation.getProject().getName() + ".");
                    n.setRead(true);
                    notificationRepository.save(n);
                });

        // Kiểm tra xem đã là thành viên chưa (phòng hờ)
        Optional<ProjectMember> existingMember = projectMemberRepository.findByProjectIdAndUserId(invitation.getProject().getId(), userId);
        if (existingMember.isPresent()) {
            return;
        }

        // Xác định vai trò cho thành viên mới
        // Nếu dự án chưa có ai khác ngoài Mentor, người đầu tiên vào sẽ là Nhóm trưởng
        List<ProjectMember> currentMembers = projectMemberRepository.findByProjectId(invitation.getProject().getId());
        boolean hasNonMentor = currentMembers.stream()
                .anyMatch(pm -> !pm.getRole().getName().equalsIgnoreCase("MENTOR"));

        ProjectRole assignedRole;
        if (!hasNonMentor) {
            assignedRole = findLeaderRole();
            log.info("👑 First non-mentor member joined project {}. Assigned as LEADER.", invitation.getProject().getId());
        } else {
            assignedRole = projectRoleRepository.findByName("MEMBER")
                    .orElseThrow(() -> new ResourceNotFoundException("Vai trò MEMBER không tồn tại trong hệ thống."));
        }

        // Add thành viên
        ProjectMember newMember = ProjectMember.builder()
                .project(invitation.getProject())
                .user(invitation.getInvitee())
                .role(assignedRole)
                .joinedAt(LocalDateTime.now())
                .invitedBy(invitation.getInviter())
                .build();
        projectMemberRepository.save(newMember);

        // Tạo thực thể Notification mới cho Người mời (Inviter) để lưu trữ bền vững trong DB
        String notifTitle = "Thành viên đã chấp nhận lời mời";
        String notifMessage = invitation.getInvitee().getProfile().getFullName() + " đã chấp nhận lời mời của bạn";
        Notification acceptedNotif = Notification.builder()
                .recipient(invitation.getInviter()) // Người nhận là người mời
                .project(invitation.getProject())
                .entityType(org.example.backend.entity.NotificationEntityType.PROJECT_INVITATION)
                .title(notifTitle)
                .message(notifMessage)
                .type(org.example.backend.entity.NotificationType.SYSTEM)
                .relatedId(invitation.getId())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        Notification savedNotif = notificationRepository.save(acceptedNotif);

        evictProjectCacheForAllMembers(invitation.getProject().getId());

        // Đảm bảo WebSocket chỉ gửi sau khi Transaction đã commit và cache đã bị xóa hoàn toàn để tránh race condition
        final Long inviterId = invitation.getInviter().getId();
        final String refreshPayload = String.format(
            "{\"type\":\"REFRESH_PROJECTS\",\"projectId\":%d,\"message\":\"Thành viên %s đã đồng ý tham gia dự án %s!\"}",
            invitation.getProject().getId(),
            invitation.getInvitee().getProfile().getFullName(),
            invitation.getProject().getName()
        );

        // Chuẩn bị payload WebSocket cho thông báo SYSTEM (Notification Center) để hiển thị real-time
        final String notifPayload = String.format(
            "{\"type\":\"NOTIFICATION\",\"data\":{\"id\":%d,\"title\":\"%s\",\"message\":\"%s\",\"type\":\"SYSTEM\",\"relatedId\":%d,\"projectId\":%d,\"entityType\":\"PROJECT_INVITATION\",\"isRead\":false,\"createdAt\":\"%s\"}}",
            savedNotif.getId(),
            savedNotif.getTitle(),
            savedNotif.getMessage(),
            savedNotif.getRelatedId(),
            invitation.getProject().getId(),
            savedNotif.getCreatedAt().toString()
        );

        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                new org.springframework.transaction.support.TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        notificationWebSocketHandler.sendToUser(inviterId, refreshPayload);
                        notificationWebSocketHandler.sendToUser(inviterId, notifPayload);
                    }
                }
            );
        } else {
            notificationWebSocketHandler.sendToUser(inviterId, refreshPayload);
            notificationWebSocketHandler.sendToUser(inviterId, notifPayload);
        }
    }

    @Override
    @Transactional
    public void rejectInvitation(Long invitationId, String token, Long userId) {
        ProjectInvitation invitation;
        if (invitationId != null) {
            invitation = projectInvitationRepository.findById(invitationId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lời mời không tồn tại."));
        } else if (token != null && !token.trim().isEmpty()) {
            invitation = projectInvitationRepository.findByToken(token)
                    .orElseThrow(() -> new ResourceNotFoundException("Đường dẫn không hợp lệ hoặc không tồn tại."));
        } else {
            throw new BadRequestException("Thiếu thông tin lời mời.");
        }

        if (!invitation.getInvitee().getId().equals(userId)) {
            throw new CustomException("Bạn không có quyền thực hiện thao tác này.", HttpStatus.FORBIDDEN);
        }

        if (invitation.getStatus() != ProjectInvitationStatus.PENDING) {
            throw new BadRequestException("Lời mời này đã được xử lý.");
        }

        invitation.setStatus(ProjectInvitationStatus.REJECTED);
        projectInvitationRepository.save(invitation);

        // Đánh dấu thông báo đã đọc và đổi nội dung
        List<Notification> notifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        notifications.stream()
                .filter(n -> n.getRelatedId() != null && n.getRelatedId().equals(invitation.getId()) && n.getType() == NotificationType.INVITATION)
                .findFirst()
                .ifPresent(n -> {
                    n.setMessage("Bạn đã từ chối tham gia dự án " + invitation.getProject().getName() + ".");
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    @Override
    @Transactional
    public void removeMember(Long projectId, Long memberUserId, Long callingUserId) {
        log.info("🗑️ Service request to remove member ID: {} from project ID: {} by user ID: {}", memberUserId, projectId, callingUserId);

        // Lấy thông tin thành viên bị xoá
        ProjectMember targetMember = projectMemberRepository.findByProjectIdAndUserId(projectId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không thuộc dự án."));

        // Người gọi api
        ProjectMember callingMember = projectMemberRepository.findByProjectIdAndUserId(projectId, callingUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn không thuộc dự án này."));

        // Chỉ cho phép PROJECT_LEADER hoặc MENTOR xoá
        if (!isLeaderRole(callingMember.getRole().getName()) && !"MENTOR".equalsIgnoreCase(callingMember.getRole().getName())) {
            throw new CustomException("Chỉ Trưởng dự án hoặc Mentor mới có quyền xóa thành viên.", HttpStatus.FORBIDDEN);
        }

        // Không được phép tự xóa chính mình nếu mình là Leader (phải chuyển quyền trước)
        if (memberUserId.equals(callingUserId)) {
            throw new BadRequestException("Bạn đang là Trưởng dự án, vui lòng nhượng quyền trước khi rời dự án.");
        }

        // Không xóa ai đang là PROJECT_LEADER
        if (isLeaderRole(targetMember.getRole().getName())) {
            throw new BadRequestException("Không thể xóa người đang giữ vai trò Trưởng dự án.");
        }

        // Không xóa MENTOR
        if ("MENTOR".equalsIgnoreCase(targetMember.getRole().getName())) {
            throw new BadRequestException("Không thể xóa Mentor khỏi dự án.");
        }

        projectMemberRepository.delete(targetMember);
        evictUserProjectsCache(memberUserId);
        evictProjectCacheForAllMembers(projectId);
        log.info("✨ Successfully removed member ID: {} from project ID: {}", memberUserId, projectId);
    }

    @Override
    @Transactional
    public void changeProjectLeader(Long projectId, Long newLeaderUserId, Long currentLeaderUserId) {
        log.info("🔄 Service request to change leader of project ID: {} from current leader ID: {} to new leader ID: {}",
                projectId, currentLeaderUserId, newLeaderUserId);

        // Evict cache ngay khi có mutation
        evictProjectCacheForAllMembers(projectId);

        // 1. Kiểm tra xem người yêu cầu có thực sự là PROJECT_LEADER hiện tại của dự án đó không
        ProjectMember currentMember = projectMemberRepository.findByProjectIdAndUserId(projectId, currentLeaderUserId)
                .orElseThrow(() -> new CustomException("Bạn không phải là thành viên của dự án này.", HttpStatus.FORBIDDEN));

        if (!isLeaderRole(currentMember.getRole().getName())) {
            throw new CustomException("Bạn không có quyền thay đổi Leader của dự án này.", HttpStatus.FORBIDDEN);
        }

        // 2. Kiểm tra xem thành viên mới được ứng cử có thuộc dự án không
        ProjectMember newLeaderMember = projectMemberRepository.findByProjectIdAndUserId(projectId, newLeaderUserId)
                .orElseThrow(() -> new BadRequestException("Thành viên được chọn không thuộc dự án này."));

        // Nếu trùng nhau thì không cần đổi
        if (newLeaderUserId.equals(currentLeaderUserId)) {
            log.info("ℹ️ Current leader and new leader are the same user. No changes needed.");
            return;
        }

        // 3. Tìm 2 vai trò tương ứng từ DB
        ProjectRole leaderRole = findLeaderRole();
        ProjectRole memberRole = projectRoleRepository.findByName("MEMBER")
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò MEMBER không tồn tại."));

        // 4. Hoán đổi vai trò nguyên tử
        currentMember.setRole(memberRole);
        newLeaderMember.setRole(leaderRole);

        projectMemberRepository.save(currentMember);
        projectMemberRepository.save(newLeaderMember);

        log.info("👑 Successfully swapped leader roles in project ID: {}. User ID: {} is now LEADER. User ID: {} is now MEMBER.",
                projectId, newLeaderUserId, currentLeaderUserId);
    }

    @Override
    @Transactional
    public void changeMemberRole(Long projectId, Long memberUserId, String newRoleName, Long callingUserId) {
        log.info("🔄 Service request to change role of member ID: {} in project ID: {} to role: {} by user ID: {}",
                memberUserId, projectId, newRoleName, callingUserId);

        // Evict cache ngay khi có mutation
        evictProjectCacheForAllMembers(projectId);

        // 1. Kiểm tra xem người yêu cầu có thực sự là PROJECT_LEADER của dự án đó không
        ProjectMember callerMember = projectMemberRepository.findByProjectIdAndUserId(projectId, callingUserId)
                .orElseThrow(() -> new CustomException("Bạn không phải là thành viên của dự án này.", HttpStatus.FORBIDDEN));

        if (!isLeaderRole(callerMember.getRole().getName())) {
            throw new CustomException("Chỉ Trưởng dự án mới có quyền phân quyền thành viên.", HttpStatus.FORBIDDEN);
        }

        // 2. Kiểm tra xem thành viên được phân quyền có thuộc dự án không
        ProjectMember targetMember = projectMemberRepository.findByProjectIdAndUserId(projectId, memberUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Thành viên không tồn tại trong dự án này."));

        // 3. Tìm vai trò tương ứng trong DB
        ProjectRole targetRole = projectRoleRepository.findByName(newRoleName)
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò " + newRoleName + " không tồn tại trong hệ thống."));

        // 4. Cập nhật vai trò
        targetMember.setRole(targetRole);
        projectMemberRepository.save(targetMember);

        log.info("✨ Successfully changed member ID: {} in project ID: {} to role: {}",
                memberUserId, projectId, newRoleName);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long projectId, ProjectResponse.UpdateProjectRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        ensureLeaderOrMentor(projectId, userId);

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            project.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getType() != null && !request.getType().trim().isEmpty()) {
            try {
                project.setType(ProjectType.valueOf(request.getType().trim().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Loại dự án không hợp lệ: " + request.getType());
            }
        }
        if (request.getStartDate() != null) {
            try {
                project.setStartDate(java.time.LocalDate.parse(request.getStartDate()));
            } catch (Exception e) {
                throw new BadRequestException("Ngày bắt đầu không hợp lệ. Vui lòng dùng định dạng yyyy-MM-dd.");
            }
        }
        if (request.getDeadline() != null && !request.getDeadline().isBlank()) {
            try {
                project.setDeadline(java.time.LocalDate.parse(request.getDeadline()));
            } catch (Exception e) {
                throw new BadRequestException("Deadline không hợp lệ. Vui lòng dùng định dạng yyyy-MM-dd.");
            }
        }
        if (request.getMaxMembers() != null && request.getMaxMembers() > 0) {
            project.setMaxMembers(request.getMaxMembers());
        }
        if (request.getCoverImageUrl() != null) {
            project.setCoverImageUrl(request.getCoverImageUrl().isBlank() ? null : request.getCoverImageUrl().trim());
        }
        if (request.getThemeColor() != null) {
            String color = request.getThemeColor().trim();
            if (!color.isEmpty() && !color.matches("^#[0-9A-Fa-f]{6}$")) {
                throw new BadRequestException("Mã màu không hợp lệ. Vui lòng dùng định dạng #RRGGBB.");
            }
            project.setThemeColor(color.isEmpty() ? null : color);
        }

        project = projectRepository.save(project);

        // Invalidate Redis cache
        try {
            Set<String> keys = redisTemplate.keys(CACHE_PREFIX + userId + ":*");
            if (keys != null && !keys.isEmpty()) redisTemplate.delete(keys);
        } catch (Exception e) {
            log.warn("Failed to invalidate Redis cache after project update: {}", e.getMessage());
        }

        log.info("✅ Project ID: {} updated successfully by user ID: {}", projectId, userId);
        return mapToProjectResponse(project, userId);
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId, Long userId) {
        Project project = projectRepository.findByIdWithPessimisticWrite(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

        // Kiểm tra quyền: Chỉ người tạo ra Classroom (Mentor) mới được phép xoá
        if (project.getAcademicContext() == null || !project.getAcademicContext().getOwner().getId().equals(userId)) {
            throw new CustomException("Chỉ người tạo lớp học (Mentor) mới có quyền xóa nhóm này.", HttpStatus.FORBIDDEN);
        }

        // Khóa mềm dự án (Soft delete)
        project.setStatus(ProjectStatus.ARCHIVED);
        projectRepository.save(project);
        
        log.info("🗑️ Successfully archived (soft-deleted) project ID: {} by user ID: {}", projectId, userId);
    }

    @Override
    public void joinProject(Long projectId, Long userId) {
        String lockKey = projectJoinLockPrefix + projectId;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "locked", 1, TimeUnit.SECONDS);

        if (Boolean.FALSE.equals(acquired)) {
            throw new BadRequestException("Hệ thống đang có nhiều người tham gia dự án cùng lúc, vui lòng thử lại sau 1 giây!");
        }

        try {
            transactionTemplate.executeWithoutResult(status -> {
                Project project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy dự án với ID: " + projectId));

                AcademicContext ac = project.getAcademicContext();
                if (ac == null) {
                    throw new BadRequestException("Dự án này không thuộc bất kỳ lớp học nào.");
                }

                // Kiểm tra xem user có thuộc lớp học này không
                boolean isEnrolled = ac.getEnrolledStudents().stream()
                        .anyMatch(u -> u.getId().equals(userId));
                if (!isEnrolled) {
                    throw new CustomException("Bạn không phải thành viên của lớp học này.", HttpStatus.FORBIDDEN);
                }

                // Kiểm tra xem user đã ở trong nhóm nào của lớp này chưa
                java.util.List<Project> classProjects = projectRepository.findByAcademicContextIdAndStatusNot(ac.getId(), ProjectStatus.ARCHIVED);
                for (Project cp : classProjects) {
                    if (cp.getMembers() != null && cp.getMembers().stream().anyMatch(m -> m.getUser().getId().equals(userId))) {
                        throw new BadRequestException("Bạn đã tham gia một nhóm khác trong lớp học này rồi.");
                    }
                }

                long currentSize = project.getMembers() != null ? project.getMembers().stream()
                        .filter(m -> m.getRole() != null && !"MENTOR".equalsIgnoreCase(m.getRole().getName()))
                        .count() : 0;

                if (project.getMaxMembers() != null && currentSize >= project.getMaxMembers()) {
                    throw new BadRequestException("Nhóm này đã đủ số lượng thành viên tối đa (" + project.getMaxMembers() + " người).");
                }

                UserAccount user = userAccountRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

                ProjectRole memberRole = projectRoleRepository.findByName("MEMBER")
                        .orElseThrow(() -> new ResourceNotFoundException("Vai trò MEMBER không tồn tại trong hệ thống."));

                ProjectMember pm = ProjectMember.builder()
                        .project(project)
                        .user(user)
                        .role(memberRole)
                        .build();

                if (project.getMembers() == null) {
                    project.setMembers(new java.util.ArrayList<>());
                }
                project.getMembers().add(pm);
                projectRepository.save(project);

                evictUserProjectsCache(userId);
                log.info("✅ User {} successfully joined project {}", userId, projectId);
            });
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Returns true if the role name represents a project leader.
     * Accepts both 'LEADER' (value stored in DB seed) and 'PROJECT_LEADER' (used in code constants)
     * so the system works correctly without requiring a DB migration.
     */
    private boolean isLeaderRole(String roleName) {
        return roleName != null && roleName.toUpperCase().contains("LEADER");
    }

    /**
     * Finds the leader ProjectRole entity by trying 'PROJECT_LEADER' first,
     * then falling back to 'LEADER' (the value in the DB seed migration).
     */
    private ProjectRole findLeaderRole() {
        return projectRoleRepository.findByName("PROJECT_LEADER")
                .or(() -> projectRoleRepository.findByName("LEADER"))
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò Leader không tồn tại trong hệ thống."));
    }

    private String buildCacheKey(Long userId, int page, int size, String status, String search, String sortBy) {
        return String.format("%s%d:p%d:s%d:%s:%s:%s",
                CACHE_PREFIX, userId, page, size,
                status != null && !status.trim().isEmpty() ? status.trim().toUpperCase() : "ALL",
                search != null && !search.trim().isEmpty() ? search.trim().toLowerCase() : "",
                sortBy != null ? sortBy.toLowerCase() : "recent");
    }

    private void evictUserProjectsCache(Long userId) {
        try {
            Set<String> keys = redisTemplate.keys(CACHE_PREFIX + userId + ":*");
            if (keys != null && !keys.isEmpty()) {
                Long deleted = redisTemplate.delete(keys);
                log.info("🗑️ Evicted {} Redis cache entries for user ID: {}", deleted, userId);
            }
        } catch (Exception e) {
            log.warn("⚠️ Failed to evict Redis cache for user ID: {}", userId, e);
        }
    }

    private void evictProjectCacheForAllMembers(Long projectId) {
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember member : members) {
            evictUserProjectsCache(member.getUser().getId());
        }
    }

    private ProjectResponse mapToProjectResponse(Project project, Long userId) {
        String localRole = "Member";
        List<ProjectResponse.MemberDto> memberDtos = new ArrayList<>();

        if (project.getMembers() != null) {
            for (ProjectMember member : project.getMembers()) {
                String name = member.getUser().getUsername();
                if (member.getUser().getProfile() != null && member.getUser().getProfile().getFullName() != null) {
                    name = member.getUser().getProfile().getFullName();
                }

                String roleName = member.getRole().getName();

                if (member.getUser().getId().equals(userId)) {
                    if (isLeaderRole(roleName)) {
                        localRole = "Project Leader";
                    } else if ("MENTOR".equalsIgnoreCase(roleName)) {
                        localRole = "Mentor";
                    }
                }

                memberDtos.add(ProjectResponse.MemberDto.builder()
                        .id(member.getUser().getId())
                        .username(member.getUser().getUsername())
                        .name(name)
                        .role(roleName)
                        .isOnline(SessionRegistryListener.isUserOnline(member.getUser().getId()))
                        .build());
            }
        }

        return ProjectResponse.builder()
                .id(project.getId().toString())
                .title(project.getName())
                .major(project.getAcademicContext() != null ? project.getAcademicContext().getSubject() : project.getType().name())
                .status(project.getStatus().name())
                .semester(project.getAcademicContext() != null && project.getAcademicContext().getSemester() != null ? project.getAcademicContext().getSemester().name() + " " + project.getAcademicContext().getAcademicYear() : "PERSONAL " + java.time.LocalDate.now().getYear())
                .role(localRole)
                .atRiskReqCount(project.getAtRiskReqCount())
                .startDate(project.getStartDate() != null ? project.getStartDate().toString() : null)
                .deadline(project.getDeadline() != null ? project.getDeadline().toString() : null)
                .progress(project.getProgress())
                .aiInsight(project.getAiInsight() != null ? project.getAiInsight() : "On Track")
                .members(memberDtos)
                .coverImageUrl(project.getCoverImageUrl())
                .themeColor(project.getThemeColor())
                .color(project.getColor())
                .description(project.getDescription())
                .type(project.getType() != null ? project.getType().name() : null)
                .maxMembers(project.getMaxMembers())
                .build();
    }

    // ─────────────────────────────────────────────────────────────
    // Project Closure Flow
    // ─────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public ProjectClosureCheckResponse checkProjectClosure(Long projectId, Long userId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy project."));
        ensureLeaderOrMentor(projectId, userId);

        List<Task> openTasks = taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && t.getStatus() != TaskStatus.CANCELLED)
                .toList();

        List<Sprint> activeSprints = sprintRepository.findByProjectIdOrderByStartDateAscIdAsc(projectId).stream()
                .filter(s -> s.getStatus() == SprintStatus.ACTIVE || s.getStatus() == SprintStatus.PLANNED)
                .toList();

        long openBugCount = bugReportRepository.findByProjectId(projectId).stream()
                .filter(b -> b.getStatus() != BugStatus.CLOSED
                          && b.getStatus() != BugStatus.VERIFIED)
                .count();

        List<ProjectClosureCheckResponse.OpenTaskItem> taskItems = openTasks.stream().map(t -> {
            String assigneeName = t.getPrimaryAssignee() != null
                    ? (t.getPrimaryAssignee().getProfile() != null && t.getPrimaryAssignee().getProfile().getFullName() != null
                        ? t.getPrimaryAssignee().getProfile().getFullName()
                        : t.getPrimaryAssignee().getUsername())
                    : "Chưa giao";
            String sprintName = t.getSprintId() != null
                    ? sprintRepository.findById(t.getSprintId()).map(Sprint::getName).orElse("Sprint #" + t.getSprintId())
                    : "Backlog";
            return ProjectClosureCheckResponse.OpenTaskItem.builder()
                    .id(t.getId())
                    .taskCode(t.getTaskCode())
                    .title(t.getTitle())
                    .status(t.getStatus().name())
                    .assigneeName(assigneeName)
                    .sprintName(sprintName)
                    .build();
        }).toList();

        return ProjectClosureCheckResponse.builder()
                .openTaskCount(openTasks.size())
                .openBugCount((int) openBugCount)
                .activeSprintCount(activeSprints.size())
                .canCloseSafely(openTasks.isEmpty() && openBugCount == 0 && activeSprints.isEmpty())
                .openTasks(taskItems)
                .activeSprints(activeSprints.stream().map(Sprint::getName).toList())
                .build();
    }

    @Override
    @Transactional
    public void closeProject(Long projectId, ProjectCloseRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy project."));
        ensureLeaderOrMentor(projectId, userId);

        if (project.getStatus() == ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Project đã được đóng trước đó.");
        }

        // Xử lý task chưa hoàn thành
        List<Task> openTasks = taskRepository.findByProjectIdOrderByUpdatedAtDesc(projectId).stream()
                .filter(t -> t.getStatus() != TaskStatus.DONE && t.getStatus() != TaskStatus.CANCELLED)
                .toList();

        if (request.getUnfinishedTaskAction() == ProjectCloseRequest.UnfinishedTaskAction.MOVE_TO_PROJECT) {
            if (request.getTargetProjectId() == null) {
                throw new BadRequestException("Vui lòng chọn project đích để chuyển task.");
            }
            Project target = projectRepository.findById(request.getTargetProjectId())
                    .orElseThrow(() -> new BadRequestException("Project đích không tồn tại."));
            for (Task t : openTasks) {
                t.setProject(target);
                t.setSprintId(null);
            }
        } else {
            for (Task t : openTasks) {
                t.setStatus(TaskStatus.CANCELLED);
            }
        }
        taskRepository.saveAll(openTasks);

        // Đóng toàn bộ bug còn mở
        List<BugReport> openBugs = bugReportRepository.findByProjectId(projectId).stream()
                .filter(b -> b.getStatus() != BugStatus.CLOSED
                          && b.getStatus() != BugStatus.VERIFIED)
                .toList();
        for (BugReport bug : openBugs) {
            bug.setStatus(BugStatus.CLOSED);
        }
        bugReportRepository.saveAll(openBugs);

        // Hoàn thành sprint đang chạy
        List<Sprint> activeSprints = sprintRepository.findByProjectIdOrderByStartDateAscIdAsc(projectId).stream()
                .filter(s -> s.getStatus() == SprintStatus.ACTIVE || s.getStatus() == SprintStatus.PLANNED)
                .toList();
        for (Sprint s : activeSprints) {
            s.setStatus(SprintStatus.COMPLETED);
        }
        sprintRepository.saveAll(activeSprints);

        // Chuyển project → ARCHIVED
        String oldStatus = project.getStatus().name();
        project.setStatus(ProjectStatus.ARCHIVED);
        project.setClosedAt(LocalDateTime.now());
        project.setClosedReason(request.getReason());
        projectRepository.save(project);

        // Ghi audit log
        UserAccount caller = userAccountRepository.findById(userId).orElse(null);
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .username(caller != null ? caller.getUsername() : "unknown")
                .action("PROJECT_CLOSED")
                .entityType("PROJECT")
                .entityId(projectId)
                .oldValue("{\"status\":\"" + oldStatus + "\"}")
                .newValue("{\"status\":\"ARCHIVED\",\"reason\":\"" + request.getReason().replace("\"", "'") + "\"}")
                .projectId(projectId)
                .status("SUCCESS")
                .build();
        auditLogRepository.save(log);

        // Publish PROJECT_CLOSED event — consumer gửi notification cho toàn nhóm
        outboxEventService.createEvent("PROJECT_CLOSED", "Project", projectId, Map.of(
                "projectName",        project.getName(),
                "closedByUserId",     userId,
                "closedByUsername",   caller != null ? caller.getUsername() : "unknown",
                "cancelledTaskCount", openTasks.size(),
                "closedBugCount",     openBugs.size(),
                "completedSprintCount", activeSprints.size(),
                "reason",             request.getReason(),
                "occurredAt",         project.getClosedAt().toString()
        ));

        // Gửi notification real-time tới tất cả thành viên trong project
        String closedByName = caller != null ? caller.getUsername() : "Leader";
        String notifTitle = "Project \"" + project.getName() + "\" đã được đóng";
        String notifMessage = "Project được đóng bởi " + closedByName + ". Lý do: " + request.getReason();
        List<ProjectMember> allMembers = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember member : allMembers) {
            Notification notif = Notification.builder()
                    .recipient(member.getUser())
                    .title(notifTitle)
                    .message(notifMessage)
                    .type(NotificationType.SYSTEM)
                    .project(project)
                    .entityType(org.example.backend.entity.NotificationEntityType.PROJECT)
                    .relatedId(projectId)
                    .isRead(false)
                    .createdAt(LocalDateTime.now())
                    .build();
            Notification savedNotif = notificationRepository.save(notif);
            String jsonPayload = String.format(
                    "{\"type\":\"NOTIFICATION\",\"data\":{\"id\":%d,\"title\":\"%s\",\"message\":\"%s\",\"type\":\"SYSTEM\",\"relatedId\":%d,\"projectId\":%d,\"entityType\":\"PROJECT\",\"isRead\":false,\"createdAt\":\"%s\"}}",
                    savedNotif.getId(),
                    savedNotif.getTitle(),
                    savedNotif.getMessage().replace("\"", "'"),
                    savedNotif.getRelatedId(),
                    project.getId(),
                    savedNotif.getCreatedAt().toString());
            notificationWebSocketHandler.sendToUser(member.getUser().getId(), jsonPayload);
        }
    }

    @Override
    @Transactional
    public void reopenProject(Long projectId, ProjectReopenRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy project."));
        ensureLeaderOrMentor(projectId, userId);

        if (project.getStatus() != ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Chỉ project đang ở trạng thái ARCHIVED mới có thể mở lại.");
        }

        project.setStatus(ProjectStatus.ACTIVE);
        project.setClosedAt(null);
        project.setClosedReason(null);
        projectRepository.save(project);

        UserAccount caller = userAccountRepository.findById(userId).orElse(null);
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .username(caller != null ? caller.getUsername() : "unknown")
                .action("PROJECT_REOPENED")
                .entityType("PROJECT")
                .entityId(projectId)
                .oldValue("{\"status\":\"ARCHIVED\"}")
                .newValue("{\"status\":\"ACTIVE\",\"reason\":\"" + request.getReason().replace("\"", "'") + "\"}")
                .projectId(projectId)
                .status("SUCCESS")
                .build();
        auditLogRepository.save(log);
    }

    private void ensureLeaderOrMentor(Long projectId, Long userId) {
        List<ProjectMember> memberships = projectMemberRepository.findByProjectId(projectId);
        boolean authorized = memberships.stream()
                .filter(m -> m.getUser().getId().equals(userId))
                .anyMatch(m -> isLeaderRole(m.getRole().getName()) || "MENTOR".equalsIgnoreCase(m.getRole().getName()));
        if (!authorized) {
            throw new CustomException("Chỉ Leader hoặc Mentor mới có quyền thực hiện thao tác này.", HttpStatus.FORBIDDEN);
        }
    }
}
