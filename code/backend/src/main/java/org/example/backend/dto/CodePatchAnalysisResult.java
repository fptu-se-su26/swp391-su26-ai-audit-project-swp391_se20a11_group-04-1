package org.example.backend.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodePatchAnalysisResult {
    private List<FileChange> physicalChanges;
    private List<MethodChange> methodSignatures;
    private CommunicationChanges communicationChanges;
    private List<LogicFlow> logicFlows;
    private List<ComplexityDelta> complexityDelta;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FileChange {
        private String filePath;
        private String action; // ADDED, MODIFIED, DELETED
        private String fileType; // java, sql, xml, etc.
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MethodChange {
        private String className;
        private String methodName;
        private String signature;
        private String changeType; // ADDED, MODIFIED
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CommunicationChanges {
        private List<String> exposedEndpoints;
        private List<String> databaseColumnsAdded;
        private List<String> externalApisCalled;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LogicFlow {
        private String file;
        private String description;
        private String sideEffects;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplexityDelta {
        private String className;
        private String methodName;
        private int estimatedIncrease; // Thang điểm 1-5
        private String reason;
    }
}
