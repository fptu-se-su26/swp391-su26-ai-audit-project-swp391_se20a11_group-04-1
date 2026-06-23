import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

export const sprintReportService = {
  getReports: (projectId, sprintId) =>
    axiosInstance.get(`/v1/projects/${projectId}/weekly-reports`, {
      params: sprintId ? { sprintId } : undefined,
    }).then(unwrap),

  getSprintSummary: (projectId, sprintId) =>
    axiosInstance.get(`/v1/projects/${projectId}/reports/sprints/${sprintId}/summary`).then(unwrap),

  getSprintHealth: (projectId, sprintId) =>
    axiosInstance.get(`/v1/projects/${projectId}/sla/sprint-health`, { params: { sprintId } }).then(unwrap),

  saveSprintReport: (projectId, sprintId, reportData) =>
    axiosInstance.post(`/v1/projects/${projectId}/weekly-reports/generate`, null, {
      params: sprintId ? { sprintId } : undefined,
    }).then(unwrap),

  getReport: (projectId, reportId) =>
    axiosInstance.get(`/v1/projects/${projectId}/weekly-reports/${reportId}`).then(unwrap),

  generate: (projectId, sprintId) =>
    axiosInstance.post(`/v1/projects/${projectId}/weekly-reports/generate`, null, {
      params: sprintId ? { sprintId } : undefined,
    }).then(unwrap),

  triggerDailyDigest: (projectId) =>
    axiosInstance.post(`/v1/projects/${projectId}/digests/test-trigger`).then(res => res.data),
}

export default sprintReportService
