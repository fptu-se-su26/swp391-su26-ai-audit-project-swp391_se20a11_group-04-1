import axiosInstance from '@api/axiosConfig';

const adminService = {
  getMetrics: async () => {
    return await axiosInstance.get('/v1/admin/dashboard/metrics');
  },
  getGrowth: async (year = new Date().getFullYear()) => {
    return await axiosInstance.get(`/v1/admin/dashboard/growth?year=${year}`);
  },
  getActivities: async () => {
    return await axiosInstance.get('/v1/admin/dashboard/activities');
  },
  getAlerts: async () => {
    return await axiosInstance.get('/v1/admin/dashboard/alerts');
  },
  getProjectHealth: async (year = new Date().getFullYear()) => {
    return await axiosInstance.get(`/v1/admin/dashboard/project-health?year=${year}`);
  },
  getAuditLogs: async (page = 0, size = 20, search = '', type = 'All', timeFilter = 'All time') => {
    return await axiosInstance.get('/v1/admin/dashboard/audit-logs', {
      params: { page, size, search, type, timeFilter }
    });
  }
};

export default adminService;
