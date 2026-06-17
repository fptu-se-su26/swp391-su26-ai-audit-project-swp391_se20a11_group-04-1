import { create } from 'zustand'
import authService from '@features/auth/services/authService'

/**
 * Zustand Store quản lý trạng thái phiên đăng nhập của người dùng
 */
export const useAuthStore = create((set) => {
  const userId = localStorage.getItem('userId') || null

  return {
    userId,
    userRole: localStorage.getItem('userRole') || null,
    username: localStorage.getItem('username') || null,
    email: localStorage.getItem('email') || null,
    fullName: localStorage.getItem('fullName') || null,
    isAuthenticated: !!userId,

  /**
   * Đăng nhập thành công, thiết lập state và lưu trữ cục bộ
   * @param {string} userId - ID của người dùng từ Backend
   * @param {string} userRole - Vai trò hệ thống của người dùng (e.g. USER, ADMIN)
   * @param {string} username - Tên tài khoản người dùng
   * @param {string} email - Địa chỉ email người dùng
   * @param {string} fullName - Họ và tên người dùng
   */
  login: (userId, userRole, username, email, fullName) => {
    const strId = userId ? String(userId) : null
    if (strId) localStorage.setItem('userId', strId)
    if (userRole) localStorage.setItem('userRole', userRole)
    if (username) localStorage.setItem('username', username)
    if (email) localStorage.setItem('email', email)
    if (fullName) localStorage.setItem('fullName', fullName)
    // Reset project state khi user mới đăng nhập
    localStorage.removeItem('devtrack-project-storage')
    set({
      userId: strId,
      userRole,
      username: username || null,
      email: email || null,
      fullName: fullName || null,
      isAuthenticated: !!strId,
    })
  },

  /**
   * Đồng bộ hóa thông tin người dùng từ Session DB/Redis
   */
  fetchMe: async () => {
    try {
      const response = await authService.getMe()
      if (response.data?.success) {
        const { id, systemRole, username, email, fullName } = response.data?.data || {}
        const strId = id ? String(id) : null
        
        if (strId) localStorage.setItem('userId', strId)
        if (systemRole) localStorage.setItem('userRole', systemRole)
        if (username) localStorage.setItem('username', username)
        if (email) localStorage.setItem('email', email)
        if (fullName) localStorage.setItem('fullName', fullName)

        set({
          userId: strId,
          userRole: systemRole || null,
          username: username || null,
          email: email || null,
          fullName: fullName || null,
          isAuthenticated: !!strId,
        })
        return response.data?.data
      }
    } catch (error) {
      console.error('Failed to fetch current user session:', error)
      // Nếu API trả về lỗi (phiên hết hạn hoặc chưa đăng nhập), dọn sạch store & localStorage
      localStorage.removeItem('userId')
      localStorage.removeItem('userRole')
      localStorage.removeItem('username')
      localStorage.removeItem('email')
      localStorage.removeItem('fullName')
      set({
        userId: null,
        userRole: null,
        username: null,
        email: null,
        fullName: null,
        isAuthenticated: false,
      })
    }
  },

  /**
   * Đăng xuất khỏi hệ thống, dọn dẹp các thông tin trong state và storage
   */
  logout: () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    localStorage.removeItem('username')
    localStorage.removeItem('email')
    localStorage.removeItem('fullName')
    // Xóa project state của user cũ
    localStorage.removeItem('devtrack-project-storage')

    // Đóng WebSocket
    import('@store/useNotificationStore').then(({ useNotificationStore }) => {
      useNotificationStore.getState().closeWebSocket()
    })

    set({
      userId: null,
      userRole: null,
      username: null,
      email: null,
      fullName: null,
      isAuthenticated: false,
    })
  }
}
})

export default useAuthStore
