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
    const response = await axiosInstance.get(`/v1/test-runs/${runId}`)
    return response.data.data
  },

  /**
   * Lấy Agent Token cho localhost testing
   */
  getAgentToken: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/agent-token`)
    return response.data.token
  },
  /**
   * Run API Test
   */
  runApiTest: async (projectId, testCaseId, environmentId = null) => {
    const params = environmentId ? { environmentId } : {}
    const response = await axiosInstance.post(`/v1/projects/${projectId}/test-cases/${testCaseId}/run-api`, null, { params })
    return response.data.data
  },

  /**
   * Generate Test Case with AI (API/UI/MANUAL)
   */
  generateTestCaseWithAi: async (projectId, payload) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/test-cases/generate-ai`, payload, { timeout: 120000 })
    return response.data.data
  },

  /**
   * Lấy dữ liệu test case generation staging
   */
  getTestCaseGeneration: async (projectId, generationId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/test-cases/generate-ai/${generationId}`)
    return response.data.data
  },

  /**
   * Approve Test Case Generation
   */
  approveTestCaseGeneration: async (projectId, generationId, payload) => {
    const response = await axiosInstance.post(`/v1/projects/${projectId}/test-cases/generate-ai/${generationId}/approve`, payload)
    return response.data.data
  },

  /**
   * Lấy lịch sử run API Test
   */
  getApiTestResults: async (projectId, testCaseId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/test-cases/${testCaseId}/api-results`)
    return response.data.data
  },

  /**
   * Lấy 1 API Test Result cụ thể (để poll)
   */
  getApiTestResult: async (projectId, testCaseId, resultId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/test-cases/${testCaseId}/api-results/${resultId}`)
    return response.data.data
  },

  /**
   * Lưu 1 API Test Result vào History
   */
  saveApiTestResult: async (projectId, testCaseId, resultId) => {
    const response = await axiosInstance.patch(`/v1/projects/${projectId}/test-cases/${testCaseId}/api-results/${resultId}/save`)
    return response.data.data
  },
}

export default testCaseService
