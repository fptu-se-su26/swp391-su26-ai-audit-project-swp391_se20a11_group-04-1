import axiosInstance from '@/api/axiosConfig'

/**
 * Test Case Service — API calls for Test Case CRUD operations
 * Base URL: /v1/projects/{projectId}/test-cases
 */
export const testCaseService = {
  /**
   * Lấy danh sách Test Case có phân trang và filter
   */
  getTestCases: async (projectId, params = {}) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/test-cases`, { params })
    return response.data.data
  },

  /**
   * Lấy chi tiết 1 Test Case theo ID
   */
  getTestCaseById: async (projectId, testCaseId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/test-cases/${testCaseId}`)
    return response.data.data
  },

  /**
   * Tạo mới Test Case
   */
  createTestCase: async (projectId, data) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/test-cases`, data)
    return response.data.data
  },

  /**
   * Cập nhật Test Case
   */
  updateTestCase: async (projectId, testCaseId, data) => {
    const response = await axiosInstance.put(`/v1/projects/${projectId}/test-cases/${testCaseId}`, data)
    return response.data.data
  },

  /**
   * Xóa Test Case
   */
  deleteTestCase: async (projectId, testCaseId) => {
    await axiosInstance.delete(`/v1/projects/${projectId}/test-cases/${testCaseId}`)
  },

  /**
   * Run Test Case
   */
  triggerTestRun: async (testCaseId) => {
    const response = await axiosInstance.post(`/v1/test-cases/${testCaseId}/run`)
    return response.data.data
  },

  /**
   * Get Test Run Status (Polling)
   */
  getTestRunStatus: async (runId) => {
    const response = await axiosInstance.get(`/v1/test-runs/${runId}/status`)
    return response.data.data
  },
}

export default testCaseService
