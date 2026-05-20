import { NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import toast from 'react-hot-toast'

/**
 * NavItem Component - Mục điều hướng đơn lẻ dùng NavLink cho active state tự động
 */
const NavItem = ({ to, icon, label, defaultIconClass = '' }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out group ${
      isActive 
        ? 'bg-secondary-container text-on-secondary-container font-semibold' 
        : 'text-secondary hover:bg-surface-container-low'
    }`}
  >
    {({ isActive }) => (
      <>
        <span className={`material-symbols-outlined text-[20px] transition-colors ${
          isActive 
            ? 'icon-fill' 
            : (defaultIconClass ? defaultIconClass : 'group-hover:text-primary')
        }`}>
          {icon}
        </span>
        <span className="font-body-md text-body-md">{label}</span>
      </>
    )}
  </NavLink>
)

/**
 * Sidebar Component - Thanh điều hướng dùng chung chứa danh sách các Module của DevTrackAI
 * Chia thành các section: Core, Intelligence, Team theo kiến trúc Feature-Based
 */
const Sidebar = () => {
  const navigate = useNavigate()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
    toast.success('Đăng xuất thành công!')
    navigate('/login')
  }

  return (
    <nav className="w-full md:w-[280px] bg-surface border-b md:border-b-0 md:border-r border-outline-variant flex flex-col py-6 z-10 shrink-0 hidden md:flex">
      
      {/* Project Info Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary">folder_special</span>
          </div>
          <div className="overflow-hidden">
            <h2 className="font-body-md text-body-md text-on-surface font-semibold truncate w-full">DevTrack AI</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-0.5">Current Project</p>
          </div>
        </div>
      </div>

      {/* Core Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        <NavItem to="/dashboard" icon="dashboard" label="Dashboard" />
        <NavItem to="/requirements" icon="description" label="Requirements" />
        <NavItem to="/use-cases" icon="account_tree" label="Use Cases" />
        <NavItem to="/task-board" icon="assignment" label="Task Board" />
        <NavItem to="/sprints" icon="history_toggle_off" label="Sprints" />
        <NavItem to="/test-cases" icon="checklist_rtl" label="Test Cases" />
        <NavItem to="/bugs" icon="bug_report" label="Bugs" />
        <NavItem to="/evidence" icon="inventory_2" label="Evidence Vault" />
        <NavItem to="/traceability-matrix" icon="reorder" label="Traceability Matrix" />

        {/* Intelligence Section */}
        <div className="pt-4 pb-2">
          <div className="h-px bg-outline-variant/50 w-full mb-2"></div>
          <span className="px-3 font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Intelligence</span>
        </div>
        
        <NavItem 
          to="/ai-assistant" 
          icon="smart_toy" 
          label="AI Assistant" 
          defaultIconClass="text-primary-container"
        />
        <NavItem to="/code-insight" icon="code" label="Code Insight" />

        {/* Team Section */}
        <div className="pt-4 pb-2">
          <div className="h-px bg-outline-variant/50 w-full mb-2"></div>
          <span className="px-3 font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Team</span>
        </div>
        
        <NavItem to="/contribution" icon="groups" label="Contribution" />
        <NavItem to="/mentor-view" icon="visibility" label="Mentor View" />

        <div className="mt-2">
          <NavItem to="/project-settings" icon="settings" label="Project Settings" />
        </div>
      </div>

      {/* User Status & Logout */}
      <div className="px-4 mt-auto pt-4 border-t border-outline-variant">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container-highest hover:bg-error-container hover:text-on-error-container border border-outline-variant rounded-lg text-on-surface font-body-md transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Đăng xuất
        </button>
      </div>
    </nav>
  )
}

export default Sidebar
