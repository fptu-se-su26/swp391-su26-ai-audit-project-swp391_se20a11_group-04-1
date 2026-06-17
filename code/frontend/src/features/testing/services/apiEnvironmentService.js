import axiosInstance from '@/api/axiosConfig'

export const apiEnvironmentService = {
  getEnvironments: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/api-environments`)
    return response.data.data ?? response.data
  },
  
  createEnvironment: async (projectId, data) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/api-environments`, data)
    return response.data.data ?? response.data
  },
  
  updateEnvironment: async (projectId, envId, data) => {
    const response = await axiosInstance.put(`/v1/projects/${projectId}/api-environments/${envId}`, data)
    return response.data.data ?? response.data
  },
  
  deleteEnvironment: async (projectId, envId) => {
    await axiosInstance.delete(`/v1/projects/${projectId}/api-environments/${envId}`)
  }
}

export default apiEnvironmentService
