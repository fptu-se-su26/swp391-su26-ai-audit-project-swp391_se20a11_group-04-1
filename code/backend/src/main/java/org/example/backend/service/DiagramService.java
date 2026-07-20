package org.example.backend.service;

import org.example.backend.dto.DiagramSyncRequest;

public interface DiagramService {
    Object getDiagramData(Long projectId, Long moduleId, String activeView);
    java.util.Map<String, String> syncDiagramData(Long projectId, DiagramSyncRequest request, Long userId, Long moduleId);
    Object getDiagramLayout(Long projectId, Long moduleId);
    void saveDiagramLayout(Long projectId, Long moduleId, org.example.backend.dto.DiagramSaveRequest request);
}
