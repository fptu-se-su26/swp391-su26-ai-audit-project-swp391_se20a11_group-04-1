package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class StructuredAlternativeFlow {
    private List<AltFlow> flows;

    @Data
    public static class AltFlow {
        private String id;
        private Integer triggerStep;
        private String condition;
        private List<AltStep> steps;
    }

    @Data
    public static class AltStep {
        private Integer step;
        private String actorRef;
        private String action;
    }
}
