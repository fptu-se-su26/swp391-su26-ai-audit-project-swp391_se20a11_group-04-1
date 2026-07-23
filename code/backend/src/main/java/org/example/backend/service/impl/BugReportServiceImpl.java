// touched to trigger recompile
package org.example.backend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.TaskRequest;
import org.example.backend.dto.TaskResponse;
import org.example.backend.entity.*;
import org.example.backend.entity.enums.BugSeverity;
import org.example.backend.entity.enums.BugStatus;
import org.example.backend.entity.enums.Environment;
import org.example.backend.exception.BadRequestException;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.BugReportService;
import org.example.backend.service.github.GitHubApiService;
import org.example.backend.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Service implementation managing BugReports lifecycle and workflow integration.
 */
@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class BugReportServiceImpl implements BugReportService {

    private final BugReportRepository bugReportRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserAccountRepository userAccountRepository;
    private final TaskRepository taskRepository;
    private final TestExecutionRepository testExecutionRepository;
    private final TaskService taskService;
    private final GitHubApiService gitHubApiService;
    private final ObjectMapper objectMapper;
    private final org.example.backend.repository.mongo.TaskProposalRepository taskProposalRepository;
    private final org.example.backend.repository.mongo.TaskCommentRepository taskCommentRepository;
    private final org.example.backend.repository.mongo.TaskVoteRepository taskVoteRepository;

    @Override
    @Transactional(readOnly = true)
    public BugReport getBugReport(Long id, Long userId) {
        BugReport bug = bugReportRepository.findById(id)
                .orElseThrow(() -> new CustomException("Bug report not found", HttpStatus.NOT_FOUND));
        ensureProjectMember(bug.getProject().getId(), userId);
        return bug;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BugReport> getProjectBugReports(Long projectId, Long userId) {
        ensureProjectMember(projectId, userId);
        return bugReportRepository.findByProjectId(projectId);
    }

    @Override
    @Transactional
    @org.example.backend.annotation.Auditable(action="CREATE_BUG_REPORT", entityType="BugReport")
    public BugReport createBugReport(Long projectId, Map<String, Object> request, Long userId) {
        ensureProjectMember(projectId, userId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));

        if (project.getStatus() == org.example.backend.entity.ProjectStatus.COMPLETED
                || project.getStatus() == org.example.backend.entity.ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Project đã đóng, không thể tạo bug report mới.");
        }

        UserAccount creator = userAccountRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        String title = requiredText((String) request.get("title"), "Bug title is required");
        String description = (String) request.get("description");
        
        BugSeverity severity = parseEnum((String) request.get("severity"), BugSeverity.class, BugSeverity.MEDIUM);
        Environment environment = parseEnum((String) request.get("environment"), Environment.class, Environment.DEV);

        // Fetch optional TestExecution if provided
        TestExecution testExecution = null;
        if (request.containsKey("testExecutionId") && request.get("testExecutionId") != null) {
            Long testExecutionId = ((Number) request.get("testExecutionId")).longValue();
            testExecution = testExecutionRepository.findById(testExecutionId).orElse(null);
        }

        // assignedTo mapping if provided
        UserAccount assignee = null;
        if (request.containsKey("assignedToId") && request.get("assignedToId") != null) {
            Long assigneeId = ((Number) request.get("assignedToId")).longValue();
            ensureProjectMember(projectId, assigneeId);
            assignee = userAccountRepository.findById(assigneeId).orElse(null);
        }

        // Convert stepsToReproduce to a structured JSON object to respect the Postgres JSONB type
        String stepsJson = null;
        String stepsRaw = (String) request.get("stepsToReproduce");
        if (stepsRaw != null && !stepsRaw.trim().isEmpty()) {
            try {
                // If it is already a valid JSON string (object/array), keep it
                objectMapper.readTree(stepsRaw);
                stepsJson = stepsRaw;
            } catch (Exception e) {
                // Otherwise, wrap plain text in a structured JSON object {"steps": "..."}
                try {
                    Map<String, String> stepsMap = new HashMap<>();
                    stepsMap.put("steps", stepsRaw);
                    stepsJson = objectMapper.writeValueAsString(stepsMap);
                } catch (Exception ignored) {
                    stepsJson = null;
                }
            }
        }

        // Bug reports are automatically approved and converted to active tasks on creation
        BugReport bug = BugReport.builder()
                .project(project)
                .title(title)
                .description(description)
                .severity(severity)
                .environment(environment)
                .testExecution(testExecution)
                .assignedTo(assignee)
                .createdBy(creator)
                .status(BugStatus.OPEN) // Auto-promote to OPEN directly
                .stepsToReproduce(stepsJson)
                .expectedResult((String) request.get("expectedResult"))
                .actualResult((String) request.get("actualResult"))
                .build();

        bug = bugReportRepository.save(bug);

        log.info("Bug Report auto-approved: ID={}, title='{}', projectId={}", bug.getId(), title, projectId);
        try {
            // Prepare TaskRequest to auto-create the linked BUG_FIX task
            TaskRequest taskReq = new TaskRequest();
            taskReq.setTitle("[BUG] " + bug.getTitle());
            taskReq.setDescription(bug.getDescription());
            taskReq.setType("BUG_FIX");
            taskReq.setPriority(mapSeverityToPriority(bug.getSeverity()));
            taskReq.setStatus("TODO");
            taskReq.setPrimaryAssigneeId(bug.getAssignedTo() != null ? bug.getAssignedTo().getId() : null);
            taskReq.setStartDate(java.time.LocalDate.now());
            taskReq.setDeadline(project.getDeadline() != null ? project.getDeadline() : java.time.LocalDate.now().plusDays(3));
            taskReq.setChecklist(new ArrayList<>());

            // Create the linked Task via existing TaskService
            TaskResponse taskResponse = taskService.createTask(projectId, taskReq, userId);

            Task createdTask = taskRepository.findById(taskResponse.getId())
                    .orElseThrow(() -> new CustomException("Created task not found", HttpStatus.INTERNAL_SERVER_ERROR));

            bug.setRelatedTask(createdTask);
            bug = bugReportRepository.save(bug);

            // Push to GitHub (non-blocking)
            try {
                gitHubApiService.createGitHubIssue(bug, userId);
            } catch (Exception e) {
                log.error("GitHub sync failed for auto-approved Bug Report ID: {}", bug.getId(), e);
            }
        } catch (Exception e) {
            log.error("Auto-approval and conversion failed for Bug Report ID: {}", bug.getId(), e);
        }

        return bug;
    }

    @Override
    @Transactional
    @org.example.backend.annotation.Auditable(action="APPROVE_BUG_REPORT", entityType="BugReport", entityIdArgIndex=0)
    public BugReport approveAndConvertBug(Long bugId, Long userId) {
        BugReport bug = bugReportRepository.findById(bugId)
                .orElseThrow(() -> new CustomException("Bug report not found", HttpStatus.NOT_FOUND));

        Long projectId = bug.getProject().getId();

        if (bug.getProject().getStatus() == org.example.backend.entity.ProjectStatus.COMPLETED
                || bug.getProject().getStatus() == org.example.backend.entity.ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Project đã đóng, không thể duyệt bug report.");
        }

        // 1. Authorize - only PROJECT_LEADER may approve a DRAFT bug report
        ProjectMember caller = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));

        if (!isLeaderRole(caller.getRole().getName())) {
            throw new CustomException("Only Project Leaders are authorized to approve and convert bug reports.", HttpStatus.FORBIDDEN);
        }

        // 2. Guard: only DRAFT issues can be approved
        if (bug.getStatus() != BugStatus.DRAFT) {
            throw new BadRequestException("Only DRAFT bug reports can be approved. Current status: " + bug.getStatus());
        }

        if (bug.getRelatedTask() != null) {
            throw new BadRequestException("This bug report has already been approved and converted to a task.");
        }

        log.info("Approving Bug Report ID: {} — promoting from DRAFT → OPEN and creating linked Task", bugId);

        // 3. Prepare TaskRequest to auto-create the linked BUG_FIX task
        TaskRequest taskReq = new TaskRequest();
        taskReq.setTitle("[BUG] " + bug.getTitle());
        taskReq.setDescription(bug.getDescription());
        taskReq.setType("BUG_FIX");
        taskReq.setPriority(mapSeverityToPriority(bug.getSeverity()));
        taskReq.setStatus("TODO");
        taskReq.setPrimaryAssigneeId(bug.getAssignedTo() != null ? bug.getAssignedTo().getId() : null);
        taskReq.setStartDate(java.time.LocalDate.now());
        taskReq.setDeadline(bug.getProject().getDeadline() != null ? bug.getProject().getDeadline() : java.time.LocalDate.now().plusDays(3));

        // Fetch checklist proposals and convert approved ones
        List<org.example.backend.entity.TaskProposal> proposals = taskProposalRepository.findByTaskIdOrderByCreatedAtAsc(bugId);
        List<org.example.backend.dto.TaskRequest.ChecklistItemRequest> itemsToRequest = new java.util.ArrayList<>();
        for (org.example.backend.entity.TaskProposal proposal : proposals) {
            if (proposal.getStatus() == org.example.backend.entity.ProposalStatus.APPROVED) {
                String[] lines = proposal.getContent().split("\\n");
                for (String line : lines) {
                    String trimmed = line.trim();
                    if (trimmed.startsWith("- [ ]") || trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]")) {
                        String itemText = trimmed.substring(5).trim();
                        if (!itemText.isEmpty()) {
                            org.example.backend.dto.TaskRequest.ChecklistItemRequest reqItem = new org.example.backend.dto.TaskRequest.ChecklistItemRequest();
                            reqItem.setContent(itemText);
                            reqItem.setDone(trimmed.startsWith("- [x]") || trimmed.startsWith("- [X]"));
                            itemsToRequest.add(reqItem);
                        }
                    }
                }
            }
        }
        taskReq.setChecklist(itemsToRequest);

        // 4. Create the linked Task via existing TaskService
        TaskResponse taskResponse = taskService.createTask(projectId, taskReq, userId);

        // 5. Link the Task back to the BugReport and promote to OPEN
        Task createdTask = taskRepository.findById(taskResponse.getId())
                .orElseThrow(() -> new CustomException("Created task not found", HttpStatus.INTERNAL_SERVER_ERROR));

        // Migrate MongoDB proposals, comments, and votes from bugId to createdTask.getId()
        for (org.example.backend.entity.TaskProposal proposal : proposals) {
            proposal.setTaskId(createdTask.getId());
            taskProposalRepository.save(proposal);
        }

        List<org.example.backend.entity.TaskComment> comments = taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(bugId);
        for (org.example.backend.entity.TaskComment comment : comments) {
            comment.setTaskId(createdTask.getId());
            taskCommentRepository.save(comment);
        }

        List<org.example.backend.entity.TaskVote> votes = taskVoteRepository.findByTaskId(bugId);
        for (org.example.backend.entity.TaskVote vote : votes) {
            vote.setTaskId(createdTask.getId());
            taskVoteRepository.save(vote);
        }

        bug.setRelatedTask(createdTask);
        bug.setStatus(BugStatus.OPEN); // DRAFT → OPEN on approval
        bug = bugReportRepository.save(bug);

        // 6. Push to GitHub ONLY after approval (non-blocking)
        try {
            gitHubApiService.createGitHubIssue(bug, userId);
        } catch (Exception e) {
            log.error("GitHub sync failed for approved Bug Report ID: {} — approval still committed", bugId, e);
        }

        return bug;
    }

    @Override
    @Transactional
    @org.example.backend.annotation.Auditable(action="UPDATE_BUG_REPORT", entityType="BugReport", entityIdArgIndex=0)
    public BugReport updateBugReport(Long bugId, Map<String, Object> request, Long userId) {
        BugReport bug = bugReportRepository.findById(bugId)
                .orElseThrow(() -> new CustomException("Bug report not found", HttpStatus.NOT_FOUND));

        Long projectId = bug.getProject().getId();

        if (bug.getProject().getStatus() == org.example.backend.entity.ProjectStatus.COMPLETED
                || bug.getProject().getStatus() == org.example.backend.entity.ProjectStatus.ARCHIVED) {
            throw new BadRequestException("Project đã đóng, không thể cập nhật bug report.");
        }

        // Fetch caller's role for permission checks
        ProjectMember caller = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
        String callerRole = caller.getRole().getName().toUpperCase();
        boolean isLeaderOrMentor = callerRole.contains("LEADER") || callerRole.contains("MENTOR");
        boolean isAssignee = bug.getAssignedTo() != null && bug.getAssignedTo().getId().equals(userId);

        // --- Handle status transition with permission matrix ---
        if (request.containsKey("status") && request.get("status") != null) {
            BugStatus newStatus = parseEnum((String) request.get("status"), BugStatus.class, null);
            if (newStatus != null && newStatus != bug.getStatus()) {
                validateStatusTransition(bug.getStatus(), newStatus, isLeaderOrMentor, isAssignee, callerRole);
                BugStatus oldStatus = bug.getStatus();
                bug.setStatus(newStatus);
                log.info("Bug {} status changed: {} → {} by userId={}", bugId, oldStatus, newStatus, userId);
            }
        }

        // --- Handle field updates (non-status) ---
        if (request.containsKey("severity") && request.get("severity") != null) {
            bug.setSeverity(parseEnum((String) request.get("severity"), BugSeverity.class, bug.getSeverity()));
        }
        if (request.containsKey("environment") && request.get("environment") != null) {
            bug.setEnvironment(parseEnum((String) request.get("environment"), Environment.class, bug.getEnvironment()));
        }
        if (request.containsKey("description")) {
            boolean isCreator = bug.getCreatedBy() != null && bug.getCreatedBy().getId().equals(userId);
            if (!isLeaderOrMentor && !isCreator && !isAssignee) {
                throw new CustomException("You do not have permission to edit the description.", HttpStatus.FORBIDDEN);
            }
            bug.setDescription((String) request.get("description"));
        }
        if (request.containsKey("fixCommitHash")) {
            bug.setFixCommitHash((String) request.get("fixCommitHash"));
        }
        if (request.containsKey("assignedToId") && request.get("assignedToId") != null) {
            if (!isLeaderOrMentor) {
                throw new CustomException("Only Leader/Mentor can reassign bugs.", HttpStatus.FORBIDDEN);
            }
            Long assigneeId = ((Number) request.get("assignedToId")).longValue();
            ensureProjectMember(projectId, assigneeId);
            UserAccount newAssignee = userAccountRepository.findById(assigneeId)
                    .orElseThrow(() -> new CustomException("Assignee not found", HttpStatus.NOT_FOUND));
            bug.setAssignedTo(newAssignee);
        }

        bug = bugReportRepository.save(bug);
        return bug;
    }

    /**
     * Validates bug status transitions based on the permission matrix.
     * Throws 403 Forbidden if the caller doesn't have permission for the requested transition.
     */
    private void validateStatusTransition(BugStatus current, BugStatus target,
                                          boolean isLeaderOrMentor, boolean isAssignee, String callerRole) {
        // DRAFT status changes are handled exclusively by approveAndConvertBug()
        if (current == BugStatus.DRAFT) {
            throw new BadRequestException("DRAFT bugs must be approved via the approve endpoint, not updated directly.");
        }

        // Leader/Mentor can do any valid transition
        if (isLeaderOrMentor) return;

        // Developer (assignee only) transitions
        if (isAssignee) {
            // Dev can: OPEN → IN_PROGRESS, IN_PROGRESS → FIXED
            if (current == BugStatus.OPEN && target == BugStatus.IN_PROGRESS) return;
            if (current == BugStatus.IN_PROGRESS && target == BugStatus.FIXED) return;
            if (current == BugStatus.REOPENED && target == BugStatus.IN_PROGRESS) return;
            throw new CustomException(
                    "Developer can only transition: OPEN→IN_PROGRESS, IN_PROGRESS→FIXED, REOPENED→IN_PROGRESS. " +
                    "Attempted: " + current + "→" + target, HttpStatus.FORBIDDEN);
        }

        // QA/Tester (non-leader, non-assignee member) transitions
        // QA can: FIXED → VERIFIED, VERIFIED → CLOSED, any → REOPENED
        if (current == BugStatus.FIXED && target == BugStatus.VERIFIED) return;
        if (current == BugStatus.VERIFIED && target == BugStatus.CLOSED) return;
        if (target == BugStatus.REOPENED) return;

        throw new CustomException(
                "You do not have permission for this status transition: " + current + "→" + target +
                ". Your role: " + callerRole, HttpStatus.FORBIDDEN);
    }

    private void ensureProjectMember(Long projectId, Long userId) {
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isEmpty()) {
            throw new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN);
        }
    }

    private String requiredText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumType, T fallback) {
        if (value == null || value.trim().isEmpty()) return fallback;
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid " + enumType.getSimpleName() + ": " + value);
        }
    }

    /**
     * Returns true if the role name represents a project leader,
     * accepting both 'LEADER' (stored in DB) and 'PROJECT_LEADER' (legacy code constant).
     */
    private boolean isLeaderRole(String roleName) {
        return roleName != null && roleName.toUpperCase().contains("LEADER");
    }

    private String mapSeverityToPriority(BugSeverity severity) {
        if (severity == null) return "MEDIUM";
        switch (severity) {
            case CRITICAL:
            case HIGH:
                return "HIGH";
            case LOW:
                return "LOW";
            case MEDIUM:
            default:
                return "MEDIUM";
        }
    }
}
