package org.example.backend.service;

public interface CodeInsightPatchService {
    void fetchChangedFiles(Long projectId, Long taskId, Long userId);
}
