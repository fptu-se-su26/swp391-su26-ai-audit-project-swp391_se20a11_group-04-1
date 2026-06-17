package org.example.backend.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskReviewDashboardResponse {
    private int pendingReviews;
    private int doneWithoutEvidence;
    private int tasksWithCiFailed;
    private int tasksWithoutPullRequest;
    private int evidenceCoveragePercent;
    private List<MemberEvidenceQuality> memberEvidenceQuality;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MemberEvidenceQuality {
        private Long memberId;
        private String memberName;
        private int taskCount;
        private int tasksWithCodeEvidence;
        private int riskyTasks;
    }
}
