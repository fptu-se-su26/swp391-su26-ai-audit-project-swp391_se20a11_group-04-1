import { create } from 'zustand'
import axiosInstance from '@api/axiosConfig'
import { getInitials, getAvatarColor } from '@/utils/avatarHelper'

/**
 * useProjectStore - Quản lý trạng thái dự án toàn cục (Portfolio & Project Workspace)
 */
export const useProjectStore = create((set, get) => ({
  // Danh sách dự án tải từ backend
  projects: [],

  // Trạng thái loading và error để quản lý UI
  loading: false,
  error: null,

  // Dự án hiện tại đang được chọn (null nghĩa là đang ở góc nhìn Portfolio toàn cục)
  activeProject: null,

  // Tab lọc danh sách dự án
  activeTab: 'all', // 'all', 'active', 'completed'

  // Bộ lọc tìm kiếm dự án
  searchQuery: '',

  // Lựa chọn sắp xếp
  sortBy: 'recent', // 'recent', 'name', 'progress'

  /**
   * Tải danh sách dự án từ backend API dựa trên trạng thái bộ lọc hiện tại
   */
  fetchProjects: async () => {
    set({ loading: true, error: null })
    try {
      const { activeTab, searchQuery, sortBy } = get()

      const params = {
        page: 0,
        size: 100, // Fetch all projects in a single page for portfolio view
        status: activeTab && activeTab !== 'all' ? activeTab.toUpperCase() : undefined,
        search: searchQuery || undefined,
        sortBy: sortBy || 'recent',
      }

      const response = await axiosInstance.get('/v1/projects', { params })
      const data = response.data

      // Transform backend response to match frontend UI requirements
      const items = (data.data?.items || []).map((project) => {
        // Dynamically compute avatar info for members to keep frontend standard high
        const transformedMembers = (project.members || []).map((member) => ({
          ...member,
          initials: getInitials(member.name),
          bg: getAvatarColor(member.name),
        }))

        return {
          ...project,
          members: transformedMembers,
        }
      })

      set({ projects: items, loading: false })
    } catch (err) {
      console.error('Error fetching projects:', err)
      set({
        error: err.response?.data?.message || err.message || 'Failed to fetch projects',
        loading: false
      })
    }
  },

  /**
   * Chọn dự án để truy cập Workspace chi tiết
   */
  selectProject: (project) => set({ activeProject: project }),

  /**
   * Thoát khỏi Workspace chi tiết, quay lại Portfolio
   */
  clearActiveProject: () => set({ activeProject: null }),

  /**
   * Đặt tab lọc hiện tại
   */
  setActiveTab: (tab) => set({ activeTab: tab }),

  /**
   * Cập nhật ô tìm kiếm dự án
   */
  setSearchQuery: (query) => set({ searchQuery: query }),

  /**
   * Cập nhật lựa chọn sắp xếp
   */
  setSortBy: (sortBy) => set({ sortBy }),
}))

export default useProjectStore
