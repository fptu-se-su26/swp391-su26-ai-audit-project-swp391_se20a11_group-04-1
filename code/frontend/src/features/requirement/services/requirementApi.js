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

  deleteRequirement: async (id) => {
    const response = await axiosInstance.delete(`${API_URL}/${id}`);
    return response.data;
  }
};
