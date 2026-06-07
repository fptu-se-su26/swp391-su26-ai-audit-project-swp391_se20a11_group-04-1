package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TaskProposalResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
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
@Service
@RequiredArgsConstructor
public class TaskProposalService {

    private final TaskProposalRepository proposalRepo;
    private final TaskRepository taskRepo;
    private final UserAccountRepository userRepo;
    private final TaskChecklistRepository checklistRepo;
    private final ProjectMemberRepository projectMemberRepository;

    // ─── Read ────────────────────────────────────────────────────────────────

    public List<TaskProposalResponse> getProposalsByTask(Long taskId, Long currentUserId) {
        return proposalRepo.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(p -> toResponse(p, currentUserId))
                .collect(Collectors.toList());
    }

    // ─── Create proposal ────────────────────────────────────────────────────

    public TaskProposalResponse createProposal(Long taskId, String content, Long currentUserId) {
        taskRepo.findById(taskId)
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + taskId));
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
        return toResponse(proposal, currentUserId);
    }

    // ─── Approve / Reject ────────────────────────────────────────────────────

    @Transactional
    public TaskProposalResponse approveProposal(String proposalId, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        long upvotes = proposal.getVotes().stream().filter(TaskProposal.ProposalVote::isUpvote).count();
        long downvotes = proposal.getVotes().stream().filter(v -> !v.isUpvote()).count();
        if (upvotes <= downvotes) {
            throw new org.example.backend.exception.CustomException(
                    "Đề xuất chỉ được duyệt khi số lượt tán thành nhiều hơn không tán thành.",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        // Fetch task from Postgres to append approved proposal to checklist
        Task task = taskRepo.findById(proposal.getTaskId())
                .orElseThrow(() -> new IllegalArgumentException("Task not found: " + proposal.getTaskId()));

        long totalMembers = projectMemberRepository.findByProjectId(task.getProject().getId()).size();
        long totalVotes = proposal.getVotes().size();
        if (3 * totalVotes <= 2 * totalMembers) {
            throw new org.example.backend.exception.CustomException(
                    "Đề xuất chưa thể duyệt do chưa đạt trên 2/3 thành viên trong nhóm tham gia vote.",
                    org.springframework.http.HttpStatus.BAD_REQUEST);
        }

        proposal.setStatus(ProposalStatus.APPROVED);

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

        if (itemsToAdd.isEmpty() && !proposal.getContent().trim().isEmpty()) {
            itemsToAdd.add(proposal.getContent().trim());
        }

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

        proposalRepo.save(proposal);
        return toResponse(proposal, currentUserId);
    }

    public TaskProposalResponse rejectProposal(String proposalId, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        proposal.setStatus(ProposalStatus.REJECTED);
        proposalRepo.save(proposal);
        return toResponse(proposal, currentUserId);
    }

    public TaskProposalResponse updateProposal(String proposalId, String content, Long currentUserId) {
        TaskProposal proposal = proposalRepo.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Proposal not found: " + proposalId));

        if (proposal.getCreatedById() == null) {
            proposal.setCreatedById(currentUserId);
        } else if (!proposal.getCreatedById().equals(currentUserId)) {
            throw new org.example.backend.exception.CustomException(
                    "Bạn không có quyền chỉnh sửa đề xuất này.",
                    org.springframework.http.HttpStatus.FORBIDDEN);
        }

        proposal.setContent(content.trim());
        proposal.setUpdatedAt(java.time.LocalDateTime.now());
        proposalRepo.save(proposal);
        return toResponse(proposal, currentUserId);
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
