import axiosInstance from '../../../api/axiosConfig';

const API_URL = '/requirements';

export const requirementApi = {
  getAllRequirements: async (params = {}) => {
    const response = await axiosInstance.get(API_URL, { params });
    return response.data.data;
  },

  getRequirementById: async (id) => {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  createRequirement: async (projectId, requirementData) => {
    const response = await axiosInstance.post(API_URL, requirementData, { params: { projectId } });
    return response.data.data;
  },

  updateRequirement: async (id, projectId, requirementData) => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, requirementData, { params: { projectId } });
    return response.data.data;
  },

  reorderRequirements: async (projectId, reqIds) => {
    const response = await axiosInstance.put(`${API_URL}/project/${projectId}/reorder`, { ids: reqIds });
    return response.data;
  },

  updateStatus: async (id, projectId, status) => {
    const response = await axiosInstance.patch(`${API_URL}/${id}/status`, null, {
      params: { status, projectId }
    });
    return response.data.data;
  },

  deleteRequirement: async (id, projectId) => {
    const response = await axiosInstance.delete(`${API_URL}/${id}`, { params: { projectId } });
    return response.data;
  },

  getTags: async (projectId) => {
    const response = await axiosInstance.get(`${API_URL}/tags`, { params: { projectId } });
    return response.data.data;
  },

  generateRequirementsWithAi: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(`/ai/generate-requirements/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 300 seconds for AI Generation
    });
    return response.data;
  },

  getStagingRequirements: async (projectId) => {
    const response = await axiosInstance.get(`/ai/staging/${projectId}`);
    return response.data;
  },

  deletePendingGenerations: async (projectId, stage) => {
    const response = await axiosInstance.delete(`/ai/staging/pending/${projectId}`, { params: { stage } });
    return response.data;
  },

  approveStagingRequirements: async (generationId, selectedIndices, modifiedPayload = null) => {
    const data = { selectedIndices };
    if (modifiedPayload) {
      data.modifiedPayload = modifiedPayload;
    }
    const response = await axiosInstance.post(`/ai/approve/${generationId}`, data);
    return response.data;
  },

  regenerateRequirementsWithAi: async (generationId) => {
    const response = await axiosInstance.post(`/ai/regenerate/${generationId}`, {}, {
      timeout: 300000,
    });
    return response.data;
  }
};
