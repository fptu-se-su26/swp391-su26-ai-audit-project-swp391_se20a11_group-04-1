import axiosInstance from '@api/axiosConfig'

// All backend responses wrap useful payload under data.data.
const unwrap = (response) => response.data?.data

export const TaskReviewService = {
  // Load repository config and Code Insight settings for the current project.
  getConfig: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/task-reviews/config`, {
      params: { t: Date.now() }
    })
    return unwrap(response)
  },

  // Save repository config/settings; backend restricts this call to project leaders.
  updateConfig: async (projectId, payload) => {
    const response = await axiosInstance.put(`/v1/projects/${projectId}/task-reviews/config`, payload)
    return unwrap(response)
  },

  // Load tasks waiting in IN_REVIEW so leader can approve or reject them.
  getReviewQueue: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/task-reviews/review-queue`, {
      params: { t: Date.now() }
    })
    return unwrap(response) || []
  },

  // Load leader dashboard metrics for evidence coverage and review risk.
  getDashboard: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/task-reviews/dashboard`, {
      params: { t: Date.now() }
    })
    return unwrap(response)
  },

  // Load linked GitHub evidence for one task review item.
  getTaskEvidence: async (projectId, taskId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/evidence`, {
      params: { t: Date.now() }
    })
    return unwrap(response)
  },

  getReviewDetail: async (projectId, taskId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/review-detail`, {
      params: { t: Date.now() }
    })
    return unwrap(response)
  },

  // Fetch PR changed-file metadata on demand and return refreshed task evidence.
  fetchTaskChangedFiles: async (projectId, taskId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/evidence/fetch-files`)
    return unwrap(response)
  },

  // Create a structured AI-assisted review summary for this task.
  createAiReview: async (projectId, taskId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/ai-review`)
    return unwrap(response)
  },

  getManualLinks: async (projectId, taskId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/manual-links`, {
      params: { t: Date.now() }
    })
    return unwrap(response) || []
  },

  suggestManualLink: async (projectId, taskId, payload) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/manual-links`, payload)
    return unwrap(response)
  },

  confirmManualLink: async (projectId, taskId, linkId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/manual-links/${linkId}/confirm`)
    return unwrap(response)
  },

  rejectManualLink: async (projectId, taskId, linkId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/task-reviews/tasks/${taskId}/manual-links/${linkId}/reject`)
    return unwrap(response)
  },

  searchEvidence: async (projectId, type, query) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/task-reviews/evidence/search`, {
      params: { type, query, t: Date.now() },
    })
    return unwrap(response) || []
  },
}
export default TaskReviewService
