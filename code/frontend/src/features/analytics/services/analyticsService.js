import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

const analyticsService = {
  getReliabilityReport: (projectId, sprintId, refresh = false) =>
    axiosInstance
      .get(`/v1/projects/${projectId}/sprints/${sprintId}/reliability`, {
        params: refresh ? { refresh: true } : undefined,
      })
      .then(unwrap),

  createAnalysisJob: (projectId, sprintId) =>
    axiosInstance
      .post(`/v1/projects/${projectId}/sprints/${sprintId}/reliability/jobs`)
      .then(unwrap),

  getAnalysisJob: (projectId, sprintId, jobId) =>
    axiosInstance
      .get(`/v1/projects/${projectId}/sprints/${sprintId}/reliability/jobs/${jobId}`)
      .then(unwrap),
}

export default analyticsService
