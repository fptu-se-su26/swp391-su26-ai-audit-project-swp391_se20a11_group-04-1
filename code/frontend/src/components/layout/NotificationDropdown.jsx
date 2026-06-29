import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useNotificationStore from '@store/useNotificationStore'
import useProjectStore from '@store/useProjectStore'

export function NotificationDropdown() {
  const navigate = useNavigate()
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    acceptInvitation,
    rejectInvitation
  } = useNotificationStore()

  const { fetchProjects } = useProjectStore()

  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Fetch thông báo ban đầu khi component mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      fetchNotifications()
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    toast.success('Đã đánh dấu đọc tất cả thông báo!')
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
  }

  const handleAccept = async (e, notification) => {
    e.stopPropagation()
    const response = await acceptInvitation({ invitationId: notification.relatedId })
    if (response === true) {
      toast.success('Đồng ý tham gia dự án thành công!')
      // Cập nhật optimistic: đánh dấu đã xử lý và đã đọc ngay lập tức, không chờ re-fetch
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notification.id
            ? { ...n, isRead: true, _resolved: 'ACCEPTED' }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - (notification.isRead ? 0 : 1)),
      }))
      fetchProjects() // Cập nhật danh sách dự án của user
    } else {
      toast.error(response?.error || 'Có lỗi xảy ra khi đồng ý lời mời.')
    }
  }

  const handleReject = async (e, notification) => {
    e.stopPropagation()
    const response = await rejectInvitation({ invitationId: notification.relatedId })
    if (response === true) {
      toast.success('Đã từ chối lời mời tham gia dự án.')
      // Cập nhật optimistic: đánh dấu đã xử lý và đã đọc ngay lập tức
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notification.id
            ? { ...n, isRead: true, _resolved: 'REJECTED' }
            : n
        ),
        unreadCount: Math.max(0, state.unreadCount - (notification.isRead ? 0 : 1)),
      }))
    } else {
      toast.error(response?.error || 'Có lỗi xảy ra khi từ chối lời mời.')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông */}
      <button
        onClick={handleToggle}
        className={`relative w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-all ${
          isOpen ? 'bg-surface-container text-primary' : ''
        }`}
        title="Thông báo"
      >
        <span className="material-symbols-outlined text-xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-error text-[10px] font-black text-white border border-surface-container-lowest flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[380px] bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-up">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/50 bg-surface-container-low/40">
            <h4 className="font-extrabold text-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">notifications_active</span>
              Trung tâm thông báo
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-primary hover:text-primary-container transition-colors"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List Notifications */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/20">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-on-surface-variant">Đang tải thông báo...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline/60">notifications_off</span>
                <p className="text-xs text-on-surface-variant font-medium">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer relative group flex gap-3.5 items-start ${
                    !n.isRead ? 'bg-primary/[0.02]' : ''
                  }`}
                >
                  {/* Trạng thái chưa đọc */}
                  {!n.isRead && (
                    <span className="absolute left-2.5 top-5 w-1.5 h-1.5 rounded-full bg-primary"></span>
                  )}

                  {/* Icon loại thông báo */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === 'INVITATION' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {n.type === 'INVITATION' ? 'mail' : 'info'}
                    </span>
                  </div>

                  {/* Chi tiết nội dung */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="font-extrabold text-xs text-on-surface leading-tight truncate">{n.title}</p>
                    <p className="text-xs text-on-surface-variant leading-relaxed break-words">{n.message}</p>
                    
                    {/* Hành động / Trạng thái Lời mời */}
                    {n.type === 'INVITATION' && (
                      n._resolved === 'ACCEPTED' ? (
                        // Đã đồng ý → Hiển thị badge xanh
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/15 text-green-600 text-[11px] font-bold rounded-lg border border-green-500/30">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Đã đồng ý tham gia
                          </span>
                        </div>
                      ) : n._resolved === 'REJECTED' ? (
                        // Đã từ chối → Hiển thị badge xám
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-lg border border-outline-variant/50">
                            <span className="material-symbols-outlined text-[13px]">cancel</span>
                            Đã từ chối
                          </span>
                        </div>
                      ) : (
                        // Chưa phản hồi (PENDING hoặc undefined) → Hiển thị 2 nút
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={(e) => handleAccept(e, n)}
                            className="px-3.5 py-1.5 bg-primary text-on-primary text-[11px] font-bold rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm"
                          >
                            Đồng ý
                          </button>
                          <button
                            onClick={(e) => handleReject(e, n)}
                            className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-[11px] font-bold rounded-lg transition-all"
                          >
                            Từ chối
                          </button>
                        </div>
                      )
                    )}

                    <p className="text-[10px] text-outline font-medium">
                      {new Date(n.createdAt).toLocaleDateString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
