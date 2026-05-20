package org.example.backend.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ProjectResponse;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRoleRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.ProjectService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRoleRepository projectRoleRepository;
    private final UserAccountRepository userAccountRepository;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "projects:user:";
    private static final long CACHE_TTL_MINUTES = 10;

    @PersistenceContext
    private EntityManager entityManager;

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
    @Transactional
    public ProjectResponse createProject(ProjectResponse.CreateProjectRequest request, Long userId) {
        log.info("🚀 Service request to create a new project: {} by user ID: {}", request.getName(), userId);

        // 1. Tìm tài khoản người tạo
        UserAccount creator = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Tài khoản người tạo không tồn tại trong hệ thống."));

        // Evict cache ngay khi có mutation
        evictUserProjectsCache(userId);

        // 2. Tìm hoặc tự động tạo mới AcademicContext dựa trên major (subject)
        String semester = "Summer 2026";
        String academicYear = "2026";
        String subject = request.getMajor() != null ? request.getMajor().trim() : "Software Engineering";

        TypedQuery<AcademicContext> query = entityManager.createQuery(
                "SELECT ac FROM AcademicContext ac WHERE ac.subject = :subject AND ac.semester = :semester AND ac.academicYear = :academicYear",
                AcademicContext.class
        );
        query.setParameter("subject", subject);
        query.setParameter("semester", semester);
        query.setParameter("academicYear", academicYear);

        List<AcademicContext> academicContexts = query.getResultList();
        AcademicContext academicContext;
        if (academicContexts.isEmpty()) {
            academicContext = AcademicContext.builder()
                    .subject(subject)
                    .semester(semester)
                    .academicYear(academicYear)
                    .build();
            entityManager.persist(academicContext);
            log.info("🌱 Created new AcademicContext: subject={}, semester={}, year={}", subject, semester, academicYear);
        } else {
            academicContext = academicContexts.get(0);
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

        LocalDate deadline = request.getDeadline() != null ? request.getDeadline() : LocalDate.now().plusMonths(3);
        if (deadline.isBefore(LocalDate.now())) {
            throw new CustomException.BadRequestException("Hạn chót dự án không được ở trong quá khứ.");
        }

        // 4. Tạo và lưu thực thể Project
        Project project = Project.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : "")
                .type(projectType)
                .academicContext(academicContext)
                .startDate(LocalDate.now())
                .deadline(deadline)
                .status(ProjectStatus.PLANNING)
                .createdBy(creator)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        project = projectRepository.save(project);
        log.info("📁 Saved new Project entity with ID: {}", project.getId());

        // 5. Tìm vai trò PROJECT_LEADER
        ProjectRole leaderRole = projectRoleRepository.findByName("PROJECT_LEADER")
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Vai trò PROJECT_LEADER không tồn tại trong hệ thống."));

        // 6. Gán người tạo làm Leader của dự án
        ProjectMember leaderMember = ProjectMember.builder()
                .project(project)
                .user(creator)
                .role(leaderRole)
                .joinedAt(LocalDateTime.now())
                .invitedBy(creator)
                .build();

        projectMemberRepository.save(leaderMember);
        log.info("👑 Assigned user ID: {} as PROJECT_LEADER for project ID: {}", userId, project.getId());

        // Do project được query lại hoặc refresh để lấy members list đầy đủ cho việc mapping
        project.setMembers(List.of(leaderMember));

        return mapToProjectResponse(project, userId);
    }

    @Override
    @Transactional
    public ProjectResponse.MemberDto inviteMember(Long projectId, String email, Long invitedByUserId) {
        log.info("📩 Service request to invite member by email: {} to project ID: {} by user ID: {}", email, projectId, invitedByUserId);

        // Evict cache ngay khi có mutation
        evictUserProjectsCache(invitedByUserId);

        // 1. Kiểm tra dự án tồn tại
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Dự án không tồn tại."));

        // 2. Tìm tài khoản người mời
        UserAccount inviter = userAccountRepository.findById(invitedByUserId)
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Tài khoản người mời không tồn tại."));

        // 3. Tìm tài khoản người được mời bằng email
        UserAccount invitedUser = userAccountRepository.findByEmail(email.trim())
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Người dùng có email này không tồn tại trong hệ thống."));

        // 4. Kiểm tra xem người dùng đã là thành viên trong dự án chưa
        Optional<ProjectMember> existingMember = projectMemberRepository.findByProjectIdAndUserId(projectId, invitedUser.getId());
        if (existingMember.isPresent()) {
            throw new CustomException.BadRequestException("Người dùng đã là thành viên của dự án này.");
        }

        // 5. Tìm vai trò MEMBER
        ProjectRole memberRole = projectRoleRepository.findByName("MEMBER")
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Vai trò MEMBER không tồn tại trong hệ thống."));

        // 6. Tạo mới và lưu bản ghi thành viên dự án
        ProjectMember newMember = ProjectMember.builder()
                .project(project)
                .user(invitedUser)
                .role(memberRole)
                .joinedAt(LocalDateTime.now())
                .invitedBy(inviter)
                .build();

        projectMemberRepository.save(newMember);
        log.info("✨ Successfully added member ID: {} to project ID: {}", invitedUser.getId(), projectId);

        // 7. Trả về thông tin DTO của thành viên vừa được mời
        String name = invitedUser.getUsername();
        if (invitedUser.getProfile() != null && invitedUser.getProfile().getFullName() != null) {
            name = invitedUser.getProfile().getFullName();
        }

        return ProjectResponse.MemberDto.builder()
                .id(invitedUser.getId())
                .name(name)
                .build();
    }

    @Override
    @Transactional
    public void changeProjectLeader(Long projectId, Long newLeaderUserId, Long currentLeaderUserId) {
        log.info("🔄 Service request to change leader of project ID: {} from current leader ID: {} to new leader ID: {}",
                projectId, currentLeaderUserId, newLeaderUserId);

        // Evict cache ngay khi có mutation
        evictUserProjectsCache(currentLeaderUserId);
        evictUserProjectsCache(newLeaderUserId);

        // 1. Kiểm tra xem người yêu cầu có thực sự là PROJECT_LEADER hiện tại của dự án đó không
        ProjectMember currentMember = projectMemberRepository.findByProjectIdAndUserId(projectId, currentLeaderUserId)
                .orElseThrow(() -> new CustomException("Bạn không phải là thành viên của dự án này.", HttpStatus.FORBIDDEN));

        if (!"PROJECT_LEADER".equalsIgnoreCase(currentMember.getRole().getName())) {
            throw new CustomException("Bạn không có quyền thay đổi Leader của dự án này.", HttpStatus.FORBIDDEN);
        }

        // 2. Kiểm tra xem thành viên mới được ứng cử có thuộc dự án không
        ProjectMember newLeaderMember = projectMemberRepository.findByProjectIdAndUserId(projectId, newLeaderUserId)
                .orElseThrow(() -> new CustomException.BadRequestException("Thành viên được chọn không thuộc dự án này."));

        // Nếu trùng nhau thì không cần đổi
        if (newLeaderUserId.equals(currentLeaderUserId)) {
            log.info("ℹ️ Current leader and new leader are the same user. No changes needed.");
            return;
        }

        // 3. Tìm 2 vai trò tương ứng từ DB
        ProjectRole leaderRole = projectRoleRepository.findByName("PROJECT_LEADER")
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Vai trò PROJECT_LEADER không tồn tại."));
        ProjectRole memberRole = projectRoleRepository.findByName("MEMBER")
                .orElseThrow(() -> new CustomException.ResourceNotFoundException("Vai trò MEMBER không tồn tại."));

        // 4. Hoán đổi vai trò nguyên tử
        currentMember.setRole(memberRole);
        newLeaderMember.setRole(leaderRole);

        projectMemberRepository.save(currentMember);
        projectMemberRepository.save(newLeaderMember);

        log.info("👑 Successfully swapped leader roles in project ID: {}. User ID: {} is now LEADER. User ID: {} is now MEMBER.",
                projectId, newLeaderUserId, currentLeaderUserId);
    }

    /**
     * Private helper: Build Redis cache key from query parameters.
     */
    private String buildCacheKey(Long userId, int page, int size, String status, String search, String sortBy) {
        return String.format("%s%d:p%d:s%d:%s:%s:%s",
                CACHE_PREFIX, userId, page, size,
                status != null && !status.trim().isEmpty() ? status.trim().toUpperCase() : "ALL",
                search != null && !search.trim().isEmpty() ? search.trim().toLowerCase() : "",
                sortBy != null ? sortBy.toLowerCase() : "recent");
    }

    /**
     * Private helper: Evict all cached pages for a specific user.
     * Called after any mutation (create, invite, change leader).
     */
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

    /**
     * Helper Method: Map thực thể Project sang ProjectResponse DTO.
     * Tái sử dụng tối đa logic map để tránh lặp code.
     */
    private ProjectResponse mapToProjectResponse(Project project, Long userId) {
        String localRole = "Member";
        List<ProjectResponse.MemberDto> memberDtos = new ArrayList<>();

        if (project.getMembers() != null) {
            for (ProjectMember member : project.getMembers()) {
                String name = member.getUser().getUsername();
                if (member.getUser().getProfile() != null && member.getUser().getProfile().getFullName() != null) {
                    name = member.getUser().getProfile().getFullName();
                }

                // Find the current logged-in user's role
                if (member.getUser().getId().equals(userId)) {
                    String roleName = member.getRole().getName();
                    if ("PROJECT_LEADER".equalsIgnoreCase(roleName)) {
                        localRole = "Project Leader";
                    } else if ("MENTOR".equalsIgnoreCase(roleName)) {
                        localRole = "Mentor";
                    }
                }

                memberDtos.add(ProjectResponse.MemberDto.builder()
                        .id(member.getUser().getId())
                        .name(name)
                        .build());
            }
        }

        return ProjectResponse.builder()
                .id(project.getId().toString())
                .title(project.getName())
                .major(project.getAcademicContext() != null ? project.getAcademicContext().getSubject() : project.getType().name())
                .status(project.getStatus().name())
                .semester(project.getAcademicContext() != null ? project.getAcademicContext().getSemester() : "Fall 2023")
                .role(localRole)
                .atRiskReqCount(project.getAtRiskReqCount())
                .deadline(project.getDeadline())
                .progress(project.getProgress())
                .aiInsight(project.getAiInsight() != null ? project.getAiInsight() : "On Track")
                .members(memberDtos)
                .build();
    }
}
