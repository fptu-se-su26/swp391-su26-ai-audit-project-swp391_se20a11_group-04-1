package org.example.backend.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class UseCaseResponse {
    private Long id;
    private Long requirementId;
    private String code;
    private String name;
    private String precondition;
    private String postcondition;
    private Map<String, Object> mainFlow;
    private Map<String, Object> alternativeFlow;
    private List<String> actors;
    private String status;
    private String version;
    private Integer completenessScore;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
