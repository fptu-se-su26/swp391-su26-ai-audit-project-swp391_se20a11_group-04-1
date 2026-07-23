import { create } from 'zustand'
import { testCaseService } from '../services/testCaseService'

/**
 * Zustand Store quản lý trạng thái Test Case module
 */
export const useTestCaseStore = create((set, get) => ({
  // State
  testCases: [],
  selectedTestCase: null,
  requirementsTree: [],
  selectedRequirementId: null,
  isDrawerOpen: false,
  drawerTestCaseId: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 0,
    size: 15,
    totalElements: 0,
    totalPages: 0,
  },
  filters: {
    status: null,
    type: null,
    requirementId: null,
  },

  // Modal states
  isFormOpen: false,
  isDeleteDialogOpen: false,
  isAiGenModalOpen: false,
  aiGenDefaults: null,
  isAiReviewOpen: false,
  currentGenerationId: null,
  aiGenerationResult: null,
  editingTestCase: null,
  deletingTestCase: null,

  // Actions
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters },
  })),

  openCreateForm: () => set({ isFormOpen: true, editingTestCase: null }),
  openEditForm: (testCase) => set({ isFormOpen: true, editingTestCase: testCase }),
  closeForm: () => set({ isFormOpen: false, editingTestCase: null }),

  openDeleteDialog: (testCase) => set({ isDeleteDialogOpen: true, deletingTestCase: testCase }),
  closeDeleteDialog: () => set({ isDeleteDialogOpen: false, deletingTestCase: null }),

  openAiGenModal: (defaults = null) => set({ isAiGenModalOpen: true, aiGenDefaults: defaults }),
  closeAiGenModal: () => set({ isAiGenModalOpen: false, aiGenDefaults: null }),

  openAiReview: (generationId, data) => set({
    isAiReviewOpen: true,
    currentGenerationId: generationId,
    aiGenerationResult: data,
  }),
  closeAiReview: () => set({
    isAiReviewOpen: false,
    currentGenerationId: null,
    aiGenerationResult: null,
  }),

  setSelectedTestCase: (testCase) => set({ selectedTestCase: testCase }),

  selectRequirement: (reqId) => set((state) => ({
    selectedRequirementId: reqId,
    filters: { ...state.filters, requirementId: reqId },
    pagination: {
      ...state.pagination,
      page: 0,
      size: reqId ? 1000 : 15
    }
  })),

  openDrawer: (testCaseId) => set({ isDrawerOpen: true, drawerTestCaseId: testCaseId }),
  closeDrawer: () => set({ isDrawerOpen: false, drawerTestCaseId: null }),

  /**
   * Fetch Requirements Tree
   */
  fetchRequirementsTree: async (projectId) => {
    try {
      const data = await testCaseService.getRequirementsTree(projectId)
      set({ requirementsTree: data })
    } catch (error) {
      console.error('[TestCaseStore] fetchRequirementsTree error:', error)
    }
  },

  /**
   * Fetch danh sách test case với filter và phân trang
   */
  fetchTestCases: async (projectId, page = 0) => {
    set({ isLoading: true, error: null })
    try {
      const { filters, pagination } = get()
      const params = {
        page,
        size: filters.requirementId ? 1000 : (pagination.size > 100 ? 15 : pagination.size),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.requirementId && { requirementId: filters.requirementId }),
        ...(filters.search && { search: filters.search }),
      }
      const res = await testCaseService.getTestCases(projectId, params)
      
      console.log('[TestCase] API response:', res);
      
      const data = res; // getTestCases already returns response.data.data
      
      if (data && data.content) {
        set({
          testCases: data.content,
          pagination: {
            page: data.page !== undefined ? data.page : data.number, // Support both new PageResponse (page) and old Spring Data (number)
            size: data.size,
            totalElements: data.totalElements,
            totalPages: data.totalPages,
          },
          isLoading: false,
        })
      } else if (Array.isArray(data)) {
        set({ testCases: data, isLoading: false })
      } else {
        set({ testCases: [], isLoading: false })
      }
    } catch (error) {
      console.error('[TestCase] fetchTestCases error:', error.response || error)
      set({ error: error.message, isLoading: false })
    }
  },

  /**
   * Fetch chi tiết 1 test case
   */
  fetchTestCaseDetail: async (projectId, testCaseId) => {
    set({ isLoading: true, error: null })
    try {
      const data = await testCaseService.getTestCaseById(projectId, testCaseId)
      set({ selectedTestCase: data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },

  /**
   * Tạo test case mới
   */
  createTestCase: async (projectId, requestData) => {
    set({ isLoading: true, error: null })
    try {
      await testCaseService.createTestCase(projectId, requestData)
      set({ isFormOpen: false, editingTestCase: null, isLoading: false })
      await get().fetchTestCases(projectId)
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  /**
   * Cập nhật test case
   */
  updateTestCase: async (projectId, testCaseId, requestData, skipFetchList = false) => {
    set({ isLoading: true, error: null })
    try {
      await testCaseService.updateTestCase(projectId, testCaseId, requestData)
      set({ isFormOpen: false, editingTestCase: null, isLoading: false })
      if (!skipFetchList) {
        await get().fetchTestCases(projectId)
      }
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  /**
   * Xóa test case
   */
  deleteTestCase: async (projectId, testCaseId) => {
    set({ isLoading: true, error: null })
    try {
      await testCaseService.deleteTestCase(projectId, testCaseId)
      set({ isDeleteDialogOpen: false, deletingTestCase: null, isLoading: false })
      await get().fetchTestCases(projectId)
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  /**
   * Chạy API Test Case
   */
  runApiTest: async (projectId, testCaseId, environmentId = null) => {
    // Không set isLoading để tránh block UI trong lúc run, tự component handle loading
    try {
      const result = await testCaseService.runApiTest(projectId, testCaseId, environmentId)
      return result
    } catch (error) {
      console.error('[TestCaseStore] runApiTest error:', error)
      throw error
    }
  },

}))

export default useTestCaseStore
