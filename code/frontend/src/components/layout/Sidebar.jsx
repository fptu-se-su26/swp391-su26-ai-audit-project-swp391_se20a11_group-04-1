import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import useProjectStore from '@store/useProjectStore'
import useLayoutStore from '@store/useLayoutStore'
import toast from 'react-hot-toast'
import { getInitials } from '@utils/avatarHelper'

/**
 * NavItem Component - Mục điều hướng đơn lẻ dùng NavLink cho active state tự động
 */
const NavItem = ({ to, icon, label, defaultIconClass = '', isCollapsed }) => (
  <NavLink 
    to={to} 
    title={isCollapsed ? label : undefined}
    className={({ isActive }) => `flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-lg transition-all duration-200 ease-in-out group ${
      isActive 
        ? 'bg-secondary-container text-on-secondary-container font-semibold shadow-sm' 
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
        {!isCollapsed && <span className="font-body-md text-body-md whitespace-nowrap overflow-hidden">{label}</span>}
      </>
    )}
  </NavLink>
)

/**
 * Sidebar Component - Thanh điều hướng dùng chung chứa danh sách các Module của DevTrackAI
 * Hỗ trợ chuyển đổi động giữa cấp Portfolio và Project Workspace
 */
const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const isCollapsed = useLayoutStore((state) => state.isSidebarCollapsed)
  const toggleCollapse = useLayoutStore((state) => state.toggleSidebar)
  const logout = useAuthStore((state) => state.logout)
  const userRole = useAuthStore((state) => state.userRole)
  const verifyStatus = useAuthStore((state) => state.verifyStatus) || 'UNVERIFIED'
  const fullName = useAuthStore((state) => state.fullName) || 'Guest User'
  const email = useAuthStore((state) => state.email) || 'guest@example.com'

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

  // Tất cả mọi người đều thấy mục Classrooms (học sinh thấy lớp đã tham gia, mentor tạo lớp)
  portfolioMenuItems.push({ id: 'classrooms', label: 'Classrooms', icon: 'school', path: '/classrooms' })
  
  // Luôn hiển thị mục Verify cho người dùng bình thường để họ có thể xem lại tài liệu đã nộp
  if (userRole !== 'ADMIN') {
    portfolioMenuItems.push({ id: 'verify', label: 'Verify Account', icon: 'verified_user', path: '/verify' })
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

  return (
    <aside className={`w-full ${isCollapsed ? 'md:w-[80px]' : 'md:w-[280px]'} md:fixed md:top-0 md:left-0 md:h-screen bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant flex flex-col p-4 md:p-5 z-20 shrink-0 select-none transition-all duration-300 ease-in-out`}>
      
      {/* PHẦN ĐẦU SIDEBAR: ĐỔI THEO TRẠNG THÁI ACTIVE PROJECT */}
      {!activeProject ? (
        // A. Cấp Portfolio: Hiển thị banner DevTrack Portfolio
        <div className={`flex items-center ${isCollapsed ? 'justify-center mb-6' : 'justify-between mb-6 p-2 bg-surface-container-low border border-outline-variant/40 shadow-sm'} rounded-xl relative group cursor-pointer transition-colors`} onClick={isCollapsed ? toggleCollapse : undefined} title={isCollapsed ? 'Mở rộng (Expand)' : ''}>
          <div className={`flex items-center gap-3.5 min-w-0 ${isCollapsed ? 'hover:opacity-80 transition-opacity' : ''}`}>
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-primary text-on-primary font-display-lg text-lg font-bold shadow-md shrink-0">
              S
            </div>
            {!isCollapsed && (
              <div className="min-w-0 pr-2">
                <h2 className="font-semibold text-sm text-on-surface truncate leading-tight">DevTrack Portfolio</h2>
                <span className="text-[11px] font-medium text-on-surface-variant/80">All Projects</span>
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
              className="hidden md:flex items-center justify-center w-6 h-6 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors shrink-0"
              title="Thu gọn (Collapse)"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
          )}
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
            title={isCollapsed ? 'Back to Portfolio' : undefined}
            className={`flex items-center justify-center text-xs font-semibold text-primary hover:text-on-primary-fixed-variant transition-colors self-start py-1.5 rounded-lg bg-primary-fixed hover:bg-primary-fixed-dim ${isCollapsed ? 'w-full px-0' : 'gap-2 px-2.5'}`}
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            {!isCollapsed && <span>Back to Portfolio</span>}
          </button>

          {/* Banner Dự án cụ thể */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between p-2 bg-surface-container-lowest border border-outline-variant/60 shadow-sm'} rounded-xl relative group cursor-pointer transition-colors`} onClick={isCollapsed ? toggleCollapse : undefined} title={isCollapsed ? 'Mở rộng (Expand)' : undefined}>
            <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'hover:opacity-80 transition-opacity' : ''}`}>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed font-bold text-sm shrink-0">
                {activeProject.title.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 pr-2">
                  <h2 className="font-bold text-xs text-on-surface truncate leading-tight" title={activeProject.title}>
                    {activeProject.title}
                  </h2>
                  <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider bg-green-500/10 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                    {activeProject.role}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleCollapse(); }}
                className="hidden md:flex items-center justify-center w-6 h-6 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors shrink-0"
                title="Thu gọn (Collapse)"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* DANH SÁCH MENU ĐIỀU HƯỚNG */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
        {!activeProject ? (
          // A. Hiển thị Menu Portfolio
          portfolioMenuItems.map((item) => {
            const isActive = (item.id === 'projects' && location.pathname === '/dashboard') || (item.path !== '#' && location.pathname === item.path)
            return (
              <button
                key={item.id}
                onClick={() => handlePortfolioMenuClick(item)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3.5 px-3'} py-2.5 rounded-lg transition-all font-semibold text-sm ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-bold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
              </button>
            )
          })
        ) : (
          // B. Hiển thị Menu của riêng Dự Án
          <div className="flex-1 space-y-1">
            <NavItem to={`/projects/${activeProject.id}/dashboard`} icon="dashboard" label="Dashboard" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/requirements`} icon="description" label="Requirements" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/use-cases`} icon="account_tree" label="Use Cases" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/task-board`} icon="assignment" label="Task Board" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/my-tasks`} icon="assignment_ind" label="My Tasks" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/sprints`} icon="history_toggle_off" label="Sprints" isCollapsed={isCollapsed} />
            {/* Sprint Reports entry point moved to SprintPage → "View Sprint Report" button */}
            <NavItem to={`/projects/${activeProject.id}/test-cases`} icon="checklist_rtl" label="Test Cases" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/issues`} icon="crisis_alert" label="Issues" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/bugs`} icon="bug_report" label="Bugs" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/evidence`} icon="inventory_2" label="Evidence Vault" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/traceability-matrix`} icon="reorder" label="Traceability Matrix" isCollapsed={isCollapsed} />

            {/* Intelligence Section */}
            <div className="pt-4 pb-2">
              <div className="h-px bg-outline-variant/50 w-full mb-2"></div>
              {!isCollapsed && <span className="px-3 font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Intelligence</span>}
            </div>
            
            <NavItem 
              to={`/projects/${activeProject.id}/ai-assistant`} 
              icon="smart_toy" 
              label="AI Assistant" 
              defaultIconClass="text-primary-container"
              isCollapsed={isCollapsed}
            />
            <NavItem to={`/projects/${activeProject.id}/github-config`} icon="hub" label="GitHub Config" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/task-reviews`} icon="fact_check" label="Task Review" isCollapsed={isCollapsed} />

            {/* Team Section */}
            <div className="pt-4 pb-2">
              <div className="h-px bg-outline-variant/50 w-full mb-2"></div>
              {!isCollapsed && <span className="px-3 font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Team</span>}
            </div>
            
            <NavItem to={`/projects/${activeProject.id}/contribution`} icon="groups" label="Contribution" isCollapsed={isCollapsed} />
            <NavItem to={`/projects/${activeProject.id}/mentor-view`} icon="visibility" label="Mentor View" isCollapsed={isCollapsed} />

            {/* Mentor Dashboard specific menu item */}
            {userRole === 'MENTOR' && (
              <div className="mt-2">
                <NavItem to={`/projects/${activeProject.id}/mentor`} icon="supervisor_account" label="Mentor Dashboard" isCollapsed={isCollapsed} />
              </div>
            )}

            <div className="mt-2">
              <NavItem to={`/projects/${activeProject.id}/project-settings`} icon="settings" label="Project Settings" isCollapsed={isCollapsed} />
            </div>
          </div>
        )}
      </nav>

      {/* PERSISTENT USER STATUS & LOGOUT */}
      <div className="pt-5 border-t border-outline-variant mt-auto flex flex-col gap-3">
        <div 
          onClick={() => navigate('/profile')}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 p-2'} rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors`}
          title="Xem trang cá nhân"
        >
          <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
            {getInitials(fullName)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <p className="font-semibold text-sm leading-tight text-on-surface truncate" title={fullName}>{fullName}</p>
              <p className="text-[11px] text-on-surface-variant truncate" title={email}>{email}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Đăng xuất' : undefined}
          className={`w-full flex items-center justify-center ${isCollapsed ? 'p-2' : 'gap-2 py-2.5'} bg-surface-container-highest hover:bg-error-container hover:text-on-error-container border border-outline-variant rounded-lg text-on-surface font-body-md transition-colors shadow-sm`}
        >
          <span className="material-symbols-outlined text-[18px] pl-1 pr-1">logout</span>
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
