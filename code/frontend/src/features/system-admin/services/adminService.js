import axiosInstance from '@api/axiosConfig';

const adminService = {
  getMetrics: async () => {
    return await axiosInstance.get('/api/v1/admin/dashboard/metrics');
  },
  getGrowth: async () => {
    return await axiosInstance.get('/api/v1/admin/dashboard/growth');
  },
  getActivities: async () => {
    return await axiosInstance.get('/api/v1/admin/dashboard/activities');
  },
  getAlerts: async () => {
    return await axiosInstance.get('/api/v1/admin/dashboard/alerts');
  },
  getProjectHealth: async () => {
    return await axiosInstance.get('/api/v1/admin/dashboard/project-health');
  }
};

export default adminService;
