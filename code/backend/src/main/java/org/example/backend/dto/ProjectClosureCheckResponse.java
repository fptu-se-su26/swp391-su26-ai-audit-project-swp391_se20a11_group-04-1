package org.example.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProjectClosureCheckResponse {

    private int openTaskCount;
    private int openBugCount;
    private int activeSprintCount;
    private boolean canCloseSafely;
    private List<OpenTaskItem> openTasks;
    private List<String> activeSprints;

    @Data
    @Builder
    public static class OpenTaskItem {
        private Long id;
        private String taskCode;
        private String title;
        private String status;
        private String assigneeName;
        private String sprintName;
    }
}
