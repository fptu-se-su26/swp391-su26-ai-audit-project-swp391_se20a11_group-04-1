package org.example.backend.dto.testing;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class RefineAiRequest {
    @NotNull(message = "Existing test cases cannot be null")
    private List<AiDraftTestCase> existingTestCases;
    
    @NotBlank(message = "Instruction cannot be empty")
    private String instruction;
}
