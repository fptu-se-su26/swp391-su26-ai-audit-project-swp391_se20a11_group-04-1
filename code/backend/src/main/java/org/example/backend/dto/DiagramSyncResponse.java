package org.example.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class DiagramSyncResponse {
    private List<DiagramActorDTO> actors;
    private List<DiagramUseCaseDTO> useCases;
    private List<DiagramRelationDTO> relations;

    @Data
    public static class DiagramActorDTO {
        private String id;
        private String name;
        private String side;
        private String inheritsFrom;
    }

    @Data
    public static class DiagramUseCaseDTO {
        private String id;
        private String name;
        private String group;
        private boolean showInDiagram;
        private boolean addedFromDiagram;
        private Long moduleId;
        private String moduleName;
    }

    @Data
    public static class DiagramRelationDTO {
        private String id;
        private String type;
        private String sourceId;
        private String targetId;
    }
}
