import axiosInstance from '../../../api/axiosConfig';

const API_URL = '/requirements';

export const requirementApi = {
  getAllRequirements: async (params = {}) => {
    const response = await axiosInstance.get(API_URL, { params });
    return response.data;
  },

  getRequirementById: async (id) => {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data;
  },

  createRequirement: async (requirementData) => {
    const response = await axiosInstance.post(API_URL, requirementData);
    return response.data;
  },

  updateRequirement: async (id, requirementData) => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, requirementData);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await axiosInstance.patch(`${API_URL}/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  deleteRequirement: async (id) => {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  },

  getTags: async (projectId) => {
    const response = await axiosInstance.get(`${API_URL}/tags`, { params: { projectId } });
    return response.data;
  },

  generateRequirementsWithAi: async (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(`/ai/generate-requirements/${projectId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 120 seconds for AI Generation (2 API calls)
    });
    return response.data;
  },

  getStagingRequirements: async (projectId) => {
    const response = await axiosInstance.get(`/ai/staging/${projectId}`);
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
      timeout: 120000,
    });
    return response.data;
  }
};
