package org.example.backend.service.sla.executor;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.entity.*;
import org.example.backend.repository.TaskRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CreateRecoveryChecklistExecutor implements RecoveryActionExecutor {

    private final TaskRepository taskRepository;
    private final ObjectMapper objectMapper;

    @Override
    public Set<RecoveryActionType> supports() {
        return Set.of(RecoveryActionType.CREATE_RECOVERY_CHECKLIST);
    }

    @Override
    public void execute(RecoveryPlanAction action, Task task, Project project) {
        List<String> checklistItems = resolveChecklistItems(action);
        int createdCount = 0;

        int maxOrder = task.getChecklist() != null && !task.getChecklist().isEmpty()
                ? task.getChecklist().stream().mapToInt(TaskChecklist::getOrderIndex).max().orElse(0)
                : 0;

        if (task.getChecklist() == null) {
            task.setChecklist(new ArrayList<>());
        }

        for (String item : checklistItems) {
            String content = "[Recovery] " + item;
            boolean exists = task.getChecklist().stream()
                    .anyMatch(c -> c.getContent().equals(content));
            if (exists) {
                continue;
            }
            maxOrder++;
            createdCount++;
            task.getChecklist().add(TaskChecklist.builder()
                    .task(task)
                    .content(content)
                    .done(false)
                    .orderIndex(maxOrder)
                    .build());
        }

        taskRepository.save(task);

        action.setStatus(RecoveryPlanActionStatus.EXECUTED);
        action.setExecutedAt(LocalDateTime.now());
        action.setResultMessage(createdCount > 0
                ? "Created " + createdCount + " recovery checklist item(s)"
                : "Recovery checklist item(s) already exist");
    }

    private List<String> resolveChecklistItems(RecoveryPlanAction action) {
        List<String> items = parseChecklistItems(action.getPayloadJson());
        if (!items.isEmpty()) {
            return items;
        }
        String fallback = action.getMessage() != null && !action.getMessage().isBlank()
                ? action.getMessage()
                : "Review remaining work and update progress today.";
        return List.of(fallback);
    }

    private List<String> parseChecklistItems(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank() || "{}".equals(payloadJson.trim())) {
            return List.of();
        }
        try {
            Map<String, Object> payload = objectMapper.readValue(payloadJson, new TypeReference<>() {});
            Object rawItems = payload.get("checklistItems");
            if (!(rawItems instanceof List<?> rawList)) {
                return List.of();
            }
            return rawList.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .map(String::trim)
                    .filter(item -> !item.isBlank())
                    .limit(6)
                    .toList();
        } catch (Exception ex) {
            return List.of();
        }
    }
}
