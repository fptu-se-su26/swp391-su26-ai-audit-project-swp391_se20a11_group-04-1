package org.example.backend.service.sla;

import lombok.Data;

import java.util.List;

@Data
public class GeminiRecoveryResult {
    private String summary;
    private String notifyMessage;
    private String escalateMessage;
    private String evidenceMessage;
    private String blockerMessage;
    private String checklistMessage;
    private List<GeminiRecoveryAction> selectedActions;
}
