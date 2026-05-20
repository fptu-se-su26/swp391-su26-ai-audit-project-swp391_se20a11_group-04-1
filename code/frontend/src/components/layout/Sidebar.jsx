import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import useProjectStore from '@store/useProjectStore'
import toast from 'react-hot-toast'

/**
 * Sidebar Component - Thanh điều hướng linh hoạt giữa cấp Portfolio và Project Workspace
 */
export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const userRole = useAuthStore((state) => state.userRole)

  // Đọc trạng thái dự án hiện tại từ useProjectStore
  const activeProject = useProjectStore((state) => state.activeProject)
  const clearActiveProject = useProjectStore((state) => state.clearActiveProject)

  const handleLogout = () => {
    logout()
    toast.success('Đăng xuất thành công!')
    navigate('/login')
  }

  // 1. Danh sách Menu cấp Portfolio (Khi chưa mở dự án cụ thể)
  const portfolioMenuItems = [
    { id: 'projects', label: 'My Projects', icon: 'grid_view', path: '/dashboard' },
    { id: 'archived', label: 'Archived', icon: 'inbox', path: '#' },
    { id: 'settings', label: 'Global Settings', icon: 'settings', path: '#' },
  ]

  // 2. Danh sách Menu cấp Project Workspace (Khi đã chọn dự án)
  const projectMenuItems = [
    { path: '/dashboard', label: 'Overview', icon: 'dashboard' },
    { path: '/requirement', label: 'Requirements', icon: 'description' },
    { path: '/kanban', label: 'Kanban Board', icon: 'view_week' },
    { path: '/testing', label: 'Testing & Bugs', icon: 'bug_report' },
    { path: '/evidence', label: 'Evidence Vault', icon: 'inventory_2' },
    { path: '/rtm', label: 'Traceability Matrix', icon: 'grid_on' },
    { path: '/code-insight', label: 'Code Insights', icon: 'source' },
    { path: '/ai-engine', label: 'AI Engine', icon: 'neurology' },
    { path: '/analytics', label: 'Contribution Analytics', icon: 'analytics' },
  ]

  if (userRole === 'MENTOR') {
    projectMenuItems.push({ path: '/mentor', label: 'Mentor Dashboard', icon: 'supervisor_account' })
  }

  // Xử lý click menu cấp Portfolio
  const handlePortfolioMenuClick = (item) => {
    if (item.path === '#') {
      toast.success(`Chức năng "${item.label}" đang được phát triển!`)
      return
    }
    clearActiveProject()
    navigate(item.path)
  }

  // Xử lý click menu cấp Project Workspace
  const handleProjectMenuClick = (path) => {
    navigate(path)
  }

  return (
    <aside className="w-full md:w-[280px] bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant flex flex-col p-5 z-10 shrink-0 select-none">
      
      {/* PHẦN ĐẦU SIDEBAR: ĐỔI THEO TRẠNG THÁI ACTIVE PROJECT */}
      {!activeProject ? (
        // A. Cấp Portfolio: Hiển thị banner DevTrack Portfolio
        <div className="flex items-center gap-3.5 mb-6 p-2 rounded-xl bg-surface-container-low border border-outline-variant/40 shadow-sm">
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary text-on-primary font-display-lg text-lg font-bold shadow-md">
            S
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-sm text-on-surface truncate leading-tight">DevTrack Portfolio</h2>
            <span className="text-[11px] font-medium text-on-surface-variant/80">All Projects</span>
          </div>
        </div>
      ) : (
        // B. Cấp Project Workspace: Hiển thị thông tin dự án hiện tại & Nút quay lại
        <div className="flex flex-col gap-3.5 mb-6">
          {/* Nút quay lại Portfolio cấp cao nhất */}
          <button
            onClick={() => {
              clearActiveProject()
              navigate('/dashboard')
            }}
            className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors self-start py-1 px-2.5 rounded-lg bg-primary-fixed hover:bg-primary-fixed-dim"
          >
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            <span>Back to Portfolio</span>
          </button>

          {/* Banner Dự án cụ thể */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-sm">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed font-bold text-sm shrink-0">
              {activeProject.title.charAt(0)}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-xs text-on-surface truncate leading-tight" title={activeProject.title}>
                {activeProject.title}
              </h2>
              <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                {activeProject.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH MENU ĐIỀU HƯỚNG */}
      <nav className="flex-1 space-y-1 overflow-y-auto max-h-[55vh] pr-1 scrollbar-thin">
        {!activeProject ? (
          // A. Hiển thị Menu Portfolio
          portfolioMenuItems.map((item) => {
            // Mặc định My Projects hoạt động ở path /dashboard khi activeProject = null
            const isActive = item.id === 'projects' && location.pathname === '/dashboard'
            return (
              <button
                key={item.id}
                onClick={() => handlePortfolioMenuClick(item)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition-all font-semibold text-sm ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })
        ) : (
          // B. Hiển thị Menu của riêng Dự Án
          projectMenuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleProjectMenuClick(item.path)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition-all font-semibold text-sm ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })
        )}
      </nav>

      {/* PERSISTENT USER STATUS & LOGOUT */}
      <div className="pt-5 border-t border-outline-variant mt-auto flex flex-col gap-3">
        <div className="flex items-center gap-3 p-1 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-inner">
            AD
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight text-on-surface truncate">Anh Dung</p>
            <p className="text-[11px] text-on-surface-variant truncate">dungsa@fpt.edu.vn</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-error/50 text-error hover:bg-error/10 transition-all font-semibold text-xs h-[38px]"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
      
    </aside>
  )
}

export default Sidebar
