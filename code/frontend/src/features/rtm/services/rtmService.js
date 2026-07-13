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

  exportSnapshotExcel: async (projectId, snapshotId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/rtm/snapshots/${snapshotId}/export`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `rtm-snapshot-${snapshotId}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  getTrackingData: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/tracking`)
    return response.data.data
  },
}

export default rtmService
