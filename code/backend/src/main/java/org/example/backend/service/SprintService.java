package org.example.backend.service;

import org.example.backend.dto.*;

import java.util.List;

public interface SprintService {
    List<SprintResponse> getProjectSprints(Long projectId, Long userId);

    SprintResponse createSprint(Long projectId, SprintRequest request, Long userId);

    SprintResponse getSprint(Long projectId, Long sprintId, Long userId);

    SprintResponse updateSprint(Long projectId, Long sprintId, SprintRequest request, Long userId);

    void deleteSprint(Long projectId, Long sprintId, Long userId);

    SprintResponse updateSprintStatus(Long projectId, Long sprintId, SprintStatusUpdateRequest request, Long userId);

    List<TaskResponse> getSprintTasks(Long projectId, Long sprintId, Long userId);

    TaskResponse assignTask(Long projectId, Long sprintId, Long taskId, Long userId);

    TaskResponse removeTask(Long projectId, Long sprintId, Long taskId, Long userId);

    TaskResponse updateTaskPlanDate(Long projectId, Long sprintId, Long taskId, SprintTaskPlanDateRequest request, Long userId);
}
