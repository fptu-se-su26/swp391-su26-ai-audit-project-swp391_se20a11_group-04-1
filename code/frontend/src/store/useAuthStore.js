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
    verifyStatus: localStorage.getItem('verifyStatus') || 'UNVERIFIED',
    passwordSet: localStorage.getItem('passwordSet') !== 'false',
    isAuthenticated: !!userId,
    isLockedOut: false,
    lockReason: null,
    appealStatus: null,

  /**
   * Đăng nhập thành công, thiết lập state và lưu trữ cục bộ
   */
  login: (userId, userRole, username, email, fullName, verifyStatus, passwordSet) => {
    const strId = userId ? String(userId) : null
    if (strId) localStorage.setItem('userId', strId)
    if (userRole) localStorage.setItem('userRole', userRole)
    if (username) localStorage.setItem('username', username)
    if (email) localStorage.setItem('email', email)
    if (fullName) localStorage.setItem('fullName', fullName)
    localStorage.setItem('verifyStatus', verifyStatus || 'UNVERIFIED')
    localStorage.setItem('passwordSet', passwordSet !== false ? 'true' : 'false')
    // Reset project state khi user mới đăng nhập
    localStorage.removeItem('devtrack-project-storage')
    set({
      userId: strId,
      userRole,
      username: username || null,
      email: email || null,
      fullName: fullName || null,
      verifyStatus: verifyStatus || 'UNVERIFIED',
      passwordSet: passwordSet !== false,
      isAuthenticated: !!strId,
      isLockedOut: false,
      lockReason: null,
      appealStatus: null,
    })
  },

  /**
   * Đồng bộ hóa thông tin người dùng từ Session DB/Redis
   */
  fetchMe: async () => {
    try {
      const response = await authService.getMe()
      if (response.data?.success) {
        const { id, systemRole, username, email, fullName, verifyStatus, active, isActive, lockReason, appealStatus, passwordSet } = response.data?.data || {}
        const strId = id ? String(id) : null
        const userIsActive = isActive ?? active ?? true;
        const userIsLocked = !userIsActive;
        
        if (strId) localStorage.setItem('userId', strId)
        if (systemRole) localStorage.setItem('userRole', systemRole)
        if (username) localStorage.setItem('username', username)
        if (email) localStorage.setItem('email', email)
        if (fullName) localStorage.setItem('fullName', fullName)
        localStorage.setItem('verifyStatus', verifyStatus || 'UNVERIFIED')
        localStorage.setItem('passwordSet', passwordSet !== false ? 'true' : 'false')

        set({
          userId: strId,
          userRole: systemRole || null,
          username: username || null,
          email: email || null,
          fullName: fullName || null,
          verifyStatus: verifyStatus || 'UNVERIFIED',
          passwordSet: passwordSet !== false,
          isAuthenticated: !!strId,
          isLockedOut: userIsLocked,
          lockReason: lockReason || null,
          appealStatus: appealStatus || null
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
      localStorage.removeItem('verifyStatus')
      localStorage.removeItem('passwordSet')
      set({
        userId: null,
        userRole: null,
        username: null,
        email: null,
        fullName: null,
        verifyStatus: 'UNVERIFIED',
        passwordSet: true,
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
    localStorage.removeItem('verifyStatus')
    localStorage.removeItem('passwordSet')
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
      verifyStatus: 'UNVERIFIED',
      passwordSet: true,
      isAuthenticated: false,
      isLockedOut: false,
      lockReason: null,
      appealStatus: null,
    })
  }
}
})

export default useAuthStore
