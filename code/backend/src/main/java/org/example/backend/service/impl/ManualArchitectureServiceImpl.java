package org.example.backend.service.impl;

import org.example.backend.entity.mongo.ArchitectureGraph;
import org.example.backend.entity.mongo.GraphEdge;
import org.example.backend.entity.mongo.GraphNode;
import org.example.backend.entity.mongo.ManualArchitectureOverride;
import org.example.backend.repository.mongo.ManualArchitectureOverrideRepository;
import org.example.backend.service.ManualArchitectureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ManualArchitectureServiceImpl implements ManualArchitectureService {

    private final ManualArchitectureOverrideRepository manualRepository;

    @Autowired
    public ManualArchitectureServiceImpl(ManualArchitectureOverrideRepository manualRepository) {
        this.manualRepository = manualRepository;
    }

    private ManualArchitectureOverride getOrCreateOverride(Long projectId) {
        return manualRepository.findByProjectId(projectId)
                .orElseGet(() -> {
                    ManualArchitectureOverride override = new ManualArchitectureOverride();
                    override.setProjectId(projectId);
                    override.setManualNodes(new ArrayList<>());
                    override.setManualEdges(new ArrayList<>());
                    return override;
                });
    }

    @Override
    public void addNode(Long projectId, GraphNode node) {
        ManualArchitectureOverride override = getOrCreateOverride(projectId);
        List<GraphNode> nodes = override.getManualNodes();
        if (nodes == null) {
            nodes = new ArrayList<>();
            override.setManualNodes(nodes);
        }
        
        // Remove if exists to overwrite
        nodes.removeIf(n -> n.getNodeId().equals(node.getNodeId()));
        nodes.add(node);
        
        manualRepository.save(override);
    }

    @Override
    public void editNode(Long projectId, String nodeId, GraphNode node) {
        ManualArchitectureOverride override = getOrCreateOverride(projectId);
        List<GraphNode> nodes = override.getManualNodes();
        if (nodes != null) {
            for (int i = 0; i < nodes.size(); i++) {
                if (nodes.get(i).getNodeId().equals(nodeId)) {
                    nodes.set(i, node);
                    manualRepository.save(override);
                    return;
                }
            }
        }
    }

    @Override
    public void deleteNode(Long projectId, String nodeId) {
        Optional<ManualArchitectureOverride> overrideOpt = manualRepository.findByProjectId(projectId);
        if (overrideOpt.isPresent()) {
            ManualArchitectureOverride override = overrideOpt.get();
            List<GraphNode> nodes = override.getManualNodes();
            if (nodes != null) {
                nodes.removeIf(n -> n.getNodeId().equals(nodeId));
            }
            
            // Clean up related manual connections
            List<GraphEdge> edges = override.getManualEdges();
            if (edges != null) {
                edges.removeIf(e -> e.getSource().equals(nodeId) || e.getTarget().equals(nodeId));
            }
            
            manualRepository.save(override);
        }
    }

    @Override
    public void addEdge(Long projectId, GraphEdge edge) {
        ManualArchitectureOverride override = getOrCreateOverride(projectId);
        List<GraphEdge> edges = override.getManualEdges();
        if (edges == null) {
            edges = new ArrayList<>();
            override.setManualEdges(edges);
        }
        
        edges.removeIf(e -> e.getEdgeId().equals(edge.getEdgeId()));
        edges.add(edge);
        
        manualRepository.save(override);
    }

    @Override
    public void deleteEdge(Long projectId, String edgeId) {
        Optional<ManualArchitectureOverride> overrideOpt = manualRepository.findByProjectId(projectId);
        if (overrideOpt.isPresent()) {
            ManualArchitectureOverride override = overrideOpt.get();
            List<GraphEdge> edges = override.getManualEdges();
            if (edges != null) {
                edges.removeIf(e -> e.getEdgeId().equals(edgeId));
            }
            manualRepository.save(override);
        }
    }

    @Override
    public ArchitectureGraph mergeManualOverrides(Long projectId, ArchitectureGraph graph) {
        if (graph == null) return null;
        
        Optional<ManualArchitectureOverride> overrideOpt = manualRepository.findByProjectId(projectId);
        if (overrideOpt.isEmpty()) {
            return graph;
        }
        
        ManualArchitectureOverride override = overrideOpt.get();
        List<GraphNode> manualNodes = override.getManualNodes();
        List<GraphEdge> manualEdges = override.getManualEdges();
        
        if (manualNodes != null && !manualNodes.isEmpty()) {
            List<GraphNode> graphNodes = new ArrayList<>(graph.getNodes() != null ? graph.getNodes() : new ArrayList<>());
            for (GraphNode manualNode : manualNodes) {
                graphNodes.removeIf(n -> n.getNodeId().equals(manualNode.getNodeId()));
                graphNodes.add(manualNode);
            }
            graph.setNodes(graphNodes);
        }
        
        if (manualEdges != null && !manualEdges.isEmpty()) {
            List<GraphEdge> graphEdges = new ArrayList<>(graph.getEdges() != null ? graph.getEdges() : new ArrayList<>());
            for (GraphEdge manualEdge : manualEdges) {
                graphEdges.removeIf(e -> e.getEdgeId().equals(manualEdge.getEdgeId()));
                graphEdges.add(manualEdge);
            }
            graph.setEdges(graphEdges);
        }
        
        return graph;
    }
}
