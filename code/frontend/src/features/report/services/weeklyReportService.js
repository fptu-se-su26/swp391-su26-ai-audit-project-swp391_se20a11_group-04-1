import axiosInstance from '@api/axiosConfig'

export const weeklyReportService = {
  getProjectReports: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/weekly-reports`)
    return response.data.data
  },

  getProjectReport: async (projectId, reportId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/weekly-reports/${reportId}`)
    return response.data.data
  },

  generateProjectReport: async (projectId) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/weekly-reports/generate`)
    return response.data.data
  },

  getProjectSlaDashboard: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/sla-dashboard`)
    return response.data.data
  },

  getLatestSchedulerRuns: async () => {
    const response = await axiosInstance.get('/v1/scheduler/runs/latest')
    return response.data.data
  },

  getSchedulerRunEmails: async (jobName) => {
    const response = await axiosInstance.get(`/v1/scheduler/runs/${jobName}/emails`)
    return response.data.data
  },

  getSchedulerRunEvents: async (jobName) => {
    const response = await axiosInstance.get(`/v1/scheduler/runs/${jobName}/events`)
    return response.data.data
  },

  getOutboxSummary: async () => {
    const response = await axiosInstance.get('/v1/outbox/summary')
    return response.data.data
  },
}

export default weeklyReportService
