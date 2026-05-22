package org.example.backend.service;

import org.example.backend.dto.TaskAssigneeUpdateRequest;
import org.example.backend.dto.TaskRequest;
import org.example.backend.dto.TaskResponse;
import org.example.backend.dto.TaskStatusUpdateRequest;

import java.util.List;

public interface TaskService {
    List<TaskResponse> getProjectTasks(Long projectId, Long userId);
    List<TaskResponse> getMyTasks(Long userId);
    TaskResponse getTask(Long taskId, Long userId);
    TaskResponse createTask(Long projectId, TaskRequest request, Long userId);
    TaskResponse updateTask(Long taskId, TaskRequest request, Long userId);
    TaskResponse updateTaskStatus(Long taskId, TaskStatusUpdateRequest request, Long userId);
    TaskResponse updateTaskAssignee(Long taskId, TaskAssigneeUpdateRequest request, Long userId);
    void deleteTask(Long taskId, Long userId);
}
