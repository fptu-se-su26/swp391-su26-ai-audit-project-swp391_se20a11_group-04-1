import axiosInstance from '@api/axiosConfig'

const unwrap = (response) => response.data?.data

export const codeInsightService = {
  getConfig: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/code-insight/config`)
    return unwrap(response)
  },

  updateConfig: async (projectId, payload) => {
    const response = await axiosInstance.put(`/v1/projects/${projectId}/code-insight/config`, payload)
    return unwrap(response)
  },

  getReviewQueue: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/code-insight/review-queue`)
    return unwrap(response) || []
  },
}

export default codeInsightService
