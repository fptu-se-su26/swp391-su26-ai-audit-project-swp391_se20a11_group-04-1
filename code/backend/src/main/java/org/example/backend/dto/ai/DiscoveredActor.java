package org.example.backend.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class DiscoveredActor {
    private String temporaryId; // e.g. ACTOR-AI-001
    private Long existingActorId;
    private String name;
    private String description;
    private String inheritsFrom;
    private List<Long> evidenceRequirementIds;
    private Double confidence;
}
