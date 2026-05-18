import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

/**
 * DashboardPage - Trang tổng quan không gian làm việc dự án DevTrackAI
 * Chỉ chứa nội dung chính của Dashboard, Sidebar được quản lý tập trung ở AppLayout
 */
export function DashboardPage() {
  const navigate = useNavigate()

  return (
    <main className="flex-1 p-6 md:p-10 z-10 overflow-y-auto">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-fixed-dim opacity-10 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-secondary-fixed opacity-15 blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="font-headline-md text-2xl text-on-surface">Chào mừng trở lại!</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Dưới đây là tổng quan hoạt động và tiến độ của không gian làm việc DevTrackAI hôm nay.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded font-semibold text-sm hover:bg-on-primary-fixed-variant transition-all h-[40px]">
          <span className="material-symbols-outlined">add</span>
          <span>Tạo Dự án Mới</span>
        </button>
      </header>

      {/* Dashboard Grid Stats */}
      <section className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1: Active Projects */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-semibold text-xs uppercase tracking-wider">Dự án Hoạt động</span>
            <span className="material-symbols-outlined text-primary text-2xl">folder</span>
          </div>
          <p className="text-3xl font-bold">8</p>
          <p className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            +2 dự án mới tuần này
          </p>
        </div>

        {/* Card 2: Requirements & Use Cases */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-semibold text-xs uppercase tracking-wider">Yêu cầu & Use Case</span>
            <span className="material-symbols-outlined text-tertiary text-2xl">description</span>
          </div>
          <p className="text-3xl font-bold">124</p>
          <p className="text-xs text-green-600 mt-2 font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">check_circle</span>
            92% đã được đặc tả và liên kết
          </p>
        </div>

        {/* Card 3: RTM Coverage Rate */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <span className="text-on-surface-variant font-semibold text-xs uppercase tracking-wider">Tỷ lệ Phủ RTM (Traceability)</span>
            <span className="material-symbols-outlined text-secondary text-2xl">grid_on</span>
          </div>
          <p className="text-3xl font-bold">95.6%</p>
          <p className="text-xs text-on-surface-variant mt-2 font-semibold">
            Đạt chuẩn kiểm thử tự động
          </p>
        </div>

      </section>

      {/* Details Table: Active Projects List */}
      <section className="relative z-10 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h3 className="font-headline-sm text-lg text-on-surface mb-4">Danh sách Dự án Hoạt động Gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-surface-container text-on-surface-variant text-xs font-semibold">
                <th className="py-3 px-4">Tên Dự án</th>
                <th className="py-3 px-4">Sprint Hiện tại</th>
                <th className="py-3 px-4">Thành viên</th>
                <th className="py-3 px-4">Tiến độ</th>
                <th className="py-3 px-4">Trạng thái RTM</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-surface-container hover:bg-surface-container-low transition-all">
                <td className="py-3 px-4 font-semibold text-primary">DevTrack AI Core</td>
                <td className="py-3 px-4">
                  <span className="font-label-md text-xs bg-surface-container rounded px-1.5 py-0.5 inline-block">Sprint 4</span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant">5 thành viên</td>
                <td className="py-3 px-4 text-green-600 font-semibold">85%</td>
                <td className="py-3 px-4 text-green-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> 100% Covered
                </td>
              </tr>
              <tr className="border-b border-surface-container hover:bg-surface-container-low transition-all">
                <td className="py-3 px-4 font-semibold text-primary">BallAndBee E-Commerce</td>
                <td className="py-3 px-4">
                  <span className="font-label-md text-xs bg-surface-container rounded px-1.5 py-0.5 inline-block">Sprint 2</span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant">4 thành viên</td>
                <td className="py-3 px-4 text-yellow-600 font-semibold">42%</td>
                <td className="py-3 px-4 text-yellow-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span> 88% Covered
                </td>
              </tr>
              <tr className="hover:bg-surface-container-low transition-all">
                <td className="py-3 px-4 font-semibold text-primary">Audit Automation Engine</td>
                <td className="py-3 px-4">
                  <span className="font-label-md text-xs bg-surface-container rounded px-1.5 py-0.5 inline-block">Sprint 1</span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant">3 thành viên</td>
                <td className="py-3 px-4 text-blue-600 font-semibold">12%</td>
                <td className="py-3 px-4 text-green-600 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">check_circle</span> 90% Covered
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      
    </main>
  )
}

export default DashboardPage
