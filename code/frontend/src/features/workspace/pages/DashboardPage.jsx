function DashboardPage() {
  return (
    <div className="p-6 md:p-10 z-10 h-full">
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
    </div>
  )
}

export default DashboardPage
