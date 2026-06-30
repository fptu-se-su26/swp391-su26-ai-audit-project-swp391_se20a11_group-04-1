package org.example.backend.entity.mongo;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "architecture_graphs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArchitectureGraph {

    @Id
    private String id;
    
    private Long projectId;
    private LocalDateTime syncedAt;
    private String commitSha;
    private String branch;
    
    private GraphStats stats;
    private List<GraphNode> nodes;
    private List<GraphEdge> edges;
    
    private java.util.Map<String, Position2D> manualPositions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Position2D {
        private Double x;
        private Double y;
    }
}
