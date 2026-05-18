import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import toast from 'react-hot-toast'

/**
 * Sidebar Component - Thanh điều hướng dùng chung chứa danh sách 10 Module của DevTrackAI
 */
export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useAuthStore((state) => state.logout)
  const userRole = useAuthStore((state) => state.userRole)

  const handleLogout = () => {
    logout()
    toast.success('Đăng xuất thành công!')
    navigate('/login')
  }

  // Danh sách các menu tương ứng với 10 Module tính năng trong DevTrackAI
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/requirement', label: 'Requirements', icon: 'description' },
    { path: '/kanban', label: 'Kanban Board', icon: 'view_week' },
    { path: '/testing', label: 'Testing & Bugs', icon: 'bug_report' },
    { path: '/evidence', label: 'Evidence Vault', icon: 'inventory_2' },
    { path: '/rtm', label: 'Traceability Matrix', icon: 'grid_on' },
    { path: '/code-insight', label: 'Code Insights', icon: 'source' },
    { path: '/ai-engine', label: 'AI Engine', icon: 'neurology' },
    { path: '/analytics', label: 'Contribution Analytics', icon: 'analytics' },
  ]

  // Mentor menu (chỉ hiển thị nếu người dùng có vai trò là MENTOR)
  if (userRole === 'MENTOR') {
    menuItems.push({ path: '/mentor', label: 'Mentor Dashboard', icon: 'supervisor_account' })
  }

  return (
    <aside className="w-full md:w-[280px] bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant flex flex-col p-6 z-10 shrink-0">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-container text-on-primary-container">
          <span className="material-symbols-outlined text-headline-md font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>
            dataset
          </span>
        </div>
        <div>
          <h2 className="font-headline-sm text-sm font-bold text-on-surface leading-tight">DevTrack AI</h2>
          <span className="text-[11px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed">
            PRO ACCESS
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto max-h-[60vh] pr-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <a
              key={item.path}
              href="#"
              onClick={(e) => {
                e.preventDefault()
                navigate(item.path)
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded transition-all font-semibold ${
                isActive
                  ? 'bg-primary-fixed text-on-primary-fixed'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          )
        })}
      </nav>

      {/* User Status Section */}
      <div className="pt-6 border-t border-outline-variant mt-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-bold text-sm">
            AD
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Audit Admin</p>
            <p className="text-xs text-on-surface-variant">admin@devtrack.ai</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded border border-error text-error hover:bg-error-container hover:text-on-error-container transition-all font-semibold mt-2 h-[40px]"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
      
    </aside>
  )
}

export default Sidebar
