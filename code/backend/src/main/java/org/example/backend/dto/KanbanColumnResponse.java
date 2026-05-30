package org.example.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KanbanColumnResponse {
    private Long id;
    private Long projectId;
    private String name;
    private String statusKey;
    private String color;
    private int columnOrder;
    private boolean defaultColumn;
    private boolean archived;
}
