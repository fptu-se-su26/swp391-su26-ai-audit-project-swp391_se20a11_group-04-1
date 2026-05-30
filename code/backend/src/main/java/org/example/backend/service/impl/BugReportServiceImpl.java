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
    public BugReport createBugReport(Long projectId, Map<String, Object> request, Long userId) {
        ensureProjectMember(projectId, userId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CustomException("Project not found", HttpStatus.NOT_FOUND));
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

        BugReport bug = BugReport.builder()
                .project(project)
                .title(title)
                .description(description)
                .severity(severity)
                .environment(environment)
                .testExecution(testExecution)
                .assignedTo(assignee)
                .createdBy(creator)
                .status(BugStatus.OPEN)
                .stepsToReproduce(stepsJson)
                .expectedResult((String) request.get("expectedResult"))
                .actualResult((String) request.get("actualResult"))
                .build();

        return bugReportRepository.save(bug);
    }

    @Override
    public BugReport approveAndConvertBug(Long bugId, Long userId) {
        BugReport bug = bugReportRepository.findById(bugId)
                .orElseThrow(() -> new CustomException("Bug report not found", HttpStatus.NOT_FOUND));
        
        Long projectId = bug.getProject().getId();
        
        // 1. Authorize - Verify calling user is a PROJECT_LEADER in this project
        ProjectMember caller = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new CustomException("You are not a member of this project", HttpStatus.FORBIDDEN));
        
        if (!isLeaderRole(caller.getRole().getName())) {
            throw new CustomException("Only Project Leaders are authorized to approve and convert bug reports.", HttpStatus.FORBIDDEN);
        }

        if (bug.getRelatedTask() != null) {
            throw new BadRequestException("This bug report has already been approved and converted to a task.");
        }

        log.info("Approving Bug Report ID: {} for conversion to Task", bugId);

        // 2. Prepare TaskRequest (Reusing your existing TaskRequest structure!)
        TaskRequest taskReq = new TaskRequest();
        taskReq.setTitle("[BUG] " + bug.getTitle());
        taskReq.setDescription(bug.getDescription());
        taskReq.setType("BUG_FIX"); // Maps to TaskType.BUG_FIX
        taskReq.setPriority(mapSeverityToPriority(bug.getSeverity()));
        taskReq.setStatus("TODO");
        taskReq.setPrimaryAssigneeId(bug.getAssignedTo() != null ? bug.getAssignedTo().getId() : null);
        taskReq.setChecklist(new ArrayList<>()); // Empty checklists to start

        // 3. Call existing TaskService.createTask method directly to create the task
        TaskResponse taskResponse = taskService.createTask(projectId, taskReq, userId);

        // 4. Link the newly created Task back to the BugReport
        Task createdTask = taskRepository.findById(taskResponse.getId())
                .orElseThrow(() -> new CustomException("Created task not found", HttpStatus.INTERNAL_SERVER_ERROR));
        
        bug.setRelatedTask(createdTask);
        bug.setStatus(BugStatus.OPEN); // Confirm its transition to officially OPEN
        bug = bugReportRepository.save(bug);

        // 5. Outbound sync - create the GitHub Issue via API calls
        try {
            gitHubApiService.createGitHubIssue(bug, userId);
        } catch (Exception e) {
            log.error("Outbound GitHub synchronization failed for Bug Report ID: {}", bugId, e);
            // Non-blocking: we still want the local bug report approval to stand even if GitHub is slow or down
        }

        return bug;
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
        return "LEADER".equalsIgnoreCase(roleName) || "PROJECT_LEADER".equalsIgnoreCase(roleName);
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
