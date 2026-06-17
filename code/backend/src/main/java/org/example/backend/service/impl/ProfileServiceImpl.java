package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.ProfileProjectRoleResponse;
import org.example.backend.dto.ProfileResponse;
import org.example.backend.dto.UpdateProfileRequest;
import org.example.backend.dto.ChangePasswordRequest;
import org.example.backend.dto.ProfileStatisticsResponse;
import org.example.backend.dto.CoWorkerResponse;
import org.example.backend.entity.ProjectMember;
import org.example.backend.entity.Task;
import org.example.backend.entity.UserAccount;
import org.example.backend.entity.UserProfile;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.*;
import org.example.backend.service.ProfileService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    private final UserAccountRepository userAccountRepository;
    private final UserProfileRepository userProfileRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final EvidenceRepository evidenceRepository;
    private final SlaActionLogRepository slaActionLogRepository;
    private final TaskPenaltyLogRepository taskPenaltyLogRepository;
    private final RecoveryPlanRepository recoveryPlanRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        UserProfile profile = user.getProfile();
        List<ProjectMember> memberships = projectMemberRepository.findByUserIdWithProjectAndRole(userId);

        List<ProfileProjectRoleResponse> projectRoles = memberships.stream()
                .map(pm -> ProfileProjectRoleResponse.builder()
                        .projectId(pm.getProject().getId())
                        .projectName(pm.getProject().getName())
                        .projectStatus(pm.getProject().getStatus() != null ? pm.getProject().getStatus().name() : null)
                        .roleName(pm.getRole() != null ? pm.getRole().getName() : null)
                        .joinedAt(pm.getJoinedAt())
                        .build())
                .collect(Collectors.toList());

        return ProfileResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(profile != null ? profile.getFullName() : user.getUsername())
                .avatarUrl(profile != null ? profile.getAvatarUrl() : null)
                .bio(profile != null ? profile.getBio() : null)
                .phone(profile != null ? profile.getPhone() : null)
                .systemRole(user.getSystemRole() != null ? user.getSystemRole().getName() : "USER")
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .projectRoles(projectRoles)
                .build();
    }

    @Override
    @Transactional
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            user.setProfile(profile);
        }

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            profile.setFullName(request.getFullName().trim());
        }
        profile.setAvatarUrl(request.getAvatarUrl());
        profile.setBio(request.getBio());
        profile.setPhone(request.getPhone());

        userProfileRepository.save(profile);

        return getProfile(userId);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Xác nhận mật khẩu mới không trùng khớp.");
        }

        UserAccount user = userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tài khoản không tồn tại."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userAccountRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public ProfileStatisticsResponse getProfileStatistics(Long userId) {
        if (!userAccountRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Tài khoản không tồn tại.");
        }

        List<ProjectMember> memberships;
        try {
            memberships = projectMemberRepository.findByUserIdWithProjectAndRole(userId);
            if (memberships == null) {
                memberships = java.util.Collections.emptyList();
            }
        } catch (Exception ex) {
            log.warn("Failed to calculate profile statistic: project memberships", ex);
            memberships = java.util.Collections.emptyList();
        }

        long totalProjects = memberships.size();
        long leaderProjects = memberships.stream()
                .filter(pm -> pm.getRole() != null && 
                        ("LEADER".equalsIgnoreCase(pm.getRole().getName()) || "PROJECT_LEADER".equalsIgnoreCase(pm.getRole().getName())))
                .count();
        long memberProjects = memberships.stream()
                .filter(pm -> pm.getRole() != null && "MEMBER".equalsIgnoreCase(pm.getRole().getName()))
                .count();

        long totalAssignedTasks = safeCount("totalAssignedTasks", () -> taskRepository.countTotalAssignedTasks(userId));
        
        List<Task> completedTasksList;
        try {
            completedTasksList = taskRepository.findCompletedTasksByUserId(userId);
            if (completedTasksList == null) {
                completedTasksList = java.util.Collections.emptyList();
            }
        } catch (Exception ex) {
            log.warn("Failed to calculate profile statistic: completedTasks", ex);
            completedTasksList = java.util.Collections.emptyList();
        }

        long completedTasks = completedTasksList.size();
        
        long onTimeCompletedTasks = 0;
        try {
            onTimeCompletedTasks = completedTasksList.stream()
                    .filter(t -> t.getDeadline() == null || t.getCompletedAt() == null || !t.getCompletedAt().toLocalDate().isAfter(t.getDeadline()))
                    .count();
        } catch (Exception ex) {
            log.warn("Failed to calculate profile statistic: onTimeCompletedTasks", ex);
        }

        long overdueTasks = safeCount("overdueTasks", () -> taskRepository.countOverdueTasks(userId));
        long uploadedEvidenceCount = safeCount("uploadedEvidenceCount", () -> evidenceRepository.countByUploadedByUserId(userId));
        long slaActionCount = safeCount("slaActionCount", () -> slaActionLogRepository.countActionsByRecipientId(userId));
        long slaWarningCount = safeCount("slaWarningCount", () -> slaActionLogRepository.countWarningsByRecipientId(userId));
        long penaltyCount = safeCount("penaltyCount", () -> taskPenaltyLogRepository.countByUserId(userId));
        long approvedRecoveryPlans = safeCount("approvedRecoveryPlans", () -> recoveryPlanRepository.countApprovedPlansByUserId(userId));
        long rejectedRecoveryPlans = safeCount("rejectedRecoveryPlans", () -> recoveryPlanRepository.countRejectedPlansByUserId(userId));

        return ProfileStatisticsResponse.builder()
                .totalProjects(totalProjects)
                .leaderProjects(leaderProjects)
                .memberProjects(memberProjects)
                .totalAssignedTasks(totalAssignedTasks)
                .completedTasks(completedTasks)
                .onTimeCompletedTasks(onTimeCompletedTasks)
                .overdueTasks(overdueTasks)
                .uploadedEvidenceCount(uploadedEvidenceCount)
                .slaActionCount(slaActionCount)
                .slaWarningCount(slaWarningCount)
                .penaltyCount(penaltyCount)
                .approvedRecoveryPlans(approvedRecoveryPlans)
                .rejectedRecoveryPlans(rejectedRecoveryPlans)
                .build();
    }

    private long safeCount(String fieldName, java.util.function.Supplier<Long> countSupplier) {
        try {
            Long result = countSupplier.get();
            return result != null ? result : 0L;
        } catch (Exception ex) {
            log.warn("Failed to calculate profile statistic: {}", fieldName, ex);
            return 0L;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<CoWorkerResponse> getCoWorkers(Long userId) {
        if (!userAccountRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Tài khoản không tồn tại.");
        }

        List<Object[]> results;
        try {
            results = projectMemberRepository.findCoWorkersByUserId(userId);
            if (results == null) {
                results = java.util.Collections.emptyList();
            }
        } catch (Exception ex) {
            log.warn("Failed to retrieve co-workers for user {}: {}", userId, ex.getMessage(), ex);
            results = java.util.Collections.emptyList();
        }

        return results.stream()
                .map(row -> {
                    Long coWorkerId = (Long) row[0];
                    String username = (String) row[1];
                    String email = (String) row[2];
                    String fullName = (String) row[3];
                    String avatarUrl = (String) row[4];
                    Long sharedCount = (Long) row[5];

                    return CoWorkerResponse.builder()
                            .userId(coWorkerId)
                            .username(username)
                            .email(email)
                            .fullName(fullName != null ? fullName : username)
                            .avatarUrl(avatarUrl)
                            .sharedProjectsCount(sharedCount != null ? sharedCount : 0L)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
