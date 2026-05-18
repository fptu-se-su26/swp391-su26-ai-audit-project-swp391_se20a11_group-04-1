import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

function DashboardPage() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('userRole')
    toast.success('Đăng xuất thành công!')
    navigate('/login')
  }

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex flex-col md:flex-row relative">
      
      {/* Sidebar */}
      <aside className="w-full md:w-[280px] bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant flex flex-col p-6 z-10 shrink-0">
        <div className="flex items-center gap-3 mb-8">
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

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded bg-primary-fixed text-on-primary-fixed font-semibold transition-all">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">analytics</span>
            <span>AI Auditing</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">source</span>
            <span>Repositories</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded text-on-surface-variant hover:bg-surface-container-high transition-all">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
        </nav>

        {/* User Info & Logout */}
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 z-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline-md text-2xl text-on-surface">Chào mừng trở lại!</h1>
            <p className="text-on-surface-variant text-sm mt-1">Dưới đây là thông số kiểm tra mã nguồn bằng AI của bạn hôm nay.</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-semibold text-sm hover:bg-on-primary-fixed-variant transition-all h-[40px]">
            <span className="material-symbols-outlined">add</span>
            <span>New Audit Run</span>
          </button>
        </header>

        {/* Dashboard Grid Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-on-surface-variant font-semibold text-xs uppercase tracking-wider">Total Repositories</span>
              <span className="material-symbols-outlined text-primary text-2xl">folder</span>
            </div>
            <p className="text-3xl font-bold">12</p>
            <p className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">trending_up</span>
              +2 active this week
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-on-surface-variant font-semibold text-xs uppercase tracking-wider">Security Audits</span>
              <span className="material-symbols-outlined text-tertiary text-2xl">security</span>
            </div>
            <p className="text-3xl font-bold">148</p>
            <p className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              All critical vulnerabilities fixed
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-on-surface-variant font-semibold text-xs uppercase tracking-wider">AI Confidence Score</span>
              <span className="material-symbols-outlined text-secondary text-2xl">neurology</span>
            </div>
            <p className="text-3xl font-bold">98.4%</p>
            <p className="text-xs text-on-surface-variant mt-2 font-semibold">
              Based on 4,200 commits checked
            </p>
          </div>
        </section>

        {/* Details Card */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <h3 className="font-headline-sm text-lg text-on-surface mb-4">Recent Audit Activity Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-container text-on-surface-variant text-xs font-semibold">
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Issues Found</th>
                  <th className="py-3 px-4">Time Checked</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-surface-container hover:bg-surface-container-low transition-all">
                  <td className="py-3 px-4 font-semibold">ai-audit-backend</td>
                  <td className="py-3 px-4 font-label-md text-xs bg-surface-container rounded px-1.5 py-0.5 inline-block mt-2">main</td>
                  <td className="py-3 px-4 text-green-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Passed
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">0 (0 Critical)</td>
                  <td className="py-3 px-4 text-on-surface-variant">10 mins ago</td>
                </tr>
                <tr className="border-b border-surface-container hover:bg-surface-container-low transition-all">
                  <td className="py-3 px-4 font-semibold">web-portal-frontend</td>
                  <td className="py-3 px-4 font-label-md text-xs bg-surface-container rounded px-1.5 py-0.5 inline-block mt-2">dev</td>
                  <td className="py-3 px-4 text-yellow-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span> Warning
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">3 minor, 0 Critical</td>
                  <td className="py-3 px-4 text-on-surface-variant">1 hour ago</td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-all">
                  <td className="py-3 px-4 font-semibold">payment-gateway-service</td>
                  <td className="py-3 px-4 font-label-md text-xs bg-surface-container rounded px-1.5 py-0.5 inline-block mt-2">main</td>
                  <td className="py-3 px-4 text-green-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span> Passed
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">0 Issues</td>
                  <td className="py-3 px-4 text-on-surface-variant">Yesterday</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
