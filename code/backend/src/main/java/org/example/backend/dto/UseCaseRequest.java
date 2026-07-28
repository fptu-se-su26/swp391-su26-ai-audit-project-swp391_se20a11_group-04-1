package org.example.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UseCaseRequest {
    private Long requirementId;
    private Long moduleId;
    private String code;
    private String name;
    private String precondition;
    private String postcondition;
    private Map<String, Object> mainFlow;
    private Map<String, Object> alternativeFlow;
    private List<String> includesList;
    private List<String> extendsList;
    private List<String> actors;
    private org.example.backend.entity.UseCaseStatus status;
    private String version;
    private java.time.LocalDate startDate;
    private java.time.LocalDate deadline;
}
