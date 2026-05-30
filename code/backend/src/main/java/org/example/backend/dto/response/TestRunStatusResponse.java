package org.example.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import org.example.backend.entity.TestRun;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TestRunStatusResponse {
    private String runId;
    private String status;
    private String scriptSource;
    private List<TestRun.StepResult> steps;
    private List<ScreenshotResponse> screenshots;
    private ErrorInfo error;
    private Integer durationMs;
    private Long bugReportId;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    @Data
    @Builder
    public static class ScreenshotResponse {
        private Long evidenceId;
        private String url;
        private String filename;
    }

    @Data
    @Builder
    public static class ErrorInfo {
        private String message;
        private String failedStep;
        private String type;
    }
}
