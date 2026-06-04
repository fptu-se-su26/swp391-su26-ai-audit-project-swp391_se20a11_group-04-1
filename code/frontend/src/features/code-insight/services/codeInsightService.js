import axiosInstance from '@api/axiosConfig'

// All backend responses wrap useful payload under data.data.
const unwrap = (response) => response.data?.data

export const codeInsightService = {
  // Load repository config and Code Insight settings for the current project.
  getConfig: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/code-insight/config`)
    return unwrap(response)
  },

  // Save repository config/settings; backend restricts this call to project leaders.
  updateConfig: async (projectId, payload) => {
    const response = await axiosInstance.put(`/v1/projects/${projectId}/code-insight/config`, payload)
    return unwrap(response)
  },

  // Load tasks waiting in IN_REVIEW so leader can approve or reject them.
  getReviewQueue: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/code-insight/review-queue`)
    return unwrap(response) || []
  },
}

export default codeInsightService
