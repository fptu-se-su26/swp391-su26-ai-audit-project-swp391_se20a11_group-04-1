import axiosInstance from '@api/axiosConfig'

const unwrap = (response) => response.data?.data

export const taskService = {
  getProjectTasks: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/tasks`)
    return unwrap(response) || []
  },

  getTask: async (taskId) => {
    const response = await axiosInstance.get(`/v1/tasks/${taskId}`)
    return unwrap(response)
  },

  getMyTasks: async () => {
    const response = await axiosInstance.get('/v1/my-tasks')
    return unwrap(response) || []
  },

  createTask: async (projectId, payload) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/tasks`, payload)
    return unwrap(response)
  },

  updateTask: async (taskId, payload) => {
    const response = await axiosInstance.put(`/v1/tasks/${taskId}`, payload)
    return unwrap(response)
  },

  deleteTask: async (taskId) => {
    await axiosInstance.delete(`/v1/tasks/${taskId}`)
  },

  updateTaskStatus: async (taskId, status, blockedReason) => {
    const response = await axiosInstance.patch(`/v1/tasks/${taskId}/status`, { status, blockedReason })
    return unwrap(response)
  },

  updateTaskAssignee: async (taskId, assigneeId) => {
    const response = await axiosInstance.patch(`/v1/tasks/${taskId}/assignee`, { assigneeId })
    return unwrap(response)
  },
}

export default taskService
