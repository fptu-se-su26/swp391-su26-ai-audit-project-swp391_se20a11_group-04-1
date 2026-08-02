package org.example.backend.dto.ai;

import com.fasterxml.jackson.annotation.JsonRawValue;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class ApproveUseCaseGenerationRequest {
    private List<String> selectedModuleRefs;
    private List<String> selectedUseCaseIds;
    private List<Integer> selectedIndices; // Legacy compatibility
    
    // Use Object to accept both Map and Array from frontend
    // Will be converted to JsonNode in service layer
    @NotNull
    private Object modifiedPayload;
}
