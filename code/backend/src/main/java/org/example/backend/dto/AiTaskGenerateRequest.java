package org.example.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiTaskGenerateRequest {
    private List<Long> requirementIds;
    private List<Long> useCaseIds;
}
