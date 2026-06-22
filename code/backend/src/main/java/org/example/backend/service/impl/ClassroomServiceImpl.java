package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ClassroomResponse;
import org.example.backend.dto.CreateClassroomRequest;
import org.example.backend.dto.PaginatedResponse;
import org.example.backend.entity.AcademicContext;
import org.example.backend.entity.AcademicSeason;
import org.example.backend.entity.UserAccount;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.AcademicContextRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.ClassroomService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.concurrent.TimeUnit;
import org.springframework.data.redis.core.StringRedisTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClassroomServiceImpl implements ClassroomService {

    private final AcademicContextRepository academicContextRepository;
    private final UserAccountRepository userAccountRepository;
    private final org.example.backend.repository.ProjectRepository projectRepository;
    private final org.example.backend.repository.ProjectRoleRepository projectRoleRepository;
    private final org.example.backend.util.ClassroomTokenUtil classroomTokenUtil;
    private final StringRedisTemplate stringRedisTemplate;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.redis.lock.classroom-join-prefix:lock:classroom_join:}")
    private String classroomJoinLockPrefix;

    @Override
    @Transactional
    public ClassroomResponse createClassroom(CreateClassroomRequest request, Long userId) {
        UserAccount owner = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));

        if (owner.getVerifyStatus() != org.example.backend.entity.VerifyStatus.VERIFIED && !"ADMIN".equals(owner.getSystemRole().getName())) {
            throw new BadRequestException("Chỉ những tài khoản đã được xác thực (Verified) mới có thể tạo Lớp học.");
        }

        AcademicSeason semester;
        try {
            semester = AcademicSeason.valueOf(request.getSemester().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Học kỳ không hợp lệ.");
        }

        int maxMembers = request.getMaxMembers();
        if (maxMembers > 50 || maxMembers < 5) {
            throw new BadRequestException("Số lượng thành viên tối đa phải từ 5 đến 50.");
        }

        AcademicContext classroom = AcademicContext.builder()
                .subject(request.getSubject().trim())
                .semester(semester)
                .academicYear(request.getAcademicYear() != null ? request.getAcademicYear() : "")
                .owner(owner)
                .maxMembers(maxMembers)
                .startDate(LocalDate.now())
                .build();

        AcademicContext savedClassroom = academicContextRepository.save(classroom);

        return mapToResponse(savedClassroom);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedResponse<ClassroomResponse> getMyClassrooms(Long userId, int page, int size, String semesterFilter, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());

        AcademicSeason seasonFilter = null;
        if (semesterFilter != null && !semesterFilter.isEmpty() && !semesterFilter.equalsIgnoreCase("all")) {
            try {
                // Front-end sends SP26, SU26, FA25 etc. 
                // We map them to the corresponding ENUM if possible, or frontend should send SPRING/SUMMER
                // For simplicity, let's assume frontend sends SPRING, SUMMER, FALL, PERSONAL
                seasonFilter = AcademicSeason.valueOf(semesterFilter.toUpperCase());
            } catch (Exception e) {
                // Ignore invalid semester filter
            }
        }

        Page<AcademicContext> classroomPage;
        if (seasonFilter != null || (search != null && !search.isEmpty())) {
            String searchQ = search == null ? "" : search;
            classroomPage = academicContextRepository.findByUserIdWithFilters(userId, seasonFilter, searchQ, pageable);
        } else {
            classroomPage = academicContextRepository.findByUserId(userId, pageable);
        }

        List<ClassroomResponse> content = classroomPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PaginatedResponse.<ClassroomResponse>builder()
                .items(content)
                .currentPage(classroomPage.getNumber())
                .pageSize(classroomPage.getSize())
                .totalItems(classroomPage.getTotalElements())
                .totalPages(classroomPage.getTotalPages())
                .hasMore(!classroomPage.isLast())
                .build();
    }

    @Override
    public String generateInviteLink(Long classroomId, Long userId) {
        AcademicContext ac = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại."));
        if (!ac.getOwner().getId().equals(userId)) {
            throw new org.example.backend.exception.CustomException("Chỉ người tạo lớp học mới có quyền tạo link mời.", org.springframework.http.HttpStatus.FORBIDDEN);
        }
        return classroomTokenUtil.generateToken(classroomId);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomResponse getClassroomFromToken(String token) {
        Long classroomId = classroomTokenUtil.decodeToken(token);
        if (classroomId == null) {
            throw new BadRequestException("Link mời không hợp lệ hoặc đã hết hạn.");
        }
        AcademicContext ac = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại."));
        return mapToResponse(ac);
    }

    @Override
    public void joinClassroom(String token, Long userId) {
        Long classroomId = classroomTokenUtil.decodeToken(token);
        if (classroomId == null) {
            throw new BadRequestException("Link mời không hợp lệ hoặc đã hết hạn.");
        }

        // 1. Xin khóa (Lock) từ Redis với TTL = 1 giây
        String lockKey = classroomJoinLockPrefix + classroomId;
        Boolean acquired = stringRedisTemplate.opsForValue().setIfAbsent(lockKey, "locked", 1, TimeUnit.SECONDS);

        if (Boolean.FALSE.equals(acquired)) {
            // Nếu không lấy được khóa -> Báo bận thay vì bắt đợi
            throw new BadRequestException("Hệ thống đang có nhiều người tham gia cùng lúc, vui lòng thử lại sau 1 giây!");
        }

        try {
            transactionTemplate.executeWithoutResult(status -> {
                AcademicContext ac = academicContextRepository.findById(classroomId)
                        .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại."));
                        
                UserAccount user = userAccountRepository.findById(userId)
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng."));
                        
                // Check if already enrolled
                boolean isEnrolled = ac.getEnrolledStudents().stream().anyMatch(u -> u.getId().equals(userId));
                if (!isEnrolled && !ac.getOwner().getId().equals(userId)) {
                    // 2. Kiểm tra giới hạn thành viên (quan trọng)
                    if (ac.getEnrolledStudents().size() >= ac.getMaxMembers()) {
                        throw new BadRequestException("Lớp học đã đủ số lượng thành viên (" + ac.getMaxMembers() + ").");
                    }
                    
                    ac.getEnrolledStudents().add(user);
                    academicContextRepository.save(ac);
                }
            });
        } finally {
            // 3. Trả lại khóa khi xong việc
            stringRedisTemplate.delete(lockKey);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomResponse getClassroomById(Long classroomId, Long userId) {
        AcademicContext ac = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại."));
                
        boolean isOwner = ac.getOwner().getId().equals(userId);
        boolean isEnrolled = ac.getEnrolledStudents().stream().anyMatch(u -> u.getId().equals(userId));
        
        if (!isOwner && !isEnrolled) {
            throw new org.example.backend.exception.CustomException("Bạn không có quyền xem lớp học này.", org.springframework.http.HttpStatus.FORBIDDEN);
        }
        
        ClassroomResponse response = mapToResponse(ac);
        
        // Fetch active projects only (hide ARCHIVED)
        List<org.example.backend.entity.Project> projects = projectRepository.findByAcademicContextId(classroomId).stream()
                .filter(p -> p.getStatus() != org.example.backend.entity.ProjectStatus.ARCHIVED)
                .collect(Collectors.toList());
        response.setProjectCount(projects.size());
        
        // Lấy số lượng thành viên tối đa của nhóm từ cấu hình lần phân nhóm trước (mặc định là 5 nếu chưa có nhóm nào)
        Integer maxMembersPerGroup = 5;
        if (!projects.isEmpty() && projects.get(0).getMaxMembers() != null) {
            maxMembersPerGroup = projects.get(0).getMaxMembers();
        }
        response.setMaxMembersPerGroup(maxMembersPerGroup);
        
        // Map projects
        List<ClassroomResponse.ProjectSummaryDto> projectDtos = projects.stream().map(p -> {
            ClassroomResponse.ProjectSummaryDto dto = new ClassroomResponse.ProjectSummaryDto();
            dto.setId(p.getId());
            dto.setName(p.getName());
            dto.setDescription(p.getDescription());
            dto.setStatus(p.getStatus().name());
            dto.setCompletion(p.getProgress());
            dto.setUpdatedAt(p.getUpdatedAt().toString()); // Simplify for now
            
            // Map members
            List<ClassroomResponse.ProjectMemberDto> members = p.getMembers().stream().map(pm -> {
                ClassroomResponse.ProjectMemberDto mDto = new ClassroomResponse.ProjectMemberDto();
                mDto.setId(pm.getUser().getId());
                mDto.setFullName(pm.getUser().getProfile() != null ? pm.getUser().getProfile().getFullName() : pm.getUser().getUsername());
                return mDto;
            }).collect(Collectors.toList());
            dto.setMembers(members);
            
            return dto;
        }).collect(Collectors.toList());
        
        response.setProjects(projectDtos);

        // Map class members
        List<ClassroomResponse.ClassroomMemberDto> memberDtos = ac.getEnrolledStudents().stream().map(u -> {
            ClassroomResponse.ClassroomMemberDto mDto = new ClassroomResponse.ClassroomMemberDto();
            mDto.setId(u.getId());
            mDto.setFullName(u.getProfile() != null ? u.getProfile().getFullName() : u.getUsername());
            mDto.setUsername(u.getUsername());
            mDto.setEmail(u.getEmail());
            mDto.setSystemRole(u.getSystemRole() != null ? u.getSystemRole().getName() : "USER");
            mDto.setAvatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null);
            mDto.setProjectRole("Member"); // Default
            
            // Find project participation
            projects.forEach(p -> {
                p.getMembers().stream()
                 .filter(pm -> pm.getUser().getId().equals(u.getId()))
                 .findFirst()
                 .ifPresent(pm -> {
                     mDto.setProjectName(p.getName());
                     mDto.setProjectId(p.getId());
                     if (pm.getRole() != null && pm.getRole().getName() != null) {
                         mDto.setProjectRole(pm.getRole().getName());
                     }
                 });
            });
            
            return mDto;
        }).collect(Collectors.toList());
        response.setMembers(memberDtos);
        
        // Calculate stats
        ClassroomResponse.ClassroomStatsDto stats = new ClassroomResponse.ClassroomStatsDto();
        stats.setTeams(projects.size());
        stats.setStudents(ac.getEnrolledStudents().size());
        
        long onTrack = projects.stream().filter(p -> org.example.backend.entity.ProjectStatus.ACTIVE.equals(p.getStatus())).count();
        stats.setOnTrack((int)onTrack);
        if (projects.size() > 0) {
            stats.setOnTrackPercent((int) ((onTrack * 100) / projects.size()));
            double avgProgress = projects.stream().mapToInt(org.example.backend.entity.Project::getProgress).average().orElse(0);
            stats.setAvgProgress((int)avgProgress);
        }
        
        response.setStats(stats);
        
        return response;
    }

    private ClassroomResponse mapToResponse(AcademicContext ac) {
        java.util.List<ClassroomResponse.ClassroomMemberDto> previewMembers = ac.getEnrolledStudents().stream()
            .limit(3)
            .map(u -> ClassroomResponse.ClassroomMemberDto.builder()
                .id(u.getId())
                .fullName(u.getProfile() != null ? u.getProfile().getFullName() : u.getUsername())
                .avatarUrl(u.getProfile() != null ? u.getProfile().getAvatarUrl() : null)
                .build())
            .collect(Collectors.toList());

        return ClassroomResponse.builder()
                .id(ac.getId())
                .subject(ac.getSubject())
                .semester(ac.getSemester().name())
                .academicYear(ac.getAcademicYear())
                .status(ac.getStatus().name())
                .maxMembers(ac.getMaxMembers())
                .startDate(ac.getStartDate())
                .endDate(ac.getEndDate())
                .memberCount(ac.getEnrolledStudents().size()) // Count actual members
                .projectCount(0) // Logic to count projects if needed later
                .members(previewMembers)
                .owner(ClassroomResponse.OwnerDto.builder()
                        .id(ac.getOwner().getId())
                        .fullName(ac.getOwner().getProfile() != null ? ac.getOwner().getProfile().getFullName() : ac.getOwner().getUsername())
                        .email(ac.getOwner().getEmail())
                        .build())
                .build();
    }
    @Override
    @Transactional
    public void removeStudent(Long classroomId, Long studentId, Long requesterId) {
        AcademicContext ac = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại."));

        if (!ac.getOwner().getId().equals(requesterId)) {
            throw new org.example.backend.exception.CustomException("Bạn không có quyền xóa thành viên khỏi lớp học này.", org.springframework.http.HttpStatus.FORBIDDEN);
        }

        UserAccount student = userAccountRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh."));

        if (!ac.getEnrolledStudents().contains(student)) {
            throw new BadRequestException("Học sinh này không nằm trong lớp học.");
        }

        // Remove from projects in this classroom
        List<org.example.backend.entity.Project> projects = projectRepository.findByAcademicContextId(classroomId);
        for (org.example.backend.entity.Project project : projects) {
            boolean removed = project.getMembers().removeIf(pm -> pm.getUser().getId().equals(studentId));
            if (removed) {
                projectRepository.save(project);
            }
        }

        // Remove from classroom
        ac.getEnrolledStudents().remove(student);
        academicContextRepository.save(ac);
    }

    @Override
    @Transactional
    public void randomGroups(Long classroomId, org.example.backend.dto.request.RandomGroupRequest request, Long userId) {
        AcademicContext ac = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại."));

        if (!ac.getOwner().getId().equals(userId)) {
            throw new org.example.backend.exception.CustomException("Bạn không có quyền phân nhóm cho lớp học này.", org.springframework.http.HttpStatus.FORBIDDEN);
        }

        int membersPerGroup = request.getMembersPerGroup();
        List<org.example.backend.entity.Project> projects = projectRepository.findByAcademicContextId(classroomId).stream()
                .filter(p -> p.getStatus() != org.example.backend.entity.ProjectStatus.ARCHIVED)
                .collect(Collectors.toList());

        int maxExistingMembers = 0;
        for (org.example.backend.entity.Project p : projects) {
            long nonMentorCount = p.getMembers().stream()
                    .filter(pm -> pm.getRole() == null || !"MENTOR".equalsIgnoreCase(pm.getRole().getName()))
                    .count();
            if (nonMentorCount > maxExistingMembers) {
                maxExistingMembers = (int) nonMentorCount;
            }
        }

        if (maxExistingMembers > membersPerGroup) {
            throw new org.example.backend.exception.CustomException("Kích thước nhóm yêu cầu nhỏ hơn số lượng thành viên của các nhóm hiện tại. Vui lòng bấm 'Clear' (Giải tán toàn bộ nhóm) trước khi chia lại.", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        // Get unassigned students
        List<UserAccount> unassignedStudents = new java.util.ArrayList<>();
        for (UserAccount student : ac.getEnrolledStudents()) {
            boolean hasProject = false;
            for (org.example.backend.entity.Project p : projects) {
                if (p.getMembers().stream().anyMatch(pm -> pm.getUser().getId().equals(student.getId()))) {
                    hasProject = true;
                    break;
                }
            }
            if (!hasProject) {
                unassignedStudents.add(student);
            }
        }

        if (unassignedStudents.isEmpty()) {
            return; // Nothing to do
        }

        java.util.Collections.shuffle(unassignedStudents);

        org.example.backend.entity.ProjectRole memberRole = projectRoleRepository.findByName("MEMBER")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role MEMBER trong hệ thống."));
        org.example.backend.entity.ProjectRole leaderRole = projectRoleRepository.findByName("LEADER")
                .orElse(projectRoleRepository.findByName("PROJECT_LEADER")
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy role LEADER trong hệ thống.")));
        org.example.backend.entity.ProjectRole mentorRole = projectRoleRepository.findByName("MENTOR")
                .orElse(null);

        int studentIndex = 0;
        boolean anyModified = false;
        java.util.Set<Long> affectedUserIds = new java.util.HashSet<>();

        // Fill existing projects that are not full
        if (request.getIsOverwrite() != null && request.getIsOverwrite()) {
            for (org.example.backend.entity.Project project : projects) {
                int currentSize = (int) project.getMembers().stream()
                        .filter(pm -> pm.getRole() == null || !"MENTOR".equalsIgnoreCase(pm.getRole().getName()))
                        .count();
                boolean modified = false;

                if (project.getMaxMembers() == null || project.getMaxMembers() != membersPerGroup) {
                    project.setMaxMembers(membersPerGroup);
                    modified = true;
                }

                while (currentSize < membersPerGroup && studentIndex < unassignedStudents.size()) {
                    UserAccount student = unassignedStudents.get(studentIndex++);
                    affectedUserIds.add(student.getId());

                    boolean hasNonMentor = project.getMembers().stream()
                            .anyMatch(pm -> pm.getRole() != null && !pm.getRole().getName().equalsIgnoreCase("MENTOR"));
                    org.example.backend.entity.ProjectRole assignedRole = hasNonMentor ? memberRole : leaderRole;

                    org.example.backend.entity.ProjectMember pm = org.example.backend.entity.ProjectMember.builder()
                            .project(project)
                            .user(student)
                            .role(assignedRole)
                            .build();
                    project.getMembers().add(pm);
                    currentSize++;
                    modified = true;
                }
                if (modified) {
                    projectRepository.save(project);
                    anyModified = true;
                }
                if (studentIndex >= unassignedStudents.size()) {
                    break;
                }
            }
        }

        // Create new projects for remaining students
        int nextGroupNumber = projects.size() + 1;
        while (studentIndex < unassignedStudents.size()) {
            org.example.backend.entity.Project newProject = org.example.backend.entity.Project.builder()
                    .name(ac.getSubject() + "-Group-" + nextGroupNumber)
                    .description("Randomly generated group")
                    .type(org.example.backend.entity.ProjectType.WEB_APP)
                    .academicContext(ac)
                    .startDate(java.time.LocalDate.now())
                    .deadline(java.time.LocalDate.now().plusMonths(3))
                    .status(org.example.backend.entity.ProjectStatus.PLANNING)
                    .createdBy(ac.getOwner())
                    .maxMembers(membersPerGroup)
                    .members(new java.util.ArrayList<>())
                    .build();

            if (mentorRole != null) {
                org.example.backend.entity.ProjectMember mentorPm = org.example.backend.entity.ProjectMember.builder()
                        .project(newProject)
                        .user(ac.getOwner())
                        .role(mentorRole)
                        .build();
                newProject.getMembers().add(mentorPm);
            }

            int added = 0;
            while (added < membersPerGroup && studentIndex < unassignedStudents.size()) {
                UserAccount student = unassignedStudents.get(studentIndex++);
                affectedUserIds.add(student.getId());

                org.example.backend.entity.ProjectRole assignedRole = (added == 0) ? leaderRole : memberRole;

                org.example.backend.entity.ProjectMember pm = org.example.backend.entity.ProjectMember.builder()
                        .project(newProject)
                        .user(student)
                        .role(assignedRole)
                        .build();
                newProject.getMembers().add(pm);
                added++;
            }
            projectRepository.save(newProject);
            anyModified = true;
            nextGroupNumber++;
        }

        if (anyModified) {
            affectedUserIds.add(ac.getOwner().getId()); // Also evict Mentor's cache
            // Evict cache for all affected users so projects show up in My Projects immediately
            for (Long uid : affectedUserIds) {
                try {
                    java.util.Set<String> keys = stringRedisTemplate.keys("projects:user:" + uid + ":*");
                    if (keys != null && !keys.isEmpty()) {
                        stringRedisTemplate.delete(keys);
                    }
                } catch (Exception e) {
                    log.warn("Failed to evict Redis cache for user ID: {}", uid, e);
                }
            }
        }
    }

    @Override
    @Transactional
    public void clearAllGroups(Long classroomId, Long userId) {
        AcademicContext ac = academicContextRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp học không tồn tại."));

        if (!ac.getOwner().getId().equals(userId)) {
            throw new org.example.backend.exception.CustomException("Bạn không có quyền giải tán nhóm trong lớp học này.", org.springframework.http.HttpStatus.FORBIDDEN);
        }

        List<org.example.backend.entity.Project> projects = projectRepository.findByAcademicContextId(classroomId).stream()
                .filter(p -> p.getStatus() != org.example.backend.entity.ProjectStatus.ARCHIVED)
                .collect(Collectors.toList());

        if (projects.isEmpty()) {
            throw new org.example.backend.exception.CustomException("Hiện tại chưa có nhóm nào hoạt động để giải tán.", org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        java.util.Set<Long> affectedUserIds = new java.util.HashSet<>();
        affectedUserIds.add(ac.getOwner().getId());

        for (org.example.backend.entity.Project p : projects) {
            p.setStatus(org.example.backend.entity.ProjectStatus.ARCHIVED);
            if (p.getMembers() != null) {
                for (org.example.backend.entity.ProjectMember pm : p.getMembers()) {
                    affectedUserIds.add(pm.getUser().getId());
                }
            }
            projectRepository.save(p);
        }
        
        // Evict cache for all affected users
        for (Long uid : affectedUserIds) {
            try {
                java.util.Set<String> keys = stringRedisTemplate.keys("projects:user:" + uid + ":*");
                if (keys != null && !keys.isEmpty()) {
                    stringRedisTemplate.delete(keys);
                }
            } catch (Exception e) {
                log.warn("Failed to evict Redis cache for user ID: {}", uid, e);
            }
        }
        
        log.info("🗑️ Mentor ID: {} cleared all groups for classroom ID: {}", userId, classroomId);
    }
}
