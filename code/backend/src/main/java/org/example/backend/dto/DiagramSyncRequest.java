package org.example.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class DiagramSyncRequest {
    private List<DiagramActorDTO> actors;
    private List<DiagramUseCaseDTO> useCases;
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
    }

    @Data
    public static class DiagramRelationDTO {
        private String id;
        private String type; // actor-uc, include, extend
        private String sourceId;
        private String targetId;
    }
}
