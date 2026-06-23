package org.example.backend.entity.mongo;

import lombok.*;
import java.util.Map;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GraphNode {
    private String nodeId;
    private String name;
    private String type;             // PACKAGE, FILE, CLASS, INTERFACE, METHOD, FUNCTION, COMPONENT, HOOK
    private String layer;            // OVERVIEW, MODULE, FLOW
    private String parentId;
    private String filePath;
    private String language;
    private Integer lineStart;
    private Integer lineEnd;
    private Map<String, Object> metadata;
    private String riskLevel;        // LOW, MEDIUM, HIGH, CRITICAL
    private Integer connectionCount;
    private List<String> childrenIds;
}
