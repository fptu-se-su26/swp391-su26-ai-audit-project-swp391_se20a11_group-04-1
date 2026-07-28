import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

export const sprintReportService = {
  getReports: (projectId, sprintId) =>
    axiosInstance.get(`/v1/projects/${projectId}/weekly-reports`, {
      params: sprintId ? { sprintId } : undefined,
    }).then(unwrap),

  getSprintSummary: (projectId, sprintId) =>
    axiosInstance.get(`/v1/projects/${projectId}/reports/sprints/${sprintId}/summary`).then(unwrap),

  getCompletionSummary: (projectId, sprintId) =>
    axiosInstance.get(`/v1/projects/${projectId}/sprints/${sprintId}/completion-summary`).then(unwrap),

  getSprintHealth: (projectId, sprintId) =>
    axiosInstance.get(`/v1/projects/${projectId}/sla/sprint-health`, { params: { sprintId } }).then(unwrap),

  getMemberAiEvaluation: (projectId, sprintId, assigneeName) =>
    axiosInstance
      .get(`/v1/projects/${projectId}/sla/sprints/${sprintId}/members/${encodeURIComponent(assigneeName)}/ai-evaluation`)
      .then(unwrap),

  pingRiskMember: (projectId, sprintId, assigneeName, aiComment) =>
    axiosInstance
      .post(`/v1/projects/${projectId}/sla/sprints/${sprintId}/ping-risk-member`, null, {
        params: { assigneeName, aiComment },
      })
      .then(unwrap),

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

  regenerateCompletionSummary: (projectId, sprintId) =>
    axiosInstance.post(`/v1/projects/${projectId}/sprints/${sprintId}/completion-summary/regenerate`).then(res => res.data),
}

export default sprintReportService
