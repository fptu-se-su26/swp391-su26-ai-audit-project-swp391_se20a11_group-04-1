import axiosInstance from '@api/axiosConfig'

const unwrap = (response) => response.data?.data

export const taskService = {
  getProjectTasks: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/tasks`)
    return unwrap(response) || []
  },

  getProjectSprints: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/sprints`)
    return unwrap(response) || []
  },

  getProjectColumns: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/kanban-columns`)
    return unwrap(response) || []
  },

  createColumn: async (projectId, payload) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/kanban-columns`, payload)
    return unwrap(response)
  },

  updateColumn: async (projectId, columnId, payload) => {
    const response = await axiosInstance.put(`/v1/projects/${projectId}/kanban-columns/${columnId}`, payload)
    return unwrap(response)
  },

  archiveColumn: async (projectId, columnId) => {
    await axiosInstance.delete(`/v1/projects/${projectId}/kanban-columns/${columnId}`)
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

  updateTaskStatus: async (taskId, status, blockedReason, columnId) => {
    // Normal status/drag-drop update; backend may reject DONE if Code Insight review gate is enabled.
    const payload = {
      blockedReason,
      status: status || null,
      columnId: columnId ? Number(columnId) : null,
    }
    const response = await axiosInstance.patch(`/v1/tasks/${taskId}/status`, payload)
    return unwrap(response)
  },

  updateTaskAssignee: async (taskId, assigneeId) => {
    const response = await axiosInstance.patch(`/v1/tasks/${taskId}/assignee`, { assigneeId })
    return unwrap(response)
  },

  requestTaskReview: async (taskId, reason = '') => {
    // Move task into IN_REVIEW and create a review request audit row.
    const response = await axiosInstance.post(`/v1/tasks/${taskId}/request-review`, { reason })
    return unwrap(response)
  },

  approveTaskReview: async (taskId, reason = '') => {
    // Leader approval endpoint; this is the allowed path from IN_REVIEW to DONE.
    const response = await axiosInstance.post(`/v1/tasks/${taskId}/approve`, { reason })
    return unwrap(response)
  },

  rejectTaskReview: async (taskId, reason, targetStatus = 'IN_PROGRESS') => {
    // Leader rejection endpoint; sends task back to IN_PROGRESS or BLOCKED with a reason.
    const response = await axiosInstance.post(`/v1/tasks/${taskId}/reject`, { reason, targetStatus })
    return unwrap(response)
  },
}

export default taskService
