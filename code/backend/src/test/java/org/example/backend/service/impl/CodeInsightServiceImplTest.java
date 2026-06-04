package org.example.backend.service.impl;

import org.example.backend.dto.CodeInsightTaskEvidenceResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.CodeInsightScoringService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("CodeInsightServiceImpl")
class CodeInsightServiceImplTest {

    @Mock private ProjectRepository projectRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private GitHubIntegrationRepository gitHubIntegrationRepository;
    @Mock private ProjectCodeInsightSettingsRepository settingsRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private CodeInsightEvidenceLinkRepository evidenceLinkRepository;
    @Mock private GitHubCommitRepository commitRepository;
    @Mock private GitHubPullRequestRepository pullRequestRepository;
    @Mock private GitHubCheckRunRepository checkRunRepository;
    @Mock private CodeInsightScoringService scoringService;

    @InjectMocks
    private CodeInsightServiceImpl codeInsightService;

    @Test
    void getTaskEvidenceReturnsLinkedGithubMetadata() {
        Project project = Project.builder().id(10L).build();
        UserAccount assignee = UserAccount.builder().id(5L).username("hieu").email("hieu@example.com").build();
        Task task = Task.builder()
                .id(12L)
                .project(project)
                .title("Implement login")
                .status(TaskStatus.IN_REVIEW)
                .priority(Priority.HIGH)
                .primaryAssignee(assignee)
                .githubIssueNumber(34)
                .githubIssueUrl("https://github.com/owner/repo/issues/34")
                .build();
        List<CodeInsightEvidenceLink> links = List.of(
                link(project, task, CodeInsightEvidenceType.COMMIT, 101L),
                link(project, task, CodeInsightEvidenceType.PULL_REQUEST, 201L),
                link(project, task, CodeInsightEvidenceType.CHECK_RUN, 301L));
        TaskReviewDecisionResponse.ReviewEvidenceSummary score = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .score(90)
                .riskLevel("READY")
                .build();

        when(projectMemberRepository.findByProjectIdAndUserId(10L, 5L))
                .thenReturn(Optional.of(ProjectMember.builder().project(project).user(assignee).build()));
        when(taskRepository.findWithDetailsById(12L)).thenReturn(Optional.of(task));
        when(evidenceLinkRepository.findByTaskId(12L)).thenReturn(links);
        when(commitRepository.findAllById(List.of(101L))).thenReturn(List.of(GitHubCommit.builder()
                .id(101L)
                .sha("abc123")
                .message("TASK-12 add login")
                .build()));
        when(pullRequestRepository.findAllById(List.of(201L))).thenReturn(List.of(GitHubPullRequest.builder()
                .id(201L)
                .prNumber(7)
                .title("TASK-12 implement login")
                .build()));
        when(checkRunRepository.findAllById(List.of(301L))).thenReturn(List.of(GitHubCheckRun.builder()
                .id(301L)
                .name("build")
                .conclusion("success")
                .build()));
        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(score);

        CodeInsightTaskEvidenceResponse response = codeInsightService.getTaskEvidence(10L, 12L, 5L);

        assertThat(response.getTask().getTitle()).isEqualTo("Implement login");
        assertThat(response.getGithubIssue().getNumber()).isEqualTo(34);
        assertThat(response.getCommits()).hasSize(1);
        assertThat(response.getPullRequests()).hasSize(1);
        assertThat(response.getCheckRuns()).hasSize(1);
        assertThat(response.getScoreSummary().getScore()).isEqualTo(90);
    }

    @Test
    void getTaskEvidenceRejectsNonMember() {
        when(projectMemberRepository.findByProjectIdAndUserId(10L, 5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> codeInsightService.getTaskEvidence(10L, 12L, 5L))
                .isInstanceOf(CustomException.class)
                .hasMessageContaining("You do not have access to this project");
    }

    private CodeInsightEvidenceLink link(Project project, Task task, CodeInsightEvidenceType type, Long evidenceId) {
        return CodeInsightEvidenceLink.builder()
                .project(project)
                .task(task)
                .evidenceType(type)
                .evidenceId(evidenceId)
                .build();
    }
}
