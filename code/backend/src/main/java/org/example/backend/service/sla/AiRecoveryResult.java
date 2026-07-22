package org.example.backend.service.sla;

import lombok.Data;
import java.util.List;

@Data
public class AiRecoveryResult {

    @Data
    public static class RootCause {
        private String type;
        private List<String> evidenceRefs;
    }

    @Data
    public static class CandidatePlan {
        private String strategy;
        private String summary;
        private List<AiRecoveryAction> actions;
        private String successCondition;
        private String fallbackCondition;
        private Double confidence;
    }

    @Data
    public static class VerifierResult {
        private boolean valid;
        private List<String> violations;
    }

    private RootCause rootCause;
    private CandidatePlan selectedPlan;
    private List<String> dataNeeded;
    private VerifierResult verifier;
}
