package org.example.backend.service;

import org.example.backend.entity.BugReport;

/**
 * Service handling direct API communications with GitHub.
 */
public interface GitHubApiService {

    /**
     * Creates a corresponding GitHub Issue for the approved BugReport.
     *
     * @param bugReport the approved BugReport entity
     * @param userId the ID of the user performing the action
     */
    void createGitHubIssue(BugReport bugReport, Long userId);

    /**
     * Synchronizes the status of the GitHub Issue (open/closed) based on the BugReport's state.
     *
     * @param bugReport the BugReport entity
     * @param userId the ID of the user performing the action
     */
    void updateGitHubIssueStatus(BugReport bugReport, Long userId);

    /**
     * Handles incoming GitHub Webhook events (issues opened, closed, assigned, edited).
     *
     * @param signatureHeader the X-Hub-Signature-256 header for secure HMAC verification
     * @param eventType       the X-GitHub-Event header (e.g. "issues")
     * @param payloadBody     the raw JSON payload body
     */
    void handleWebhook(String signatureHeader, String eventType, byte[] payloadBytes);

    /**
     * Decrypts an encrypted token or secret using the system's AES key.
     */
    String decryptToken(String encrypted);

    /**
     * Retrieves the GitHub connection configuration for a project.
     * Only accessible by project members.
     */
    org.example.backend.entity.GitHubIntegration getIntegration(Long projectId, Long userId);

    /**
     * Checks if the user has a configured GitHub Personal Access Token.
     */
    boolean hasUserToken(Long userId);

    /**
     * Fetches the current GitHub API rate limit status for the project's token.
     */
    java.util.Map<String, Object> getRateLimit(Long projectId, Long userId);

    java.util.Map<String, Object> getWebhookDeliveryStatus(Long projectId, Long userId);

    void pingWebhook(Long projectId, Long userId);

    /**
     * Saves or updates the GitHub connection configuration for a project.
     * Only accessible by Project Leaders.
     */
    org.example.backend.entity.GitHubIntegration saveIntegration(Long projectId, java.util.Map<String, Object> request, Long userId);
    /**
     * Encrypts a plaintext token using the system's AES key.
     */
    String encryptToken(String plaintext);
}
