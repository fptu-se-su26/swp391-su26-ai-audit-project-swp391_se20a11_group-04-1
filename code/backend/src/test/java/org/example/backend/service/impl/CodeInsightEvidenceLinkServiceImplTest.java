package org.example.backend.service.impl;

import org.example.backend.entity.*;
import org.example.backend.repository.CodeInsightEvidenceLinkRepository;
import org.example.backend.repository.GitHubCommitRepository;
import org.example.backend.repository.GitHubPullRequestRepository;
import org.example.backend.repository.TaskRepository;
import org.example.backend.service.WebSocketBroadcastService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CodeInsightEvidenceLinkServiceImpl")
class CodeInsightEvidenceLinkServiceImplTest {

    @Mock private CodeInsightEvidenceLinkRepository linkRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private GitHubCommitRepository commitRepository;
    @Mock private GitHubPullRequestRepository pullRequestRepository;
    @Mock private WebSocketBroadcastService webSocketBroadcastService;

    @InjectMocks
    private CodeInsightEvidenceLinkServiceImpl linkService;

    @Test
    void linkCommitUsesTaskKeyFromBranch() {
        Project project = project(10L);
        Task task = task(12L, project);
        GitHubCommit commit = GitHubCommit.builder()
                .id(101L)
                .project(project)
                .branchName("feature/TSK-12-login")
                .message("add login")
                .build();

        when(taskRepository.findByProjectIdAndTaskCodeIgnoreCase(10L, "TASK-12")).thenReturn(Optional.of(task));
        when(linkRepository.existsByProjectIdAndTaskIdAndEvidenceTypeAndEvidenceId(
                10L, 12L, CodeInsightEvidenceType.COMMIT, 101L)).thenReturn(false);

        linkService.linkCommit(commit);

        verify(linkRepository).save(argThat(link ->
                link.getTask() == task
                        && link.getEvidenceType() == CodeInsightEvidenceType.COMMIT
                        && link.getEvidenceId().equals(101L)
                        && link.getSource() == CodeInsightEvidenceLinkSource.BRANCH_NAME
                        && link.getConfidence() == CodeInsightEvidenceConfidence.HIGH));
    }

    @Test
    void linkPullRequestUsesTaskKeyFromTitle() {
        Project project = project(10L);
        Task task = task(12L, project);
        GitHubPullRequest pullRequest = GitHubPullRequest.builder()
                .id(201L)
                .project(project)
                .title("TASK-12 implement login")
                .headBranch("feature/login")
                .build();

        when(taskRepository.findByProjectIdAndTaskCodeIgnoreCase(10L, "TASK-12")).thenReturn(Optional.of(task));

        linkService.linkPullRequest(pullRequest);

        verify(linkRepository).save(argThat(link ->
                link.getTask() == task
                        && link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST
                        && link.getEvidenceId().equals(201L)
                        && link.getSource() == CodeInsightEvidenceLinkSource.PR_TITLE));
    }

    @Test
    void linkPullRequestUsesGithubIssueNumberFromBody() {
        Project project = project(10L);
        Task task = task(12L, project);
        GitHubPullRequest pullRequest = GitHubPullRequest.builder()
                .id(202L)
                .project(project)
                .body("Closes #34")
                .build();

        when(taskRepository.findByProjectIdAndGithubIssueNumber(10L, 34)).thenReturn(List.of(task));

        linkService.linkPullRequest(pullRequest);

        verify(linkRepository).save(argThat(link ->
                link.getTask() == task
                        && link.getEvidenceType() == CodeInsightEvidenceType.PULL_REQUEST
                        && link.getSource() == CodeInsightEvidenceLinkSource.GITHUB_ISSUE_NUMBER));
    }

    @Test
    void linkCheckRunCopiesExistingPullRequestLinkBySha() {
        Project project = project(10L);
        Task task = task(12L, project);
        GitHubPullRequest pullRequest = GitHubPullRequest.builder()
                .id(201L)
                .project(project)
                .headSha("abc123")
                .build();
        GitHubCheckRun checkRun = GitHubCheckRun.builder()
                .id(301L)
                .project(project)
                .sha("abc123")
                .build();
        CodeInsightEvidenceLink existing = CodeInsightEvidenceLink.builder()
                .project(project)
                .task(task)
                .evidenceType(CodeInsightEvidenceType.PULL_REQUEST)
                .evidenceId(201L)
                .build();

        when(commitRepository.findByProjectIdAndSha(10L, "abc123")).thenReturn(Optional.empty());
        when(pullRequestRepository.findFirstByProjectIdAndHeadShaOrProjectIdAndMergeCommitSha(10L, "abc123", 10L, "abc123"))
                .thenReturn(Optional.of(pullRequest));
        when(linkRepository.findByProjectIdAndEvidenceTypeAndEvidenceId(10L, CodeInsightEvidenceType.PULL_REQUEST, 201L))
                .thenReturn(List.of(existing));

        linkService.linkCheckRun(checkRun);

        verify(linkRepository).save(argThat(link ->
                link.getTask() == task
                        && link.getEvidenceType() == CodeInsightEvidenceType.CHECK_RUN
                        && link.getEvidenceId().equals(301L)
                        && link.getSource() == CodeInsightEvidenceLinkSource.SHA_CHAIN));
    }

    @Test
    void existingLinkIsNotSavedAgain() {
        Project project = project(10L);
        Task task = task(12L, project);
        GitHubCommit commit = GitHubCommit.builder()
                .id(101L)
                .project(project)
                .message("TASK-12 add API")
                .build();

        when(taskRepository.findByProjectIdAndTaskCodeIgnoreCase(10L, "TASK-12")).thenReturn(Optional.of(task));
        when(linkRepository.existsByProjectIdAndTaskIdAndEvidenceTypeAndEvidenceId(
                10L, 12L, CodeInsightEvidenceType.COMMIT, 101L)).thenReturn(true);

        linkService.linkCommit(commit);

        verify(linkRepository, never()).save(any());
    }

    @Test
    void crossProjectTaskIsNotLinked() {
        Project evidenceProject = project(10L);
        Project otherProject = project(99L);
        Task task = task(12L, otherProject);
        GitHubCommit commit = GitHubCommit.builder()
                .id(101L)
                .project(evidenceProject)
                .message("TASK-12 add API")
                .build();

        when(taskRepository.findByProjectIdAndTaskCodeIgnoreCase(10L, "TASK-12")).thenReturn(Optional.of(task));

        linkService.linkCommit(commit);

        verify(linkRepository, never()).save(any());
    }

    private Project project(Long id) {
        return Project.builder().id(id).build();
    }

    private Task task(Long id, Project project) {
        return Task.builder()
                .id(id)
                .project(project)
                .taskCode("TASK-" + id)
                .build();
    }
}
