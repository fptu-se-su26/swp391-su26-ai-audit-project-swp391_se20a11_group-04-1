package org.example.backend.service;

import org.example.backend.dto.DiagramSyncRequest;

public interface DiagramService {
    Object getDiagramData(Long projectId, Long targetUserId, String activeView);
    java.util.Map<String, String> syncDiagramData(Long projectId, DiagramSyncRequest request, Long userId, Long targetUserId);
    Object getDiagramLayout(Long projectId, Long targetUserId);
    void saveDiagramLayout(Long projectId, Long targetUserId, org.example.backend.dto.DiagramSaveRequest request);
}
