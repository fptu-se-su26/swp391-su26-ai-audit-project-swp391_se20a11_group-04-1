package org.example.backend.service.sla.executor;

import org.example.backend.entity.Project;
import org.example.backend.entity.RecoveryActionType;
import org.example.backend.entity.RecoveryPlanAction;
import org.example.backend.entity.Task;

import java.util.Set;

public interface RecoveryActionExecutor {
    Set<RecoveryActionType> supports();
    void execute(RecoveryPlanAction action, Task task, Project project);
}
