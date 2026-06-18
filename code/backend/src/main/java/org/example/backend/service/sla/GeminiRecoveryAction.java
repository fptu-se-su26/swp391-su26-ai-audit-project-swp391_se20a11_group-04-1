package org.example.backend.service.sla;

import lombok.Data;

@Data
public class GeminiRecoveryAction {
    private String actionType;
    private String priority;
    private String message;
}
