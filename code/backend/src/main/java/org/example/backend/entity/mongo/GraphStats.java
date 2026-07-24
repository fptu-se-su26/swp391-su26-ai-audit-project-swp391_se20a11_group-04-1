package org.example.backend.entity.mongo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.Map;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class GraphStats {
    private Integer totalFiles;
    private Integer totalNodes;
    private Integer totalEdges;
    private Map<String, Integer> languages;
    private List<GodNode> godNodes;
    private Map<String, Integer> layoutHints;

    // Analysis method metadata (added by architecture-parser)
    private String analysisMethod;        // "AI" | "RULE_BASED"
    private String repoType;              // e.g. "AI_DATA_PIPELINE"
    private String classifierConfidence;  // "HIGH" | "MEDIUM" | "LOW"
}
