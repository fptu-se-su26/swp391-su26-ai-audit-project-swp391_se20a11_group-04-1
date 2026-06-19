package org.example.backend.entity.mongo;

import lombok.*;
import java.util.Map;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GraphStats {
    private Integer totalFiles;
    private Integer totalNodes;
    private Integer totalEdges;
    private Map<String, Integer> languages;
    private List<GodNode> godNodes;
}
