package org.example.backend.service;

import org.example.backend.entity.mongo.ArchitectureGraph;
import org.example.backend.entity.mongo.GraphEdge;
import org.example.backend.entity.mongo.GraphNode;

public interface ManualArchitectureService {
    void addNode(Long projectId, GraphNode node);
    void editNode(Long projectId, String nodeId, GraphNode node);
    void deleteNode(Long projectId, String nodeId);
    void addEdge(Long projectId, GraphEdge edge);
    void deleteEdge(Long projectId, String edgeId);
    ArchitectureGraph mergeManualOverrides(Long projectId, ArchitectureGraph graph);
}
