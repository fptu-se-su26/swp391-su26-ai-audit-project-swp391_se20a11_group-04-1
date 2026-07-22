import axiosInstance from '@/api/axiosConfig';

const BASE_URL = '/projects';

export const businessModuleService = {
  getModulesByProject: async (projectId) => {
    const response = await axiosInstance.get(`${BASE_URL}/${projectId}/modules`);
    return response.data.data; // ApiResponse format
  },

  createModule: async (projectId, moduleData) => {
    const response = await axiosInstance.post(`${BASE_URL}/${projectId}/modules`, moduleData);
    return response.data.data;
  },

  updateModule: async (projectId, moduleId, moduleData) => {
    const response = await axiosInstance.put(`${BASE_URL}/${projectId}/modules/${moduleId}`, moduleData);
    return response.data.data;
  },

  deleteModule: async (projectId, moduleId) => {
    const response = await axiosInstance.delete(`${BASE_URL}/${projectId}/modules/${moduleId}`);
    return response.data.data;
  },

  assignMember: async (projectId, moduleId, assigneeId) => {
    const response = await axiosInstance.patch(`${BASE_URL}/${projectId}/modules/${moduleId}/assignee`, { assigneeId });
    return response.data.data;
  }
};
