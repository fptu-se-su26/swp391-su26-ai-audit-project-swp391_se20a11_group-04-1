import { create } from 'zustand'

/**
 * Zustand Store quản lý trạng thái phiên đăng nhập của người dùng
 */
export const useAuthStore = create((set) => ({
  userId: localStorage.getItem('userId') || null,
  userRole: localStorage.getItem('userRole') || null,
  isAuthenticated: !!localStorage.getItem('userId'),

  /**
   * Đăng nhập thành công, thiết lập state và lưu trữ cục bộ
   * @param {string} userId - ID của người dùng từ Backend
   * @param {string} userRole - Vai trò hệ thống của người dùng (e.g. USER, ADMIN)
   */
  login: (userId, userRole) => {
    localStorage.setItem('userId', userId)
    localStorage.setItem('userRole', userRole)
    set({
      userId,
      userRole,
      isAuthenticated: true,
    })
  },

  /**
   * Đăng xuất khỏi hệ thống, dọn dẹp các thông tin trong state và storage
   */
  logout: () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    set({
      userId: null,
      userRole: null,
      isAuthenticated: false,
    })
  },
}))

export default useAuthStore
