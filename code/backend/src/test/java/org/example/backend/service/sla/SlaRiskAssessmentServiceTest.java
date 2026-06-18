package org.example.backend.service.sla;

import org.example.backend.entity.Task;
import org.example.backend.entity.TaskStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SlaRiskAssessmentService — Unit Tests")
class SlaRiskAssessmentServiceTest {

    private final SlaRiskAssessmentService service = new SlaRiskAssessmentService();

    @Test
    @DisplayName("Should evaluate score/risk/reason/action for DUE_TODAY category correctly")
    void testDueTodayAssessment() {
        Task task = Task.builder()
                .status(TaskStatus.IN_PROGRESS)
                .build();
        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.DUE_TODAY),
                0,
                false
        );

        SlaRiskAssessmentService.AssessmentResult result = service.assess(task, evaluation);
        assertThat(result.getScore()).isEqualTo(45);
        assertThat(result.getRiskLevel()).isEqualTo("HIGH");
        assertThat(result.getReasons()).contains("Task deadline is today.");
        assertThat(result.getRecommendedAction()).contains("Finish or update this task before the end of today.");
    }

    @Test
    @DisplayName("Should evaluate score/risk/reason/action for OVERDUE_PENALTY category correctly")
    void testOverduePenaltyAssessment() {
        Task task = Task.builder()
                .status(TaskStatus.IN_PROGRESS)
                .build();
        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.OVERDUE_PENALTY),
                3,
                false
        );

        SlaRiskAssessmentService.AssessmentResult result = service.assess(task, evaluation);
        assertThat(result.getScore()).isEqualTo(0);
        assertThat(result.getRiskLevel()).isEqualTo("CRITICAL");
        assertThat(result.getReasons()).contains("Task is overdue by 3 day(s) and qualifies for penalty.");
        assertThat(result.getRecommendedAction()).contains("Escalate this task and request recovery action.");
    }

    @Test
    @DisplayName("Should evaluate score/risk/reason/action for BLOCKED category correctly")
    void testBlockedAssessment() {
        Task task = Task.builder()
                .status(TaskStatus.BLOCKED)
                .build();
        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.BLOCKED),
                0,
                false
        );

        SlaRiskAssessmentService.AssessmentResult result = service.assess(task, evaluation);
        assertThat(result.getScore()).isEqualTo(80); // 100 - 20 = 80
        assertThat(result.getRiskLevel()).isEqualTo("LOW");
        assertThat(result.getReasons()).contains("Task is blocked.");
        assertThat(result.getRecommendedAction()).contains("Clarify blocker and request leader support.");
    }

    @Test
    @DisplayName("Should evaluate score/risk/reason/action for MISSING_EVIDENCE category correctly")
    void testMissingEvidenceAssessment() {
        Task task = Task.builder()
                .status(TaskStatus.DONE)
                .build();
        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.of(TaskSlaCategory.MISSING_EVIDENCE),
                0,
                false
        );

        SlaRiskAssessmentService.AssessmentResult result = service.assess(task, evaluation);
        assertThat(result.getScore()).isEqualTo(75); // 100 - 25 = 75
        assertThat(result.getRiskLevel()).isEqualTo("MEDIUM");
        assertThat(result.getReasons()).contains("Task is missing accepted evidence.");
        assertThat(result.getRecommendedAction()).contains("Upload or request accepted evidence.");
    }

    @Test
    @DisplayName("Should evaluate score/risk/reason/action for resolved DONE task correctly")
    void testResolvedTaskAssessment() {
        Task task = Task.builder()
                .status(TaskStatus.DONE)
                .build();
        TaskSlaEvaluation evaluation = new TaskSlaEvaluation(
                EnumSet.noneOf(TaskSlaCategory.class),
                0,
                true
        );

        SlaRiskAssessmentService.AssessmentResult result = service.assess(task, evaluation);
        assertThat(result.getScore()).isEqualTo(100);
        assertThat(result.getRiskLevel()).isEqualTo("NORMAL");
        assertThat(result.getReasons()).contains("Task is resolved (DONE).");
        assertThat(result.getRecommendedAction()).isEqualTo("No action required.");
    }
}
