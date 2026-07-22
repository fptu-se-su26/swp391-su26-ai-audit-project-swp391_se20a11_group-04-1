import axiosInstance from '@/api/axiosConfig';

export const diagramService = {
  getDiagramData: async (projectId, moduleId = null, activeView = null) => {
    const params = moduleId ? { moduleId } : {};
    if (activeView) params.activeView = activeView;
    const response = await axiosInstance.get(`/diagrams/projects/${projectId}`, { params });
    return response.data.data;
  },

  syncDiagramData: async (projectId, payload, moduleId = null) => {
    const params = moduleId ? { moduleId } : {};
    const response = await axiosInstance.post(`/diagrams/projects/${projectId}/sync`, payload, { params });
    return response.data;
  },

  getDiagramLayout: async (projectId, moduleId = null) => {
    const params = moduleId ? { moduleId } : {};
    const response = await axiosInstance.get(`/diagrams/projects/${projectId}/layout`, { params });
    return response.data.data;
  },

  saveDiagramLayout: async (projectId, payload, moduleId = null) => {
    const params = moduleId ? { moduleId } : {};
    const response = await axiosInstance.post(`/diagrams/projects/${projectId}/layout`, payload, { params });
    return response.data;
  }
};
