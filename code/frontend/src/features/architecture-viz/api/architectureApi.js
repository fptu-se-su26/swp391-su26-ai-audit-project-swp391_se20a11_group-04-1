import axiosInstance from '../../../api/axiosConfig'

export const getSyncStatus = async (projectId) => {
  const response = await axiosInstance.get(`/v1/architecture/projects/${projectId}/status`)
  return response.data
}

export const triggerSync = async (projectId) => {
  const response = await axiosInstance.post(`/v1/architecture/projects/${projectId}/sync`)
  return response.data
}

export const getGraphData = async (projectId, view, serviceId = null) => {
  const url = `/v1/architecture/projects/${projectId}/graph?view=${view}${serviceId ? `&serviceId=${serviceId}` : ''}`
  const response = await axiosInstance.get(url)
  return response.data
}
