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
        
        int start = cleaned.indexOf("```json");
        if (start != -1) {
            int end = cleaned.lastIndexOf("```");
            if (end > start) {
                return cleaned.substring(start + 7, end).trim();
            }
        }
        
        start = cleaned.indexOf("```");
        if (start != -1) {
            int end = cleaned.lastIndexOf("```");
            if (end > start && start != end) {
                String sub = cleaned.substring(start + 3, end).trim();
                if (sub.startsWith("json")) {
                    sub = sub.substring(4).trim();
                }
                return sub;
            }
        }
        
        // Fallback: extract from first { or [ to last } or ]
        int firstBrace = cleaned.indexOf('{');
        int firstBracket = cleaned.indexOf('[');
        int startIdx = -1;
        if (firstBrace != -1 && firstBracket != -1) {
            startIdx = Math.min(firstBrace, firstBracket);
        } else if (firstBrace != -1) {
            startIdx = firstBrace;
        } else if (firstBracket != -1) {
            startIdx = firstBracket;
        }

        int lastBrace = cleaned.lastIndexOf('}');
        int lastBracket = cleaned.lastIndexOf(']');
        int endIdx = -1;
        if (lastBrace != -1 && lastBracket != -1) {
            endIdx = Math.max(lastBrace, lastBracket);
        } else if (lastBrace != -1) {
            endIdx = lastBrace;
        } else if (lastBracket != -1) {
            endIdx = lastBracket;
        }

        if (startIdx != -1 && endIdx != -1 && startIdx <= endIdx) {
            return cleaned.substring(startIdx, endIdx + 1);
        }

        return cleaned;
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
    private final KanbanColumnRepository kanbanColumnRepository;
    private final org.example.backend.repository.TaskChecklistRepository taskChecklistRepository;
    private final SprintRepository sprintRepository;

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
                                   ObjectMapper objectMapper,
                                   KanbanColumnRepository kanbanColumnRepository,
                                   org.example.backend.repository.TaskChecklistRepository taskChecklistRepository,
                                   SprintRepository sprintRepository) {
        this.taskGeminiService = taskGeminiService;
        this.stagingRepository = stagingRepository;
        this.projectRepository = projectRepository;
        this.requirementRepository = requirementRepository;
        this.useCaseRepository = useCaseRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.objectMapper = objectMapper;
        this.kanbanColumnRepository = kanbanColumnRepository;
        this.taskChecklistRepository = taskChecklistRepository;
        this.sprintRepository = sprintRepository;
    }

    public UUID generateTasks(Long projectId, AiTaskGenerateRequest request, Long userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found: " + projectId));

        // 1. Data Collection
        List<UseCase> useCases = self.fetchUseCases(request);
        if (useCases.isEmpty()) {
            throw new RuntimeException("No valid Use Cases found to generate tasks.");
        }

        List<Task> existingTasks = self.fetchExistingTasks(projectId);
        List<Map<String, Object>> members = self.fetchProjectMembers(projectId);

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
    public List<Map<String, Object>> fetchProjectMembers(Long projectId) {
        List<org.example.backend.entity.ProjectMember> pms = projectMemberRepository.findByProjectId(projectId);
        return pms.stream().map(pm -> {
            Map<String, Object> map = new HashMap<>();
            org.example.backend.entity.UserAccount u = pm.getUser();
            map.put("id", u.getId());
            map.put("username", u.getUsername());
            map.put("fullName", u.getProfile() != null ? u.getProfile().getFullName() : u.getUsername());
            return map;
        }).collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Task> fetchExistingTasks(Long projectId) {
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        for (Task t : tasks) {
            if (t.getPrimaryAssignee() != null) {
                org.hibernate.Hibernate.initialize(t.getPrimaryAssignee());
            }
        }
        return tasks;
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
            
            // Calculate current workload
            Map<String, Long> taskCountMap = new HashMap<>();
            Map<String, Double> weightMap = new HashMap<>();
            if (existingTasks != null) {
                for (Task t : existingTasks) {
                    if (t.getPrimaryAssignee() != null) {
                        String username = t.getPrimaryAssignee().getUsername();
                        taskCountMap.put(username, taskCountMap.getOrDefault(username, 0L) + 1);
                        weightMap.put(username, weightMap.getOrDefault(username, 0.0) + (t.getWeight() != null ? t.getWeight().doubleValue() : 1.0));
                    }
                }
            }
            
            List<Map<String, Object>> membersWithWorkload = members.stream().map(m -> {
                Map<String, Object> map = new HashMap<>(m);
                String username = (String) m.get("username");
                map.put("current_task_count", taskCountMap.getOrDefault(username, 0L));
                map.put("current_workload_weight", weightMap.getOrDefault(username, 0.0));
                return map;
            }).collect(Collectors.toList());

            dataNode.set("members", objectMapper.valueToTree(membersWithWorkload));

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

            // Wrap Gemini call separately so API errors (401, quota) fall through to fallback
            JsonNode resultNode = null;
            try {
                String cleanJson = taskGeminiService.splitTask(objectMapper.writeValueAsString(dataNode));
                resultNode = objectMapper.readTree(cleanJsonString(cleanJson));
            } catch (Exception geminiEx) {
                log.warn("Gemini splitTask failed ({}), falling back to deterministic split.", geminiEx.getMessage());
                resultNode = objectMapper.createObjectNode(); // empty node → triggers fallback below
            }

            Map<String, Object> responseMap = new HashMap<>();

            boolean hasValidSubTasks = resultNode != null
                    && resultNode.has("sub_tasks")
                    && resultNode.get("sub_tasks").isArray()
                    && resultNode.get("sub_tasks").size() >= 2;

            if (hasValidSubTasks) {
                List<Map<String, Object>> parsedList = objectMapper.convertValue(
                        resultNode.get("sub_tasks"), 
                        new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {}
                );
                responseMap.put("sub_tasks", parsedList);
            } else {
                // HARD FALLBACK: Gemini refused / API error → deterministic 2-phase split
                log.info("splitTask: using deterministic fallback for task '{}'", taskData.get("title"));
                List<Map<String, Object>> fallbackList = new ArrayList<>();

                String baseTitle = taskData.containsKey("title") ? taskData.get("title").toString() : "Task";
                String baseDesc = taskData.containsKey("description") ? taskData.get("description").toString() : "";
                double baseHours;
                try {
                    baseHours = taskData.containsKey("estimated_hours") ? Double.parseDouble(taskData.get("estimated_hours").toString()) : 4.0;
                } catch (NumberFormatException nfe) {
                    baseHours = 4.0;
                }
                String priority = taskData.containsKey("priority") ? taskData.get("priority").toString() : "MEDIUM";
                String taskType = taskData.containsKey("task_type") ? taskData.get("task_type").toString() : "DEVELOPMENT";

                Map<String, Object> part1 = new HashMap<>();
                part1.put("temp_id", "fallback_sub1");
                part1.put("title", "[Phase 1] " + baseTitle);
                part1.put("description", "Analyze, design and prepare for: " + baseDesc);
                part1.put("estimated_hours", Math.max(1.0, baseHours / 2.0));
                part1.put("priority", priority);
                part1.put("task_type", taskType);
                part1.put("checklists", List.of("Requirements analysis", "Design solution", "Confirm scope with team"));

                Map<String, Object> part2 = new HashMap<>();
                part2.put("temp_id", "fallback_sub2");
                part2.put("title", "[Phase 2] " + baseTitle);
                part2.put("description", "Execute, test and finalize for: " + baseDesc);
                part2.put("estimated_hours", Math.max(1.0, baseHours / 2.0));
                part2.put("priority", priority);
                part2.put("task_type", taskType);
                part2.put("depends_on", List.of("fallback_sub1"));
                part2.put("checklists", List.of("Implement based on design", "Write unit tests", "Code review", "Deploy & verify"));

                fallbackList.add(part1);
                fallbackList.add(part2);
                responseMap.put("sub_tasks", fallbackList);
            }

            if (resultNode != null && resultNode.has("reason")) {
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
            
            if (resultNode.has("merged_task")) {
                Map<String, Object> parsedMap = objectMapper.convertValue(
                        resultNode.get("merged_task"),
                        new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}
                );
                responseMap.put("merged_task", parsedMap);
            }
            
            if (resultNode.has("reason")) {
                responseMap.put("reason", resultNode.get("reason").asText());
            }
            return responseMap;
        } catch (Exception e) {
            log.error("Error merging tasks via AI, using fallback.", e);
            return createFallbackMergedTask(tasksData);
        }
    }

    private Map<String, Object> createFallbackMergedTask(List<Map<String, Object>> tasksData) {
        Map<String, Object> responseMap = new HashMap<>();
        Map<String, Object> merged = new HashMap<>();
        
        if (tasksData == null || tasksData.isEmpty()) {
            return responseMap;
        }
        
        StringBuilder combinedTitle = new StringBuilder("Merged: ");
        StringBuilder combinedDesc = new StringBuilder("Merged tasks:\n");
        double totalHours = 0.0;
        
        for (Map<String, Object> t : tasksData) {
            String tTitle = t.containsKey("title") ? t.get("title").toString() : "Task";
            combinedTitle.append(tTitle).append(" & ");
            
            String tDesc = t.containsKey("description") ? t.get("description").toString() : "";
            combinedDesc.append("- ").append(tTitle).append(": ").append(tDesc).append("\n");
            
            try {
                if (t.containsKey("estimated_hours") && t.get("estimated_hours") != null) {
                    totalHours += Double.parseDouble(t.get("estimated_hours").toString());
                }
            } catch (NumberFormatException ignored) {}
        }
        
        String finalTitle = combinedTitle.substring(0, Math.max(0, combinedTitle.length() - 3));
        if (finalTitle.length() > 100) finalTitle = finalTitle.substring(0, 97) + "...";
        
        merged.put("temp_id", "fallback_merged");
        merged.put("title", finalTitle);
        merged.put("description", combinedDesc.toString());
        merged.put("estimated_hours", totalHours);
        merged.put("priority", tasksData.get(0).containsKey("priority") ? tasksData.get(0).get("priority") : "MEDIUM");
        merged.put("task_type", tasksData.get(0).containsKey("task_type") ? tasksData.get(0).get("task_type") : "DEVELOPMENT");
        
        responseMap.put("merged_task", merged);
        responseMap.put("reason", "API failed. Used deterministic fallback merge.");
        
        return responseMap;
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

        UserAccount creator = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        KanbanColumn defaultColumn = kanbanColumnRepository.findByProjectIdAndStatusKey(projectId, "TODO")
            .orElseGet(() -> kanbanColumnRepository.findByProjectIdAndNameIgnoreCase(projectId, "TODO").orElse(null));

        for (Integer index : selectedIndices) {
            JsonNode taskNode = modifiedPayload.get(index);
            if (taskNode != null) {
                Task task = Task.builder().build();
                task.setProject(project);
                task.setCreatedBy(creator);
                task.setKanbanColumn(defaultColumn);
                task.setTitle(taskNode.has("title") ? taskNode.get("title").asText() : "AI Generated Task");
                task.setDescription(taskNode.has("description") ? taskNode.get("description").asText() : "");
                
                if (taskNode.has("start_date") && !taskNode.get("start_date").isNull() && !taskNode.get("start_date").asText().isEmpty()) {
                    try {
                        task.setStartDate(java.time.LocalDate.parse(taskNode.get("start_date").asText()));
                    } catch (Exception e) {}
                }
                
                String deadlineStr = null;
                if (taskNode.has("deadline") && !taskNode.get("deadline").isNull() && !taskNode.get("deadline").asText().isEmpty()) {
                    deadlineStr = taskNode.get("deadline").asText();
                } else if (taskNode.has("suggested_deadline") && !taskNode.get("suggested_deadline").isNull() && !taskNode.get("suggested_deadline").asText().isEmpty()) {
                    deadlineStr = taskNode.get("suggested_deadline").asText();
                }
                
                if (deadlineStr != null) {
                    try {
                        task.setDeadline(java.time.LocalDate.parse(deadlineStr));
                    } catch (Exception e) {
                        task.setDeadline(java.time.LocalDate.now().plusDays(7));
                    }
                } else {
                    task.setDeadline(java.time.LocalDate.now().plusDays(7));
                }
                
                if (taskNode.has("weight") && !taskNode.get("weight").isNull()) {
                    try {
                        task.setWeight(java.math.BigDecimal.valueOf(taskNode.get("weight").asDouble()));
                    } catch (Exception e) {}
                }
                
                if (taskNode.has("sprint_id") && !taskNode.get("sprint_id").isNull()) {
                    try {
                        task.setSprintId(taskNode.get("sprint_id").asLong());
                    } catch (Exception e) {}
                }
                
                org.example.backend.util.DateValidationUtils.validateDateRange(task.getStartDate(), task.getDeadline(), "Task");
                if (project != null) {
                    try {
                        org.example.backend.util.DateValidationUtils.validateBounds(task.getStartDate(), task.getDeadline(), project.getStartDate(), project.getDeadline(), "Task", "Project");
                    } catch (Exception e) {
                        throw new org.example.backend.exception.BadRequestException("Task '" + task.getTitle() + "' có ngày nằm ngoài Project.");
                    }
                }
                if (task.getSprintId() != null) {
                    Sprint sprint = sprintRepository.findById(task.getSprintId()).orElse(null);
                    if (sprint != null) {
                        try {
                            org.example.backend.util.DateValidationUtils.validateBounds(task.getStartDate(), task.getDeadline(), sprint.getStartDate(), sprint.getEndDate(), "Task", "Sprint");
                        } catch (Exception e) {
                            throw new org.example.backend.exception.BadRequestException("Task '" + task.getTitle() + "' có ngày nằm ngoài Sprint.");
                        }
                    }
                }
                
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
                    if (taskNode.has("_existingTaskId") && !taskNode.get("_existingTaskId").isNull()) {
                        String existingTaskIdStr = taskNode.get("_existingTaskId").asText().replace("TASK-", "");
                    try {
                        Long existingTaskId = Long.parseLong(existingTaskIdStr);
                        Task existingTask = taskRepository.findById(existingTaskId).orElse(null);
                        if (existingTask != null) {
                            existingTask.setTitle(task.getTitle());
                            existingTask.setDescription(task.getDescription());
                            existingTask.setPriority(task.getPriority());
                            existingTask.setType(task.getType());
                            existingTask.setEstimatedHours(task.getEstimatedHours());
                            if (task.getStartDate() != null) existingTask.setStartDate(task.getStartDate());
                            if (task.getDeadline() != null) existingTask.setDeadline(task.getDeadline());
                            if (task.getWeight() != null) existingTask.setWeight(task.getWeight());
                            if (task.getSprintId() != null) existingTask.setSprintId(task.getSprintId());
                            if (task.getRequirementId() != null) existingTask.setRequirementId(task.getRequirementId());
                            if (task.getUseCaseId() != null) existingTask.setUseCaseId(task.getUseCaseId());
                            if (task.getPrimaryAssignee() != null) existingTask.setPrimaryAssignee(task.getPrimaryAssignee());
                            taskRepository.save(existingTask);
                            
                            // Save Checklists for existing task
                            if (taskNode.has("checklists") && taskNode.get("checklists").isArray()) {
                                // Delete old checklists
                                taskChecklistRepository.deleteByTaskId(existingTask.getId());
                                
                                int orderIndex = 0;
                                for (JsonNode checklistNode : taskNode.get("checklists")) {
                                    String content = checklistNode.asText();
                                    if (content != null && !content.trim().isEmpty() && !content.trim().equalsIgnoreCase("null")) {
                                        org.example.backend.entity.TaskChecklist checklist = org.example.backend.entity.TaskChecklist.builder()
                                                .task(existingTask)
                                                .content(content.trim())
                                                .done(false)
                                                .orderIndex(orderIndex++)
                                                .build();
                                        taskChecklistRepository.save(checklist);
                                    }
                                }
                            }
                            
                            continue; // Skip creating a new one
                        }
                    } catch (NumberFormatException ignored) {}
                    }
                }

                taskRepository.save(task);

                // Save Checklists
                if (taskNode.has("checklists") && taskNode.get("checklists").isArray()) {
                    int orderIndex = 0;
                    for (JsonNode checklistNode : taskNode.get("checklists")) {
                        String content = checklistNode.asText();
                        if (content != null && !content.trim().isEmpty() && !content.trim().equalsIgnoreCase("null")) {
                            org.example.backend.entity.TaskChecklist checklist = org.example.backend.entity.TaskChecklist.builder()
                                    .task(task)
                                    .content(content.trim())
                                    .done(false)
                                    .orderIndex(orderIndex++)
                                    .build();
                            taskChecklistRepository.save(checklist);
                        }
                    }
                }
            }
        }

        staging.setStatus(AiGenerationStatus.CONFIRMED);
        stagingRepository.save(staging);
    }
}
