import axiosInstance from '@/api/axiosConfig';

export const diagramService = {
  getDiagramData: async (projectId, targetUserId = null, activeView = null) => {
    const params = targetUserId ? { targetUserId } : {};
    if (activeView) params.activeView = activeView;
    const response = await axiosInstance.get(`/diagrams/projects/${projectId}`, { params });
    return response.data.data;
  },

  syncDiagramData: async (projectId, payload, targetUserId = null) => {
    const params = targetUserId ? { targetUserId } : {};
    const response = await axiosInstance.post(`/diagrams/projects/${projectId}/sync`, payload, { params });
    return response.data;
  },

  getDiagramLayout: async (projectId, targetUserId = null) => {
    const params = targetUserId ? { targetUserId } : {};
    const response = await axiosInstance.get(`/diagrams/projects/${projectId}/layout`, { params });
    return response.data.data;
  },

  saveDiagramLayout: async (projectId, payload, targetUserId = null) => {
    const params = targetUserId ? { targetUserId } : {};
    const response = await axiosInstance.post(`/diagrams/projects/${projectId}/layout`, payload, { params });
    return response.data;
  }
};
