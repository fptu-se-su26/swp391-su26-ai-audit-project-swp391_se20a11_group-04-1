import axiosInstance from '../../../api/axiosConfig'

export const getSyncStatus = async (projectId) => {
  const response = await axiosInstance.get(`/v1/architecture/projects/${projectId}/status`)
  return response.data
}

export const triggerSync = async (projectId) => {
  const response = await axiosInstance.post(`/v1/architecture/projects/${projectId}/sync`)
  return response.data
}

export const getGraphData = async (projectId) => {
  const url = `/v1/architecture/projects/${projectId}/graph`
  const response = await axiosInstance.get(url)
  return response.data
}

export const addManualNode = async (projectId, nodeData) => {
  const response = await axiosInstance.post(`/v1/architecture/projects/${projectId}/manual/nodes`, nodeData)
  return response.data
}

export const editManualNode = async (projectId, nodeId, nodeData) => {
  const response = await axiosInstance.put(`/v1/architecture/projects/${projectId}/manual/nodes/${nodeId}`, nodeData)
  return response.data
}

export const deleteManualNode = async (projectId, nodeId) => {
  const response = await axiosInstance.delete(`/v1/architecture/projects/${projectId}/manual/nodes/${nodeId}`)
  return response.data
}

export const addManualEdge = async (projectId, edgeData) => {
  const response = await axiosInstance.post(`/v1/architecture/projects/${projectId}/manual/edges`, edgeData)
  return response.data
}

export const deleteManualEdge = async (projectId, edgeId) => {
  const response = await axiosInstance.delete(`/v1/architecture/projects/${projectId}/manual/edges/${edgeId}`)
  return response.data
}
