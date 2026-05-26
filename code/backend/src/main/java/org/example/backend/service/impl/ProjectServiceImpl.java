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
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.exception.BadRequestException;
import org.example.backend.repository.ProjectRepository;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.ProjectRoleRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.repository.ProjectInvitationRepository;
import org.example.backend.repository.NotificationRepository;
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

        // Nếu người tạo gọi thì cũng cho phép (trường hợp chưa có member)
        if (!isMember && project.getCreatedBy() != null && project.getCreatedBy().getId().equals(userId)) {
            isMember = true;
        }

        if (!isMember) {
            throw new CustomException("Bạn không có quyền truy cập dự án này.", HttpStatus.FORBIDDEN);
        }

        return mapToProjectResponse(project, userId);
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
            throw new BadRequestException("Hạn chót dự án không được ở trong quá khứ.");
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
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò PROJECT_LEADER không tồn tại trong hệ thống."));

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
        org.example.backend.config.NotificationWebSocketHandler.sendToUser(invitedUser.getId(), jsonPayload);

        // 7. Gửi Email
        String acceptLink = "http://localhost:5173/invite/accept?token=" + token;
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

        // Tìm vai trò MEMBER
        ProjectRole memberRole = projectRoleRepository.findByName("MEMBER")
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò MEMBER không tồn tại trong hệ thống."));

        // Add thành viên
        ProjectMember newMember = ProjectMember.builder()
                .project(invitation.getProject())
                .user(invitation.getInvitee())
                .role(memberRole)
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
                        org.example.backend.config.NotificationWebSocketHandler.sendToUser(inviterId, refreshPayload);
                        org.example.backend.config.NotificationWebSocketHandler.sendToUser(inviterId, notifPayload);
                    }
                }
            );
        } else {
            org.example.backend.config.NotificationWebSocketHandler.sendToUser(inviterId, refreshPayload);
            org.example.backend.config.NotificationWebSocketHandler.sendToUser(inviterId, notifPayload);
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

        // Chỉ cho phép PROJECT_LEADER xoá
        if (!"PROJECT_LEADER".equalsIgnoreCase(callingMember.getRole().getName())) {
            throw new CustomException("Chỉ Trưởng dự án mới có quyền xóa thành viên.", HttpStatus.FORBIDDEN);
        }

        // Không được phép tự xóa chính mình nếu mình là Leader (phải chuyển quyền trước)
        if (memberUserId.equals(callingUserId)) {
            throw new BadRequestException("Bạn đang là Trưởng dự án, vui lòng nhượng quyền trước khi rời dự án.");
        }

        // Không xóa ai đang là PROJECT_LEADER
        if ("PROJECT_LEADER".equalsIgnoreCase(targetMember.getRole().getName())) {
            throw new BadRequestException("Không thể xóa người đang giữ vai trò Trưởng dự án.");
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

        if (!"PROJECT_LEADER".equalsIgnoreCase(currentMember.getRole().getName())) {
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
        ProjectRole leaderRole = projectRoleRepository.findByName("PROJECT_LEADER")
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò PROJECT_LEADER không tồn tại."));
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

        if (!"PROJECT_LEADER".equalsIgnoreCase(callerMember.getRole().getName())) {
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

        Long creatorId = project.getCreatedBy() != null ? project.getCreatedBy().getId() : null;
        boolean hasLeader = false;
        boolean creatorFound = false;

        if (project.getMembers() != null) {
            for (ProjectMember member : project.getMembers()) {
                if ("PROJECT_LEADER".equalsIgnoreCase(member.getRole().getName())) {
                    hasLeader = true;
                }
                if (creatorId != null && member.getUser().getId().equals(creatorId)) {
                    creatorFound = true;
                }
            }
        }

        if (project.getMembers() != null) {
            for (ProjectMember member : project.getMembers()) {
                String name = member.getUser().getUsername();
                if (member.getUser().getProfile() != null && member.getUser().getProfile().getFullName() != null) {
                    name = member.getUser().getProfile().getFullName();
                }

                String roleName = member.getRole().getName();
                boolean isCreator = creatorId != null && member.getUser().getId().equals(creatorId);

                if (!hasLeader && isCreator) {
                    roleName = "PROJECT_LEADER";
                }

                if (member.getUser().getId().equals(userId)) {
                    if ("PROJECT_LEADER".equalsIgnoreCase(roleName)) {
                        localRole = "Project Leader";
                    } else if ("MENTOR".equalsIgnoreCase(roleName)) {
                        localRole = "Mentor";
                    }
                }

                memberDtos.add(ProjectResponse.MemberDto.builder()
                        .id(member.getUser().getId())
                        .name(name)
                        .role(roleName)
                        .build());
            }
        }

        if (!hasLeader && !creatorFound && project.getCreatedBy() != null) {
            UserAccount creator = project.getCreatedBy();
            String name = creator.getUsername();
            if (creator.getProfile() != null && creator.getProfile().getFullName() != null) {
                name = creator.getProfile().getFullName();
            }

            if (creator.getId().equals(userId)) {
                localRole = "Project Leader";
            }

            memberDtos.add(ProjectResponse.MemberDto.builder()
                    .id(creator.getId())
                    .name(name)
                    .role("PROJECT_LEADER")
                    .build());
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