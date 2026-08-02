import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

export const recoveryPlanService = {
  getProjectRecoveryTasks: (projectId, { sprintId } = {}) =>
    axiosInstance
      .get(`/v1/projects/${projectId}/recovery-tasks`, {
        params: {
          sprintId: sprintId || undefined
        }
      })
      .then(unwrap),

  getProjectRecoveryPlans: (projectId, { sprintId, status } = {}) =>
    axiosInstance
      .get(`/v1/projects/${projectId}/recovery-plans`, {
        params: {
          sprintId: sprintId || undefined,
          status: status || undefined
        }
      })
      .then(unwrap),

  generateRecoveryPlan: (projectId, taskId) =>
    axiosInstance
      .post(`/v1/projects/${projectId}/tasks/${taskId}/recovery-plans/generate`)
      .then(unwrap),

  generateProjectRecoveryPlans: (projectId, { sprintId } = {}) =>
    axiosInstance
      .post(`/v1/projects/${projectId}/recovery-plans/generate`, null, {
        params: {
          sprintId: sprintId || undefined
        }
      })
      .then(unwrap),

  approveRecoveryPlan: (projectId, planId) =>
    axiosInstance
      .patch(`/v1/projects/${projectId}/recovery-plans/${planId}/approve`)
      .then(unwrap),

  updateRecoveryPlan: (projectId, planId, payload) =>
    axiosInstance
      .patch(`/v1/projects/${projectId}/recovery-plans/${planId}`, payload)
      .then(unwrap),

  executeRecoveryPlan: (projectId, planId) =>
    axiosInstance
      .patch(`/v1/projects/${projectId}/recovery-plans/${planId}/execute`)
      .then(unwrap),
}

export default recoveryPlanService
