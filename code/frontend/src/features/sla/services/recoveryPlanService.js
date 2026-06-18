import axiosInstance from '@api/axiosConfig'

const unwrap = (res) => res.data?.data

export const recoveryPlanService = {
  getProjectRecoveryPlans: (projectId, { sprintId, status } = {}) =>
    axiosInstance
      .get(`/v1/projects/${projectId}/recovery-plans`, {
        params: {
          sprintId: sprintId || undefined,
          status: status || undefined
        }
      })
      .then(unwrap),

  approveRecoveryPlan: (projectId, planId) =>
    axiosInstance
      .patch(`/v1/projects/${projectId}/recovery-plans/${planId}/approve`)
      .then(unwrap),

  rejectRecoveryPlan: (projectId, planId, reason) =>
    axiosInstance
      .patch(`/v1/projects/${projectId}/recovery-plans/${planId}/reject`, { reason })
      .then(unwrap),

  executeRecoveryPlan: (projectId, planId) =>
    axiosInstance
      .patch(`/v1/projects/${projectId}/recovery-plans/${planId}/execute`)
      .then(unwrap),
}

export default recoveryPlanService
