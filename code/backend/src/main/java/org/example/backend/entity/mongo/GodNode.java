package org.example.backend.entity.mongo;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GodNode {
    private String nodeId;
    private String name;
    private String type;
    private Integer connections;
}
