package org.example.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RtmMatrixResponse(
        Long projectId,
        LocalDateTime generatedAt,
        RtmSummaryResponse summary,
        List<RtmRowResponse> rows
) {
    public record RtmRowResponse(
            Long requirementId,
            String requirementCode,
            String title,
            String description,
            String priority,
            String ownerName,
            String ownerEmail,
            String requirementStatus,
            String traceabilityStatus,
            boolean evidenceRequired,
            int taskTotal,
            int taskDone,
            int taskBlocked,
            int testTotal,
            int testPassed,
            int testFailed,
            int testBlocked,
            int testNotRun,
            int openBugCount,
            int criticalBugCount,
            int evidenceCount,
            List<String> riskReasons,
            List<LinkedItemResponse> tasks,
            List<LinkedItemResponse> testCases,
            List<LinkedItemResponse> bugs,
            List<LinkedItemResponse> evidence
    ) {
    }

    public record LinkedItemResponse(
            Long id,
            String code,
            String title,
            String status,
            String owner,
            String meta
    ) {
    }
}
