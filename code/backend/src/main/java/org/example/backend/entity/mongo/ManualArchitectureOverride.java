package org.example.backend.entity.mongo;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "manual_architecture_overrides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualArchitectureOverride {

    @Id
    private String id;
    
    private Long projectId;
    private List<GraphNode> manualNodes;
    private List<GraphEdge> manualEdges;
}
