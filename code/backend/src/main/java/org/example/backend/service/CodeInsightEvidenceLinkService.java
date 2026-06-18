package org.example.backend.service;

import org.example.backend.entity.GitHubCheckRun;
import org.example.backend.entity.GitHubCommit;
import org.example.backend.entity.GitHubPullRequest;

public interface CodeInsightEvidenceLinkService {
    void linkCommit(GitHubCommit commit);

    void linkPullRequest(GitHubPullRequest pullRequest);

    void linkCheckRun(GitHubCheckRun checkRun);
}
