package org.example.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KanbanColumnRequest {
    private String name;
    private String color;
    private Integer columnOrder;
    private Boolean archived;
}
