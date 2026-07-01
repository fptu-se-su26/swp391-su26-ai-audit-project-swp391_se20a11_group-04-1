package org.example.backend.service;

import org.example.backend.entity.ArchitectureSync;
import org.example.backend.entity.mongo.ArchitectureGraph;

public interface ArchitectureSyncService {
    ArchitectureSync getSyncStatus(Long projectId, Long userId);
    ArchitectureSync triggerSync(Long projectId, Long userId);
    ArchitectureGraph getGraphData(Long projectId, Long userId);
    void saveNodePositions(Long projectId, java.util.Map<String, org.example.backend.entity.mongo.ArchitectureGraph.Position2D> positions, Long userId);
    void resetNodePositions(Long projectId, Long userId);
}
