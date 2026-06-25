package org.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.example.backend.dto.AiTaskGenerateRequest;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AiTaskGenerationService {

    private String cleanJsonString(String raw) {
        if (raw == null) return "{}";
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    private final TaskGeminiService taskGeminiService;
    private final AiGenerationStagingRepository stagingRepository;
    private final ProjectRepository projectRepository;
    private final RequirementRepository requirementRepository;
    private final UseCaseRepository useCaseRepository;
    private final TaskRepository taskRepository;
    private final UserAccountRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ObjectMapper objectMapper;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private AiTaskGenerationService self;

    @Autowired
    public AiTaskGenerationService(TaskGeminiService taskGeminiService,
                                   AiGenerationStagingRepository stagingRepository,
                                   ProjectRepository projectRepository,
                                   RequirementRepository requirementRepository,
                                   UseCaseRepository useCaseRepository,
                                   TaskRepository taskRepository,
                                   UserAccountRepository userRepository,
                                   ProjectMemberRepository projectMemberRepository,
                                   ObjectMapper objectMapper) {
        this.taskGeminiService = taskGeminiService;
        this.stagingRepository = stagingRepository;
        this.projectRepository = projectRepository;
        this.requirementRepository = requirementRepository;
        this.useCaseRepository = useCaseRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.objectMapper = objectMapper;
    }

    public UUID generateTasks(Long projectId, AiTaskGenerateRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        // 1. Data Collection
        List<UseCase> useCases = self.fetchUseCases(request);
        if (useCases.isEmpty()) {
            throw new RuntimeException("No valid Use Cases found to generate tasks.");
        }

        List<Task> existingTasks = taskRepository.findByProjectId(projectId);
        List<Map<String, Object>> members = fetchProjectMembers(projectId);

        // 2. Chunking / Batching Phase 1: Task Generation
        List<JsonNode> generatedTasksList = new ArrayList<>();
        int batchSize = 5;
        for (int i = 0; i < useCases.size(); i += batchSize) {
            List<UseCase> batch = useCases.subList(i, Math.min(i + batchSize, useCases.size()));
            JsonNode batchResult = generateTasksBatch(project, batch, existingTasks, members);
            if (batchResult != null) {
                if (batchResult.has("tasks") && batchResult.get("tasks").isArray()) {
                    batchResult.get("tasks").forEach(generatedTasksList::add);
                } else if (batchResult.has("technical_tasks") && batchResult.get("technical_tasks").isArray()) {
                    batchResult.get("technical_tasks").forEach(generatedTasksList::add);
                } else {
                    log.warn("Gemini returned JSON without a recognized tasks array: {}", batchResult.toString());
                }
            }
        }

        // 3. Deterministic Checks (Circular Dependency, Invalid temp_id)
        ArrayNode safeTasksNode = performDeterministicChecks(generatedTasksList);

        // 4. Phase 2: Critical Audit
        JsonNode auditResult = performCriticalAudit(safeTasksNode, useCases, existingTasks, members);

        // 5. Staging
        ObjectNode finalPayload = objectMapper.createObjectNode();
        finalPayload.set("tasks", safeTasksNode);
        if (auditResult != null && auditResult.has("ai_critical_assessment")) {
            finalPayload.set("ai_critical_assessment", auditResult.get("ai_critical_assessment"));
        }

        UUID generationId = UUID.randomUUID();
        AiGenerationStaging staging = AiGenerationStaging.builder()
                .project(project)
                .stage(AiStage.TASK)
                .generationId(generationId)
                .payload(finalPayload)
                .status(AiGenerationStatus.PENDING)
                .build();
        stagingRepository.save(staging);

        return generationId;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<UseCase> fetchUseCases(AiTaskGenerateRequest request) {
        List<UseCase> useCases = new ArrayList<>();
        if (request.getUseCaseIds() != null && !request.getUseCaseIds().isEmpty()) {
            useCases.addAll(useCaseRepository.findAllById(request.getUseCaseIds()));
        } else if (request.getRequirementIds() != null && !request.getRequirementIds().isEmpty()) {
            useCases.addAll(useCaseRepository.findByRequirementIdIn(request.getRequirementIds()));
        }
        
        // Eagerly initialize Requirement to avoid LazyInitializationException outside transaction
        for (UseCase uc : useCases) {
            if (uc.getRequirement() != null) {
                org.hibernate.Hibernate.initialize(uc.getRequirement());
            }
        }
        
        return useCases;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    protected List<Map<String, Object>> fetchProjectMembers(Long projectId) {
        List<org.example.backend.entity.ProjectMember> pms = projectMemberRepository.findByProjectId(projectId);
        List<Long> userIds = pms.stream().map(pm -> pm.getUser().getId()).collect(Collectors.toList());
        List<UserAccount> users = userRepository.findAllById(userIds);
        
        return users.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            return map;
        }).collect(Collectors.toList());
    }

    private JsonNode generateTasksBatch(Project project, List<UseCase> useCases, List<Task> existingTasks, List<Map<String, Object>> members) {
        try {
            String todayStr = java.time.LocalDate.now().toString();
            String deadlineStr = project.getEndDate() != null ? project.getEndDate().toString() : java.time.LocalDate.now().plusMonths(1).toString();
            
            ObjectNode dataNode = objectMapper.createObjectNode();
            dataNode.put("today", todayStr);
            dataNode.put("projectDeadline", deadlineStr);
            
            List<Map<String, Object>> simpleUseCases = useCases.stream().map(uc -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", uc.getId());
                map.put("ucCode", uc.getCode());
                map.put("requirementCode", uc.getRequirement() != null ? uc.getRequirement()
                                                                         .getReqCode() : "N/A");
                map.put("name", uc.getName());
                map.put("mainFlow", uc.getMainFlow());
                map.put("alternativeFlows", uc.getAlternativeFlow());
                return map;
            }).collect(Collectors.toList());

            List<Map<String, Object>> simpleExistingTasks = existingTasks.stream().map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getId());
                map.put("title", t.getTitle());
                map.put("description", t.getDescription());
                map.put("priority", t.getPriority() != null ? t.getPriority().name() : null);
                map.put("type", t.getType() != null ? t.getType().name() : null);
                return map;
            }).collect(Collectors.toList());

            dataNode.set("useCases", objectMapper.valueToTree(simpleUseCases));
            dataNode.set("existingTasks", objectMapper.valueToTree(simpleExistingTasks));
            dataNode.set("members", objectMapper.valueToTree(members));

            String cleanJson = taskGeminiService.generateTasksBatch(objectMapper.writeValueAsString(dataNode));
            return objectMapper.readTree(cleanJsonString(cleanJson));
        } catch (Exception e) {
            throw new RuntimeException("Error generating tasks batch: " + e.getMessage(), e);
        }
    }

    private ArrayNode performDeterministicChecks(List<JsonNode> tasks) {
        ArrayNode checkedTasks = objectMapper.createArrayNode();
        Map<String, JsonNode> taskMap = new HashMap<>();
        
        for (JsonNode task : tasks) {
            if (task.has("temp_id")) {
                taskMap.put(task.get("temp_id").asText(), task);
            }
            checkedTasks.add(task);
        }

        // Check invalid temp_id
        for (JsonNode task : checkedTasks) {
            if (task.has("depends_on") && task.get("depends_on").isArray()) {
                ArrayNode dependsOn = (ArrayNode) task.get("depends_on");
                for (int i = dependsOn.size() - 1; i >= 0; i--) {
                    String depId = dependsOn.get(i).asText();
                    if (!taskMap.containsKey(depId)) {
                        dependsOn.remove(i);
                    }
                }
            }
        }

        // Circular dependency check (DFS)
        Set<String> visited = new HashSet<>();
        Set<String> recursionStack = new HashSet<>();

        for (String taskId : taskMap.keySet()) {
            if (hasCircularDependency(taskId, taskMap, visited, recursionStack)) {
                // If circle found, just clear depends_on of this task to break it
                ((ObjectNode) taskMap.get(taskId)).remove("depends_on");
            }
        }

        return checkedTasks;
    }

    private boolean hasCircularDependency(String taskId, Map<String, JsonNode> taskMap, Set<String> visited, Set<String> recursionStack) {
        if (recursionStack.contains(taskId)) return true;
        if (visited.contains(taskId)) return false;

        visited.add(taskId);
        recursionStack.add(taskId);

        JsonNode task = taskMap.get(taskId);
        if (task != null && task.has("depends_on") && task.get("depends_on").isArray()) {
            for (JsonNode depNode : task.get("depends_on")) {
                if (hasCircularDependency(depNode.asText(), taskMap, visited, recursionStack)) {
                    return true;
                }
            }
        }

        recursionStack.remove(taskId);
        return false;
    }

    private JsonNode performCriticalAudit(ArrayNode generatedTasks, List<UseCase> useCases, List<Task> existingTasks, List<Map<String, Object>> members) {
        try {
            ObjectNode dataNode = objectMapper.createObjectNode();

            List<Map<String, Object>> simpleUseCases = useCases.stream().map(uc -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", uc.getId());
                map.put("ucCode", uc.getCode());
                map.put("name", uc.getName());
                map.put("mainFlow", uc.getMainFlow());
                map.put("alternativeFlows", uc.getAlternativeFlow());
                return map;
            }).collect(Collectors.toList());

            List<Map<String, Object>> simpleExistingTasks = existingTasks.stream().map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getId());
                map.put("title", t.getTitle());
                map.put("description", t.getDescription());
                return map;
            }).collect(Collectors.toList());

            dataNode.set("requirementsWithUCsJson", objectMapper.valueToTree(simpleUseCases));
            dataNode.set("existingTasksJson", objectMapper.valueToTree(simpleExistingTasks));
            dataNode.set("projectMembersJson", objectMapper.valueToTree(members));
            dataNode.set("generatedTasksJson", generatedTasks);

            String cleanJson = taskGeminiService.auditTasks(objectMapper.writeValueAsString(dataNode));
            return objectMapper.readTree(cleanJsonString(cleanJson));
        } catch (Exception e) {
            throw new RuntimeException("Error performing critical audit: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> splitTask(Long projectId, Map<String, Object> taskData, Long userId) {
        try {
            Project project = projectRepository.findById(projectId).orElseThrow();
            String todayStr = java.time.LocalDate.now().toString();
            String deadlineStr = project.getEndDate() != null ? project.getEndDate().toString() : java.time.LocalDate.now().plusMonths(1).toString();

            ObjectNode dataNode = objectMapper.createObjectNode();
            dataNode.put("today", todayStr);
            dataNode.put("originalDeadline", deadlineStr);
            dataNode.set("originalTask", objectMapper.valueToTree(taskData));

            String cleanJson = taskGeminiService.splitTask(objectMapper.writeValueAsString(dataNode));
            JsonNode resultNode = objectMapper.readTree(cleanJsonString(cleanJson));
            
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("sub_tasks", resultNode.get("sub_tasks"));
            if (resultNode.has("reason")) {
                responseMap.put("reason", resultNode.get("reason").asText());
            }
            return responseMap;
        } catch (Exception e) {
            throw new RuntimeException("Error splitting task: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> mergeTasks(Long projectId, List<Map<String, Object>> tasksData, Long userId) {
        try {
            String todayStr = java.time.LocalDate.now().toString();

            ObjectNode dataNode = objectMapper.createObjectNode();
            dataNode.put("today", todayStr);
            dataNode.set("tasksToMerge", objectMapper.valueToTree(tasksData));

            String cleanJson = taskGeminiService.mergeTasks(objectMapper.writeValueAsString(dataNode));
            JsonNode resultNode = objectMapper.readTree(cleanJsonString(cleanJson));

            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("merged_task", resultNode.get("merged_task"));
            if (resultNode.has("reason")) {
                responseMap.put("reason", resultNode.get("reason").asText());
            }
            return responseMap;
        } catch (Exception e) {
            throw new RuntimeException("Error merging tasks: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void approveTaskGeneration(Long projectId, UUID generationId, List<Integer> selectedIndices, JsonNode modifiedPayload, Long userId) {
        Project project = projectRepository.findById(projectId).orElseThrow();
        List<AiGenerationStaging> stagings = stagingRepository.findByGenerationId(generationId);
        if (stagings == null || stagings.isEmpty()) {
            throw new RuntimeException("Staging not found");
        }
        AiGenerationStaging staging = stagings.get(0);

        if (modifiedPayload == null || !modifiedPayload.isArray()) {
            throw new RuntimeException("Invalid payload");
        }

        for (Integer index : selectedIndices) {
            JsonNode taskNode = modifiedPayload.get(index);
            if (taskNode != null) {
                Task task = new Task();
                task.setProject(project);
                task.setTitle(taskNode.has("title") ? taskNode.get("title").asText() : "AI Generated Task");
                task.setDescription(taskNode.has("description") ? taskNode.get("description").asText() : "");
                
                try {
                    task.setPriority(taskNode.has("priority") ? Priority.valueOf(taskNode.get("priority").asText().toUpperCase()) : Priority.MEDIUM);
                } catch (Exception e) {
                    task.setPriority(Priority.MEDIUM);
                }

                try {
                    String typeStr = taskNode.has("task_type") ? taskNode.get("task_type").asText() : "DEVELOPMENT";
                    task.setType(TaskType.valueOf(typeStr.toUpperCase()));
                } catch (Exception e) {
                    task.setType(TaskType.DEVELOPMENT);
                }

                if (taskNode.has("estimated_hours")) {
                    task.setEstimatedHours(java.math.BigDecimal.valueOf(taskNode.get("estimated_hours").asDouble()));
                }
                
                if (taskNode.has("requirement_code") && !taskNode.get("requirement_code").asText().isEmpty()) {
                    String reqCode = taskNode.get("requirement_code").asText();
                    Requirement req = requirementRepository.findByProjectIdAndReqCode(projectId, reqCode).orElse(null);
                    if (req != null) task.setRequirementId(req.getId());
                }

                if (taskNode.has("use_case_code") && !taskNode.get("use_case_code").asText().isEmpty()) {
                    String ucCode = taskNode.get("use_case_code").asText();
                    UseCase uc = useCaseRepository.findByProjectIdAndCode(projectId, ucCode).orElse(null);
                    if (uc != null) task.setUseCaseId(uc.getId());
                }

                if (taskNode.has("suggested_assignee") && taskNode.get("suggested_assignee").has("member_name")) {
                    String username = taskNode.get("suggested_assignee").get("member_name").asText();
                    UserAccount assignee = userRepository.findByUsername(username).orElse(null);
                    if (assignee != null) task.setPrimaryAssignee(assignee);
                }
                
                // If the backend has TaskStatus, we might set it here.
                // Assuming default is set in the entity or DB.
                
                if (taskNode.has("_syncAction") && "MERGE_INTO_EXISTING".equals(taskNode.get("_syncAction").asText())) {
                    String existingTaskIdStr = taskNode.get("_existingTaskId").asText().replace("TASK-", "");
                    try {
                        Long existingTaskId = Long.parseLong(existingTaskIdStr);
                        Task existingTask = taskRepository.findById(existingTaskId).orElse(null);
                        if (existingTask != null) {
                            existingTask.setDescription(existingTask.getDescription() + "\n\n[AI Merged Info]:\n" + task.getDescription());
                            taskRepository.save(existingTask);
                            continue; // Skip creating a new one
                        }
                    } catch (NumberFormatException ignored) {}
                }

                taskRepository.save(task);
            }
        }

        staging.setStatus(AiGenerationStatus.CONFIRMED);
        stagingRepository.save(staging);
    }
}
