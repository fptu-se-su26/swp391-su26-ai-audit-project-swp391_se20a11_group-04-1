package org.example.backend.service;

public interface TaskGeminiService {
    String generateTasksBatch(String contextDataJson);
    String auditTasks(String contextDataJson);
    String splitTask(String taskDataJson);
    String mergeTasks(String tasksDataJson);
}
