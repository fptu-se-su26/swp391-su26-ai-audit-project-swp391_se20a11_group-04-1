package org.example.backend.service.sla.executor;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.*;
import org.example.backend.repository.TaskRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CreateRecoveryChecklistExecutor implements RecoveryActionExecutor {

    private final TaskRepository taskRepository;

    @Override
    public Set<RecoveryActionType> supports() {
        return Set.of(RecoveryActionType.CREATE_RECOVERY_CHECKLIST);
    }

    @Override
    public void execute(RecoveryPlanAction action, Task task, Project project) {
        String content = "[Recovery] " + (action.getMessage() != null
                ? action.getMessage()
                : "Review remaining work and update progress today.");

        boolean exists = task.getChecklist() != null && task.getChecklist().stream()
                .anyMatch(c -> c.getContent().equals(content));

        if (exists) {
            action.setStatus(RecoveryPlanActionStatus.EXECUTED);
            action.setExecutedAt(LocalDateTime.now());
            action.setResultMessage("Checklist already exists");
            return;
        }

        int maxOrder = task.getChecklist() != null && !task.getChecklist().isEmpty()
                ? task.getChecklist().stream().mapToInt(TaskChecklist::getOrderIndex).max().orElse(0)
                : 0;

        if (task.getChecklist() == null) {
            task.setChecklist(new ArrayList<>());
        }
        task.getChecklist().add(TaskChecklist.builder()
                .task(task)
                .content(content)
                .done(false)
                .orderIndex(maxOrder + 1)
                .build());
        taskRepository.save(task);

        action.setStatus(RecoveryPlanActionStatus.EXECUTED);
        action.setExecutedAt(LocalDateTime.now());
        action.setResultMessage("Checklist created successfully");
    }
}
