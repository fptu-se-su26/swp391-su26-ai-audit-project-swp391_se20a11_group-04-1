package org.example.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiUseCaseGenerateRequest {
    private List<Long> requirementIds;
    private GenerationMode generationMode = GenerationMode.MODULE;
    private Long moduleId;
    private Boolean allowProposedActors = true;
    private Boolean regenerateMissingOnly = false;

    public enum GenerationMode {
        MODULE,
        PROJECT
    }
}
