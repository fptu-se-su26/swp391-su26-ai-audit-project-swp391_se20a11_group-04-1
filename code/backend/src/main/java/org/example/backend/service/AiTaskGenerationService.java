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

import org.example.backend.service.AuditService;
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
                cleaned = cleaned.substring(start + 7, end).trim();
            }
        } else {
            start = cleaned.indexOf("```");
            if (start != -1) {
                int end = cleaned.lastIndexOf("```");
                if (end > start && start != end) {
                    cleaned = cleaned.substring(start + 3, end).trim();
                    if (cleaned.startsWith("json")) {
                        cleaned = cleaned.substring(4).trim();
                    }
                }
            }
        }
        
        int firstCurly = cleaned.indexOf("{");
        int lastCurly = cleaned.lastIndexOf("}");
        int firstSquare = cleaned.indexOf("[");
        int lastSquare = cleaned.lastIndexOf("]");
        
        if (firstCurly != -1 && lastCurly > firstCurly) {
            if (firstSquare != -1 && lastSquare > firstSquare) {
                if (firstCurly < firstSquare && lastCurly > lastSquare) {
                    return cleaned.substring(firstCurly, lastCurly + 1);
                } else if (firstSquare < firstCurly && lastSquare > lastCurly) {
                    return cleaned.substring(firstSquare, lastSquare + 1);
                } else {
                    if (firstCurly < firstSquare) return cleaned.substring(firstCurly, lastCurly + 1);
                    else return cleaned.substring(firstSquare, lastSquare + 1);
                }
            } else {
                return cleaned.substring(firstCurly, lastCurly + 1);
            }
        } else if (firstSquare != -1 && lastSquare > firstSquare) {
            return cleaned.substring(firstSquare, lastSquare + 1);
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
    private org.example.backend.service.KanbanColumnService kanbanColumnService;
    
    @Autowired
    private AuditService auditService;

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
        List<UseCase> useCases = self.fetchUseCases(request, projectId);
        List<Requirement> directReqs = self.fetchDirectRequirements(request, projectId, useCases);

        if (useCases.isEmpty() && directReqs.isEmpty()) {
            throw new RuntimeException("No valid Use Cases or Requirements found to generate tasks. For Functional Requirements, please generate Use Cases first, or they will be generated directly from the description.");
        }

        String idsStr = useCases.stream().map(uc -> uc.getCode() != null ? uc.getCode() : String.valueOf(uc.getId())).sorted().collect(Collectors.joining(",")) +
                        "|" + directReqs.stream().map(r -> r.getReqCode() != null ? r.getReqCode() : String.valueOf(r.getId())).sorted().collect(Collectors.joining(","));
        String stagingHash = org.springframework.util.DigestUtils.md5DigestAsHex(idsStr.getBytes());
        java.util.Optional<AiGenerationStaging> existingCache = stagingRepository.findFirstByFileHashAndProjectIdAndStageOrderByCreatedAtDesc(stagingHash, projectId, AiStage.TASK);

        List<Task> existingProjectTasks = taskRepository.findByProjectId(projectId);
        // BUG-7 FIX: Use cache regardless of whether the project already has tasks.
        // The cache is valid if: same hash (same UC/Req set) + status is a reusable state.
        // We skip cache only when the project has NO matching confirmed staging for this exact hash.
        if (existingCache.isPresent() && (existingCache.get().getStatus() == AiGenerationStatus.CONFIRMED || existingCache.get().getStatus() == AiGenerationStatus.PENDING || existingCache.get().getStatus() == AiGenerationStatus.DISCARDED)) {
            AiGenerationStaging oldStaging = existingCache.get();
            UUID generationId = UUID.randomUUID();
            AiGenerationStaging newStaging = AiGenerationStaging.builder()
                    .project(project)
                    .stage(AiStage.TASK)
                    .generationId(generationId)
                    .payload(objectMapper.createObjectNode())
                    .fileHash(stagingHash)
                    .status(AiGenerationStatus.PENDING)
                    .build();
            stagingRepository.save(newStaging);
            java.util.concurrent.CompletableFuture.runAsync(() -> {
                try {
                    Thread.sleep(10000); // Synchronous fake AI delay (10s) so frontend shows loading
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                newStaging.setPayload(oldStaging.getPayload());
                newStaging.setStatus(AiGenerationStatus.CONFIRMED);
                stagingRepository.save(newStaging);
            });
            return generationId;
        }

        UUID generationId = UUID.randomUUID();
        AiGenerationStaging staging = AiGenerationStaging.builder()
                .project(project)
                .stage(AiStage.TASK)
                .generationId(generationId)
                .payload(objectMapper.createObjectNode())
                .fileHash(stagingHash)
                .status(AiGenerationStatus.PENDING)
                .build();
        stagingRepository.save(staging);

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                List<Task> existingTasks = self.fetchExistingTasks(projectId);
                List<Map<String, Object>> members = self.fetchProjectMembers(projectId);

                // 2. Chunking / Batching Phase 1: Task Generation
                List<JsonNode> generatedTasksList = new ArrayList<>();
                int batchSize = 5;
                
                // Process Functional Use Cases
                for (int i = 0; i < useCases.size(); i += batchSize) {
                    List<UseCase> batch = useCases.subList(i, Math.min(i + batchSize, useCases.size()));
                    JsonNode batchResult = generateTasksBatch(project, batch, java.util.Collections.emptyList(), existingTasks, members);
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
                
                // Process Direct Requirements (Non-Functional or Functional without Use Cases)
                for (int i = 0; i < directReqs.size(); i += batchSize) {
                    List<Requirement> batch = directReqs.subList(i, Math.min(i + batchSize, directReqs.size()));
                    JsonNode batchResult = generateTasksBatch(project, java.util.Collections.emptyList(), batch, existingTasks, members);
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
                JsonNode auditResult = performCriticalAudit(safeTasksNode, useCases, directReqs, existingTasks, members);

                // 5. Update Staging
                ObjectNode finalPayload = objectMapper.createObjectNode();
                finalPayload.set("tasks", safeTasksNode);
                if (auditResult != null && auditResult.has("ai_critical_assessment")) {
                    finalPayload.set("ai_critical_assessment", auditResult.get("ai_critical_assessment"));
                }
                
                staging.setPayload(finalPayload);
                staging.setStatus(AiGenerationStatus.CONFIRMED);
                stagingRepository.save(staging);
            } catch (Exception e) {
                log.error("Error during async task generation", e);
                staging.setStatus(AiGenerationStatus.DISCARDED);
                stagingRepository.save(staging);
            }
        });

        return generationId;
    }



    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<UseCase> fetchUseCases(AiTaskGenerateRequest request, Long projectId) {
        List<UseCase> useCases = new ArrayList<>();
        if (request.getUseCaseIds() != null && !request.getUseCaseIds().isEmpty()) {
            useCases.addAll(useCaseRepository.findAllById(request.getUseCaseIds()));
        } else if (request.getRequirementIds() != null && !request.getRequirementIds().isEmpty()) {
            useCases.addAll(useCaseRepository.findByRequirementIdIn(request.getRequirementIds()));
        }
        
        for (UseCase uc : useCases) {
            if (!uc.getProjectId().equals(projectId)) {
                throw new RuntimeException("UseCase ID " + uc.getId() + " không thuộc dự án này.");
            }
            if (uc.getRequirement() != null) {
                org.hibernate.Hibernate.initialize(uc.getRequirement());
            }
        }
        
        return useCases;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<Requirement> fetchDirectRequirements(AiTaskGenerateRequest request, Long projectId, List<UseCase> fetchedUseCases) {
        List<Requirement> reqs = new ArrayList<>();
        if (request.getRequirementIds() != null && !request.getRequirementIds().isEmpty()) {
            reqs.addAll(requirementRepository.findAllById(request.getRequirementIds()));
        }
        for (Requirement req : reqs) {
            if (!req.getProject().getId().equals(projectId)) {
                throw new RuntimeException("Requirement ID " + req.getId() + " không thuộc dự án này.");
            }
        }
        
        java.util.Set<Long> reqIdsWithUseCases = fetchedUseCases.stream()
            .filter(uc -> uc.getRequirement() != null)
            .map(uc -> uc.getRequirement().getId())
            .collect(Collectors.toSet());
            
        return reqs.stream()
                .filter(r -> r.getType() != org.example.backend.entity.RequirementType.FUNCTIONAL || !reqIdsWithUseCases.contains(r.getId()))
                .collect(Collectors.toList());
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

    private JsonNode generateTasksBatch(Project project, List<UseCase> useCases, List<Requirement> nonFunctionalReqs, List<Task> existingTasks, List<Map<String, Object>> members) {
        try {
            String todayStr = java.time.LocalDate.now().toString();
            String startDateStr = project.getStartDate() != null ? project.getStartDate().toString() : todayStr;
            String deadlineStr = project.getDeadline() != null ? project.getDeadline().toString() : (project.getEndDate() != null ? project.getEndDate().toString() : java.time.LocalDate.now().plusMonths(1).toString());
            
            ObjectNode dataNode = objectMapper.createObjectNode();
            dataNode.put("today", todayStr);
            dataNode.put("projectStartDate", startDateStr);
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
            
            List<Map<String, Object>> simpleNonFuncReqs = nonFunctionalReqs.stream().map(req -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", req.getId());
                map.put("requirementCode", req.getReqCode());
                map.put("title", req.getTitle());
                map.put("description", req.getDescription());
                map.put("type", req.getType() != null ? req.getType().name() : "N/A");
                return map;
            }).collect(Collectors.toList());

            java.util.Set<Long> reqIds = new java.util.HashSet<>();
            reqIds.addAll(useCases.stream()
                .filter(uc -> uc.getRequirement() != null)
                .map(uc -> uc.getRequirement().getId())
                .collect(Collectors.toSet()));
            reqIds.addAll(nonFunctionalReqs.stream().map(Requirement::getId).collect(Collectors.toSet()));

            java.util.Set<Long> ucIds = useCases.stream()
                .map(UseCase::getId)
                .collect(Collectors.toSet());

            List<Map<String, Object>> simpleExistingTasks = existingTasks.stream()
                .filter(t -> (t.getRequirementId() != null && reqIds.contains(t.getRequirementId())) || (t.getUseCaseId() != null && ucIds.contains(t.getUseCaseId())))
                .map(t -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", t.getId());
                map.put("title", t.getTitle());
                map.put("description", t.getDescription());
                map.put("priority", t.getPriority() != null ? t.getPriority().name() : null);
                map.put("type", t.getType() != null ? t.getType().name() : null);
                return map;
            }).collect(Collectors.toList());

            dataNode.set("useCases", objectMapper.valueToTree(simpleUseCases));
            dataNode.set("nonFunctionalRequirements", objectMapper.valueToTree(simpleNonFuncReqs));
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

        // BUG-3 FIX: Instead of removing all depends_on of the offending task,
        // only remove the specific edge(s) that form a cycle by doing a targeted break.
        // We rebuild depends_on removing only the dep that causes the back-edge (cycle entry point).
        for (String taskId : new java.util.ArrayList<>(taskMap.keySet())) {
            Set<String> visitedCheck = new HashSet<>();
            Set<String> stack = new HashSet<>();
            if (hasCircularDependency(taskId, taskMap, visitedCheck, stack)) {
                // Find and remove only the back-edge that creates the cycle
                JsonNode taskNode = taskMap.get(taskId);
                if (taskNode != null && taskNode.has("depends_on") && taskNode.get("depends_on").isArray()) {
                    ArrayNode depsArray = (ArrayNode) taskNode.get("depends_on");
                    for (int i = depsArray.size() - 1; i >= 0; i--) {
                        String depId = depsArray.get(i).asText();
                        // If removing this single edge breaks the cycle, remove only it
                        Set<String> testVisited = new HashSet<>();
                        Set<String> testStack = new HashSet<>();
                        depsArray.remove(i);
                        boolean stillHasCycle = hasCircularDependency(taskId, taskMap, testVisited, testStack);
                        if (!stillHasCycle) break; // Found the single back-edge, done
                        // Restore and try the next one
                        depsArray.insert(i, depId);
                    }
                }
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

    private JsonNode performCriticalAudit(ArrayNode generatedTasks, List<UseCase> useCases, List<Requirement> nonFunctionalReqs, List<Task> existingTasks, List<Map<String, Object>> members) {
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
            
            List<Map<String, Object>> simpleNonFuncReqs = nonFunctionalReqs.stream().map(req -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", req.getId());
                map.put("requirementCode", req.getReqCode());
                map.put("title", req.getTitle());
                map.put("description", req.getDescription());
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
            dataNode.set("nonFunctionalRequirementsJson", objectMapper.valueToTree(simpleNonFuncReqs));
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

        // BUG-2 FIX: The approve flow sets staging to CONFIRMED when generation is ready.
        // So we should only block if the staging is ALREADY fully approved (re-approve attempt),
        // not on the first approval of a CONFIRMED-ready staging.
        // We detect a re-approve attempt by checking if this generationId's tasks already exist.
        // Simple approach: allow CONFIRMED (ready-to-approve) and throw only for already-processed states
        // by checking if there are already tasks linked to this sourceGenerationId.
        boolean alreadyApproved = taskRepository.existsBySourceGenerationId(generationId);
        if (alreadyApproved) {
            throw new RuntimeException("This generation has already been approved.");
        }

        if (modifiedPayload == null || !modifiedPayload.isArray()) {
            throw new RuntimeException("Invalid payload");
        }

        UserAccount creator = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        kanbanColumnService.ensureDefaultColumns(projectId);
        KanbanColumn defaultColumn = kanbanColumnRepository.findByProjectIdAndStatusKey(projectId, "TODO")
            .orElseGet(() -> kanbanColumnRepository.findByProjectIdAndNameIgnoreCase(projectId, "TODO").orElse(null));

        Map<String, Task> tempIdToSavedTaskMap = new java.util.HashMap<>();
        List<java.util.Map.Entry<Task, JsonNode>> tasksToProcessDependencies = new java.util.ArrayList<>();

        for (Integer index : selectedIndices) {
            JsonNode taskNode = modifiedPayload.get(index);
            if (taskNode != null) {
                Task task = Task.builder().build();
                task.setProject(project);
                task.setCreatedBy(creator);
                task.setKanbanColumn(defaultColumn);
                task.setStatus(org.example.backend.entity.TaskStatus.TODO);
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
                // Auto-clamp dates to prevent AI from causing BadRequestException
                if (project != null) {
                    if (task.getStartDate() != null && project.getStartDate() != null && task.getStartDate().isBefore(project.getStartDate())) {
                        task.setStartDate(project.getStartDate());
                    }
                    if (task.getDeadline() != null && project.getDeadline() != null && task.getDeadline().isAfter(project.getDeadline())) {
                        task.setDeadline(project.getDeadline());
                    }
                    if (task.getStartDate() != null && task.getDeadline() != null && task.getStartDate().isAfter(task.getDeadline())) {
                        task.setStartDate(task.getDeadline());
                    }
                }
                
                if (task.getSprintId() != null) {
                    Sprint sprint = sprintRepository.findById(task.getSprintId()).orElse(null);
                    if (sprint != null) {
                        if (task.getStartDate() != null && sprint.getStartDate() != null && task.getStartDate().isBefore(sprint.getStartDate())) {
                            task.setStartDate(sprint.getStartDate());
                        }
                        if (task.getDeadline() != null && sprint.getEndDate() != null && task.getDeadline().isAfter(sprint.getEndDate())) {
                            task.setDeadline(sprint.getEndDate());
                        }
                        if (task.getStartDate() != null && task.getDeadline() != null && task.getStartDate().isAfter(task.getDeadline())) {
                            task.setStartDate(task.getDeadline());
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
                            
                            auditService.publishSuccess(userId, creator.getUsername(), "UPDATE_TASK", 
                                    "Task", existingTask.getId(), projectId, null, 
                                    "INTERNAL", "POST", "/api/generate/approve-tasks/" + generationId, 0L);
                            
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
                
                if (taskNode.has("temp_id")) {
                    tempIdToSavedTaskMap.put(taskNode.get("temp_id").asText(), task);
                }
                if (taskNode.has("depends_on") && taskNode.get("depends_on").isArray() && taskNode.get("depends_on").size() > 0) {
                    tasksToProcessDependencies.add(new java.util.AbstractMap.SimpleEntry<>(task, taskNode));
                }

                auditService.publishSuccess(userId, creator.getUsername(), "CREATE_TASK", 
                        "Task", task.getId(), projectId, null, 
                        "INTERNAL", "POST", "/api/generate/approve-tasks/" + generationId, 0L);

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
        
        // Pass 2: Wire up dependencies
        for (java.util.Map.Entry<Task, JsonNode> entry : tasksToProcessDependencies) {
            Task task = entry.getKey();
            JsonNode taskNode = entry.getValue();
            java.util.Set<Task> dependsOnSet = new java.util.HashSet<>();
            for (JsonNode depNode : taskNode.get("depends_on")) {
                String depStr = depNode.asText();
                if (depStr.startsWith("TASK-")) {
                    try {
                        Long existingId = Long.parseLong(depStr.replace("TASK-", ""));
                        Task existingDep = taskRepository.findById(existingId).orElse(null);
                        if (existingDep != null) dependsOnSet.add(existingDep);
                    } catch (Exception ignored) {}
                } else {
                    Task tempDep = tempIdToSavedTaskMap.get(depStr);
                    if (tempDep != null) dependsOnSet.add(tempDep);
                }
            }
            if (!dependsOnSet.isEmpty()) {
                task.setDependsOn(dependsOnSet);
                taskRepository.save(task);
            }
        }

        staging.setStatus(AiGenerationStatus.CONFIRMED);
        stagingRepository.save(staging);
    }
}
