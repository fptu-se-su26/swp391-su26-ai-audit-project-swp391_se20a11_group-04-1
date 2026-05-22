import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axiosInstance from '@api/axiosConfig'
import { getInitials, getAvatarColor } from '@/utils/avatarHelper'

/** Chuyển đổi project từ backend response sang cấu trúc frontend */
const transformProject = (project) => {
  const transformedMembers = (project.members || []).map((member) => ({
    ...member,
    initials: getInitials(member.name),
    bg: getAvatarColor(member.name),
  }))
  return { ...project, members: transformedMembers }
}

/**
 * useProjectStore - Quản lý trạng thái dự án toàn cục (Portfolio & Project Workspace)
 */
export const useProjectStore = create(
  persist(
    (set, get) => ({
  // ── Dữ liệu dự án (tích lũy qua nhiều trang) ──────────────────────────────
  projects: [],           // Tất cả dự án đã tải từ backend (cumulative)

  // ── Phân trang thông minh ──────────────────────────────────────────────────
  visibleCount: 3,        // Số thẻ đang hiển thị trên Dashboard
  currentPage: 0,         // Trang backend đã tải gần nhất (0-indexed)
  totalItems: 0,          // Tổng số dự án của user (từ backend)
  hasMorePages: false,    // Còn trang tiếp theo từ backend hay không

  // ── Trạng thái UI ─────────────────────────────────────────────────────────
  loading: false,
  error: null,

  // ── Dự án đang xem (Workspace) ────────────────────────────────────────────
  activeProject: null,    // null = đang ở Portfolio toàn cục

  // ── Bộ lọc & sắp xếp ─────────────────────────────────────────────────────
  activeTab: 'all',       // 'all' | 'active' | 'completed' | 'archived'
  searchQuery: '',
  sortBy: 'recent',       // 'recent' | 'name' | 'progress'

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Tải trang đầu tiên (page 0) và RESET toàn bộ pagination state.
   * Gọi khi: lần đầu vào Dashboard, sau khi tạo/xóa dự án.
   */
  fetchProjects: async () => {
    set({ loading: true, error: null, projects: [], currentPage: 0, visibleCount: 3 })
    try {
      const { activeTab, searchQuery, sortBy } = get()

      const params = {
        page: 0,
        size: 15,
        status: activeTab && activeTab !== 'all' ? activeTab.toUpperCase() : undefined,
        search: searchQuery || undefined,
        sortBy: sortBy || 'recent',
      }

      const response = await axiosInstance.get('/v1/projects', { params })
      const paginatedData = response.data?.data || {}
      const items = (paginatedData.items || []).map(transformProject)

      set({
        projects: items,
        totalItems: paginatedData.totalItems || 0,
        hasMorePages: paginatedData.hasMore || false,
        loading: false,
      })
    } catch (err) {
      console.error('Error fetching projects:', err)
      set({
        error: err.response?.data?.message || err.message || 'Failed to fetch projects',
        loading: false,
      })
    }
  },

  /**
   * Tải chi tiết 1 dự án bằng ID.
   * Dùng khi reload lại trang project details mà chưa có activeProject hoàn chỉnh.
   */
  fetchProjectById: async (projectId) => {
    set({ loading: true, error: null })
    try {
      const response = await axiosInstance.get(`/v1/projects/${projectId}`)
      const rawProject = response.data?.data
      if (rawProject) {
        const fullProject = transformProject(rawProject)
        set({ activeProject: fullProject, loading: false })
        
        // Update it in the projects list if it exists
        const { projects } = get()
        const index = projects.findIndex(p => p.id === fullProject.id)
        if (index !== -1) {
          const newProjects = [...projects]
          newProjects[index] = fullProject
          set({ projects: newProjects })
        }
      } else {
        set({ loading: false })
      }
    } catch (err) {
      console.error('Error fetching project by id:', err)
      set({
        error: err.response?.data?.message || err.message || 'Failed to fetch project detail',
        loading: false,
      })
    }
  },

  /**
   * Hiển thị thêm 3 thẻ dự án.
   * - Nếu đã có đủ dữ liệu trong bộ nhớ → chỉ tăng visibleCount.
   * - Nếu hết dữ liệu nhưng backend còn → tự động fetch trang tiếp theo
   *   và cache 10 phút trên Redis (xử lý ở backend).
   */
  loadMore: async () => {
    const { projects, visibleCount, currentPage, totalItems, hasMorePages, activeTab, searchQuery, sortBy, loading } = get()
    if (loading) return

    const nextVisible = visibleCount + 3

    // Đã có đủ dữ liệu trong bộ nhớ → chỉ tăng visibleCount
    if (nextVisible <= projects.length) {
      set({ visibleCount: nextVisible })
      return
    }

    // Cần tải thêm từ backend (auto-fetch next page → Redis cache)
    if (projects.length < totalItems && hasMorePages) {
      set({ loading: true })
      try {
        const nextPage = currentPage + 1
        const params = {
          page: nextPage,
          size: 15,
          status: activeTab && activeTab !== 'all' ? activeTab.toUpperCase() : undefined,
          search: searchQuery || undefined,
          sortBy: sortBy || 'recent',
        }

        const response = await axiosInstance.get('/v1/projects', { params })
        const paginatedData = response.data?.data || {}
        const newItems = (paginatedData.items || []).map(transformProject)

        set((state) => ({
          projects: [...state.projects, ...newItems],
          currentPage: nextPage,
          totalItems: paginatedData.totalItems || state.totalItems,
          hasMorePages: paginatedData.hasMore || false,
          visibleCount: Math.min(nextVisible, state.projects.length + newItems.length),
          loading: false,
        }))
      } catch (err) {
        console.error('Error loading more projects:', err)
        set({ loading: false })
      }
    } else {
      // Không còn gì để tải → clamp visibleCount đến giới hạn cuối
      set({ visibleCount: Math.min(nextVisible, projects.length) })
    }
  },

  /**
   * Reset chỉ visibleCount về 3 mà không xóa dữ liệu đã tải.
   * Dùng khi user thay đổi filter/tab.
   */
  resetVisible: () => set({ visibleCount: 3 }),

  // ── Dự án ─────────────────────────────────────────────────────────────────

  /** Chọn dự án để truy cập Workspace chi tiết */
  selectProject: (project) => set({ activeProject: project }),

  /** Thoát khỏi Workspace chi tiết, quay lại Portfolio */
  clearActiveProject: () => set({ activeProject: null }),

  // ── Bộ lọc ────────────────────────────────────────────────────────────────

  /** Đặt tab lọc và reset pagination */
  setActiveTab: (tab) => {
    set({ activeTab: tab })
    get().fetchProjects()
  },

  /** Cập nhật ô tìm kiếm (không auto-fetch: để DashboardPage debounce) */
  setSearchQuery: (query) => set({ searchQuery: query }),

  /** Cập nhật lựa chọn sắp xếp */
  setSortBy: (sortBy) => set({ sortBy }),

  // ── Tạo dự án ─────────────────────────────────────────────────────────────

  /**
   * Tạo mới một dự án → backend evict cache → tự động nạp lại danh sách
   */
  createProject: async (projectData) => {
    set({ loading: true, error: null })
    try {
      await axiosInstance.post('/v1/projects', projectData)
      // Backend đã evict Redis cache; gọi lại để tải fresh data từ DB
      await get().fetchProjects()
      set({ loading: false })
      return true
    } catch (err) {
      console.error('Error creating project:', err)
      set({
        error: err.response?.data?.message || err.message || 'Failed to create project',
        loading: false,
      })
      return false
    }
  },

  /**
   * Mời thành viên mới vào dự án bằng email.
   * Backend sẽ gửi lời mời + email — KHÔNG thêm thành viên trực tiếp.
   */
  inviteProjectMember: async (email) => {
    const { activeProject } = get()
    if (!activeProject) return false
    set({ loading: true, error: null })
    try {
      await axiosInstance.post(`/v1/projects/${activeProject.id}/members/invite`, { email })
      set({ loading: false })
      return true
    } catch (err) {
      console.error('Error inviting member:', err)
      const errMsg = err.response?.data?.message || err.message || 'Mời thành viên thất bại'
      set({ error: errMsg, loading: false })
      return false
    }
  },

  /**
   * Xoá thành viên khỏi dự án (chỉ Project Leader mới được phép).
   * Cập nhật optimistic local state ngay lập tức.
   */
  removeProjectMember: async (memberUserId) => {
    const { activeProject } = get()
    if (!activeProject) return false
    set({ loading: true, error: null })
    try {
      await axiosInstance.delete(`/v1/projects/${activeProject.id}/members/${memberUserId}`)

      const updatedMembers = (activeProject.members || []).filter((m) => m.id !== memberUserId)
      const updatedProject = { ...activeProject, members: updatedMembers }
      const updatedProjects = get().projects.map((p) => p.id === activeProject.id ? updatedProject : p)

      set({ activeProject: updatedProject, projects: updatedProjects, loading: false })
      return true
    } catch (err) {
      console.error('Error removing member:', err)
      const errMsg = err.response?.data?.message || err.message || 'Xoá thành viên thất bại'
      set({ error: errMsg, loading: false })
      return false
    }
  },

  /**
   * Thay đổi vai trò thành viên (ví dụ phong cấp Mentor).
   * Cập nhật danh sách thành viên activeProject và projects ngay lập tức.
   */
  changeProjectMemberRole: async (memberUserId, newRole) => {
    const { activeProject } = get()
    if (!activeProject) return false
    set({ loading: true, error: null })
    try {
      await axiosInstance.put(`/v1/projects/${activeProject.id}/members/${memberUserId}/role`, { role: newRole })

      const updatedMembers = (activeProject.members || []).map((member) =>
        member.id === memberUserId ? { ...member, role: newRole } : member
      )
      const updatedProject = { ...activeProject, members: updatedMembers }

      const updatedProjects = get().projects.map((p) => p.id === activeProject.id ? updatedProject : p)

      set({
        activeProject: updatedProject,
        projects: updatedProjects,
        loading: false,
      })
      return true
    } catch (err) {
      console.error('Error changing member role:', err)
      const errMsg = err.response?.data?.message || err.message || 'Thay đổi vai trò thất bại'
      set({ error: errMsg, loading: false })
      return false
    }
  },
    }),
    {
      name: 'devtrack-project-storage',
      partialize: (state) => ({ activeProject: state.activeProject }),
    }
  )
)

export default useProjectStore
