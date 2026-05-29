import axiosInstance from '@api/axiosConfig'

const unwrap = (response) => response.data?.data

export const sprintService = {
  getSprints: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/sprints`)
    return unwrap(response) || []
  },

  createSprint: async (projectId, payload) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/sprints`, payload)
    return unwrap(response)
  },

  updateSprint: async (projectId, sprintId, payload) => {
    const response = await axiosInstance.put(`/v1/projects/${projectId}/sprints/${sprintId}`, payload)
    return unwrap(response)
  },

  deleteSprint: async (projectId, sprintId) => {
    await axiosInstance.delete(`/v1/projects/${projectId}/sprints/${sprintId}`)
  },

  updateSprintStatus: async (projectId, sprintId, status) => {
    const response = await axiosInstance.patch(`/v1/projects/${projectId}/sprints/${sprintId}/status`, { status })
    return unwrap(response)
  },

  getSprintTasks: async (projectId, sprintId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/sprints/${sprintId}/tasks`)
    return unwrap(response) || []
  },

  assignTask: async (projectId, sprintId, taskId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`)
    return unwrap(response)
  },

  removeTask: async (projectId, sprintId, taskId) => {
    const response = await axiosInstance.delete(`/v1/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}`)
    return unwrap(response)
  },

  updateTaskPlanDate: async (projectId, sprintId, taskId, sprintPlanDate) => {
    const response = await axiosInstance.patch(
      `/v1/projects/${projectId}/sprints/${sprintId}/tasks/${taskId}/plan-date`,
      { sprintPlanDate }
    )
    return unwrap(response)
  },
}

export default sprintService
