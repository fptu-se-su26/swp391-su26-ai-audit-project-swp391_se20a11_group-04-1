import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import axiosInstance from '@/api/axiosConfig'
import ProjectClosureModal from '../components/ProjectClosureModal'

/**
 * DashboardPage - Trang tổng quan không gian làm việc dự án DevTrackAI
 * Hỗ trợ 2 chế độ hiển thị:
 * 1. Chế độ Portfolio (activeProject === null): Liệt kê và quản lý danh sách dự án
 * 2. Chế độ Project Overview (activeProject !== null): Hiển thị chi tiết tổng quan của dự án đang chạy
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const passwordSet = useAuthStore((state) => state.passwordSet)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  // Trạng thái modal đóng project
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false)
  const [reopening, setReopening] = useState(false)

  // Trạng thái modal và form tạo dự án mới
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    major: '',
    type: 'WEB_APP',
    startDate: '',
    deadline: '',
    description: ''
  })

  // Trạng thái cấu hình GitHub
  const [hasToken, setHasToken] = useState(false)
  const [userRepos, setUserRepos] = useState([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [githubStatusLoading, setGithubStatusLoading] = useState(false)
  
  // Repo được chọn
  const [selectedRepo, setSelectedRepo] = useState(null) // { owner, name }
  const [searchRepo, setSearchRepo] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Cấu hình khi tạo repo mới
  const [enableGithub, setEnableGithub] = useState(false)
  const [isNewRepo, setIsNewRepo] = useState(false)
  const [newRepoData, setNewRepoData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    autoInit: true,
    gitignoreTemplate: 'None',
    licenseTemplate: 'None'
  })
  const [creatingRepo, setCreatingRepo] = useState(false)

  // Đọc dữ liệu và hàm từ Zustand store
  const {
    projects,
    activeProject,
    selectProject,
    clearActiveProject,
    activeTab,
    setActiveTab,
    searchQuery,
    sortBy,
    setSortBy,
    loading,
    error,
    fetchProjects,
    createProject,
    loadMore,
    visibleCount,
    totalItems,
    hasMorePages,
  } = useProjectStore()

  const openProject = (project) => {
    selectProject(project)
    navigate(`/projects/${project.id}/dashboard`)
  }

  const handleReopen = async (projectId) => {
    const reason = window.prompt('Nhập lý do mở lại project (tối thiểu 10 ký tự):')
    if (!reason || reason.trim().length < 10) {
      toast.error('Lý do phải ít nhất 10 ký tự.')
      return
    }
    setReopening(true)
    try {
      await axiosInstance.post(`/v1/projects/${projectId}/reopen`, { reason: reason.trim() })
      toast.success('Project đã được mở lại!')
      fetchProjects()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Mở lại project thất bại.')
    } finally {
      setReopening(false)
    }
  }

  // Lấy trạng thái OAuth và Repo
  const checkGithubStatus = async () => {
    setGithubStatusLoading(true)
    try {
      const res = await axiosInstance.get('/v1/github/status')
      const tokenExists = res.data?.data?.hasToken || false
      setHasToken(tokenExists)
      if (tokenExists) {
        fetchUserRepos()
      }
    } catch (err) {
      console.error('Failed to check GitHub OAuth status:', err)
    } finally {
      setGithubStatusLoading(false)
    }
  }

  const fetchUserRepos = async () => {
    setLoadingRepos(true)
    try {
      const res = await axiosInstance.get('/v1/github/repos')
      setUserRepos(res.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch repositories:', err)
    } finally {
      setLoadingRepos(false)
    }
  }

  // Kết nối OAuth GitHub
  const handleConnectGitHub = async () => {
    try {
      const stateToSave = {
        formData,
        selectedRepo,
        enableGithub,
        isNewRepo,
        newRepoData
      }
      sessionStorage.setItem('pendingProjectForm', JSON.stringify(stateToSave))
      
      const res = await axiosInstance.get('/v1/github/auth-url')
      const state = btoa(JSON.stringify({ isCreateProjectFlow: true }))
      window.location.href = res.data.data + "&state=" + state
    } catch (err) {
      console.error("OAuth Init Error:", err)
      toast.error('Kết nối GitHub thất bại: ' + (err.response?.data?.message || err.message))
    }
  }

  // Tạo Repo mới trên GitHub
  const handleCreateGithubRepo = async () => {
    if (!newRepoData.name.trim()) {
      toast.error('Tên kho lưu trữ GitHub không được để trống!')
      return null
    }
    setCreatingRepo(true)
    try {
      const res = await axiosInstance.post('/v1/github/repos', {
        name: newRepoData.name.trim(),
        description: newRepoData.description.trim(),
        isPrivate: newRepoData.isPrivate,
        autoInit: newRepoData.autoInit,
        gitignoreTemplate: newRepoData.gitignoreTemplate,
        licenseTemplate: newRepoData.licenseTemplate
      })
      return res.data?.data // trả về repo object
    } catch (err) {
      console.error('Failed to create GitHub repository:', err)
      toast.error('Tạo kho lưu trữ trên GitHub thất bại: ' + (err.response?.data?.message || err.message))
      return null
    } finally {
      setCreatingRepo(false)
    }
  }

  // Fetch khi chưa có dữ liệu
  useEffect(() => {
    fetchMe()
    if (projects.length === 0) {
      fetchProjects()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Khôi phục trạng thái form sau khi OAuth redirect
  useEffect(() => {
    const savedForm = sessionStorage.getItem('pendingProjectForm')
    const hasOAuthState = location.state?.openCreateProject
    
    if (savedForm) {
      try {
        const parsed = JSON.parse(savedForm)
        if (parsed.formData) setFormData(parsed.formData)
        if (parsed.selectedRepo) {
          setSelectedRepo(parsed.selectedRepo)
          setSearchRepo(`${parsed.selectedRepo.owner}/${parsed.selectedRepo.name}`)
        }
        if (parsed.enableGithub !== undefined) setEnableGithub(parsed.enableGithub)
        if (parsed.isNewRepo !== undefined) setIsNewRepo(parsed.isNewRepo)
        if (parsed.newRepoData) setNewRepoData(parsed.newRepoData)
        
        setIsModalOpen(true)
        checkGithubStatus()
      } catch (e) {
        console.error("Failed to restore form state", e)
      } finally {
        sessionStorage.removeItem('pendingProjectForm')
      }
    } else if (hasOAuthState) {
      setIsModalOpen(true)
      checkGithubStatus()
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const isGlobalDashboard = location.pathname === '/dashboard'

  useEffect(() => {
    if (isGlobalDashboard && activeProject) {
      clearActiveProject()
    }
  }, [location.pathname, activeProject, clearActiveProject, isGlobalDashboard])

  // Check for createProjectForClassroom URL param to automatically open modal
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const classroomId = searchParams.get('createProjectForClassroom')
    const isMentor = searchParams.get('isMentor') === 'true'
    const semesterParam = searchParams.get('semester')
    const subjectParam = searchParams.get('subject')

    const hideToast = searchParams.get('hideToast') === 'true'

    if (classroomId) {
      if (!isMentor && !hideToast) {
        toast.success('Đã xác nhận tham gia lớp học! Vui lòng tạo dự án cho nhóm của bạn.')
      }

      let startDate = ''
      let deadline = ''
      if (semesterParam) {
        const currentYear = new Date().getFullYear()
        if (semesterParam.includes('SPRING') || semesterParam.startsWith('SP')) {
          startDate = `${currentYear}-01-01`
          deadline = `${currentYear}-04-30`
        } else if (semesterParam.includes('SUMMER') || semesterParam.startsWith('SU')) {
          startDate = `${currentYear}-05-01`
          deadline = `${currentYear}-08-31`
        } else if (semesterParam.includes('FALL') || semesterParam.startsWith('FA')) {
          startDate = `${currentYear}-09-01`
          deadline = `${currentYear}-12-31`
        }
      }

      setFormData(prev => ({ 
        ...prev, 
        classroomId: parseInt(classroomId, 10),
        major: subjectParam || prev.major,
        startDate: startDate || prev.startDate,
        deadline: deadline || prev.deadline
      }))
      setIsModalOpen(true)
      checkGithubStatus()
    }
  }, [location.search])

  // Xử lý mở modal tạo dự án mới
  const handleCreateProject = () => {
    setIsModalOpen(true)
    checkGithubStatus()
  }

  // Xử lý gửi form tạo dự án mới
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Tên dự án không được để trống!')
      return
    }
    if (!formData.major.trim()) {
      toast.error('Chuyên ngành không được để trống!')
      return
    }
    if (!formData.startDate) {
      toast.error('Ngày bắt đầu không được để trống!')
      return
    }
    if (!formData.deadline) {
      toast.error('Hạn chót dự án không được để trống!')
      return
    }
    const start = new Date(formData.startDate)
    const deadline = new Date(formData.deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (deadline < start) {
      toast.error('Hạn chót không được trước ngày bắt đầu!')
      return
    }

    // Kiểm tra cấu hình GitHub cho dự án code
    const isCodeProj = ['WEB_APP', 'MOBILE', 'DATABASE'].includes(formData.type)
    const shouldLinkGithub = isCodeProj || enableGithub

    let repoOwner = null
    let repoName = null

    if (shouldLinkGithub) {
      if (!hasToken) {
        toast.error('Vui lòng kết nối tài khoản GitHub để tiếp tục!')
        return
      }

      if (isNewRepo) {
        // Tạo repo mới trực tiếp trên GitHub
        const createdRepo = await handleCreateGithubRepo()
        if (!createdRepo) return // Dừng nếu tạo repo thất bại
        
        // Tên repo đầy đủ: "owner/name"
        const fullName = createdRepo.full_name || ''
        const parts = fullName.split('/')
        repoOwner = parts[0]
        repoName = parts[1]
      } else {
        // Lấy repo đã chọn sẵn
        if (!selectedRepo) {
          toast.error('Vui lòng chọn một kho lưu trữ GitHub!')
          return
        }
        repoOwner = selectedRepo.owner
        repoName = selectedRepo.name
      }
    }

    const payload = {
      ...formData,
      repoOwner,
      repoName
    }

    const success = await createProject(payload)
    if (success) {
      toast.success('Tạo dự án mới thành công!')
      setIsModalOpen(false)
      setFormData({
        name: '',
        major: '',
        type: 'WEB_APP',
        startDate: '',
        deadline: '',
        description: ''
      })
      // Clear URL param if exists
      const searchParams = new URLSearchParams(location.search)
      if (searchParams.has('createProjectForClassroom')) {
        searchParams.delete('createProjectForClassroom')
        navigate({ search: searchParams.toString() }, { replace: true })
      }

      // Reset GitHub integration state
      setSelectedRepo(null)
      setSearchRepo('')
      setEnableGithub(false)
      setIsNewRepo(false)
      setNewRepoData({
        name: '',
        description: '',
        isPrivate: false,
        autoInit: true,
        gitignoreTemplate: 'None',
        licenseTemplate: 'None'
      })
    } else {
      toast.error(error || 'Tạo dự án thất bại, vui lòng thử lại!')
    }
  }

  // --- SMART SORT: ưu tiên deadline gần hôm nay nhất ---
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const filteredProjects = projects
    // 1. Lọc theo Tab (bổ sung client-side nếu đã lọc server-side)
    .filter((project) => {
      if (activeTab === 'active') return project.status === 'ACTIVE'
      if (activeTab === 'completed') return project.status === 'COMPLETED'
      return true
    })
    // 2. Lọc theo tìm kiếm (client-side)
    .filter((project) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        project.title.toLowerCase().includes(q) ||
        project.major.toLowerCase().includes(q) ||
        project.role.toLowerCase().includes(q)
      )
    })
    // 3. Smart Sort theo deadline priority
    .sort((a, b) => {
      // Nếu user chọn sort khác (name, progress) thì dùng sort đó
      if (sortBy === 'name') return a.title.localeCompare(b.title)
      if (sortBy === 'progress') return b.progress - a.progress

      // sortBy === 'recent' → Smart deadline sort
      const aDeadline = new Date(a.deadline)
      const bDeadline = new Date(b.deadline)
      const aCompleted = a.status === 'COMPLETED' || a.status === 'ARCHIVED'
      const bCompleted = b.status === 'COMPLETED' || b.status === 'ARCHIVED'
      const aOverdue = !aCompleted && aDeadline < today
      const bOverdue = !bCompleted && bDeadline < today

      // Completed/Archived → cuối danh sách
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1
      // Non-overdue → trước overdue
      if (aOverdue !== bOverdue) return aOverdue ? 1 : -1
      // Cả 2 đều overdue → gần hôm nay nhất lên trước (DESC deadline)
      if (aOverdue && bOverdue) return bDeadline - aDeadline
      // Cả 2 đều non-overdue → deadline gần nhất lên trước (ASC deadline)
      return aDeadline - bDeadline
    })

  // Danh sách visible (slice theo visibleCount)
  const visibleProjects = filteredProjects.slice(0, visibleCount)

  // Có thể hiện thêm không? (trong bộ nhớ hoặc backend)
  const canShowMore = visibleCount < filteredProjects.length || (filteredProjects.length >= projects.length && projects.length < totalItems && hasMorePages)
  // Số dự án sẽ hiển thị khi bấm nút
  const nextBatchCount = Math.min(3, filteredProjects.length - visibleCount > 0
    ? filteredProjects.length - visibleCount
    : totalItems - visibleCount)

  // Số lượng dự án để hiển thị lên nhãn Tab
  const totalCount = totalItems || projects.length
  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length

  // ==========================================
  // CHẾ ĐỘ 1: GIAO DIỆN DANH MỤC DỰ ÁN PORTFOLIO (HÌNH MẪU)
  // ==========================================
  if (isGlobalDashboard) {
    if (loading && projects.length === 0) {
      return (
        <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
          <div className="relative z-10 w-full space-y-8">
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
              className="bg-[#1E707D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#165964] transition-all shadow-md mt-2"
            >
              Thử lại
            </button>
          </div>
        </main>
      )
    }
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">

        {/* Warning Banner for GitHub temporary password */}
        {!passwordSet && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-300 flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300 relative z-20">
            <span className="material-symbols-outlined text-2xl text-amber-600 shrink-0">
              warning
            </span>
            <div className="flex-1 text-sm leading-relaxed text-left">
              <h4 className="font-bold text-amber-950 dark:text-amber-200">Bảo mật tài khoản của bạn</h4>
              <p className="mt-1">
                Tài khoản của bạn hiện chưa được thiết lập mật khẩu thường (đang đăng nhập qua GitHub). 
                Để đảm bảo an toàn bảo mật và có thể đăng nhập bằng mật khẩu thường, vui lòng click{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/profile`)}
                  className="font-bold underline text-amber-700 hover:text-amber-850 focus:outline-none cursor-pointer"
                >
                  Đổi mật khẩu
                </button>{' '}
                trong trang Cá nhân để thiết lập mật khẩu mới ngay.
              </p>
            </div>
          </div>
        )}

        {/* Glow Background nhẹ nhàng sang trọng */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#D7EEF1] opacity-[0.12] blur-[90px]"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.15] blur-[100px]"></div>
        </div>

        <div className="relative z-10 w-full space-y-8">

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
              className="flex items-center gap-2 bg-[#1E707D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#165964] transition-all shadow-md shadow-[#1E707D]/10 shrink-0"
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'all'
                  ? 'bg-[#D7EEF1] text-white border-primary-container shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                  }`}
              >
                All Projects ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'active'
                  ? 'bg-[#D7EEF1] text-white border-primary-container shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                  }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'completed'
                  ? 'bg-[#D7EEF1] text-white border-primary-container shadow-sm'
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
                className="bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-semibold text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-[#1E707D] cursor-pointer hover:bg-surface-container transition-colors"
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
              {visibleProjects.map((project) => {
                const isOverdue = new Date(project.deadline) < new Date().setHours(0, 0, 0, 0) && project.status !== 'COMPLETED';
                return (
                  <div
                    key={project.id}
                    className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group"
                  >

                  {/* Banner Đầu: AI Insight */}
                  <div className="bg-[#1E707D]/5 border-b border-outline-variant/30 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-[#1E707D]">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm font-bold">neurology</span>
                      <span className="tracking-wider uppercase text-[10px]">AI INSIGHT</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${project.aiInsight === 'On Track' ? 'bg-green-100 text-green-700' :
                      project.aiInsight === 'At Risk' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-[#1E707D]'
                      }`}>
                      {project.aiInsight}
                    </span>
                  </div>

                  {/* Body Thẻ Dự Án */}
                  <div className="p-5 flex-1 flex flex-col">

                    {/* Nhãn chuyên ngành & Nhãn trạng thái */}
                    <div className="flex items-center gap-2">
                      <span className="bg-[#1E707D]/5 text-[#1E707D] text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase">
                        {project.major}
                      </span>
                      <span className={`text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded uppercase ${project.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-[#1E707D]/10 text-[#1E707D]'
                        }`}>
                        {project.status}
                      </span>
                    </div>

                    {/* Tên Dự Án */}
                    <h2
                      onClick={() => openProject(project)}
                      className="text-lg font-bold text-on-surface leading-snug mt-3 mb-1 line-clamp-2 hover:text-[#1E707D] transition-colors cursor-pointer"
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
                      <div className={`rounded-xl p-3 flex flex-col justify-between min-h-[76px] ${
                        isOverdue 
                          ? 'bg-red-500/[0.04] border border-red-500/20' 
                          : 'bg-surface-container-low border border-outline-variant/40'
                      }`}>
                        <div className={`flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider ${
                          isOverdue ? 'text-red-500' : 'text-on-surface-variant'
                        }`}>
                          <span className="material-symbols-outlined text-xs">{isOverdue ? 'error' : 'event'}</span>
                          <span>{isOverdue ? 'Overdue' : 'Deadline'}</span>
                        </div>
                        <span className={`text-xs font-extrabold mt-1 leading-tight ${
                          isOverdue ? 'text-red-600' : 'text-on-surface'
                        }`}>
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
                          className="h-full rounded-full bg-[#1E707D] transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>

                  {/* Chân Thẻ: Avatar & Nút Vào Dự Án */}
                  <div className="border-t border-outline-variant/40 px-5 py-3.5 flex items-center justify-between bg-surface-container-low/20">

                    {/* Avatars chồng nhau */}
                    <div className="flex items-center -space-x-2.5 overflow-hidden">
                      {(project.members || []).slice(0, 3).map((member, idx) => (
                        <div
                          key={idx}
                          title={member.name}
                          className={`w-7 h-7 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-[9px] font-extrabold shadow-sm ${member.bg} shrink-0 cursor-pointer hover:z-10 hover:scale-110 transition-all`}
                        >
                          {member.initials}
                        </div>
                      ))}
                      {(project.members?.length || 0) > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[9px] font-bold shadow-sm shrink-0">
                          +{(project.members?.length || 0) - 3}
                        </div>
                      )}
                    </div>

                    {/* Nút Open Project */}
                    <button
                      onClick={() => openProject(project)}
                      className="bg-[#1E707D] text-white hover:bg-[#165964] px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>Open Project</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>

                  </div>

                </div>
              );
              })}
            </div>
          )}

          {/* D. Load More + Progress Info */}
          {filteredProjects.length > 0 && (
            <div className="flex flex-col items-center gap-3 pt-2 pb-4">
              {/* Counter */}
              <p className="text-xs text-on-surface-variant">
                Đang hiển thị <span className="font-bold text-on-surface">{Math.min(visibleCount, filteredProjects.length)}</span>
                {' '}trên <span className="font-bold text-on-surface">{totalCount}</span> dự án
              </p>

              {/* Load More Button */}
              {canShowMore ? (
                <button
                  id="btn-load-more-projects"
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface-variant text-sm font-bold hover:bg-surface-container hover:text-on-surface hover:border-[#1E707D]/40 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 text-[#1E707D]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Đang tải...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">expand_more</span>
                      <span>Xem thêm ({nextBatchCount > 0 ? nextBatchCount : 3} dự án nữa)</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/40">
                  <span className="material-symbols-outlined text-sm text-[#1E707D]">check_circle</span>
                  <span>Đã hiển thị hết tất cả dự án của bạn 🎉</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Tạo Dự Án Mới */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030213]/60 backdrop-blur-sm animate-fadeIn">
            <div className="create-project-modal w-full max-w-lg bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp">
              
              {/* Header Modal */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/35">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1E707D] text-xl font-bold">add_box</span>
                  <h3 className="font-extrabold text-base text-on-surface">Create New Project</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                
                {/* Tên dự án */}
                <div className="space-y-1.5">
                  <label htmlFor="projName" className="block text-xs font-bold uppercase tracking-wider text-outline">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="projName"
                    type="text"
                    required
                    placeholder="E.g., DevTrack Management System"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chuyên ngành */}
                  <div className="space-y-1.5">
                    <label htmlFor="projMajor" className="block text-xs font-bold uppercase tracking-wider text-outline">
                      Major / Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="projMajor"
                      type="text"
                      required
                      placeholder="E.g., Software Engineering"
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      disabled={!!formData.classroomId}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all ${
                        formData.classroomId 
                          ? 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant cursor-not-allowed opacity-70' 
                          : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D]'
                      }`}
                    />
                  </div>

                  {/* Loại dự án */}
                  <div className="space-y-1.5">
                    <label htmlFor="projType" className="block text-xs font-bold uppercase tracking-wider text-outline">
                      Project Type
                    </label>
                    <select
                      id="projType"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface-variant focus:outline-none focus:border-[#1E707D] cursor-pointer hover:bg-surface-container transition-colors"
                    >
                      <option value="WEB_APP">Web Application</option>
                      <option value="MOBILE">Mobile Application</option>
                      <option value="DATABASE">Database Systems</option>
                      <option value="RESEARCH">Research Project</option>
                      <option value="OTHER">Other Type</option>
                    </select>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="projStartDate" className="block text-xs font-bold uppercase tracking-wider text-outline">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="projStartDate"
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      disabled={!!formData.classroomId}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all ${
                        formData.classroomId 
                          ? 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant cursor-not-allowed opacity-70' 
                          : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface-variant focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D]'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="projDeadline" className="block text-xs font-bold uppercase tracking-wider text-outline">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="projDeadline"
                      type="date"
                      required
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      disabled={!!formData.classroomId}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm transition-all ${
                        formData.classroomId 
                          ? 'bg-surface-container-high border-outline-variant/40 text-on-surface-variant cursor-not-allowed opacity-70' 
                          : 'bg-surface-container-lowest border-outline-variant/60 text-on-surface-variant focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D]'
                      }`}
                    />
                  </div>
                </div>

                {/* Mô tả */}
                <div className="space-y-1.5">
                  <label htmlFor="projDesc" className="block text-xs font-bold uppercase tracking-wider text-outline">
                    Project Description
                  </label>
                  <textarea
                    id="projDesc"
                    rows="4"
                    placeholder="Provide a high-level overview of your project, target audience, and core features..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all resize-none"
                  ></textarea>
                </div>

                {/* GitHub Integration */}
                <div className="pt-4 border-t border-outline-variant/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#1E707D] text-[20px]">webhook</span>
                      GitHub Repository Integration
                    </h4>
                    {!['WEB_APP', 'MOBILE', 'DATABASE'].includes(formData.type) && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enableGithub}
                          onChange={(e) => setEnableGithub(e.target.checked)}
                          className="rounded border-outline text-[#1E707D] focus:ring-[#1E707D] w-4 h-4"
                        />
                        <span className="text-xs font-semibold text-on-surface-variant">Enable GitHub</span>
                      </label>
                    )}
                  </div>

                  {(['WEB_APP', 'MOBILE', 'DATABASE'].includes(formData.type) || enableGithub) && (
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 space-y-4">
                      {githubStatusLoading ? (
                        <div className="text-center py-4 text-xs text-on-surface-variant italic">
                          Checking GitHub Connection...
                        </div>
                      ) : !hasToken ? (
                        <div className="text-center py-3 space-y-3">
                          <p className="text-xs text-on-surface-variant">
                            Bạn cần liên kết tài khoản GitHub của mình trước khi kết nối repository.
                          </p>
                          <button
                            type="button"
                            onClick={handleConnectGitHub}
                            className="px-4 py-2 bg-secondary text-on-secondary text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 mx-auto"
                          >
                            <span className="material-symbols-outlined text-[16px]">link</span>
                            Connect to GitHub
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Tabs: Select Existing vs Create New */}
                          <div className="flex bg-surface-container-high p-1 rounded-xl">
                            <button
                              type="button"
                              onClick={() => setIsNewRepo(false)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                !isNewRepo ? 'bg-surface text-[#1E707D] shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              Choose Repository
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsNewRepo(true)}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                isNewRepo ? 'bg-surface text-[#1E707D] shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                              }`}
                            >
                              Create New Repo
                            </button>
                          </div>

                          {!isNewRepo ? (
                            /* Select Existing */
                            <div className="space-y-2 relative">
                              <label className="block text-[11px] font-bold text-outline uppercase tracking-wider">
                                Select Repository
                              </label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    placeholder="Search your repos..."
                                    value={searchRepo}
                                    onChange={(e) => {
                                      setSearchRepo(e.target.value)
                                      setIsDropdownOpen(true)
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3 py-2 text-sm text-on-surface"
                                  />
                                  {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-surface-container-lowest border border-outline rounded-xl shadow-lg z-30 divide-y divide-outline-variant">
                                      {loadingRepos ? (
                                        <div className="p-3 text-xs text-on-surface-variant italic">Loading repos...</div>
                                      ) : userRepos.filter(r => r.full_name?.toLowerCase().includes(searchRepo.toLowerCase())).length > 0 ? (
                                        userRepos
                                          .filter(r => r.full_name?.toLowerCase().includes(searchRepo.toLowerCase()))
                                          .map(r => (
                                            <button
                                              key={r.id}
                                              type="button"
                                              onClick={() => {
                                                setSelectedRepo({ owner: r.owner.login, name: r.name })
                                                setSearchRepo(r.full_name)
                                                setIsDropdownOpen(false)
                                              }}
                                              className="w-full text-left p-2.5 hover:bg-surface-container-low text-xs text-on-surface truncate font-medium block"
                                            >
                                              {r.full_name}
                                            </button>
                                          ))
                                      ) : (
                                        <div className="p-3 text-xs text-on-surface-variant italic">No repos found</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {searchRepo && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedRepo(null)
                                      setSearchRepo('')
                                    }}
                                    className="px-2.5 bg-surface border border-outline rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            /* Create New Repo */
                            <div className="space-y-3 text-left">
                              {/* Repo Name */}
                              <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-outline uppercase tracking-wider">
                                  Repo Name
                                </label>
                                <input
                                  type="text"
                                  placeholder="my-awesome-repo"
                                  value={newRepoData.name}
                                  onChange={(e) => setNewRepoData({ ...newRepoData, name: e.target.value })}
                                  className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3 py-2 text-sm text-on-surface"
                                />
                              </div>

                              {/* Repo Description */}
                              <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-outline uppercase tracking-wider">
                                  Repo Description (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Short summary of repository..."
                                  value={newRepoData.description}
                                  onChange={(e) => setNewRepoData({ ...newRepoData, description: e.target.value })}
                                  className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3 py-2 text-sm text-on-surface"
                                />
                              </div>

                              {/* Private checkbox & README checkbox */}
                              <div className="flex gap-4 pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-on-surface-variant">
                                  <input
                                    type="checkbox"
                                    checked={newRepoData.isPrivate}
                                    onChange={(e) => setNewRepoData({ ...newRepoData, isPrivate: e.target.checked })}
                                    className="rounded border-outline text-[#1E707D] focus:ring-[#1E707D] w-4 h-4"
                                  />
                                  <span>Private Repository</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-on-surface-variant">
                                  <input
                                    type="checkbox"
                                    checked={newRepoData.autoInit}
                                    onChange={(e) => setNewRepoData({ ...newRepoData, autoInit: e.target.checked })}
                                    className="rounded border-outline text-[#1E707D] focus:ring-[#1E707D] w-4 h-4"
                                  />
                                  <span>Add README.md</span>
                                </label>
                              </div>

                              {/* Gitignore & License grid */}
                              <div className="grid grid-cols-2 gap-3 pt-1">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider">
                                    Add .gitignore
                                  </label>
                                  <select
                                    value={newRepoData.gitignoreTemplate}
                                    onChange={(e) => setNewRepoData({ ...newRepoData, gitignoreTemplate: e.target.value })}
                                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-2 py-1.5 text-xs text-on-surface focus:outline-none"
                                  >
                                    {['None', 'Node', 'Java', 'Maven', 'Python', 'Go', 'Rust', 'C++'].map(t => (
                                      <option key={t} value={t}>{t === 'None' ? 'None (.gitignore)' : t}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider">
                                    Add License
                                  </label>
                                  <select
                                    value={newRepoData.licenseTemplate}
                                    onChange={(e) => setNewRepoData({ ...newRepoData, licenseTemplate: e.target.value })}
                                    className="w-full bg-surface-container-lowest border border-outline rounded-xl px-2 py-1.5 text-xs text-on-surface focus:outline-none"
                                  >
                                    {[
                                      { value: 'None', label: 'None (License)' },
                                      { value: 'mit', label: 'MIT License' },
                                      { value: 'apache-2.0', label: 'Apache 2.0' },
                                      { value: 'gpl-3.0', label: 'GPLv3' },
                                      { value: 'unlicense', label: 'Unlicense' }
                                    ].map(l => (
                                      <option key={l.value} value={l.value}>{l.label}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Modal Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40 mt-6 bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#1E707D] text-white hover:bg-[#165964] text-xs font-bold transition-all shadow-md shadow-[#1E707D]/10 flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                    <span>Create Project</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </main>
    )
  }

  // ==========================================
  // CHẾ ĐỘ 2: GIAO DIỆN TỔNG QUAN DỰ ÁN CHI TIẾT (PROJECT WORKSPACE OVERVIEW)
  // ==========================================
  if (!activeProject?.members) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
        <div className="w-full space-y-6 animate-pulse">
          <div className="h-32 rounded-2xl bg-surface-container-high"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 rounded-xl bg-surface-container-high"></div>
            ))}
          </div>
        </div>
      </main>
    )
  }

  const uniqueMembers = []
  const seenIds = new Set()
  if (activeProject && activeProject.members) {
    activeProject.members.forEach((member) => {
      if (!seenIds.has(member.id)) {
        seenIds.add(member.id)
        uniqueMembers.push(member)
      }
    })
  }

  const renderRoleBadge = (role) => {
    const upper = (role || '').toUpperCase()
    if (upper === 'PROJECT_LEADER' || upper === 'LEADER') {
      return (
        <span className="text-[10px] bg-[#1E707D]/10 text-[#1E707D] border border-[#1E707D]/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          Leader
        </span>
      )
    }
    if (upper === 'MENTOR') {
      return (
        <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          Mentor
        </span>
      )
    }
    return (
      <span className="text-[10px] bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
        Developer
      </span>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">

      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] rounded-full bg-tertiary-fixed opacity-[0.08] blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full space-y-8">

        {/* Banner Dự án đầu trang */}
        {(() => {
          const role = (activeProject.role || '').toUpperCase()
          const isLeaderOrMentor = role.includes('LEADER') || role === 'MENTOR'
          const isArchived = activeProject.status === 'ARCHIVED'
          return (
            <div className={`p-6 rounded-2xl text-white shadow-lg flex flex-col gap-4 ${isArchived ? 'bg-gradient-to-r from-gray-600 to-gray-700' : 'bg-gradient-to-r from-primary to-primary-container'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-white/10 text-white text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase">
                      {activeProject.major} • {activeProject.semester}
                    </span>
                    {isArchived && (
                      <span className="bg-gray-400/30 text-white text-[10px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase border border-white/20">
                        ARCHIVED — Chỉ đọc
                      </span>
                    )}
                  </div>
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

              {/* Action buttons — chỉ hiện với Leader/Mentor */}
              {isLeaderOrMentor && (
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
                  {/* Close Project */}
                  {!isArchived && (
                    <button
                      onClick={() => setIsClosureModalOpen(true)}
                      className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/80 hover:bg-red-500 backdrop-blur-md border border-red-400/50 text-white text-xs font-bold shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"></div>
                      <span className="material-symbols-outlined text-base group-hover:rotate-12 transition-transform duration-300 relative z-10">lock</span>
                      <span className="relative z-10">Đóng Project</span>
                    </button>
                  )}

                  {/* Reopen Project */}
                  {isArchived && (
                    <button
                      onClick={() => handleReopen(activeProject.id)}
                      disabled={reopening}
                      className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-500 backdrop-blur-md border border-emerald-400/50 text-white text-xs font-bold shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                    >
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"></div>
                      <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform duration-300 relative z-10">lock_open</span>
                      <span className="relative z-10">{reopening ? 'Đang mở lại...' : 'Mở Lại Project'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Các Chỉ Số KPI Nghiệp Vụ */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {/* Card 1: Requirements */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center text-outline">
              <span className="text-xs font-bold uppercase tracking-wider">Yêu Cầu & Use Case</span>
              <span className="material-symbols-outlined text-[#1E707D] text-2xl">description</span>
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
        <section className="bg-[#1E707D]/[0.03] border border-[#1E707D]/10 rounded-2xl p-6 shadow-inner flex flex-col md:flex-row gap-5 items-start">
          <div className="w-12 h-12 bg-[#1E707D]/10 rounded-xl flex items-center justify-center text-[#1E707D] shrink-0">
            <span className="material-symbols-outlined text-2xl">neurology</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-extrabold text-base text-[#1E707D]">Đề xuất thông minh từ AI (DevTrack AI Insights)</h3>
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
                <span className="material-symbols-outlined text-[#1E707D] bg-[#1E707D]/10 p-2 rounded-lg self-start text-sm">description</span>
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
            <h3 className="font-extrabold text-base text-on-surface">Thành viên Nhóm ({uniqueMembers.length})</h3>
            <div className="space-y-3">
              {uniqueMembers.map((member, idx) => (
                <div key={member.id || idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.bg}`}>
                      {member.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-on-surface">{member.name}</h4>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Active</p>
                    </div>
                  </div>
                  {renderRoleBadge(member.role)}
                </div>
              ))}
            </div>
          </div>

        </section>

      </div>

      {/* Modal đóng project */}
      {isClosureModalOpen && activeProject && (
        <ProjectClosureModal
          projectId={activeProject.id}
          projectTitle={activeProject.title}
          onClose={() => setIsClosureModalOpen(false)}
          onClosed={() => fetchProjects()}
        />
      )}

    </main>
  )
}

export default DashboardPage
