import axiosInstance from '../../../api/axiosConfig';

const API_URL = '/requirements';

export const requirementApi = {
  getAllRequirements: async () => {
    const response = await axiosInstance.get(API_URL);
    return response.data;
  },

  getRequirementById: async (id) => {
    const response = await axiosInstance.get(`${API_URL}/${id}`);
    return response.data;
  },

  createRequirement: async (requirementData) => {
    // TODO: Get projectId from current active project context/URL
    const payload = { ...requirementData, projectId: 1 };
    const response = await axiosInstance.post(API_URL, payload);
    return response.data;
  },

  updateRequirement: async (id, requirementData) => {
    const response = await axiosInstance.put(`${API_URL}/${id}`, requirementData);
    return response.data;
  },

  deleteRequirement: async (id) => {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  }
};
