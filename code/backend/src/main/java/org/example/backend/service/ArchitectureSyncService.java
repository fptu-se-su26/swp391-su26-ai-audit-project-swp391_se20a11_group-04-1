package org.example.backend.service;

import org.example.backend.entity.ArchitectureSync;
import org.example.backend.entity.mongo.ArchitectureGraph;

public interface ArchitectureSyncService {
    ArchitectureSync getSyncStatus(Long projectId, Long userId);
    ArchitectureSync triggerSync(Long projectId, Long userId);
    ArchitectureGraph getGraphData(Long projectId, String layer, String nodeId, Long userId);
}
