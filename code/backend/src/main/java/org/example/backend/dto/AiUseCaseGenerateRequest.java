package org.example.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class AiUseCaseGenerateRequest {
    private List<Long> requirementIds;
}
