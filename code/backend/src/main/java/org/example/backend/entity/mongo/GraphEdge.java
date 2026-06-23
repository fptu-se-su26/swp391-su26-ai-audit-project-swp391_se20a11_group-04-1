package org.example.backend.entity.mongo;

import lombok.*;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GraphEdge {
    private String edgeId;
    private String source;
    private String target;
    private String type;             // IMPORTS, CALLS, EXTENDS, IMPLEMENTS, DEPENDS_ON, CONTAINS
    private String layer;            // OVERVIEW, MODULE, FLOW
    private String confidence;       // EXTRACTED, INFERRED
    private Map<String, Object> metadata;
}
