package org.example.backend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class DiagramSyncRequest {
    @NotNull
    private List<DiagramActorDTO> actors;
    @NotNull
    private List<DiagramUseCaseDTO> useCases;
    @NotNull
    private List<DiagramRelationDTO> relations;

    @Data
    public static class DiagramActorDTO {
        private String id;
        private String name;
        private String side;
    }

    @Data
    public static class DiagramUseCaseDTO {
        private String id;
        private String name;
        private String group;
        private boolean showInDiagram;
        private boolean addedFromDiagram;
    }

    @Data
    public static class DiagramRelationDTO {
        private String id;
        private String type; // actor-uc, include, extends
        private String sourceId;
        private String targetId;
    }
}
