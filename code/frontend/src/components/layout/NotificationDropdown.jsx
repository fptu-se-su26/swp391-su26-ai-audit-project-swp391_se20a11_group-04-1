import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useNotificationStore from '@store/useNotificationStore'
import useProjectStore from '@store/useProjectStore'

const notificationMeta = (notification) => {
  if (notification.type === 'INVITATION') {
    return { icon: 'mail', className: 'bg-[#1E707D]/10 text-[#1E707D]' }
  }
  if (notification.entityType === 'WEEKLY_REPORT') {
    return { icon: 'summarize', className: 'bg-[#1E707D]/10 text-[#1E707D]' }
  }
  if (notification.entityType === 'TASK' && /sla|quá hạn|penalty|overdue/i.test(`${notification.title} ${notification.message}`)) {
    return { icon: 'release_alert', className: 'bg-red-500/10 text-red-700' }
  }
  if (notification.entityType === 'TASK') {
    return { icon: 'task_alt', className: 'bg-emerald-500/10 text-emerald-700' }
  }
  if (notification.entityType === 'MENTOR_VERIFICATION') {
    const isError = /từ chối|hết hạn|cancel/i.test(`${notification.title} ${notification.message}`)
    return isError 
      ? { icon: 'gpp_bad', className: 'bg-red-500/10 text-red-700' }
      : { icon: 'verified_user', className: 'bg-emerald-500/10 text-emerald-700' }
  }
  return { icon: 'info', className: 'bg-secondary/10 text-secondary' }
}

const notificationPath = (notification, fallbackProjectId) => {
  const projectId = notification.projectId || fallbackProjectId

  if (notification.entityType === 'MENTOR_VERIFICATION') {
    return '/verification'
  }

  if (!projectId) return null

  if (notification.entityType === 'WEEKLY_REPORT') {
    const reportQuery = notification.relatedId ? `?reportId=${notification.relatedId}` : ''
    return `/projects/${projectId}/sprint-reports${reportQuery}`
  }

  if (notification.entityType === 'TASK' && notification.relatedId) {
    return `/projects/${projectId}/tasks/${notification.relatedId}`
  }

  if (notification.entityType === 'PROJECT_INVITATION') {
    return '/dashboard'
  }

  return null
}

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

  const { activeProject, fetchProjects, projects } = useProjectStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false)
  const [selectedFilterProjectId, setSelectedFilterProjectId] = useState('all')
  const dropdownRef = useRef(null)
  const filterDropdownRef = useRef(null)

  // Fetch thông báo ban đầu khi component mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Đóng dropdown filter khi click ra ngoài
  useEffect(() => {
    function handleClickOutsideFilter(event) {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setIsProjectFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsideFilter)
    return () => document.removeEventListener('mousedown', handleClickOutsideFilter)
  }, [])

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
    toast.success('Marked all notifications as read!')
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    const path = notificationPath(notification, activeProject?.id)
    if (path) {
      setIsOpen(false)
      navigate(path)
    }
  }

  const handleAccept = async (e, notification) => {
    e.stopPropagation()
    const response = await acceptInvitation({ invitationId: notification.relatedId })
    if (response === true) {
      toast.success('Accepted project invitation successfully!')
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
      toast.error(response?.error || 'Failed to accept invitation.')
    }
  }

  const handleReject = async (e, notification) => {
    e.stopPropagation()
    const response = await rejectInvitation({ invitationId: notification.relatedId })
    if (response === true) {
      toast.success('Rejected project invitation.')
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
      toast.error(response?.error || 'Failed to reject invitation.')
    }
  }

  // Calculate unread counts by project and filter notifications
  const unreadByProject = {}
  let otherUnreadCount = 0

  notifications.forEach((n) => {
    if (!n.isRead) {
      const pId = n.projectId ? String(n.projectId) : 'system'
      unreadByProject[pId] = (unreadByProject[pId] || 0) + 1
      if (selectedFilterProjectId !== 'all' && String(n.projectId) !== String(selectedFilterProjectId)) {
        otherUnreadCount++
      }
    }
  })

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilterProjectId === 'all') return true
    if (n.type === 'INVITATION') return false // Lời mời chỉ hiện ở mục "Tất cả dự án"
    return String(n.projectId) === String(selectedFilterProjectId)
  })

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông */}
      <button
        onClick={handleToggle}
        className={`relative w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-all ${
          isOpen ? 'bg-surface-container text-[#1E707D]' : ''
        }`}
        title="Notifications"
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/50 bg-surface-container-low/40">
            <div className="relative" ref={filterDropdownRef}>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsProjectFilterOpen(!isProjectFilterOpen); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-left ${
                  isProjectFilterOpen 
                    ? 'bg-[#1E707D]/10 border-[#1E707D]/30 text-[#1E707D] shadow-inner' 
                    : 'bg-surface-container-lowest border-outline-variant/60 hover:bg-surface-container-low hover:border-outline-variant text-on-surface shadow-sm'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${isProjectFilterOpen ? 'text-[#1E707D]' : 'text-on-surface-variant'}`}>
                  filter_list
                </span>
                <span className="font-bold text-[13px] flex items-center gap-1">
                  <span className="truncate max-w-[140px]">
                    {selectedFilterProjectId === 'all' 
                      ? 'Notification Center' 
                      : (projects.find(p => p.id === selectedFilterProjectId)?.name || projects.find(p => p.id === selectedFilterProjectId)?.title || 'Unknown Project')}
                  </span>
                  <span className={`material-symbols-outlined text-[18px] leading-none opacity-60 transition-transform duration-200 ${isProjectFilterOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </span>
                {otherUnreadCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-error ml-0.5 shadow-sm border border-white" title={`${otherUnreadCount} new notifications in other projects`}></span>
                )}
              </button>
              
              {isProjectFilterOpen && (
                <div className="absolute top-full left-0 mt-1 w-[260px] bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-lg z-50 overflow-hidden animate-scale-up">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedFilterProjectId('all'); setIsProjectFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-surface-container flex items-center justify-between ${selectedFilterProjectId === 'all' ? 'bg-[#1E707D]/10 text-[#1E707D]' : 'text-on-surface'}`}
                  >
                    <span>Notification Center</span>
                    {unreadCount > 0 && (
                      <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </button>
                  <div className="max-h-48 overflow-y-auto divide-y divide-outline-variant/20">
                    {projects.map(p => {
                      const pUnread = unreadByProject[p.id] || 0;
                      return (
                        <button
                          key={p.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedFilterProjectId(p.id); setIsProjectFilterOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-surface-container flex items-center justify-between ${selectedFilterProjectId === p.id ? 'bg-[#1E707D]/10 text-[#1E707D]' : 'text-on-surface-variant'}`}
                        >
                          <span className="truncate pr-2">{p.name || p.title}</span>
                          {pUnread > 0 && (
                            <span className="text-xs font-bold text-white bg-error px-2 py-0.5 rounded-full shrink-0 shadow-sm">{pUnread}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-bold text-[#1E707D] hover:text-[#165964] transition-colors shrink-0 px-2"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List Notifications */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-outline-variant/20">
            {loading && filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-[#1E707D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-on-surface-variant">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-outline/60">notifications_off</span>
                <p className="text-xs text-on-surface-variant font-medium">No notifications yet</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 hover:bg-surface-container-low/30 transition-colors cursor-pointer relative group flex gap-3.5 items-start ${
                    !n.isRead ? 'bg-[#1E707D]/[0.02]' : ''
                  }`}
                >
                  {/* Trạng thái chưa đọc */}
                  {!n.isRead && (
                    <span className="absolute left-2.5 top-5 w-1.5 h-1.5 rounded-full bg-[#1E707D]"></span>
                  )}

                  {/* Icon loại thông báo */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notificationMeta(n).className}`}>
                    <span className="material-symbols-outlined text-lg">
                      {notificationMeta(n).icon}
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
                            Accepted
                          </span>
                        </div>
                      ) : n._resolved === 'REJECTED' ? (
                        // Đã từ chối → Hiển thị badge xám
                        <div className="flex items-center gap-1.5 pt-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-high text-on-surface-variant text-[11px] font-bold rounded-lg border border-outline-variant/50">
                            <span className="material-symbols-outlined text-[13px]">cancel</span>
                            Rejected
                          </span>
                        </div>
                      ) : (
                        // Chưa phản hồi (PENDING hoặc undefined) → Hiển thị 2 nút
                        <div className="flex gap-2 pt-1.5">
                          <button
                            onClick={(e) => handleAccept(e, n)}
                            className="px-3.5 py-1.5 bg-[#1E707D] text-white text-[11px] font-bold rounded-lg hover:bg-[#D7EEF1] hover:text-[#1E707D] transition-all shadow-sm"
                          >
                            Accept
                          </button>
                          <button
                            onClick={(e) => handleReject(e, n)}
                            className="px-3.5 py-1.5 bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-[11px] font-bold rounded-lg transition-all"
                          >
                            Decline
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
