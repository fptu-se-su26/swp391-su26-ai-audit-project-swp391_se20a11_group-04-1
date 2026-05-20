import { create } from 'zustand'
import axiosInstance from '@api/axiosConfig'

/**
 * useNotificationStore - Quản lý trạng thái thông báo trong ứng dụng
 */
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  /**
   * Lấy toàn bộ thông báo của user hiện tại
   */
  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const response = await axiosInstance.get('/v1/notifications')
      const notifications = (response.data?.data || []).map((n) => ({
        ...n,
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
}))

export default useNotificationStore
