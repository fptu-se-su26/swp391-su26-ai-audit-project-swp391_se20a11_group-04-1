package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.CodeInsightEvidenceSearchResponse;
import org.example.backend.dto.CodeInsightManualEvidenceLinkRequest;
import org.example.backend.dto.CodeInsightManualEvidenceLinkResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.CodeInsightManualEvidenceLinkService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CodeInsightManualEvidenceLinkServiceImpl implements CodeInsightManualEvidenceLinkService {

    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final UserAccountRepository userAccountRepository;
    private final CodeInsightManualEvidenceLinkRepository manualLinkRepository;
    private final GitHubPullRequestRepository pullRequestRepository;
    private final GitHubCommitRepository commitRepository;
    private final GitHubCheckRunRepository checkRunRepository;

    @Override
    @Transactional(readOnly = true)
    public List<CodeInsightManualEvidenceLinkResponse> list(Long projectId, Long taskId, Long userId) {
        requireProjectMember(projectId, userId);
        Task task = requireTask(projectId, taskId);
        return manualLinkRepository.findByTaskIdOrderByCreatedAtDesc(task.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CodeInsightManualEvidenceLinkResponse suggest(
            Long projectId,
            Long taskId,
            CodeInsightManualEvidenceLinkRequest request,
            Long userId) {
        ProjectMember member = requireProjectMember(projectId, userId);
        Task task = requireTask(projectId, taskId);
        if (!isLeader(member) && !isAssignee(task, userId)) {
            throw new CustomException("Only task assignee or project leader can suggest manual evidence", HttpStatus.FORBIDDEN);
        }
        if (request == null || request.getEvidenceId() == null) {
            throw new BadRequestException("Evidence id is required");
        }
        CodeInsightEvidenceType type = parseEvidenceType(request.getEvidenceType());
        ensureEvidenceExists(projectId, type, request.getEvidenceId());

        UserAccount actor = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        CodeInsightManualEvidenceLink link = manualLinkRepository
                .findByProjectIdAndTaskIdAndEvidenceTypeAndEvidenceId(projectId, taskId, type, request.getEvidenceId())
                .orElseGet(CodeInsightManualEvidenceLink::new);
        link.setProject(task.getProject());
        link.setTask(task);
        link.setEvidenceType(type);
        link.setEvidenceId(request.getEvidenceId());
        link.setSuggestedBy(actor);
        link.setReason(trim(request.getReason()));
        link.setStatus(isLeader(member)
                ? CodeInsightManualEvidenceLinkStatus.CONFIRMED
                : CodeInsightManualEvidenceLinkStatus.PENDING);
        link.setConfirmedBy(isLeader(member) ? actor : null);
        link.setUpdatedAt(LocalDateTime.now());
        return toResponse(manualLinkRepository.save(link));
    }

    @Override
    @Transactional
    public CodeInsightManualEvidenceLinkResponse confirm(Long projectId, Long taskId, Long linkId, Long userId) {
        requireLeader(projectId, userId);
        requireTask(projectId, taskId);
        CodeInsightManualEvidenceLink link = requireLink(projectId, taskId, linkId);
        UserAccount actor = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));
        link.setStatus(CodeInsightManualEvidenceLinkStatus.CONFIRMED);
        link.setConfirmedBy(actor);
        return toResponse(manualLinkRepository.save(link));
    }

    @Override
    @Transactional
    public CodeInsightManualEvidenceLinkResponse reject(Long projectId, Long taskId, Long linkId, Long userId) {
        requireLeader(projectId, userId);
        requireTask(projectId, taskId);
        CodeInsightManualEvidenceLink link = requireLink(projectId, taskId, linkId);
        link.setStatus(CodeInsightManualEvidenceLinkStatus.REJECTED);
        link.setConfirmedBy(null);
        return toResponse(manualLinkRepository.save(link));
    }

    @Override
    @Transactional(readOnly = true)
    public CodeInsightEvidenceSearchResponse search(Long projectId, String evidenceType, String query, Long userId) {
        requireProjectMember(projectId, userId);
        CodeInsightEvidenceType type = parseEvidenceType(evidenceType);
        String q = query == null ? "" : query.trim();
        List<CodeInsightEvidenceSearchResponse.ResultItem> results = new ArrayList<>();
        if (type == CodeInsightEvidenceType.PULL_REQUEST) {
            (q.isEmpty()
                    ? pullRequestRepository.findTop20ByProjectIdOrderByUpdatedAtDesc(projectId)
                    : pullRequestRepository.findTop20ByProjectIdAndTitleContainingIgnoreCaseOrderByUpdatedAtDesc(projectId, q))
                    .forEach(pr -> results.add(CodeInsightEvidenceSearchResponse.ResultItem.builder()
                            .id(pr.getId())
                            .evidenceType("PULL_REQUEST")
                            .title("#" + pr.getPrNumber() + " " + nullToEmpty(pr.getTitle()))
                            .subtitle(nullToEmpty(pr.getState()) + " | " + nullToEmpty(pr.getHeadBranch()))
                            .reference(String.valueOf(pr.getPrNumber()))
                            .url(pr.getUrl())
                            .occurredAt(pr.getUpdatedAt())
                            .build()));
        } else if (type == CodeInsightEvidenceType.COMMIT) {
            List<GitHubCommit> commits = q.isEmpty()
                    ? commitRepository.findTop20ByProjectIdOrderByUpdatedAtDesc(projectId)
                    : commitRepository.findTop20ByProjectIdAndShaStartingWithIgnoreCaseOrderByUpdatedAtDesc(projectId, q);
            if (commits.isEmpty() && !q.isEmpty()) {
                commits = commitRepository.findTop20ByProjectIdAndMessageContainingIgnoreCaseOrderByUpdatedAtDesc(projectId, q);
            }
            commits.forEach(commit -> results.add(CodeInsightEvidenceSearchResponse.ResultItem.builder()
                    .id(commit.getId())
                    .evidenceType("COMMIT")
                    .title(shortSha(commit.getSha()) + " - " + nullToEmpty(commit.getMessage()))
                    .subtitle(nullToEmpty(commit.getBranchName()) + " | " + nullToEmpty(commit.getAuthorLogin()))
                    .reference(commit.getSha())
                    .url(commit.getUrl())
                    .occurredAt(commit.getCommittedAt())
                    .build()));
        } else if (type == CodeInsightEvidenceType.CHECK_RUN) {
            (q.isEmpty()
                    ? checkRunRepository.findTop20ByProjectIdOrderByUpdatedAtDesc(projectId)
                    : checkRunRepository.findTop20ByProjectIdAndNameContainingIgnoreCaseOrderByUpdatedAtDesc(projectId, q))
                    .forEach(check -> results.add(CodeInsightEvidenceSearchResponse.ResultItem.builder()
                            .id(check.getId())
                            .evidenceType("CHECK_RUN")
                            .title(nullToEmpty(check.getName()))
                            .subtitle(nullToEmpty(check.getStatus()) + " / " + nullToEmpty(check.getConclusion()))
                            .reference(check.getExternalId())
                            .url(check.getUrl())
                            .occurredAt(check.getCompletedAt())
                            .build()));
        }
        return CodeInsightEvidenceSearchResponse.builder().results(results).build();
    }

    private ProjectMember requireProjectMember(Long projectId, Long userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You do not have access to this project", HttpStatus.FORBIDDEN));
    }

    private void requireLeader(Long projectId, Long userId) {
        if (!isLeader(requireProjectMember(projectId, userId))) {
            throw new CustomException("Only project leader can confirm manual evidence", HttpStatus.FORBIDDEN);
        }
    }

    private Task requireTask(Long projectId, Long taskId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new CustomException("Task not found", HttpStatus.NOT_FOUND));
        if (task.getProject() == null || !projectId.equals(task.getProject().getId())) {
            throw new BadRequestException("Task does not belong to this project");
        }
        return task;
    }

    private CodeInsightManualEvidenceLink requireLink(Long projectId, Long taskId, Long linkId) {
        CodeInsightManualEvidenceLink link = manualLinkRepository.findById(linkId)
                .orElseThrow(() -> new CustomException("Manual evidence link not found", HttpStatus.NOT_FOUND));
        if (link.getProject() == null || !projectId.equals(link.getProject().getId())
                || link.getTask() == null || !taskId.equals(link.getTask().getId())) {
            throw new BadRequestException("Manual evidence link does not belong to this task");
        }
        return link;
    }

    private boolean isLeader(ProjectMember member) {
        String roleName = member.getRole() != null ? member.getRole().getName() : "";
        String normalized = roleName.toUpperCase(Locale.ROOT).replace(" ", "_");
        return normalized.equals("PROJECT_LEADER") || normalized.equals("LEADER") || normalized.contains("LEADER");
    }

    private boolean isAssignee(Task task, Long userId) {
        return task.getPrimaryAssignee() != null && userId.equals(task.getPrimaryAssignee().getId());
    }

    private CodeInsightEvidenceType parseEvidenceType(String value) {
        try {
            return CodeInsightEvidenceType.valueOf(value == null ? "" : value.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BadRequestException("Evidence type must be COMMIT, PULL_REQUEST, or CHECK_RUN");
        }
    }

    private void ensureEvidenceExists(Long projectId, CodeInsightEvidenceType type, Long evidenceId) {
        boolean exists = switch (type) {
            case COMMIT -> commitRepository.findById(evidenceId).filter(item -> projectId.equals(item.getProject().getId())).isPresent();
            case PULL_REQUEST -> pullRequestRepository.findById(evidenceId).filter(item -> projectId.equals(item.getProject().getId())).isPresent();
            case CHECK_RUN -> checkRunRepository.findById(evidenceId).filter(item -> projectId.equals(item.getProject().getId())).isPresent();
        };
        if (!exists) {
            throw new BadRequestException("Evidence item does not belong to this project");
        }
    }

    private CodeInsightManualEvidenceLinkResponse toResponse(CodeInsightManualEvidenceLink link) {
        return CodeInsightManualEvidenceLinkResponse.builder()
                .id(link.getId())
                .projectId(link.getProject() != null ? link.getProject().getId() : null)
                .taskId(link.getTask() != null ? link.getTask().getId() : null)
                .evidenceType(link.getEvidenceType() != null ? link.getEvidenceType().name() : null)
                .evidenceId(link.getEvidenceId())
                .status(link.getStatus() != null ? link.getStatus().name() : null)
                .reason(link.getReason())
                .suggestedBy(userSummary(link.getSuggestedBy()))
                .confirmedBy(userSummary(link.getConfirmedBy()))
                .createdAt(link.getCreatedAt())
                .updatedAt(link.getUpdatedAt())
                .build();
    }

    private CodeInsightManualEvidenceLinkResponse.UserSummary userSummary(UserAccount user) {
        if (user == null) return null;
        return CodeInsightManualEvidenceLinkResponse.UserSummary.builder()
                .id(user.getId())
                .name(displayName(user))
                .email(user.getEmail())
                .build();
    }

    private String displayName(UserAccount user) {
        if (user.getProfile() != null && hasText(user.getProfile().getFullName())) {
            return user.getProfile().getFullName();
        }
        return hasText(user.getUsername()) ? user.getUsername() : user.getEmail();
    }

    private String trim(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String shortSha(String sha) {
        return sha == null ? "" : sha.substring(0, Math.min(7, sha.length()));
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }
}
