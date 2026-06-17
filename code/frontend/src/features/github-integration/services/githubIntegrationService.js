import axiosInstance from '@/api/axiosConfig'

export const githubIntegrationService = {
  getGithubConfig: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/github-integration`)
    return response.data.data
  },

  saveGithubConfig: async (projectId, data) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration`, data)
    return response.data.data
  },

  getGithubRateLimit: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/github-integration/rate-limit`)
    return response.data.data
  },

  createGithubRepo: async (data) => {
    const response = await axiosInstance.post('/v1/github/repos', data)
    return response.data.data
  },

  pingWebhook: async (projectId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration/ping`)
    return response.data.data
  },

  autoConfigureWebhook: async (projectId, webhookUrl, events, webhookSecret) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration/auto-configure`, {
      webhookUrl,
      events,
      webhookSecret,
    })
    return response.data.data
  },

  refreshWebhookConfig: async (projectId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration/webhook/refresh`)
    return response.data.data
  },

  getWebhookDeliveries: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/github-integration/deliveries`)
    return response.data.data
  },

  redeliverWebhook: async (projectId, deliveryId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/github-integration/deliveries/${deliveryId}/redeliver`)
    return response.data.data
  },
}

export default githubIntegrationService
