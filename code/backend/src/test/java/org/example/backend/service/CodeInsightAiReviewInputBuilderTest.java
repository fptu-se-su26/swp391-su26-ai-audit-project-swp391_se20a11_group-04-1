package org.example.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.CodeInsightAiReviewInput;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CodeInsightAiReviewInputBuilderTest {

    private final CodeInsightEvidenceLinkRepository evidenceLinkRepository = mock(CodeInsightEvidenceLinkRepository.class);
    private final GitHubPullRequestRepository pullRequestRepository = mock(GitHubPullRequestRepository.class);
    private final GitHubCommitRepository commitRepository = mock(GitHubCommitRepository.class);
    private final GitHubCheckRunRepository checkRunRepository = mock(GitHubCheckRunRepository.class);
    private final GitHubPullRequestFileRepository pullRequestFileRepository = mock(GitHubPullRequestFileRepository.class);
    private final RequirementRepository requirementRepository = mock(RequirementRepository.class);

    private final CodeInsightAiReviewInputBuilder builder = new CodeInsightAiReviewInputBuilder(
            evidenceLinkRepository,
            pullRequestRepository,
            commitRepository,
            checkRunRepository,
            pullRequestFileRepository,
            requirementRepository,
            new ObjectMapper());

    @Test
    void excludesCredentialFilesAndRedactsSecretsBeforePromptInput() {
        Task task = task();
        when(evidenceLinkRepository.findByTaskId(31L)).thenReturn(List.of(
                CodeInsightEvidenceLink.builder()
                        .task(task)
                        .project(task.getProject())
                        .evidenceType(CodeInsightEvidenceType.PULL_REQUEST)
                        .evidenceId(7L)
                        .build()));
        when(pullRequestRepository.findAllById(List.of(7L))).thenReturn(List.of(
                GitHubPullRequest.builder().id(7L).prNumber(20).title("TASK-31 PR").build()));
        when(commitRepository.findAllById(List.of())).thenReturn(List.of());
        when(checkRunRepository.findAllById(List.of())).thenReturn(List.of());
        when(requirementRepository.findById(11L)).thenReturn(Optional.empty());
        when(pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(List.of(7L))).thenReturn(List.of(
                file(".env", "+API_KEY=abc123\n+PASSWORD=super-secret"),
                file("src/main/resources/application.properties", "+spring.datasource.url=postgres://user:plainpass@localhost/db\n+token=my-token")));

        CodeInsightAiReviewInput input = builder.build(task, score());

        CodeInsightAiReviewInput.ChangedFileInput envFile = input.getChangedFiles().get(0);
        assertThat(envFile.getFile()).isEqualTo(".env");
        assertThat(envFile.getPatch()).isNull();
        assertThat(envFile.isSecretsRedacted()).isTrue();
        assertThat(envFile.getPatchExcludedReason()).isEqualTo("SENSITIVE_FILE");

        CodeInsightAiReviewInput.ChangedFileInput propertiesFile = input.getChangedFiles().get(1);
        assertThat(propertiesFile.getPatch()).contains("[REDACTED]");
        assertThat(propertiesFile.getPatch()).doesNotContain("plainpass", "my-token");
        assertThat(propertiesFile.isSecretsRedacted()).isTrue();
        assertThat(propertiesFile.getPatchExcludedReason()).isNull();
    }

    private Task task() {
        Project project = Project.builder()
                .id(2L)
                .name("Code Insight")
                .deadline(LocalDate.now().plusDays(1))
                .build();
        return Task.builder()
                .id(31L)
                .project(project)
                .requirementId(11L)
                .title("CI security review")
                .description("Review AI prompt hardening")
                .status(TaskStatus.IN_REVIEW)
                .type(TaskType.DEVELOPMENT)
                .priority(Priority.MEDIUM)
                .build();
    }

    private TaskReviewDecisionResponse.ReviewEvidenceSummary score() {
        return TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .score(100)
                .riskLevel("READY")
                .ciStatus("PASSED")
                .warnings(List.of())
                .positiveSignals(List.of())
                .scoreBreakdown(List.of())
                .build();
    }

    private GitHubPullRequestFile file(String path, String patch) {
        return GitHubPullRequestFile.builder()
                .filePath(path)
                .status("modified")
                .additions(1)
                .deletions(0)
                .changes(1)
                .patchSummary(patch)
                .build();
    }
}
