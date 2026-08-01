package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class StructuredMainFlow {
    private List<MainStep> steps;

    @Data
    public static class MainStep {
        private Integer step;
        private String actorRef;
        private String actorAction;
        private String systemResponse;
    }
}
