// touched to trigger recompile
package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TaskProposalResponse;
import org.example.backend.entity.*;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.repository.*;
import org.example.backend.repository.mongo.TaskProposalRepository;
import org.example.backend.repository.mongo.TaskVoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Business logic for the Task Proposal & Comment discussion system.
 * Integrates with MongoDB and syncs approved checklists to PostgreSQL.
 */
import org.example.backend.service.github.GitHubApiService;

@Service
@RequiredArgsConstructor
public class TaskProposalService {

    private final TaskProposalRepository proposalRepo;
    private final TaskRepository taskRepo;
    private final UserAccountRepository userRepo;
    private final TaskChecklistRepository checklistRepo;
    private final ProjectMemberRepository projectMemberRepository;
    private final GitHubApiService gitHubApiService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final BugReportRepository bugReportRepo;
    private final TaskVoteRepository taskVoteRepo;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TaskProposalService.class);

    private static class ParseResult {
        String plainText;
        List<String> checklist = new java.util.ArrayList<>();
    }

    private ParseResult parseProposalContent(String content) {
        ParseResult result = new ParseResult();
        if (content == null || content.isBlank()) {
            result.plainText = "";
            return result;
        }
        String[] lines = content.split("\\r?\\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]")) {
                String itemText = trimmed.substring(5).trim();
                if (!itemText.isEmpty()) {
                    result.checklist.add(itemText);
                }
            } else {
                sb.append(line).append("\n");
            }
        }
        result.plainText = sb.toString().trim();
        return result;
    }

    private void broadcastProposalUpdate(Long taskId) {
        try {
            java.util.Map<String, Object> payload = java.util.Map.of(
                "type", "TASK_PROPOSAL_UPDATE",
                "taskId", taskId
            );
            String json = objectMapper.writeValueAsString(payload);
            org.example.backend.config.NotificationWebSocketHandler.broadcast(json);
            log.info("📢 Broadcasted TASK_PROPOSAL_UPDATE for Task ID: {}", taskId);
        } catch (Exception e) {
            log.error("Failed to broadcast TASK_PROPOSAL_UPDATE via WebSocket: {}", e.getMessage(), e);
        }
    }

    // ─── Read ────────────────────────────────────────────────────────────────

    public List<TaskProposalResponse> getProposalsByTask(Long taskId, Long currentUserId) {
        return proposalRepo.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(p -> toResponse(p, currentUserId))
                .collect(Collectors.toList());
    }

    // ─── Create proposal ────────────────────────────────────────────────────

    public TaskProposalResponse createProposal(Long taskId, String content, Long currentUserId) {
        boolean taskExists = taskRepo.existsById(taskId);
        boolean bugExists = bugReportRepo.existsById(taskId);
        if (!taskExists && !bugExists) {
            throw new IllegalArgumentException("Task or Bug Report not found: " + taskId);
        }
        UserAccount author = userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        String creatorName = author.getProfile() != null
                ? author.getProfile().getFullName()
                : author.getUsername();

        TaskProposal proposal = TaskProposal.builder()
                .taskId(taskId)
                .content(content.trim())
                .createdById(currentUserId)
                .createdByName(creatorName)
                .build();

        proposalRepo.save(proposal);
        broadcastProposalUpdate(taskId);
        return toResponse(proposal, currentUserId);
    }

    // ─── Vote ────────────────────────────────────────────────────────────────

    public TaskProposalResponse vote(String proposalId, boolean isUpvote, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));
        userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        Optional<TaskProposal.ProposalVote> existing = proposal.getVotes().stream()
                .filter(v -> v.getUserId().equals(currentUserId))
                .findFirst();

        if (existing.isPresent()) {
            TaskProposal.ProposalVote vote = existing.get();
            if (vote.isUpvote() == isUpvote) {
                // Same direction → undo (remove)
                proposal.getVotes().remove(vote);
            } else {
                // Different direction → switch
                vote.setUpvote(isUpvote);
            }
        } else {
            // Create
            TaskProposal.ProposalVote vote = TaskProposal.ProposalVote.builder()
                    .userId(currentUserId)
                    .isUpvote(isUpvote)
                    .build();
            proposal.getVotes().add(vote);
        }

        proposalRepo.save(proposal);
        broadcastProposalUpdate(proposal.getTaskId());
        return toResponse(proposal, currentUserId);
    }

    // ─── Add comment ─────────────────────────────────────────────────────────

    public TaskProposalResponse addComment(String proposalId, String content, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));
        UserAccount author = userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        String creatorName = author.getProfile() != null
                ? author.getProfile().getFullName()
                : author.getUsername();

        TaskProposal.ProposalComment comment = TaskProposal.ProposalComment.builder()
                .id(UUID.randomUUID().toString())
                .content(content.trim())
                .createdById(currentUserId)
                .createdByName(creatorName)
                .build();

        proposal.getComments().add(comment);
        proposalRepo.save(proposal);
        broadcastProposalUpdate(proposal.getTaskId());
        return toResponse(proposal, currentUserId);
    }

    // ─── Approve / Reject ────────────────────────────────────────────────────

    @Transactional
    public TaskProposalResponse approveProposal(String proposalId, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        java.util.Optional<Task> taskOpt = taskRepo.findById(proposal.getTaskId());
        Task task = taskOpt.orElse(null);
        Long projectId;
        if (task != null) {
            projectId = task.getProject().getId();
        } else {
            java.util.Optional<BugReport> bugOpt = bugReportRepo.findById(proposal.getTaskId());
            if (!bugOpt.isPresent()) {
                throw new IllegalArgumentException("Task or Bug Report not found: " + proposal.getTaskId());
            }
            projectId = bugOpt.get().getProject().getId();
        }

        List<ProjectMember> pmList = projectMemberRepository.findByProjectId(projectId);
        java.util.Set<Long> mentorUserIds = pmList.stream()
                .filter(pm -> pm.getRole() != null && "MENTOR".equalsIgnoreCase(pm.getRole().getName()))
                .map(pm -> pm.getUser().getId())
                .collect(Collectors.toSet());

        long upvotes = proposal.getVotes().stream()
                .filter(v -> !mentorUserIds.contains(v.getUserId()))
                .filter(TaskProposal.ProposalVote::isUpvote)
                .count();

        long downvotes = proposal.getVotes().stream()
                .filter(v -> !mentorUserIds.contains(v.getUserId()))
                .filter(v -> !v.isUpvote())
                .count();

        if (upvotes <= downvotes) {
            throw new org.example.backend.exception.CustomException(
                    "Proposals can only be approved when upvotes exceed downvotes.",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        long totalNonMentorMembers = pmList.size() - mentorUserIds.size();
        long totalNonMentorVotes = upvotes + downvotes;

        if (3 * totalNonMentorVotes <= 2 * totalNonMentorMembers) {
            throw new org.example.backend.exception.CustomException(
                    "Proposals cannot be approved until at least 2/3 of the project members have voted.",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        List<String> itemsToAdd = new java.util.ArrayList<>();
        String[] lines = proposal.getContent().split("\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]")) {
                String itemText = trimmed.substring(5).trim();
                if (!itemText.isEmpty()) {
                    itemsToAdd.add(itemText);
                }
            }
        }

        if (itemsToAdd.isEmpty()) {
            throw new org.example.backend.exception.CustomException(
                    "Proposals must contain at least one checklist item (starting with '- [ ]' or '- [x]').",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        proposal.setStatus(ProposalStatus.APPROVED);

        if (task != null) {
            for (String content : itemsToAdd) {
                boolean alreadyInChecklist = task.getChecklist()
                        .stream()
                        .anyMatch(c -> c.getContent().equals(content));

                if (!alreadyInChecklist) {
                    int nextIndex = task.getChecklist().size();
                    TaskChecklist newItem = TaskChecklist.builder()
                            .task(task)
                            .content(content)
                            .done(false)
                            .orderIndex(nextIndex)
                            .build();
                    task.getChecklist().add(newItem);
                }
            }
            taskRepo.save(task);
        }

        proposalRepo.save(proposal);
        broadcastProposalUpdate(proposal.getTaskId());
        return toResponse(proposal, currentUserId);
    }

    public TaskProposalResponse rejectProposal(String proposalId, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        proposal.setStatus(ProposalStatus.REJECTED);
        proposalRepo.save(proposal);
        broadcastProposalUpdate(proposal.getTaskId());
        return toResponse(proposal, currentUserId);
    }

    public TaskProposalResponse updateProposal(String proposalId, String content, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        if (proposal.getCreatedById() == null) {
            proposal.setCreatedById(currentUserId);
        } else if (!proposal.getCreatedById().equals(currentUserId)) {
            throw new org.example.backend.exception.CustomException(
                    "You do not have permission to edit this proposal.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        proposal.setContent(content.trim());
        proposal.setUpdatedAt(java.time.LocalDateTime.now());
        proposalRepo.save(proposal);
        broadcastProposalUpdate(proposal.getTaskId());
        return toResponse(proposal, currentUserId);
    }

    @Transactional
    public void approveAndSyncTask(Long taskId, Long currentUserId) {
        Task task = taskRepo.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));

        if (task.getParent() == null) {
            long totalMembers = projectMemberRepository.findByProjectId(task.getProject().getId()).size();
            long upvotes = taskVoteRepo.countByTaskIdAndIsUpvote(taskId, true);
            long downvotes = taskVoteRepo.countByTaskIdAndIsUpvote(taskId, false);
            long totalVotes = upvotes + downvotes;

            if (3 * downvotes > 2 * totalMembers) {
                throw new org.example.backend.exception.CustomException(
                        "More than 2/3 of members voted down this proposal. Please discuss further to reach a consensus.",
                        org.springframework.http.HttpStatus.BAD_REQUEST);
            }

            if (3 * totalVotes <= 2 * totalMembers || upvotes <= downvotes) {
                throw new org.example.backend.exception.CustomException(
                        "The proposal must have more than 2/3 of the team participating in the vote and be approved by the majority to be approved.",
                        org.springframework.http.HttpStatus.BAD_REQUEST);
            }
        }

        UserAccount currentUser = userRepo.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUserId));

        // 1. Only sync proposals that have already been individually APPROVED.
        //    Do NOT auto-approve PENDING proposals — each proposal must be approved separately first.
        List<TaskProposal> approvedProposals = proposalRepo.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .filter(p -> p.getStatus() == ProposalStatus.APPROVED)
                .collect(Collectors.toList());

        boolean isBlankIssue = task.getDescription() != null && task.getDescription().contains("<!-- sync-source: github-blank");

        if (approvedProposals.isEmpty() && !isBlankIssue) {
            throw new org.example.backend.exception.CustomException(
                    "No proposals have been approved yet. Please approve at least one proposal before syncing to GitHub.",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        // 2. Sync to GitHub & update status
        if (task.getType() == TaskType.BUG_FIX) {
            // BUG_FIX Task is associated with a BugReport. Promote BugReport from DRAFT -> OPEN.
            BugReport bug = bugReportRepo.findByRelatedTaskId(taskId).orElse(null);
            if (bug != null) {
                if (bug.getStatus() == BugStatus.DRAFT) {
                    bug.setStatus(BugStatus.OPEN);
                    bugReportRepo.save(bug);
                }
                
                // Retrieve issue number from task, or try to restore it from bug report metadata
                Integer existingIssueNum = task.getGithubIssueNumber();
                if (existingIssueNum == null && bug.getStepsToReproduce() != null) {
                    try {
                        java.util.Map<?, ?> meta = objectMapper.readValue(bug.getStepsToReproduce(), java.util.Map.class);
                        Object num = meta.get("github_issue_number");
                        if (num instanceof Number) {
                            existingIssueNum = ((Number) num).intValue();
                            task.setGithubIssueNumber(existingIssueNum);
                            Object urlObj = meta.get("github_issue_url");
                            if (urlObj != null) {
                                task.setGithubIssueUrl(urlObj.toString());
                            }
                            taskRepo.save(task);
                            log.info("Restored GitHub Issue #{} metadata to Task ID: {} from associated BugReport", existingIssueNum, task.getId());
                        }
                    } catch (Exception ignored) {}
                }

                // Sync the BugReport to GitHub if it does not have an issue yet
                if (existingIssueNum == null) {
                    try {
                        gitHubApiService.createGitHubIssue(bug, currentUserId);
                    } catch (Exception e) {
                        log.error("Failed to sync approved Bug Report to GitHub ID: {}", bug.getId(), e);
                        throw new org.example.backend.exception.CustomException(
                                "Đồng bộ Bug Report lên GitHub thất bại: " + e.getMessage(),
                                org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
                    }
                }
            }
        } else {
            // Regular Feature / Task
            if (task.getGithubIssueNumber() == null) {
                try {
                    gitHubApiService.createGitHubIssueForTask(task, currentUserId);
                } catch (Exception e) {
                    log.error("Failed to create GitHub Issue for parent task ID: {}", task.getId(), e);
                    throw new org.example.backend.exception.CustomException(
                            "Đồng bộ Task cha lên GitHub thất bại: " + e.getMessage(),
                            org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
        }

        // Update parent task status to TODO (so it appears on the Kanban Board and Open columns)
        task.setStatus(TaskStatus.TODO);
        if (task.getDescription() != null) {
            if (task.getDescription().contains("<!-- sync-source: github-blank-draft -->")) {
                task.setDescription(task.getDescription().replace("<!-- sync-source: github-blank-draft -->", "<!-- sync-source: github-blank-approved -->"));
            } else if (task.getDescription().contains("<!-- sync-source: feature-proposal-draft -->")) {
                task.setDescription(task.getDescription().replace("<!-- sync-source: feature-proposal-draft -->", "<!-- sync-source: feature-proposal-approved -->"));
            }
        }
        taskRepo.save(task);


        // 3. For each APPROVED proposal, convert to a sub-task
        for (TaskProposal p : approvedProposals) {
            ParseResult parseResult = parseProposalContent(p.getContent());
            String plainTitle = parseResult.plainText;
            if (plainTitle == null || plainTitle.isBlank()) {
                plainTitle = "Đề xuất checklist";
            }
            final String finalTitle = plainTitle;
            boolean subTaskExists = taskRepo.findByParentId(taskId).stream()
                    .anyMatch(sub -> sub.getTitle().equals(finalTitle) || sub.getTitle().equals("[Sub-task] " + finalTitle));

            if (!subTaskExists) {
                // Create Sub-task
                Task subTask = Task.builder()
                        .project(task.getProject())
                        .createdBy(currentUser)
                        .parent(task)
                        .title(finalTitle)
                        .type(TaskType.DEVELOPMENT)
                        .priority(Priority.MEDIUM)
                        .startDate(java.time.LocalDate.now())
                        .deadline(task.getDeadline() != null ? task.getDeadline() : java.time.LocalDate.now().plusDays(7))
                        .weight(java.math.BigDecimal.ONE)
                        .status(TaskStatus.TODO)
                        .checklist(new java.util.ArrayList<>())
                        .build();

                int order = 0;
                for (String content : parseResult.checklist) {
                    TaskChecklist newItem = TaskChecklist.builder()
                            .task(subTask)
                            .content(content)
                            .done(false)
                            .orderIndex(order++)
                            .build();
                    subTask.getChecklist().add(newItem);
                }

                Task savedSub = taskRepo.save(subTask);

                // Sync sub-task to GitHub
                try {
                    gitHubApiService.createGitHubIssueForTask(savedSub, currentUserId);
                } catch (Exception e) {
                    log.error("Failed to sync sub-task to GitHub ID: {}", savedSub.getId(), e);
                    throw new org.example.backend.exception.CustomException(
                            "Đồng bộ sub-task '" + finalTitle + "' lên GitHub thất bại: " + e.getMessage(),
                            org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
        }

        // 4. Update parent task GitHub Issue body (to show sub-tasks list)
        try {
            gitHubApiService.updateGitHubIssueStatusForTask(task, currentUserId);
        } catch (Exception e) {
            log.error("Failed to update parent task body on GitHub ID: {}", task.getId(), e);
            throw new org.example.backend.exception.CustomException(
                    "Cập nhật nội dung Task cha trên GitHub thất bại: " + e.getMessage(),
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Broadcast WebSockets
        broadcastProposalUpdate(taskId);
        
        try {
            String wsMessage = String.format("{\"type\":\"REFRESH_BUGS\",\"projectId\":%d}", task.getProject().getId());
            org.example.backend.config.NotificationWebSocketHandler.broadcast(wsMessage);
            log.info("📢 Broadcasted REFRESH_BUGS via WS for task conversion. Project ID: {}", task.getProject().getId());
        } catch (Exception e) {
            log.error("Failed to broadcast REFRESH_BUGS event for Project ID: {}", task.getProject().getId(), e);
        }
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private TaskProposalResponse toResponse(TaskProposal p, Long currentUserId) {
        long up = p.getVotes().stream().filter(TaskProposal.ProposalVote::isUpvote).count();
        long down = p.getVotes().stream().filter(v -> !v.isUpvote()).count();

        String myVote = null;
        if (currentUserId != null) {
            myVote = p.getVotes().stream()
                    .filter(v -> v.getUserId().equals(currentUserId))
                    .map(v -> v.isUpvote() ? "UP" : "DOWN")
                    .findFirst()
                    .orElse(null);
        }

        List<TaskProposalResponse.TaskProposalCommentResponse> commentDtos = p.getComments()
                .stream()
                .map(c -> TaskProposalResponse.TaskProposalCommentResponse.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .createdById(c.getCreatedById())
                        .createdByName(c.getCreatedByName())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return TaskProposalResponse.builder()
                .id(p.getId())
                .taskId(p.getTaskId())
                .content(p.getContent())
                .status(p.getStatus())
                .createdById(p.getCreatedById())
                .createdByName(p.getCreatedByName())
                .createdAt(p.getCreatedAt())
                .upvotes((int) up)
                .downvotes((int) down)
                .myVote(myVote)
                .comments(commentDtos)
                .build();
    }
}
