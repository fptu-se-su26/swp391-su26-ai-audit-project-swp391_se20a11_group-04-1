import axiosInstance from '@api/axiosConfig'

export const rtmService = {
  getMatrix: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/rtm`)
    return response.data.data
  },

  getSummary: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/rtm/summary`)
    return response.data.data
  },

  saveSnapshot: async (projectId, sprintId = null) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/rtm/snapshots`, { sprintId })
    return response.data.data
  },

  getSnapshots: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/rtm/snapshots`)
    return response.data.data
  },
}

export default rtmService
