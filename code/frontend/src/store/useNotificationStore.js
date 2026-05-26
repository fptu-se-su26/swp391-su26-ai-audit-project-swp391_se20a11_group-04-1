import { create } from 'zustand'
import axiosInstance from '@api/axiosConfig'
import React from 'react'
import toast from 'react-hot-toast'

/**
 * useNotificationStore - Quản lý trạng thái thông báo trong ứng dụng
 */
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  socket: null,

  /**
   * Lấy toàn bộ thông báo của user hiện tại
   */
  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axiosInstance.get('/v1/notifications')
      const notifications = (response.data?.data || []).map((n) => ({
        ...n,
        isRead: n.isRead !== undefined ? n.isRead : n.read,
        _resolved: n.invitationStatus
      }))
      const unreadCount = notifications.filter((n) => !n.isRead).length
      set({ notifications, unreadCount, loading: false })
    } catch (err) {
      console.error('Error fetching notifications:', err)
      set({ error: err.response?.data?.message || 'Tải thông báo thất bại', loading: false })
    }
  },

  /**
   * Lấy số thông báo chưa đọc (cho badge chuông)
   */
  fetchUnreadCount: async () => {
    try {
      const response = await axiosInstance.get('/v1/notifications/unread-count')
      const count = response.data?.data?.count || 0
      set({ unreadCount: count })
    } catch (err) {
      console.error('Error fetching unread count:', err)
    }
  },

  /**
   * Đánh dấu một thông báo là đã đọc
   */
  markAsRead: async (notificationId) => {
    try {
      await axiosInstance.put(`/v1/notifications/${notificationId}/read`)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   */
  markAllAsRead: async () => {
    try {
      await axiosInstance.put('/v1/notifications/read-all')
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }))
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  },

  /**
   * Đồng ý tham gia dự án từ lời mời
   */
  acceptInvitation: async ({ token, invitationId }) => {
    try {
      await axiosInstance.post('/v1/projects/invitations/accept', { token, invitationId })
      return true
    } catch (err) {
      console.error('Error accepting invitation:', err)
      return { error: err.response?.data?.message || 'Có lỗi xảy ra khi đồng ý lời mời.' }
    }
  },

  /**
   * Từ chối lời mời tham gia dự án
   */
  rejectInvitation: async ({ token, invitationId }) => {
    try {
      await axiosInstance.post('/v1/projects/invitations/reject', { token, invitationId })
      return true
    } catch (err) {
      console.error('Error rejecting invitation:', err)
      return { error: err.response?.data?.message || 'Có lỗi xảy ra khi từ chối lời mời.' }
    }
  },

  /**
   * Khởi tạo kết nối WebSocket để nhận dữ liệu thời gian thực
   */
  initWebSocket: (userId) => {
    const existingSocket = get().socket
    if (existingSocket) {
      if (existingSocket.readyState === WebSocket.OPEN) {
        return
      }
      existingSocket.close()
    }

    try {
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const backendUrl = import.meta.env.VITE_API_BASE_URL

      let wsUrl = ''
      if (backendUrl && backendUrl.startsWith('http')) {
        wsUrl = backendUrl.replace(/^http/, 'ws') + '/ws/notifications?userId=' + userId
      } else {
        wsUrl = isDev
          ? `ws://localhost:8080/api/ws/notifications?userId=${userId}`
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws/notifications?userId=${userId}`
      }

      const ws = new WebSocket(wsUrl)

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)

          if (payload.type === 'NOTIFICATION' && payload.data) {
            // Đo lường độ trễ từ lúc tạo trên Server đến lúc hiển thị ở Client (Latency)
            const createdAtStr = payload.data.createdAt
            if (createdAtStr) {
              const serverTime = new Date(createdAtStr).getTime()
              const clientTime = Date.now()
              const latencyMs = clientTime - serverTime
              if (latencyMs > 1000) {
                console.error(
                  `%c🚨 [WebSocket Delay Alert] Notification was NOT displayed within 1 second! Delay: ${latencyMs}ms (> 1000ms).`,
                  'color: #ffffff; background-color: #ef4444; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
                )
              }
            }

            const newNotif = {
              ...payload.data,
              isRead: payload.data.isRead !== undefined ? payload.data.isRead : payload.data.read,
              _resolved: payload.data.invitationStatus
            }

            set((state) => {
              if (state.notifications.some(n => n.id === newNotif.id)) {
                return state
              }
              const updated = [newNotif, ...state.notifications]
              return {
                notifications: updated,
                unreadCount: state.unreadCount + 1
              }
            })

            // Hiển thị thông báo Toast đẹp mắt có nút đóng (✕) - Mute Toast này nếu đã có Toast REFRESH_PROJECTS để tránh trùng lặp
            if (!(newNotif.type === 'SYSTEM' && newNotif.entityType === 'PROJECT_INVITATION')) {
              toast((t) =>
                React.createElement('div', { className: 'flex items-center justify-between gap-3 w-full text-on-surface' },
                  React.createElement('span', { className: 'font-semibold text-sm' }, `🔔 ${newNotif.message}`),
                  React.createElement('button', {
                    onClick: () => toast.dismiss(t.id),
                    className: 'shrink-0 w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 text-on-surface flex items-center justify-center transition-all focus:outline-none text-[10px] font-extrabold cursor-pointer border-none',
                    title: 'Đóng'
                  }, '✕')
                ),
                {
                  duration: 3000,
                  style: {
                    minWidth: '300px',
                    maxWidth: '420px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    borderRadius: '10px',
                    border: '1px solid var(--md-sys-color-outline-variant, #e0e0e0)',
                    padding: '10px 14px',
                    background: 'var(--md-sys-color-surface-container-lowest, #ffffff)'
                  }
                }
              )
            }
          }

          if (payload.type === 'REFRESH_PROJECTS') {
            import('@store/useProjectStore').then(({ useProjectStore }) => {
              useProjectStore.getState().fetchProjects()
              const activeProj = useProjectStore.getState().activeProject
              if (activeProj && activeProj.id === payload.projectId) {
                useProjectStore.getState().fetchProjectById(payload.projectId)
              }
            })

            // Hiển thị thông báo Toast chúc mừng có nút đóng (✕)
            toast.success((t) =>
              React.createElement('div', { className: 'flex items-center justify-between gap-3 w-full text-emerald-850' },
                React.createElement('span', { className: 'font-semibold text-sm' }, payload.message),
                React.createElement('button', {
                  onClick: () => toast.dismiss(t.id),
                  className: 'shrink-0 w-5 h-5 rounded-full bg-emerald-200/50 hover:bg-emerald-200 text-emerald-950 flex items-center justify-center transition-all focus:outline-none text-[10px] font-extrabold cursor-pointer border-none',
                  title: 'Đóng'
                }, '✕')
              ),
              {
                duration: 3000,
                style: {
                  minWidth: '300px',
                  maxWidth: '420px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  borderRadius: '10px',
                  border: '1px solid #c3e6cb',
                  padding: '10px 14px',
                  background: '#d4edda'
                }
              }
            )
          }
        } catch (err) {
          console.error('Error handling WebSocket payload:', err)
        }
      }

      ws.onclose = (event) => {
        if (event.code !== 1000) {
          setTimeout(() => {
            const currentUserId = localStorage.getItem('userId')
            if (currentUserId) {
              get().initWebSocket(currentUserId)
            }
          }, 5000)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket connection error occurred:', error)
      }

      set({ socket: ws })
    } catch (err) {
      console.error('Failed to establish WebSocket connection:', err)
    }
  },

  /**
   * Đóng kết nối WebSocket khi logout
   */
  closeWebSocket: () => {
    const ws = get().socket
    if (ws) {
      ws.close(1000, 'User logged out')
      set({ socket: null })
    }
  },
}))

export default useNotificationStore
