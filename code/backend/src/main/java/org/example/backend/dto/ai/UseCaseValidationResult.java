package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class UseCaseValidationResult {
    private List<ValidationError> errors;
    private List<ValidationWarning> warnings;
    private boolean isBlocking;

    @Data
    public static class ValidationError {
        private String code;
        private String message;
        private String targetRef;
    }

    @Data
    public static class ValidationWarning {
        private String code;
        private String message;
        private String targetRef;
    }
}
