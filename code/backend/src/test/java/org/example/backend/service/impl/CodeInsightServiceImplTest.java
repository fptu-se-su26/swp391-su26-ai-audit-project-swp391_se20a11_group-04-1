package org.example.backend.service.impl;

import org.example.backend.dto.CodeInsightApprovalGateResponse;
import org.example.backend.dto.CodeInsightTaskEvidenceResponse;
import org.example.backend.dto.TaskReviewDecisionResponse;
import org.example.backend.dto.CodeInsightReviewDetailResponse;
import org.example.backend.dto.ReqDiffAlignmentResult;
import org.example.backend.entity.*;
import org.example.backend.exception.CustomException;
import org.example.backend.repository.*;
import org.example.backend.service.CodeInsightApprovalGateService;
import org.example.backend.service.CodeInsightAiReviewService;
import org.example.backend.service.CodeInsightManualEvidenceLinkService;
import org.example.backend.service.CodeInsightPatchService;
import org.example.backend.service.CodeInsightScoringService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

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
    @Mock private GitHubPullRequestFileRepository pullRequestFileRepository;
    @Mock private GitHubCheckRunRepository checkRunRepository;
    @Mock private CodeInsightManualEvidenceLinkRepository manualEvidenceLinkRepository;
    @Mock private GitHubWebhookEventRepository webhookEventRepository;
    @Mock private TaskReviewDecisionRepository taskReviewDecisionRepository;
    @Mock private CodeInsightScoringService scoringService;
    @Mock private CodeInsightPatchService patchService;
    @Mock private CodeInsightAiReviewService aiReviewService;
    @Mock private CodeInsightApprovalGateService approvalGateService;
    @Mock private CodeInsightManualEvidenceLinkService manualEvidenceLinkService;
    @Mock private CodeInsightAiReviewRepository aiReviewRepository;
    @Mock private ObjectMapper objectMapper;
    @Mock private EvidenceLinkRepository generalEvidenceLinkRepository;
    @Mock private RequirementRepository requirementRepository;

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
        when(pullRequestFileRepository.findByPullRequestIdInOrderByFilePathAsc(List.of(201L))).thenReturn(List.of());
        when(checkRunRepository.findAllById(List.of(301L))).thenReturn(List.of(GitHubCheckRun.builder()
                .id(301L)
                .name("build")
                .conclusion("success")
                .build()));
        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(score);
        when(manualEvidenceLinkService.list(10L, 12L, 5L)).thenReturn(List.of());
        when(approvalGateService.evaluate(task)).thenReturn(CodeInsightApprovalGateResponse.builder()
                .approvalStatus("CAN_APPROVE")
                .score(90)
                .riskLevel("READY")
                .blockers(List.of())
                .warnings(List.of())
                .build());

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

    @Test
    void getReviewDetailComputesRequirementAcCoverage() throws Exception {
        // Prepare IDs
        Long projectId = 10L;
        Long taskId = 12L;
        Long userId = 5L;
        Long reqId = 100L;

        // Entities
        Project project = Project.builder().id(projectId).build();
        UserAccount assignee = UserAccount.builder().id(userId).username("hieu").email("hieu@example.com").build();
        
        Requirement requirement = Requirement.builder()
                .id(reqId)
                .acceptanceCriteria("[\"AC1\", \"AC2\"]")
                .project(project)
                .build();

        Task task = Task.builder()
                .id(taskId)
                .project(project)
                .title("Implement login")
                .status(TaskStatus.IN_REVIEW)
                .priority(Priority.HIGH)
                .primaryAssignee(assignee)
                .githubIssueNumber(34)
                .githubIssueUrl("https://github.com/owner/repo/issues/34")
                .requirementId(reqId)
                .taskCode("TSK-12")
                .build();

        Task siblingDoneTask = Task.builder()
                .id(13L)
                .project(project)
                .title("Done task")
                .status(TaskStatus.DONE)
                .requirementId(reqId)
                .taskCode("TSK-13")
                .build();

        // Mocks for getTaskEvidence inside getReviewDetail
        List<CodeInsightEvidenceLink> links = List.of();
        TaskReviewDecisionResponse.ReviewEvidenceSummary score = TaskReviewDecisionResponse.ReviewEvidenceSummary.builder()
                .score(90)
                .riskLevel("READY")
                .build();

        when(projectMemberRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(ProjectMember.builder().project(project).user(assignee).build()));
        when(taskRepository.findWithDetailsById(taskId)).thenReturn(Optional.of(task));
        when(evidenceLinkRepository.findByTaskId(taskId)).thenReturn(links);
        when(commitRepository.findAllById(List.of())).thenReturn(List.of());
        when(pullRequestRepository.findAllById(List.of())).thenReturn(List.of());
        when(checkRunRepository.findAllById(List.of())).thenReturn(List.of());
        when(scoringService.buildReviewEvidenceSummary(task)).thenReturn(score);
        when(manualEvidenceLinkService.list(projectId, taskId, userId)).thenReturn(List.of());
        when(approvalGateService.evaluate(task)).thenReturn(CodeInsightApprovalGateResponse.builder()
                .approvalStatus("CAN_APPROVE")
                .score(90)
                .riskLevel("READY")
                .blockers(List.of())
                .warnings(List.of())
                .build());

        // Mocks for getReviewDetail decisions
        when(taskReviewDecisionRepository.findByTaskIdOrderByCreatedAtDesc(taskId)).thenReturn(List.of());

        // Mocks for requirement/sibling logic in getReviewDetail
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(requirementRepository.findById(reqId)).thenReturn(Optional.of(requirement));
        when(taskRepository.findByRequirementId(reqId)).thenReturn(List.of(task, siblingDoneTask));

        // Stub ObjectMapper reading ACs from requirement
        when(objectMapper.readValue(
                eq("[\"AC1\", \"AC2\"]"),
                any(com.fasterxml.jackson.core.type.TypeReference.class)
        )).thenReturn(List.of("AC1", "AC2"));

        // approved reviews mock
        CodeInsightAiReview doneReview = CodeInsightAiReview.builder()
                .id(50L)
                .task(siblingDoneTask)
                .alignmentResultJson("alignment-json")
                .build();
        when(aiReviewRepository.findLatestReviewsForTasks(List.of(13L))).thenReturn(List.of(doneReview));

        // Mock reading alignment result from ObjectMapper
        ReqDiffAlignmentResult alignResult = new ReqDiffAlignmentResult();
        ReqDiffAlignmentResult.AlignmentItem item1 = new ReqDiffAlignmentResult.AlignmentItem();
        item1.setAcText("AC1");
        item1.setStatus("FULLY_COVERED");
        ReqDiffAlignmentResult.AlignmentItem item2 = new ReqDiffAlignmentResult.AlignmentItem();
        item2.setAcText("AC2");
        item2.setStatus("PARTIAL");
        alignResult.setAlignmentMatrix(List.of(item1, item2));

        when(objectMapper.readValue("alignment-json", ReqDiffAlignmentResult.class)).thenReturn(alignResult);

        // Run service method
        CodeInsightReviewDetailResponse response = codeInsightService.getReviewDetail(projectId, taskId, userId);

        // Assertions
        assertThat(response).isNotNull();
        assertThat(response.getRequirementAcCoverage()).hasSize(2);
        
        CodeInsightReviewDetailResponse.RequirementAcCoverageSummary sum1 = response.getRequirementAcCoverage().get(0);
        assertThat(sum1.getAcText()).isEqualTo("AC1");
        assertThat(sum1.getStatus()).isEqualTo("FULLY_COVERED");
        assertThat(sum1.getCoveredByTaskId()).isEqualTo(13L);
        assertThat(sum1.getCoveredByTaskCode()).isEqualTo("TSK-13");

        CodeInsightReviewDetailResponse.RequirementAcCoverageSummary sum2 = response.getRequirementAcCoverage().get(1);
        assertThat(sum2.getAcText()).isEqualTo("AC2");
        assertThat(sum2.getStatus()).isEqualTo("PARTIAL");
        assertThat(sum2.getCoveredByTaskId()).isEqualTo(13L);
        assertThat(sum2.getCoveredByTaskCode()).isEqualTo("TSK-13");
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
