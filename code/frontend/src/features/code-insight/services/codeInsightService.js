import axiosInstance from '@api/axiosConfig'

const unwrap = (response) => response.data?.data

export const codeInsightService = {
  getReviewQueue: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/code-insight/review-queue`)
    return unwrap(response) || []
  },
}

export default codeInsightService
