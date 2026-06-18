import axiosInstance from '@/api/axiosConfig';

export const diagramService = {
  getDiagramData: async (projectId) => {
    const response = await axiosInstance.get(`/diagrams/projects/${projectId}`);
    return response.data.data;
  },

  syncDiagramData: async (projectId, payload) => {
    const response = await axiosInstance.post(`/diagrams/projects/${projectId}/sync`, payload);
    return response.data;
  },

  getDiagramLayout: async (projectId) => {
    const response = await axiosInstance.get(`/diagrams/projects/${projectId}/layout`);
    return response.data.data;
  },

  saveDiagramLayout: async (projectId, payload) => {
    const response = await axiosInstance.post(`/diagrams/projects/${projectId}/layout`, payload);
    return response.data;
  }
};
