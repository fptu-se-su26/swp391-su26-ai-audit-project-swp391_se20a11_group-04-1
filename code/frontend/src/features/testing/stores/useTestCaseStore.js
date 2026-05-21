import { create } from 'zustand'
import { testCaseService } from '../services/testCaseService'

/**
 * Zustand Store quản lý trạng thái Test Case module
 */
export const useTestCaseStore = create((set, get) => ({
  // State
  testCases: [],
  selectedTestCase: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 0,
    size: 20,
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

  setSelectedTestCase: (testCase) => set({ selectedTestCase: testCase }),

  /**
   * Fetch danh sách test case với filter và phân trang
   */
  fetchTestCases: async (projectId, page = 0) => {
    set({ isLoading: true, error: null })
    try {
      const { filters, pagination } = get()
      const params = {
        page,
        size: pagination.size,
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.requirementId && { requirementId: filters.requirementId }),
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
  updateTestCase: async (projectId, testCaseId, requestData) => {
    set({ isLoading: true, error: null })
    try {
      await testCaseService.updateTestCase(projectId, testCaseId, requestData)
      set({ isFormOpen: false, editingTestCase: null, isLoading: false })
      await get().fetchTestCases(projectId)
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
}))

export default useTestCaseStore
