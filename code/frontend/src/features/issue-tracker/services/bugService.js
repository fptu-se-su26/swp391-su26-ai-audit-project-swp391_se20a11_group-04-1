import axiosInstance from '@/api/axiosConfig'

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
    const response = await axiosInstance.get(`/v1/projects/${projectId}/github-integration`)
    return response.data.data
  },

  /**
   * Saves or updates the GitHub Integration config of a project
   * POST /v1/projects/{projectId}/github-integration
   */
  saveGithubConfig: async (projectId, data) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration`, data)
    return response.data.data
  },

  /**
   * Retrieves GitHub API rate limit for the project's integration
   * GET /v1/projects/{projectId}/github-integration/rate-limit
   */
  getGithubRateLimit: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/github-integration/rate-limit`)
    return response.data.data
  },

  /**
   * Triggers a webhook ping event from GitHub to test the connection
   * POST /v1/projects/{projectId}/github-integration/ping
   */
  pingWebhook: async (projectId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration/ping`)
    return response.data.data
  },

  /**
   * Fetches webhook delivery history from GitHub (last 30 deliveries)
   * GET /v1/projects/{projectId}/github-integration/deliveries
   */
  getWebhookDeliveries: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/github-integration/deliveries`)
    return response.data.data
  },

  /**
   * Triggers a redeliver of a specific webhook delivery
   * POST /v1/projects/{projectId}/github-integration/deliveries/{deliveryId}/redeliver
   */
  redeliverWebhook: async (projectId, deliveryId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration/deliveries/${deliveryId}/redeliver`)
    return response.data.data
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
