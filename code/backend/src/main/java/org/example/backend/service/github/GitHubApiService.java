package org.example.backend.service.github;

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

    /**
     * Fetches recent webhook delivery history from GitHub (last 30 deliveries).
     */
    Object getWebhookDeliveries(Long projectId, Long userId);

    /**
     * Triggers a redelivery of a specific webhook delivery by its GitHub delivery ID.
     */
    void redeliverWebhook(Long projectId, Long deliveryId, Long userId);

    /**
     * Gets the GitHub OAuth login URL.
     */
    String getOAuthUrl();

    /**
     * Exchanges the OAuth code for an access token and saves it for the user.
     */
    String exchangeCodeForToken(String code, Long userId);

    /**
     * Gets a list of repositories accessible by the user.
     */
    Object getUserRepositories(Long userId);

    /**
     * Creates a new GitHub repository for the authenticated user.
     *
     * @param userId      The user's ID
     * @param name        The name of the new repository
     * @param description An optional description
     * @param isPrivate   Whether the repository should be private
     * @return The created repository details as an Object (Map/JSON)
     */
    Object createRepository(Long userId, String name, String description, boolean isPrivate);

    /**
     * Auto-configures the GitHub webhook for the given project.
     * 
     * @param projectId  The project ID
     * @param userId     The authenticated user ID
     * @param webhookUrl The payload URL to configure on GitHub
     * @param events     The list of events to subscribe to
     * @param webhookSecret Optional custom secret to use
     */
    void autoConfigureWebhook(Long projectId, Long userId, String webhookUrl, java.util.List<String> events, String webhookSecret);
}
