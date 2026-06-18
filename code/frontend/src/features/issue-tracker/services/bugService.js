import axiosInstance from '@/api/axiosConfig'
import githubIntegrationService from '@features/github-integration/services/githubIntegrationService'

/**
 * Bug Tracker & GitHub Integration Service
 * Exposes API endpoints for CRUD bugs, leader approvals, and repository configurations.
 */
export const bugService = {
  /**
   * Retrieves all Bug Reports for a specific project
   * GET /v1/projects/{projectId}/bugs
   */
  getProjectBugs: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/bugs`)
    return response.data.data
  },

  /**
   * Creates a draft Bug Report in the project
   * POST /v1/projects/{projectId}/bugs
   */
  createBug: async (projectId, data) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/bugs`, data)
    return response.data.data
  },

  /**
   * Retrieves details of a specific Bug Report
   * GET /v1/bugs/{bugId}
   */
  getBugDetails: async (bugId) => {
    const response = await axiosInstance.get(`/v1/bugs/${bugId}`)
    return response.data.data
  },

  /**
   * Leader approves and converts draft Bug Report to Task & GitHub Issue
   * POST /v1/bugs/{bugId}/approve
   */
  approveBug: async (bugId) => {
    const response = await axiosInstance.post(`/v1/bugs/${bugId}/approve`)
    return response.data.data
  },

  /**
   * Retrieves the GitHub Integration config of a project
   * GET /v1/projects/{projectId}/github-integration
   */
  getGithubConfig: async (projectId) => {
    return githubIntegrationService.getGithubConfig(projectId)
  },

  /**
   * Saves or updates the GitHub Integration config of a project
   * POST /v1/projects/{projectId}/github-integration
   */
  saveGithubConfig: async (projectId, data) => {
    return githubIntegrationService.saveGithubConfig(projectId, data)
  },

  /**
   * Retrieves GitHub API rate limit for the project's integration
   * GET /v1/projects/{projectId}/github-integration/rate-limit
   */
  getGithubRateLimit: async (projectId) => {
    return githubIntegrationService.getGithubRateLimit(projectId)
  },

  /**
   * Creates a new GitHub repository for the authenticated user
   * POST /v1/github/repos
   */
  createGithubRepo: async (data) => {
    return githubIntegrationService.createGithubRepo(data)
  },

  /**
   * Triggers a webhook ping event from GitHub to test the connection
   * POST /v1/projects/{projectId}/github-integration/ping
   */
  pingWebhook: async (projectId) => {
    return githubIntegrationService.pingWebhook(projectId)
  },

  /**
   * Auto-configures the webhook on GitHub
   * POST /v1/projects/{projectId}/github-integration/auto-configure
   */
  autoConfigureWebhook: async (projectId, webhookUrl, events, webhookSecret) => {
    return githubIntegrationService.autoConfigureWebhook(projectId, webhookUrl, events, webhookSecret)
  },

  refreshWebhookConfig: async (projectId) => {
    return githubIntegrationService.refreshWebhookConfig(projectId)
  },

  /**
   * Fetches webhook delivery history from GitHub (last 30 deliveries)
   * GET /v1/projects/{projectId}/github-integration/deliveries
   */
  getWebhookDeliveries: async (projectId) => {
    return githubIntegrationService.getWebhookDeliveries(projectId)
  },

  /**
   * Triggers a redeliver of a specific webhook delivery
   * POST /v1/projects/{projectId}/github-integration/deliveries/{deliveryId}/redeliver
   */
  redeliverWebhook: async (projectId, deliveryId) => {
    return githubIntegrationService.redeliverWebhook(projectId, deliveryId)
  },

  /**
   * Retrieves details of a specific Task including checklist items
   * GET /v1/tasks/{taskId}
   */
  getTaskDetails: async (taskId) => {
    const response = await axiosInstance.get(`/v1/tasks/${taskId}`)
    return response.data.data
  }
}

export default bugService
