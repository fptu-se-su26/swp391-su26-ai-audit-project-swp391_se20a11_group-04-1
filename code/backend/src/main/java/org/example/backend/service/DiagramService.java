package org.example.backend.service;

import org.example.backend.dto.DiagramSyncRequest;

public interface DiagramService {
    Object getDiagramData(Long projectId);
    java.util.Map<String, String> syncDiagramData(Long projectId, DiagramSyncRequest request, Long userId);
    Object getDiagramLayout(Long projectId);
    void saveDiagramLayout(Long projectId, org.example.backend.dto.DiagramSaveRequest request);
}
