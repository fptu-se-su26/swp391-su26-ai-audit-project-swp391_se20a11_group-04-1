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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.example.backend.service.sla.executor.RecoveryActionExecutor;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecoveryPlanService {
    private static final List<RecoveryPlanStatus> ACTIVE_STATUSES = List.of(
            RecoveryPlanStatus.PENDING_APPROVAL,
            RecoveryPlanStatus.APPROVED,
            RecoveryPlanStatus.EXECUTING
    );
    private static final Set<RecoveryActionType> ALLOWED_AI_ACTION_TYPES = Set.of(
            RecoveryActionType.NOTIFY_ASSIGNEE,
            RecoveryActionType.ESCALATE_LEADER,
            RecoveryActionType.ASK_BLOCKER_UPDATE,
            RecoveryActionType.CREATE_RECOVERY_CHECKLIST,
            RecoveryActionType.SCHEDULE_FOLLOW_UP,
            RecoveryActionType.SUGGEST_SPLIT_TASK,
            RecoveryActionType.SUGGEST_REASSIGN
    );
    private static final Set<String> LEADER_ROLE_NAMES = Set.of("LEADER", "PROJECT_LEADER", "MENTOR");
    private static final int MAX_AI_ACTIONS = 4;
    private static final int MAX_AI_PLANS_PER_TASK_SPRINT = 3;

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
    private final GeminiRecoveryService geminiRecoveryService;

    @org.springframework.context.annotation.Lazy
    @org.springframework.beans.factory.annotation.Autowired
    private SlaReliabilityMetricsService slaReliabilityMetricsService;

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
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new BusinessException("Task does not belong to the project");
        }

        projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                .orElseThrow(() -> new BusinessException("User is not a member of this project"));

        if (task.getStatus() == TaskStatus.DONE) {
            throw new BusinessException("Cannot generate recovery plan for a completed task");
        }

        return createRecoveryPlan(projectId, task, currentUserId, RecoveryPlanSource.RULE,
                "RECOVERY_PLAN_GENERATE", false, false, null);
    }

    @Transactional
    public RecoveryPlanResponse autoGenerateForTask(Long projectId, Long taskId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new BusinessException("Task does not belong to the project");
        }

        if (task.getStatus() == TaskStatus.DONE) {
            throw new BusinessException("Cannot generate recovery plan for a completed task");
        }

        LocalDateTime recentCutoff = LocalDateTime.now().minusHours(24);
        if (recoveryPlanRepository.existsByProjectIdAndTaskIdAndGeneratedSourceAndCreatedAtAfter(
                projectId, taskId, RecoveryPlanSource.AI, recentCutoff)) {
            log.debug("Recent AI recovery plan already exists for task {}, skipping auto-generation", taskId);
            return getLatestForTaskInternal(projectId, taskId);
        }

        return createRecoveryPlan(projectId, task, null, RecoveryPlanSource.AI,
                "AI_BACKGROUND_RECOVERY_PLAN", true, false, null);
    }

    @Transactional
    public RecoveryPlanResponse autoGenerateFollowUpPlan(Long projectId, Long taskId, Long previousPlanId) {
        Task task = taskRepository.findWithDetailsById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new BusinessException("Task does not belong to the project");
        }

        if (task.getStatus() == TaskStatus.DONE) {
            throw new BusinessException("Cannot generate recovery plan for a completed task");
        }

        if (recoveryPlanRepository.existsByProjectIdAndTaskIdAndStatusIn(projectId, taskId, ACTIVE_STATUSES)) {
            log.debug("Active recovery plan already exists for task {}, skipping follow-up generation", taskId);
            return getLatestActivePlan(projectId, taskId, ACTIVE_STATUSES);
        }

        LocalDateTime recentCutoff = LocalDateTime.now().minusHours(24);
        if (recoveryPlanRepository.existsByProjectIdAndTaskIdAndGeneratedSourceAndFollowUpTrueAndCreatedAtAfter(
                projectId, taskId, RecoveryPlanSource.AI, recentCutoff)) {
            log.debug("Recent follow-up recovery plan already exists for task {}, skipping retry", taskId);
            return getLatestForTaskInternal(projectId, taskId);
        }

        int aiPlanCountInSprint = recoveryPlanRepository.countByProjectIdAndTaskIdAndGeneratedSourceAndSprintId(
                projectId, taskId, RecoveryPlanSource.AI, task.getSprintId());
        if (aiPlanCountInSprint >= MAX_AI_PLANS_PER_TASK_SPRINT) {
            log.info("Task {} already has {} AI recovery plans in sprint {}, skipping follow-up",
                    taskId, aiPlanCountInSprint, task.getSprintId());
            return getLatestForTaskInternal(projectId, taskId);
        }

        return createRecoveryPlan(projectId, task, null, RecoveryPlanSource.AI,
                "AI_FOLLOW_UP_RECOVERY_PLAN", true, true, previousPlanId);
    }

    private RecoveryPlanResponse createRecoveryPlan(Long projectId, Task task, Long currentUserId,
                                                    RecoveryPlanSource source, String evaluationEvent,
                                                    boolean notifyLeaders, boolean isFollowUp,
                                                    Long previousPlanId) {
        Long taskId = task.getId();

        if (recoveryPlanRepository.existsByProjectIdAndTaskIdAndStatusIn(projectId, taskId, ACTIVE_STATUSES)) {
            return getLatestActivePlan(projectId, taskId, ACTIVE_STATUSES);
        }

        TaskSlaState slaState = taskSlaStateRepository.findById(taskId).orElse(null);
        if (slaState == null) {
            try {
                slaStateService.evaluateAndPersist(taskId, evaluationEvent);
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
        categories.removeIf(c -> "HEALTHY".equalsIgnoreCase(c));

        String riskLevel = slaState.getCurrentRiskLevel();
        boolean isHighRisk = "WARNING".equalsIgnoreCase(riskLevel) || "BREACH".equalsIgnoreCase(riskLevel);

        if (!isHighRisk && categories.isEmpty()) {
            throw new BusinessException("Task has no SLA risk (risk level: " + riskLevel + "). Only WARNING or BREACH tasks can have recovery plans.");
        }

        GeminiRecoveryResult aiContent = geminiRecoveryService.generateContent(
                buildGeminiContext(task, slaState, categories, isFollowUp, previousPlanId));
        String summary = aiContent != null && aiContent.getSummary() != null && !aiContent.getSummary().isBlank()
                ? aiContent.getSummary()
                : String.format("Task is %s risk because of %s. The system recommends recovery actions for leader approval.",
                        slaState.getCurrentRiskLevel(), String.join(" and ", categories));

        RecoveryPlan plan = RecoveryPlan.builder()
                .projectId(projectId)
                .sprintId(task.getSprintId())
                .taskId(taskId)
                .generatedByUserId(currentUserId)
                .generatedSource(source)
                .status(RecoveryPlanStatus.PENDING_APPROVAL)
                .riskLevel(slaState.getCurrentRiskLevel())
                .riskCategoriesJson(slaState.getCategoriesJson())
                .summary(summary)
                .followUp(isFollowUp)
                .build();

        try {
            plan = recoveryPlanRepository.save(plan);
        } catch (DataIntegrityViolationException e) {
            log.warn("Race condition detected: active recovery plan already exists for task {}", taskId);
            return getLatestActivePlan(projectId, taskId, ACTIVE_STATUSES);
        }

        List<RecoveryPlanAction> actions = buildActions(plan, task, slaState, categories, aiContent);

        recoveryPlanActionRepository.saveAll(actions);
        
        // Update summary with action count
        if (aiContent == null || aiContent.getSummary() == null || aiContent.getSummary().isBlank()) {
            plan.setSummary(String.format("Task is %s risk because of %s. The system recommends %d recovery actions for leader approval.",
                    slaState.getCurrentRiskLevel(), String.join(" and ", categories), actions.size()));
        }
        recoveryPlanRepository.save(plan);

        String generationMessage = isFollowUp
                ? "Follow-up recovery plan generated with " + actions.size() + " actions after a declined plan"
                : "Recovery plan generated with " + actions.size() + " actions";

        recordAuditLog(plan, null, currentUserId, RecoveryPlanAuditEventType.PLAN_GENERATED,
                null, RecoveryPlanStatus.PENDING_APPROVAL.name(),
                generationMessage, null);

        if (notifyLeaders) {
            notifyLeadersAboutAutoPlan(task, plan);
        }

        return mapToResponse(plan);
    }

    private List<RecoveryPlanAction> buildActions(RecoveryPlan plan, Task task, TaskSlaState slaState,
                                                  List<String> categories, GeminiRecoveryResult aiContent) {
        List<RecoveryPlanAction> aiActions = buildAiSelectedActions(plan, task, aiContent);
        if (!aiActions.isEmpty()) {
            return assignIdempotencyKeys(plan, aiActions, "AI");
        }

        return assignIdempotencyKeys(plan, buildRuleBasedActions(plan, task, slaState, categories, aiContent), "RULE");
    }

    private List<RecoveryPlanAction> buildAiSelectedActions(RecoveryPlan plan, Task task, GeminiRecoveryResult aiContent) {
        if (aiContent == null || aiContent.getSelectedActions() == null || aiContent.getSelectedActions().isEmpty()) {
            return List.of();
        }

        List<RecoveryPlanAction> actions = new ArrayList<>();
        for (GeminiRecoveryAction selectedAction : aiContent.getSelectedActions()) {
            if (actions.size() >= MAX_AI_ACTIONS || selectedAction == null) {
                break;
            }

            RecoveryActionType actionType = parseActionType(selectedAction.getActionType());
            if (actionType == null || !ALLOWED_AI_ACTION_TYPES.contains(actionType)) {
                log.debug("Ignoring unsupported Gemini recovery action: {}", selectedAction.getActionType());
                continue;
            }

            RecoveryActionPriority priority = parsePriority(selectedAction.getPriority(), RecoveryActionPriority.MEDIUM);
            String message = selectedAction.getMessage();
            if (message == null || message.isBlank()) {
                message = defaultMessageForAction(actionType);
            }

            actions.add(RecoveryPlanAction.builder()
                    .recoveryPlan(plan)
                    .projectId(plan.getProjectId())
                    .taskId(plan.getTaskId())
                    .actionType(actionType)
                    .targetUserId(resolveTargetUserId(task, actionType))
                    .status(RecoveryPlanActionStatus.PENDING)
                    .priority(priority)
                    .message(message)
                    .build());
        }

        return deduplicateByActionType(actions);
    }

    private List<RecoveryPlanAction> buildRuleBasedActions(RecoveryPlan plan, Task task, TaskSlaState slaState,
                                                           List<String> categories, GeminiRecoveryResult aiContent) {
        List<RecoveryPlanAction> actions = new ArrayList<>();
        for (String category : categories) {
            RecoveryPlanAction action = createRuleBasedActionForCategory(category, plan, task, aiContent);
            if (action != null) {
                actions.add(action);
            }
        }

        if (Arrays.asList("WARNING", "BREACH").contains(slaState.getCurrentRiskLevel().toUpperCase())) {
            actions.add(RecoveryPlanAction.builder()
                    .recoveryPlan(plan)
                    .projectId(plan.getProjectId())
                    .taskId(plan.getTaskId())
                    .actionType(RecoveryActionType.CREATE_RECOVERY_CHECKLIST)
                    .targetUserId(resolveTargetUserId(task, RecoveryActionType.CREATE_RECOVERY_CHECKLIST))
                    .status(RecoveryPlanActionStatus.PENDING)
                    .priority(RecoveryActionPriority.MEDIUM)
                    .message(resolveAiMessage(aiContent, RecoveryActionType.CREATE_RECOVERY_CHECKLIST,
                            "Create a recovery checklist to break down the remaining work."))
                    .build());
        }

        return deduplicateByActionType(actions);
    }

    private RecoveryPlanAction createRuleBasedActionForCategory(String category, RecoveryPlan plan, Task task,
                                                               GeminiRecoveryResult aiContent) {
        RecoveryActionType actionType = null;
        RecoveryActionPriority priority = null;
        String message = null;
        Long targetUserId = task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;

        switch (category) {
            case "DUE_TODAY":
                actionType = RecoveryActionType.NOTIFY_ASSIGNEE;
                priority = RecoveryActionPriority.HIGH;
                message = "Please finish or update this task before the end of today.";
                break;
            case "DUE_TOMORROW":
            case "DUE_IN_2_DAYS":
            case "DUE_IN_3_DAYS":
                actionType = RecoveryActionType.NOTIFY_ASSIGNEE;
                priority = RecoveryActionPriority.MEDIUM;
                message = "Please plan remaining work before the deadline.";
                break;
            case "OVERDUE_SHORT":
                actionType = RecoveryActionType.NOTIFY_ASSIGNEE;
                priority = RecoveryActionPriority.HIGH;
                message = "This task is overdue. Please update progress before it becomes a penalty.";
                break;
            case "OVERDUE_PENALTY":
                actionType = RecoveryActionType.ESCALATE_LEADER;
                priority = RecoveryActionPriority.CRITICAL;
                targetUserId = null;
                message = "This task qualifies for SLA penalty and needs leader recovery action.";
                break;
            case "BLOCKED":
                actionType = RecoveryActionType.ASK_BLOCKER_UPDATE;
                priority = RecoveryActionPriority.HIGH;
                message = "Please clarify the blocker and what support is needed.";
                break;
        }

        if (actionType == null) return null;
        message = resolveAiMessage(aiContent, actionType, message);

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

    private List<RecoveryPlanAction> assignIdempotencyKeys(RecoveryPlan plan, List<RecoveryPlanAction> actions, String sourceTag) {
        List<RecoveryPlanAction> result = new ArrayList<>();
        for (RecoveryPlanAction action : actions) {
            String idempotencyKey = String.format("%d:%d:%s:%s",
                    plan.getId(), plan.getTaskId(), action.getActionType().name(), sourceTag);
            if (!recoveryPlanActionRepository.existsByIdempotencyKey(idempotencyKey)) {
                action.setIdempotencyKey(idempotencyKey);
                result.add(action);
            }
        }
        return result;
    }

    private List<RecoveryPlanAction> deduplicateByActionType(List<RecoveryPlanAction> actions) {
        Map<RecoveryActionType, RecoveryPlanAction> unique = new LinkedHashMap<>();
        for (RecoveryPlanAction action : actions) {
            if (action != null && action.getActionType() != null) {
                unique.putIfAbsent(action.getActionType(), action);
            }
        }
        return new ArrayList<>(unique.values());
    }

    private RecoveryActionType parseActionType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return RecoveryActionType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private RecoveryActionPriority parsePriority(String value, RecoveryActionPriority fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return RecoveryActionPriority.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return fallback;
        }
    }

    private Long resolveTargetUserId(Task task, RecoveryActionType actionType) {
        if (actionType == RecoveryActionType.ESCALATE_LEADER
                || actionType == RecoveryActionType.SCHEDULE_FOLLOW_UP
                || actionType == RecoveryActionType.SUGGEST_REASSIGN) {
            return null;
        }
        return task.getPrimaryAssignee() != null ? task.getPrimaryAssignee().getId() : null;
    }

    private String defaultMessageForAction(RecoveryActionType actionType) {
        return switch (actionType) {
            case NOTIFY_ASSIGNEE -> "Please update progress and the remaining work for this task.";
            case ESCALATE_LEADER -> "This task needs leader review because the current recovery path may not be enough.";
            case REQUEST_EVIDENCE -> "Please upload accepted evidence or explain what evidence is still missing.";
            case ASK_BLOCKER_UPDATE -> "Please clarify the blocker and what support is needed.";
            case CREATE_RECOVERY_CHECKLIST -> "Create a recovery checklist to break down the remaining work.";
            case SCHEDULE_FOLLOW_UP -> "Schedule a follow-up check to verify whether the recovery action improves SLA.";
            case SUGGEST_SPLIT_TASK -> "Consider splitting this task into smaller trackable recovery items.";
            case SUGGEST_REASSIGN -> "Consider reassigning or sharing this task because the current owner may be overloaded.";
        };
    }

    private GeminiRecoveryContext buildGeminiContext(Task task, TaskSlaState slaState, List<String> categories,
                                                     boolean isFollowUp, Long previousPlanId) {
        RecoveryPlan previousPlan = resolvePreviousPlan(task.getProject().getId(), task.getId(), previousPlanId);
        return GeminiRecoveryContext.builder()
                .taskTitle(task.getTitle())
                .riskLevel(slaState.getCurrentRiskLevel())
                .categories(categories)
                .reasons(parseStringList(slaState.getReasonsJson()))
                .slaScore(slaState.getCurrentScore())
                .overdueDays(slaState.getOverdueDays())
                .assigneeActiveTaskCount(task.getPrimaryAssignee() != null
                        ? taskRepository.countActiveTasksByAssignee(task.getPrimaryAssignee().getId())
                        : 0)
                .previousPlanCount((int) recoveryPlanRepository.countByProjectIdAndTaskId(task.getProject().getId(), task.getId()))
                .previousActions(previousPlan != null ? getActionTypeNames(previousPlan.getId()) : List.of())
                .previousEffectiveness(previousPlan != null ? resolveEffectivenessStatus(previousPlan) : null)
                .lastScoreBefore(previousPlan != null ? previousPlan.getScoreBeforeExecution() : null)
                .lastScoreAfter(previousPlan != null ? previousPlan.getScoreAfterExecution() : null)
                .followUp(isFollowUp)
                .build();
    }

    private RecoveryPlan resolvePreviousPlan(Long projectId, Long taskId, Long previousPlanId) {
        if (previousPlanId != null) {
            return recoveryPlanRepository.findById(previousPlanId)
                    .filter(plan -> plan.getProjectId().equals(projectId) && plan.getTaskId().equals(taskId))
                    .orElse(null);
        }
        return recoveryPlanRepository.findTopByProjectIdAndTaskIdOrderByCreatedAtDesc(projectId, taskId)
                .orElse(null);
    }

    private List<String> getActionTypeNames(Long planId) {
        List<RecoveryPlanAction> actions = recoveryPlanActionRepository.findByRecoveryPlanIdOrderByCreatedAtAsc(planId);
        if (actions == null) {
            return List.of();
        }
        return actions.stream()
                .map(RecoveryPlanAction::getActionType)
                .filter(type -> type != null)
                .map(Enum::name)
                .collect(Collectors.toList());
    }

    private List<String> parseStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException ex) {
            log.warn("Failed to parse string list JSON: {}", ex.getMessage());
            return List.of();
        }
    }

    private String resolveAiMessage(GeminiRecoveryResult aiContent, RecoveryActionType actionType, String fallback) {
        if (aiContent == null || actionType == null) {
            return fallback;
        }

        String candidate = switch (actionType) {
            case NOTIFY_ASSIGNEE -> aiContent.getNotifyMessage();
            case ESCALATE_LEADER -> aiContent.getEscalateMessage();
            case REQUEST_EVIDENCE -> aiContent.getEvidenceMessage();
            case ASK_BLOCKER_UPDATE -> aiContent.getBlockerMessage();
            case CREATE_RECOVERY_CHECKLIST -> aiContent.getChecklistMessage();
            default -> null;
        };
        return candidate == null || candidate.isBlank() ? fallback : candidate;
    }

    private void notifyLeadersAboutAutoPlan(Task task, RecoveryPlan plan) {
        List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(plan.getProjectId());
        for (ProjectMember member : projectMembers) {
            if (member == null || member.getUser() == null || member.getRole() == null || member.getRole().getName() == null) {
                continue;
            }

            String roleName = member.getRole().getName().trim().toUpperCase().replace(" ", "_");
            if (!LEADER_ROLE_NAMES.contains(roleName)) {
                continue;
            }

            notificationService.createAndPush(
                    member.getUser(),
                    task.getProject(),
                    NotificationEntityType.TASK,
                    task.getId(),
                    NotificationType.SYSTEM,
                    "AI recovery plan needs review",
                    "Task \"" + task.getTitle() + "\" is " + plan.getRiskLevel()
                            + " risk. An AI-assisted recovery plan was created and needs review."
            );
        }
    }

    @Transactional(readOnly = true)
    public RecoveryPlanResponse getLatestForTask(Long projectId, Long taskId, Long currentUserId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                .orElseThrow(() -> new BusinessException("User is not a member of this project"));

        return getLatestForTaskInternal(projectId, taskId);
    }

    @Transactional(readOnly = true)
    public List<RecoveryPlanResponse> getProjectPlans(Long projectId, Long sprintId, List<String> statuses, Long currentUserId) {
        projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                .orElseThrow(() -> new BusinessException("User is not a member of this project"));

        List<RecoveryPlanStatus> statusFilters = parseStatusFilters(statuses);
        List<RecoveryPlan> plans = sprintId != null
                ? recoveryPlanRepository.findByProjectIdAndSprintIdAndStatusInOrderByCreatedAtDesc(projectId, sprintId, statusFilters)
                : recoveryPlanRepository.findByProjectIdAndStatusInOrderByCreatedAtDesc(projectId, statusFilters);

        return plans.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private List<RecoveryPlanStatus> parseStatusFilters(List<String> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return Arrays.asList(RecoveryPlanStatus.values());
        }

        return statuses.stream()
                .filter(status -> status != null && !status.trim().isEmpty())
                .map(status -> {
                    try {
                        return RecoveryPlanStatus.valueOf(status.trim().toUpperCase());
                    } catch (IllegalArgumentException ex) {
                        throw new BusinessException("Invalid recovery plan status: " + status);
                    }
                })
                .distinct()
                .collect(Collectors.toList());
    }

    private RecoveryPlanResponse getLatestForTaskInternal(Long projectId, Long taskId) {
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

        RecoveryPlan plan = recoveryPlanRepository.findByIdForUpdate(planId)
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

        RecoveryPlan plan = recoveryPlanRepository.findByIdForUpdate(planId)
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

        RecoveryPlan plan = recoveryPlanRepository.findByIdForUpdate(planId)
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

        TaskSlaState stateBeforeExecution = taskSlaStateRepository
                .findByTaskIdAndProjectId(task.getId(), projectId)
                .orElse(null);
        if (stateBeforeExecution != null) {
            plan.setScoreBeforeExecution(stateBeforeExecution.getCurrentScore());
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
            plan.setExecutedAt(LocalDateTime.now());
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

    @Transactional
    public int checkEffectivenessForExecutedPlans(LocalDateTime cutoff) {
        List<RecoveryPlan> plans = recoveryPlanRepository.findExecutedWithoutEffectivenessCheck(cutoff);
        int checked = 0;

        for (RecoveryPlan plan : plans) {
            try {
                Task task = taskRepository.findWithDetailsById(plan.getTaskId()).orElse(null);
                if (task == null || !task.getProject().getId().equals(plan.getProjectId())) {
                    continue;
                }

                slaStateService.evaluateAndPersist(task.getId(), "RECOVERY_EFFECTIVENESS_CHECK");
                TaskSlaState currentState = taskSlaStateRepository
                        .findByTaskIdAndProjectId(task.getId(), plan.getProjectId())
                        .orElse(null);
                if (currentState == null) {
                    continue;
                }

                plan.setScoreAfterExecution(currentState.getCurrentScore());
                plan.setEffectivenessCheckedAt(LocalDateTime.now());

                if (plan.getSprintId() != null) {
                    try {
                        org.example.backend.entity.SlaReliabilitySnapshot snapshot =
                                slaReliabilityMetricsService.computeAndPersist(plan.getProjectId(), plan.getSprintId());
                        if (snapshot != null) {
                            plan.setEvidenceSnapshotId(snapshot.getId());
                        }
                    } catch (Exception ex) {
                        log.warn("Failed to capture reliability snapshot for recovery plan {}", plan.getId(), ex);
                    }
                }

                GateVerdict verdict = evaluateGate(plan, currentState);
                plan.setGateResult(verdict.result());
                plan.setGateReason(verdict.reason());

                if ("FAILED".equals(verdict.result())) {
                    plan.setStatus(RecoveryPlanStatus.DECLINED);
                    recordAuditLog(plan, null, null, RecoveryPlanAuditEventType.PLAN_FAILED,
                            RecoveryPlanStatus.EXECUTED.name(), RecoveryPlanStatus.DECLINED.name(),
                            verdict.reason(), null);
                    recoveryPlanRepository.save(plan);
                    notifyLeadersPlanIneffective(task, plan);
                    autoGenerateFollowUpPlan(plan.getProjectId(), plan.getTaskId(), plan.getId());
                } else {
                    recoveryPlanRepository.save(plan);
                }
                checked++;
            } catch (Exception ex) {
                log.warn("Effectiveness check failed for recovery plan {}", plan.getId(), ex);
            }
        }

        return checked;
    }

    private void notifyLeadersPlanIneffective(Task task, RecoveryPlan plan) {
        List<ProjectMember> projectMembers = projectMemberRepository.findByProjectId(plan.getProjectId());
        for (ProjectMember member : projectMembers) {
            if (member == null || member.getUser() == null || member.getRole() == null || member.getRole().getName() == null) {
                continue;
            }

            String roleName = member.getRole().getName().trim().toUpperCase().replace(" ", "_");
            if (!LEADER_ROLE_NAMES.contains(roleName)) {
                continue;
            }

            notificationService.createAndPush(
                    member.getUser(),
                    task.getProject(),
                    NotificationEntityType.TASK,
                    task.getId(),
                    NotificationType.SYSTEM,
                    "Recovery plan needs follow-up",
                    "Task \"" + task.getTitle() + "\" did not improve after recovery execution. SLA score changed from "
                            + plan.getScoreBeforeExecution() + " to " + plan.getScoreAfterExecution() + "."
            );
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
                        .priority(action.getPriority() != null ? action.getPriority().name() : null)
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
                .priority(resolvePlanPriority(planActions))
                .followUp(plan.isFollowUp())
                .scoreBeforeExecution(plan.getScoreBeforeExecution())
                .scoreAfterExecution(plan.getScoreAfterExecution())
                .effectivenessCheckedAt(plan.getEffectivenessCheckedAt())
                .evidenceSnapshotId(plan.getEvidenceSnapshotId())
                .gateResult(plan.getGateResult())
                .gateReason(plan.getGateReason())
                .effectivenessStatus(resolveEffectivenessStatus(plan))
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .actions(actionResponses)
                .auditLogs(auditLogs)
                .build();
    }

    private String resolveEffectivenessStatus(RecoveryPlan plan) {
        return plan.getGateResult();
    }

    private String resolvePlanPriority(List<RecoveryPlanAction> actions) {
        if (actions == null || actions.isEmpty()) {
            return null;
        }
        return actions.stream()
                .map(RecoveryPlanAction::getPriority)
                .filter(priority -> priority != null)
                .max(Comparator.comparingInt(this::priorityWeight))
                .map(Enum::name)
                .orElse(null);
    }

    private int priorityWeight(RecoveryActionPriority priority) {
        return switch (priority) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
            case CRITICAL -> 4;
        };
    }

    private record GateVerdict(String result, String reason) {}

    private GateVerdict evaluateGate(RecoveryPlan plan, TaskSlaState currentState) {
        if (plan.getScoreBeforeExecution() == null || plan.getScoreAfterExecution() == null) {
            return new GateVerdict("INSUFFICIENT_DATA",
                    "Cannot evaluate gate: score data missing before or after execution.");
        }
        if (plan.getEvidenceSnapshotId() == null) {
            return new GateVerdict("INSUFFICIENT_DATA",
                    "Cannot evaluate gate: reliability snapshot evidence not captured.");
        }

        int before = plan.getScoreBeforeExecution();
        int after = plan.getScoreAfterExecution();
        String riskLevel = currentState.getCurrentRiskLevel();
        boolean stillHighRisk = "WARNING".equalsIgnoreCase(riskLevel) || "BREACH".equalsIgnoreCase(riskLevel);

        if (after > before && !stillHighRisk) {
            return new GateVerdict("PASSED",
                    String.format("Score improved from %d to %d and task risk level is now %s.", before, after, riskLevel));
        }
        if (after < before) {
            return new GateVerdict("FAILED",
                    String.format("Score decreased from %d to %d after recovery execution.", before, after));
        }
        if (stillHighRisk) {
            return new GateVerdict("FAILED",
                    String.format("Score unchanged at %d but task is still %s risk.", after, riskLevel));
        }
        // score same, not high risk
        return new GateVerdict("PASSED",
                String.format("Score held at %d and task risk level is now %s.", after, riskLevel));
    }
}
