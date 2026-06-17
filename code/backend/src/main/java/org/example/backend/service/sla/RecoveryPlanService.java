package org.example.backend.service.sla;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.backend.dto.RecoveryPlanActionResponse;
import org.example.backend.dto.RecoveryPlanAuditLogResponse;
import org.example.backend.dto.RecoveryPlanResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.BusinessException;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.repository.ProjectMemberRepository;
import org.example.backend.repository.RecoveryPlanActionRepository;
import org.example.backend.repository.RecoveryPlanAuditLogRepository;
import org.example.backend.repository.UserAccountRepository;
import org.example.backend.service.NotificationService;
import org.springframework.dao.DataIntegrityViolationException;
import org.example.backend.repository.RecoveryPlanRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.repository.TaskSlaStateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.example.backend.service.sla.executor.RecoveryActionExecutor;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecoveryPlanService {

    private final RecoveryPlanRepository recoveryPlanRepository;
    private final RecoveryPlanActionRepository recoveryPlanActionRepository;
    private final TaskRepository taskRepository;
    private final TaskSlaStateRepository taskSlaStateRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserAccountRepository userAccountRepository;
    private final RecoveryPlanAuditLogRepository recoveryPlanAuditLogRepository;
    private final SlaStateService slaStateService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final List<RecoveryActionExecutor> executorList;

    private Map<RecoveryActionType, RecoveryActionExecutor> actionExecutors;

    @PostConstruct
    private void initExecutors() {
        actionExecutors = new HashMap<>();
        for (RecoveryActionExecutor executor : executorList) {
            for (RecoveryActionType type : executor.supports()) {
                actionExecutors.put(type, executor);
            }
        }
    }

    @Transactional
    public RecoveryPlanResponse generateForTask(Long projectId, Long taskId, Long currentUserId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new BusinessException("Task does not belong to the project");
        }

        projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                .orElseThrow(() -> new BusinessException("User is not a member of this project"));

        if (task.getStatus() == TaskStatus.DONE) {
            throw new BusinessException("Cannot generate recovery plan for a completed task");
        }

        // Check active plans
        List<RecoveryPlanStatus> activeStatuses = Arrays.asList(
                RecoveryPlanStatus.PENDING_APPROVAL,
                RecoveryPlanStatus.APPROVED,
                RecoveryPlanStatus.EXECUTING
        );
        
        if (recoveryPlanRepository.existsByProjectIdAndTaskIdAndStatusIn(projectId, taskId, activeStatuses)) {
            return getLatestActivePlan(projectId, taskId, activeStatuses);
        }

        TaskSlaState slaState = taskSlaStateRepository.findById(taskId).orElse(null);
        if (slaState == null) {
            try {
                slaStateService.evaluateAndPersist(taskId, "RECOVERY_PLAN_GENERATE");
            } catch (Exception e) {
                log.warn("SLA evaluation failed for task {}, will try to proceed if state was partially saved: {}", taskId, e.getMessage());
            }
            slaState = taskSlaStateRepository.findById(taskId).orElse(null);
            if (slaState == null) {
                throw new BusinessException("Failed to generate SLA state for task. Please try again.");
            }
        }

        log.info("[RecoveryPlan] Task {} SLA state: riskLevel={}, categoriesJson={}",
                taskId, slaState.getCurrentRiskLevel(), slaState.getCategoriesJson());

        List<String> categories;
        try {
            String json = slaState.getCategoriesJson();
            if (json == null || json.isBlank()) {
                categories = new ArrayList<>();
            } else {
                categories = objectMapper.readValue(json, new TypeReference<List<String>>() {});
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to parse categories JSON for task {}: {}", taskId, slaState.getCategoriesJson(), e);
            throw new BusinessException("Corrupted SLA state data for task " + taskId + ": invalid categories JSON");
        }

        // Remove NORMAL from categories — it's just a placeholder meaning "no issue"
        categories.removeIf(c -> "NORMAL".equalsIgnoreCase(c));

        String riskLevel = slaState.getCurrentRiskLevel();
        boolean isHighRisk = "HIGH".equalsIgnoreCase(riskLevel) || "CRITICAL".equalsIgnoreCase(riskLevel);

        if (!isHighRisk && categories.isEmpty()) {
            throw new BusinessException("Task has no SLA risk (risk level: " + riskLevel + "). Only HIGH or CRITICAL tasks can have recovery plans.");
        }

        String summary = String.format("Task is %s risk because of %s. The system recommends recovery actions for leader approval.",
                slaState.getCurrentRiskLevel(), String.join(" and ", categories));

        RecoveryPlan plan = RecoveryPlan.builder()
                .projectId(projectId)
                .sprintId(task.getSprintId())
                .taskId(taskId)
                .generatedByUserId(currentUserId)
                .generatedSource(RecoveryPlanSource.RULE)
                .status(RecoveryPlanStatus.PENDING_APPROVAL)
                .riskLevel(slaState.getCurrentRiskLevel())
                .riskCategoriesJson(slaState.getCategoriesJson())
                .summary(summary)
                .build();

        try {
            plan = recoveryPlanRepository.save(plan);
        } catch (DataIntegrityViolationException e) {
            log.warn("Race condition detected: active recovery plan already exists for task {}", taskId);
            return getLatestActivePlan(projectId, taskId, activeStatuses);
        }

        List<RecoveryPlanAction> actions = new ArrayList<>();
        for (String category : categories) {
            RecoveryPlanAction action = createActionForCategory(category, plan, task);
            if (action != null) {
                // Ensure no duplicate action in the same plan
                String idempotencyKey = String.format("%d:%d:%s:%s", plan.getId(), taskId, action.getActionType().name(), category);
                if (!recoveryPlanActionRepository.existsByIdempotencyKey(idempotencyKey)) {
                    action.setIdempotencyKey(idempotencyKey);
                    actions.add(action);
                }
            }
        }

        if (Arrays.asList("HIGH", "CRITICAL").contains(slaState.getCurrentRiskLevel().toUpperCase())) {
            RecoveryPlanAction checklistAction = RecoveryPlanAction.builder()
                    .recoveryPlan(plan)
                    .projectId(projectId)
                    .taskId(taskId)
                    .actionType(RecoveryActionType.CREATE_RECOVERY_CHECKLIST)
                    .targetUserId(task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null)
                    .status(RecoveryPlanActionStatus.PENDING)
                    .priority("MEDIUM")
                    .message("Create a recovery checklist to break down the remaining work.")
                    .build();
            
            String idempotencyKey = String.format("%d:%d:%s:RISK", plan.getId(), taskId, checklistAction.getActionType().name());
            if (!recoveryPlanActionRepository.existsByIdempotencyKey(idempotencyKey)) {
                checklistAction.setIdempotencyKey(idempotencyKey);
                actions.add(checklistAction);
            }
        }

        recoveryPlanActionRepository.saveAll(actions);
        
        // Update summary with action count
        plan.setSummary(String.format("Task is %s risk because of %s. The system recommends %d recovery actions for leader approval.",
                slaState.getCurrentRiskLevel(), String.join(" and ", categories), actions.size()));
        recoveryPlanRepository.save(plan);

        recordAuditLog(plan, null, currentUserId, RecoveryPlanAuditEventType.PLAN_GENERATED,
                null, RecoveryPlanStatus.PENDING_APPROVAL.name(),
                "Recovery plan generated with " + actions.size() + " actions", null);

        return mapToResponse(plan);
    }

    private RecoveryPlanAction createActionForCategory(String category, RecoveryPlan plan, Task task) {
        RecoveryActionType actionType = null;
        String priority = null;
        String message = null;
        Long targetUserId = task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;

        switch (category) {
            case "DUE_TODAY":
                actionType = RecoveryActionType.NOTIFY_ASSIGNEE;
                priority = "HIGH";
                message = "Please finish or update this task before the end of today.";
                break;
            case "DUE_TOMORROW":
            case "DUE_IN_2_DAYS":
            case "DUE_IN_3_DAYS":
                actionType = RecoveryActionType.NOTIFY_ASSIGNEE;
                priority = "MEDIUM";
                message = "Please plan remaining work before the deadline.";
                break;
            case "OVERDUE_SHORT":
                actionType = RecoveryActionType.NOTIFY_ASSIGNEE;
                priority = "HIGH";
                message = "This task is overdue. Please update progress before it becomes a penalty.";
                break;
            case "OVERDUE_PENALTY":
                actionType = RecoveryActionType.ESCALATE_LEADER;
                priority = "CRITICAL";
                targetUserId = null;
                message = "This task qualifies for SLA penalty and needs leader recovery action.";
                break;
            case "BLOCKED":
                actionType = RecoveryActionType.ASK_BLOCKER_UPDATE;
                priority = "HIGH";
                message = "Please clarify the blocker and what support is needed.";
                break;
            case "MISSING_EVIDENCE":
                actionType = RecoveryActionType.REQUEST_EVIDENCE;
                priority = "HIGH";
                message = "Please upload or request accepted evidence for this task.";
                break;
        }

        if (actionType == null) return null;

        return RecoveryPlanAction.builder()
                .recoveryPlan(plan)
                .projectId(plan.getProjectId())
                .taskId(plan.getTaskId())
                .actionType(actionType)
                .targetUserId(targetUserId)
                .status(RecoveryPlanActionStatus.PENDING)
                .priority(priority)
                .message(message)
                .build();
    }

    @Transactional(readOnly = true)
    public RecoveryPlanResponse getLatestForTask(Long projectId, Long taskId, Long currentUserId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                .orElseThrow(() -> new BusinessException("User is not a member of this project"));

        RecoveryPlan plan = recoveryPlanRepository.findTopByProjectIdAndTaskIdOrderByCreatedAtDesc(projectId, taskId)
                .orElseThrow(() -> new ResourceNotFoundException("No recovery plan found for this task"));
        return mapToResponse(plan);
    }

    private RecoveryPlanResponse getLatestActivePlan(Long projectId, Long taskId, List<RecoveryPlanStatus> activeStatuses) {
        RecoveryPlan plan = recoveryPlanRepository.findTopByProjectIdAndTaskIdAndStatusInOrderByCreatedAtDesc(projectId, taskId, activeStatuses)
                .orElseThrow(() -> new BusinessException("Active recovery plan exists but could not be fetched"));
        return mapToResponse(plan);
    }

    @Transactional
    public RecoveryPlanResponse approvePlan(Long projectId, Long planId, Long currentUserId) {
        ensureLeaderOrMentor(projectId, currentUserId);

        RecoveryPlan plan = recoveryPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Recovery plan not found"));

        if (!plan.getProjectId().equals(projectId)) {
            throw new BusinessException("Recovery plan does not belong to the project");
        }

        if (plan.getStatus() != RecoveryPlanStatus.PENDING_APPROVAL) {
            throw new BusinessException("Only pending recovery plans can be approved");
        }

        plan.setStatus(RecoveryPlanStatus.APPROVED);
        plan.setApprovedBy(currentUserId);
        plan.setApprovedAt(LocalDateTime.now());

        recordAuditLog(plan, null, currentUserId, RecoveryPlanAuditEventType.PLAN_APPROVED,
                RecoveryPlanStatus.PENDING_APPROVAL.name(), RecoveryPlanStatus.APPROVED.name(),
                "Recovery plan approved", null);

        List<RecoveryPlanAction> actions = recoveryPlanActionRepository.findByRecoveryPlanIdOrderByCreatedAtAsc(planId);
        if (actions != null) {
            for (RecoveryPlanAction action : actions) {
                if (action.getStatus() == RecoveryPlanActionStatus.PENDING) {
                    action.setStatus(RecoveryPlanActionStatus.APPROVED);
                }
            }
            recoveryPlanActionRepository.saveAll(actions);
        }

        plan = recoveryPlanRepository.save(plan);
        return mapToResponse(plan);
    }

    @Transactional
    public RecoveryPlanResponse rejectPlan(Long projectId, Long planId, Long currentUserId, String reason) {
        ensureLeaderOrMentor(projectId, currentUserId);

        if (reason == null || reason.trim().isEmpty()) {
            throw new BusinessException("Reject reason is required");
        }
        
        String trimmedReason = reason.trim();

        RecoveryPlan plan = recoveryPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Recovery plan not found"));

        if (!plan.getProjectId().equals(projectId)) {
            throw new BusinessException("Recovery plan does not belong to the project");
        }

        if (plan.getStatus() != RecoveryPlanStatus.PENDING_APPROVAL) {
            throw new BusinessException("Only pending recovery plans can be rejected");
        }

        plan.setStatus(RecoveryPlanStatus.REJECTED);
        plan.setRejectedBy(currentUserId);
        plan.setRejectedAt(LocalDateTime.now());
        plan.setRejectReason(trimmedReason);

        recordAuditLog(plan, null, currentUserId, RecoveryPlanAuditEventType.PLAN_REJECTED,
                RecoveryPlanStatus.PENDING_APPROVAL.name(), RecoveryPlanStatus.REJECTED.name(),
                "Recovery plan rejected: " + trimmedReason, null);

        List<RecoveryPlanAction> actions = recoveryPlanActionRepository.findByRecoveryPlanIdOrderByCreatedAtAsc(planId);
        if (actions != null) {
            for (RecoveryPlanAction action : actions) {
                if (action.getStatus() == RecoveryPlanActionStatus.PENDING) {
                    action.setStatus(RecoveryPlanActionStatus.SKIPPED);
                    action.setResultMessage("Plan rejected: " + trimmedReason);
                }
            }
            recoveryPlanActionRepository.saveAll(actions);
        }

        plan = recoveryPlanRepository.save(plan);
        return mapToResponse(plan);
    }

    @Transactional
    public RecoveryPlanResponse executePlan(Long projectId, Long planId, Long currentUserId) {
        ensureLeaderOrMentor(projectId, currentUserId);

        RecoveryPlan plan = recoveryPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Recovery plan not found"));

        if (!plan.getProjectId().equals(projectId)) {
            throw new BusinessException("Recovery plan does not belong to the project");
        }

        if (plan.getStatus() != RecoveryPlanStatus.APPROVED) {
            throw new BusinessException("Only approved recovery plans can be executed");
        }

        Task task = taskRepository.findWithDetailsById(plan.getTaskId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new BusinessException("Task does not belong to the project");
        }

        if (task.getStatus() == TaskStatus.DONE) {
            throw new BusinessException("Cannot execute recovery plan for completed task");
        }

        plan.setStatus(RecoveryPlanStatus.EXECUTING);

        recordAuditLog(plan, null, currentUserId, RecoveryPlanAuditEventType.PLAN_EXECUTION_STARTED,
                RecoveryPlanStatus.APPROVED.name(), RecoveryPlanStatus.EXECUTING.name(),
                "Execution started", null);

        List<RecoveryPlanAction> actions = recoveryPlanActionRepository.findByRecoveryPlanIdOrderByCreatedAtAsc(planId);
        boolean hasFailedAction = false;

        if (actions != null) {
            for (RecoveryPlanAction action : actions) {
                if (action.getStatus() != RecoveryPlanActionStatus.APPROVED) {
                    continue; // Skip non-approved actions
                }

                try {
                    executeSingleAction(action, task);
                    if (action.getStatus() == RecoveryPlanActionStatus.FAILED) {
                        hasFailedAction = true;
                    }

                    RecoveryPlanAuditEventType actionEventType = action.getStatus() == RecoveryPlanActionStatus.EXECUTED
                            ? RecoveryPlanAuditEventType.ACTION_EXECUTED
                            : action.getStatus() == RecoveryPlanActionStatus.SKIPPED
                                    ? RecoveryPlanAuditEventType.ACTION_SKIPPED
                                    : RecoveryPlanAuditEventType.ACTION_FAILED;

                    recordAuditLog(plan, action, currentUserId, actionEventType,
                            RecoveryPlanActionStatus.APPROVED.name(), action.getStatus().name(),
                            action.getResultMessage(), null);

                } catch (Exception e) {
                    log.error("Failed to execute action {}", action.getId(), e);
                    action.setStatus(RecoveryPlanActionStatus.FAILED);
                    action.setExecutedAt(LocalDateTime.now());
                    action.setResultMessage("Execution failed: " + e.getMessage());
                    hasFailedAction = true;

                    recordAuditLog(plan, action, currentUserId, RecoveryPlanAuditEventType.ACTION_FAILED,
                            RecoveryPlanActionStatus.APPROVED.name(), RecoveryPlanActionStatus.FAILED.name(),
                            "Execution failed: " + e.getMessage(), null);
                }
            }
            recoveryPlanActionRepository.saveAll(actions);
        }

        if (hasFailedAction) {
            plan.setStatus(RecoveryPlanStatus.FAILED);
            recordAuditLog(plan, null, currentUserId, RecoveryPlanAuditEventType.PLAN_FAILED,
                    RecoveryPlanStatus.EXECUTING.name(), RecoveryPlanStatus.FAILED.name(),
                    "Recovery plan completed with failed actions", null);
        } else {
            plan.setStatus(RecoveryPlanStatus.EXECUTED);
            recordAuditLog(plan, null, currentUserId, RecoveryPlanAuditEventType.PLAN_EXECUTED,
                    RecoveryPlanStatus.EXECUTING.name(), RecoveryPlanStatus.EXECUTED.name(),
                    "Recovery plan executed successfully", null);
        }

        plan = recoveryPlanRepository.save(plan);
        return mapToResponse(plan);
    }

    private void executeSingleAction(RecoveryPlanAction action, Task task) {
        RecoveryActionExecutor executor = actionExecutors.get(action.getActionType());
        if (executor != null) {
            executor.execute(action, task, task.getProject());
        } else {
            action.setStatus(RecoveryPlanActionStatus.SKIPPED);
            action.setExecutedAt(LocalDateTime.now());
            action.setResultMessage("Action type not recognized or not supported for automatic execution");
        }
    }

    private void ensureLeaderOrMentor(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new BusinessException("User is not a member of this project"));

        if (member.getRole() == null || member.getRole().getName() == null) {
            throw new BusinessException("User has no role in this project");
        }

        String roleName = member.getRole().getName().trim().toUpperCase().replace(" ", "_");
        if (!Arrays.asList("LEADER", "PROJECT_LEADER", "MENTOR").contains(roleName)) {
            throw new BusinessException("User must be a LEADER or MENTOR to perform this action");
        }
    }

    private void recordAuditLog(RecoveryPlan plan, RecoveryPlanAction action, Long actorUserId,
                                RecoveryPlanAuditEventType eventType, String fromStatus, String toStatus,
                                String message, String metadataJson) {
        if (metadataJson == null || metadataJson.trim().isEmpty()) {
            metadataJson = "{}";
        }

        RecoveryPlanAuditLog auditLog = RecoveryPlanAuditLog.builder()
                .recoveryPlan(plan)
                .recoveryPlanAction(action)
                .projectId(plan.getProjectId())
                .taskId(plan.getTaskId())
                .actorUserId(actorUserId)
                .eventType(eventType)
                .fromStatus(fromStatus)
                .toStatus(toStatus)
                .message(message)
                .metadataJson(metadataJson)
                .build();

        recoveryPlanAuditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<RecoveryPlanAuditLogResponse> getAuditLogs(Long projectId, Long planId, Long currentUserId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                .orElseThrow(() -> new BusinessException("User is not a member of this project"));

        RecoveryPlan plan = recoveryPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Recovery plan not found"));

        if (!plan.getProjectId().equals(projectId)) {
            throw new BusinessException("Recovery plan does not belong to the project");
        }

        return fetchAuditLogResponses(planId);
    }

    private List<RecoveryPlanAuditLogResponse> fetchAuditLogResponses(Long planId) {
        List<RecoveryPlanAuditLog> logs = recoveryPlanAuditLogRepository.findByRecoveryPlanIdOrderByCreatedAtAsc(planId);
        if (logs == null) return new ArrayList<>();

        return logs.stream().map(log -> RecoveryPlanAuditLogResponse.builder()
                .id(log.getId())
                .recoveryPlanId(log.getRecoveryPlan().getId())
                .recoveryPlanActionId(log.getRecoveryPlanAction() != null ? log.getRecoveryPlanAction().getId() : null)
                .projectId(log.getProjectId())
                .taskId(log.getTaskId())
                .actorUserId(log.getActorUserId())
                .eventType(log.getEventType() != null ? log.getEventType().name() : null)
                .fromStatus(log.getFromStatus())
                .toStatus(log.getToStatus())
                .message(log.getMessage())
                .metadata(log.getMetadataJson())
                .createdAt(log.getCreatedAt())
                .build()
        ).collect(Collectors.toList());
    }

    private RecoveryPlanResponse mapToResponse(RecoveryPlan plan) {
        List<String> categories = new ArrayList<>();
        try {
            categories = objectMapper.readValue(plan.getRiskCategoriesJson(), new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to parse categories JSON", e);
        }

        List<RecoveryPlanAction> planActions = recoveryPlanActionRepository.findByRecoveryPlanIdOrderByCreatedAtAsc(plan.getId());
        
        List<RecoveryPlanActionResponse> actionResponses = planActions != null 
            ? planActions.stream()
                .map(action -> RecoveryPlanActionResponse.builder()
                        .id(action.getId())
                        .actionType(action.getActionType() != null ? action.getActionType().name() : null)
                        .targetUserId(action.getTargetUserId())
                        .status(action.getStatus() != null ? action.getStatus().name() : null)
                        .priority(action.getPriority())
                        .message(action.getMessage())
                        .payload(action.getPayloadJson())
                        .idempotencyKey(action.getIdempotencyKey())
                        .executedAt(action.getExecutedAt())
                        .resultMessage(action.getResultMessage())
                        .createdAt(action.getCreatedAt())
                        .build())
                .collect(Collectors.toList())
            : new ArrayList<>();

        List<RecoveryPlanAuditLogResponse> auditLogs = fetchAuditLogResponses(plan.getId());

        return RecoveryPlanResponse.builder()
                .id(plan.getId())
                .projectId(plan.getProjectId())
                .sprintId(plan.getSprintId())
                .taskId(plan.getTaskId())
                .generatedByUserId(plan.getGeneratedByUserId())
                .status(plan.getStatus() != null ? plan.getStatus().name() : null)
                .riskLevel(plan.getRiskLevel())
                .riskCategories(categories)
                .summary(plan.getSummary())
                .generatedSource(plan.getGeneratedSource() != null ? plan.getGeneratedSource().name() : null)
                .rejectReason(plan.getRejectReason())
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .actions(actionResponses)
                .auditLogs(auditLogs)
                .build();
    }
}
