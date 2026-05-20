import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'

/**
 * DashboardPage - Trang tổng quan không gian làm việc dự án DevTrackAI
 * Hỗ trợ 2 chế độ hiển thị:
 * 1. Chế độ Portfolio (activeProject === null): Liệt kê và quản lý danh sách dự án
 * 2. Chế độ Project Overview (activeProject !== null): Hiển thị chi tiết tổng quan của dự án đang chạy
 */
export function DashboardPage() {
  const navigate = useNavigate()

  // Đọc dữ liệu và hàm từ Zustand store
  const {
    projects,
    activeProject,
    selectProject,
    activeTab,
    setActiveTab,
    searchQuery,
    sortBy,
    setSortBy,
    loading,
    error,
    fetchProjects,
  } = useProjectStore()

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Xử lý tạo dự án mới
  const handleCreateProject = () => {
    toast.success('Chức năng "Tạo Dự án Mới" đang được phát triển!')
  }

  // --- LOGIC LỌC VÀ SẮP XẾP DỰ ÁN ---
  const filteredProjects = projects
    // 1. Lọc theo Tab (All, Active, Completed)
    .filter((project) => {
      if (activeTab === 'active') return project.status === 'ACTIVE'
      if (activeTab === 'completed') return project.status === 'COMPLETED'
      return true
    })
    // 2. Lọc theo tìm kiếm (Query search)
    .filter((project) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        project.title.toLowerCase().includes(q) ||
        project.major.toLowerCase().includes(q) ||
        project.role.toLowerCase().includes(q)
      )
    })
    // 3. Sắp xếp theo cài đặt
    .sort((a, b) => {
      if (sortBy === 'name') return a.title.localeCompare(b.title)
      if (sortBy === 'progress') return b.progress - a.progress
      return 0 // Mặc định giữ nguyên thứ tự (Recent)
    })

  // Số lượng dự án để hiển thị lên nhãn Tab
  const totalCount = projects.length
  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length

  // ==========================================
  // CHẾ ĐỘ 1: GIAO DIỆN DANH MỤC DỰ ÁN PORTFOLIO (HÌNH MẪU)
  // ==========================================
  if (!activeProject) {
    if (loading && projects.length === 0) {
      return (
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
          <div className="relative z-10 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-surface-container-high rounded-xl"></div>
                <div className="h-4 w-64 bg-surface-container-high rounded-lg"></div>
              </div>
              <div className="h-10 w-36 bg-surface-container-high rounded-xl"></div>
            </div>
            <div className="h-12 w-full bg-surface-container-high rounded-xl animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 space-y-4 animate-pulse">
                  <div className="h-6 w-1/3 bg-surface-container-high rounded"></div>
                  <div className="h-8 w-3/4 bg-surface-container-high rounded"></div>
                  <div className="h-16 w-full bg-surface-container-high rounded-xl"></div>
                  <div className="h-6 w-full bg-surface-container-high rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )
    }

    if (error && projects.length === 0) {
      return (
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
          <div className="max-w-md mx-auto mt-20 text-center bg-surface-container-lowest p-8 rounded-2xl border border-red-500/10 shadow-sm space-y-4">
            <span className="material-symbols-outlined text-5xl text-red-500">error</span>
            <h3 className="font-bold text-lg text-on-surface">Không thể tải danh sách dự án</h3>
            <p className="text-sm text-on-surface-variant">{error}</p>
            <button
              onClick={() => fetchProjects()}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-on-primary-fixed-variant transition-all shadow-md mt-2"
            >
              Thử lại
            </button>
          </div>
        </main>
      )
    }
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
        
        {/* Glow Background nhẹ nhàng sang trọng */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full bg-primary-fixed opacity-[0.12] blur-[90px]"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.15] blur-[100px]"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto space-y-8">
          
          {/* A. Dòng Tiêu Đề & Nút Thêm Mới */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">My Projects</h1>
              <p className="text-on-surface-variant text-sm mt-1">
                Manage your academic IT projects and track progress.
              </p>
            </div>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-on-primary-fixed-variant transition-all shadow-md shadow-primary/10 shrink-0"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Create Project</span>
            </button>
          </div>

          {/* B. Dòng Bộ Lọc (Tabs) & Sắp Xếp */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-3">
            
            {/* Tab lọc */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeTab === 'all'
                    ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                }`}
              >
                All Projects ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeTab === 'active'
                    ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  activeTab === 'completed'
                    ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* Dropdown Sắp xếp */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-outline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:bg-surface-container transition-colors"
              >
                <option value="recent">Recent</option>
                <option value="name">Name A-Z</option>
                <option value="progress">Progress</option>
              </select>
            </div>

          </div>

          {/* C. Grid Danh Sách Dự Án */}
          {filteredProjects.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">folder_open</span>
              <h3 className="font-bold text-base text-on-surface">Không tìm thấy dự án nào</h3>
              <p className="text-xs text-on-surface-variant mt-1">Hãy thử nhập từ khóa tìm kiếm khác hoặc tạo dự án mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group"
                >
                  
                  {/* Banner Đầu: AI Insight */}
                  <div className="bg-primary/5 border-b border-outline-variant/30 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-primary">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm font-bold">neurology</span>
                      <span className="tracking-wider uppercase text-[10px]">AI INSIGHT</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      project.aiInsight === 'On Track' ? 'bg-green-100 text-green-700' :
                      project.aiInsight === 'At Risk' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {project.aiInsight}
                    </span>
                  </div>

                  {/* Body Thẻ Dự Án */}
                  <div className="p-5 flex-1 flex flex-col">
                    
                    {/* Nhãn chuyên ngành & Nhãn trạng thái */}
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/5 text-primary text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase">
                        {project.major}
                      </span>
                      <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase ${
                        project.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-blue-500/10 text-blue-600'
                      }`}>
                        {project.status}
                      </span>
                    </div>

                    {/* Tên Dự Án */}
                    <h2
                      onClick={() => selectProject(project)}
                      className="text-lg font-bold text-on-surface leading-snug mt-3 mb-1 line-clamp-2 hover:text-primary transition-colors cursor-pointer"
                    >
                      {project.title}
                    </h2>

                    {/* Thông tin Kỳ học & Vai trò */}
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-2 font-medium">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      <span>{project.semester}</span>
                      <span className="text-outline-variant">•</span>
                      <span className="material-symbols-outlined text-sm">person</span>
                      <span>{project.role}</span>
                    </div>

                    {/* Hộp Số Liệu KPI */}
                    <div className="grid grid-cols-2 gap-3.5 my-4.5">
                      
                      {/* KPI 1: Yêu cầu rủi ro (At Risk Req) */}
                      <div className="bg-red-500/[0.04] border border-red-500/10 rounded-xl p-3 flex flex-col justify-between min-h-[76px]">
                        <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-red-500 uppercase tracking-wider">
                          <span className="material-symbols-outlined text-xs font-bold">warning</span>
                          <span>At Risk Req</span>
                        </div>
                        <span className="text-2xl font-black text-red-600 mt-1 leading-none">
                          {project.atRiskReqCount}
                        </span>
                      </div>

                      {/* KPI 2: Hạn chót (Deadline) */}
                      <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-3 flex flex-col justify-between min-h-[76px]">
                        <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-on-surface-variant uppercase tracking-wider">
                          <span className="material-symbols-outlined text-xs">event</span>
                          <span>Deadline</span>
                        </div>
                        <span className="text-xs font-extrabold text-on-surface mt-1 leading-tight">
                          {project.deadline}
                        </span>
                      </div>

                    </div>

                    {/* Thanh Tiến Độ */}
                    <div className="mt-auto">
                      <div className="flex justify-between items-center text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>

                  {/* Chân Thẻ: Avatar & Nút Vào Dự Án */}
                  <div className="border-t border-outline-variant/40 px-5 py-3.5 flex items-center justify-between bg-surface-container-low/20">
                    
                    {/* Avatars chồng nhau */}
                    <div className="flex items-center -space-x-2.5 overflow-hidden">
                      {project.members.slice(0, 3).map((member, idx) => (
                        <div
                          key={idx}
                          title={member.name}
                          className={`w-7 h-7 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-[9px] font-extrabold shadow-sm ${member.bg} shrink-0 cursor-pointer hover:z-10 hover:scale-110 transition-all`}
                        >
                          {member.initials}
                        </div>
                      ))}
                      {project.members.length > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[9px] font-bold shadow-sm shrink-0">
                          +{project.members.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Nút Open Project */}
                    <button
                      onClick={() => selectProject(project)}
                      className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>Open Project</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>

                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    )
  }

  // ==========================================
  // CHẾ ĐỘ 2: GIAO DIỆN TỔNG QUAN DỰ ÁN CHI TIẾT (PROJECT WORKSPACE OVERVIEW)
  // ==========================================
  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] rounded-full bg-tertiary-fixed opacity-[0.08] blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Banner Dự án đầu trang */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="bg-white/10 text-white text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase">
              {activeProject.major} • {activeProject.semester}
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{activeProject.title}</h1>
            <p className="text-white/80 text-sm font-medium">
              Chào mừng bạn trở lại dự án với vai trò: <strong className="text-white font-black">{activeProject.role}</strong>
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/10 text-center shrink-0">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-85">Tiến độ Sprint</div>
            <div className="text-3xl font-black mt-1">{activeProject.progress}%</div>
          </div>
        </div>

        {/* Các Chỉ Số KPI Nghiệp Vụ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Requirements */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-outline">
              <span className="text-xs font-bold uppercase tracking-wider">Yêu Cầu & Use Case</span>
              <span className="material-symbols-outlined text-primary text-2xl">description</span>
            </div>
            <p className="text-3xl font-black mt-3 text-on-surface">24</p>
            <p className="text-[11px] text-green-600 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">check_circle</span>
              92% đã liên kết và đặc tả
            </p>
          </div>

          {/* Card 2: Open Bugs */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-outline">
              <span className="text-xs font-bold uppercase tracking-wider">Bugs & Phát sinh</span>
              <span className="material-symbols-outlined text-error text-2xl">bug_report</span>
            </div>
            <p className="text-3xl font-black mt-3 text-on-surface">{activeProject.atRiskReqCount * 2 + 1}</p>
            <p className="text-[11px] text-red-500 font-semibold mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">warning</span>
              Có {activeProject.atRiskReqCount} yêu cầu có nguy cơ trễ hạn
            </p>
          </div>

          {/* Card 3: RTM Matrix Coverage */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-outline">
              <span className="text-xs font-bold uppercase tracking-wider">Phủ Traceability (RTM)</span>
              <span className="material-symbols-outlined text-secondary text-2xl">grid_on</span>
            </div>
            <p className="text-3xl font-black mt-3 text-on-surface">95.8%</p>
            <p className="text-[11px] text-on-surface-variant font-semibold mt-2">
              Đạt tiêu chuẩn tự động hóa
            </p>
          </div>

          {/* Card 4: Sprint Time */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-outline">
              <span className="text-xs font-bold uppercase tracking-wider">Hạn Chót Cuối Cùng</span>
              <span className="material-symbols-outlined text-amber-600 text-2xl">alarm</span>
            </div>
            <p className="text-base font-black mt-4 text-amber-700 leading-tight">{activeProject.deadline}</p>
            <p className="text-[11px] text-on-surface-variant font-semibold mt-1">
              Còn lại khoảng 2 tuần
            </p>
          </div>

        </section>

        {/* Panel Đề Xuất Trí Tuệ Nhân Tạo (AI INSIGHTS) */}
        <section className="bg-primary/[0.03] border border-primary/10 rounded-2xl p-6 shadow-inner flex flex-col md:flex-row gap-5 items-start">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-2xl">neurology</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-base text-primary">Đề xuất thông minh từ AI (DevTrack AI Insights)</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Hệ thống phát hiện dự án **{activeProject.title}** hiện đang có **{activeProject.atRiskReqCount}** yêu cầu nghiệp vụ ở mức độ rủi ro chậm trễ cao do thiếu các bằng chứng kiểm thử (Evidence). 
              Chúng tôi khuyên bạn nên truy cập mô-đun **Requirements** và **Traceability Matrix (RTM)** ở thanh Sidebar bên trái để cập nhật tài liệu kiểm thử, kéo giảm rủi ro về mức an toàn.
            </p>
          </div>
        </section>

        {/* Hoạt Động & Thành Viên Dự Án */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cột 1 & 2: Danh sách hoạt động gần đây */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-on-surface">Nhật ký Hoạt động Gần đây</h3>
            <div className="space-y-3.5">
              <div className="flex gap-4 p-3 rounded-lg hover:bg-surface-container-low/40 transition-colors">
                <span className="material-symbols-outlined text-green-600 bg-green-500/10 p-2 rounded-lg self-start text-sm">check_circle</span>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Đã cập nhật ma trận RTM thành công</h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Anh Dung đã liên kết 3 yêu cầu nghiệp vụ với các ca kiểm thử tương ứng.</p>
                  <span className="text-[10px] text-outline mt-1 inline-block">10 phút trước</span>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-lg hover:bg-surface-container-low/40 transition-colors">
                <span className="material-symbols-outlined text-red-500 bg-red-500/10 p-2 rounded-lg self-start text-sm">warning</span>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Phát hiện Ca kiểm thử thất bại (Failed Test)</h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Hệ thống AI Audit đã đánh dấu cảnh báo "At Risk" tại Requirement #REQ-04.</p>
                  <span className="text-[10px] text-outline mt-1 inline-block">1 giờ trước</span>
                </div>
              </div>
              <div className="flex gap-4 p-3 rounded-lg hover:bg-surface-container-low/40 transition-colors">
                <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg self-start text-sm">description</span>
                <div>
                  <h4 className="font-bold text-xs text-on-surface">Thêm tài liệu mô tả Use Case mới</h4>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">Tuan Hung đã tải lên đặc tả chi tiết cho tính năng "Quản lý Đăng nhập & Đăng ký".</p>
                  <span className="text-[10px] text-outline mt-1 inline-block">Hôm qua</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột 3: Quản lý thành viên nhóm */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-on-surface">Thành viên Nhóm ({activeProject.members.length})</h3>
            <div className="space-y-3">
              {activeProject.members.map((member, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.bg}`}>
                      {member.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-on-surface">{member.name}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Active</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-semibold">
                    {idx === 0 ? 'Leader' : 'Developer'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </section>

      </div>
    </main>
  )
}

export default DashboardPage
