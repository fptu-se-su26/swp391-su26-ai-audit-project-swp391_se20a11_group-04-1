import { useEffect, useState, useMemo } from 'react'
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

const formatActivityText = (text) => {
  if (!text) return 'performed an action';
  const action = text.toUpperCase();
  
  if (action.includes('CREATE_TASK')) return 'created a Task';
  if (action.includes('UPDATE_TASK')) return 'updated a Task';
  if (action.includes('DELETE_TASK')) return 'deleted a Task';
  if (action.includes('CREATE_REQUIREMENT')) return 'created a Requirement';
  if (action.includes('UPDATE_REQUIREMENT')) return 'updated a Requirement';
  if (action.includes('DELETE_REQUIREMENT')) return 'deleted a Requirement';
  if (action.includes('CREATE_USECASE')) return 'created a Use Case';
  if (action.includes('UPDATE_USECASE')) return 'updated a Use Case';
  if (action.includes('DELETE_USECASE')) return 'deleted a Use Case';
  if (action.includes('CREATE_BUG')) return 'reported a Bug';
  if (action.includes('UPDATE_BUG')) return 'updated a Bug report';
  if (action.includes('APPROVE_BUG')) return 'approved a Bug report';
  if (action.includes('CREATE_SPRINT')) return 'created a Sprint';
  if (action.includes('UPDATE_SPRINT')) return 'updated a Sprint';
  if (action.includes('DELETE_SPRINT')) return 'deleted a Sprint';
  if (action.includes('ISSUE')) return 'interacted with a Github Issue';
  
  return `has ${text.toLowerCase().replace(/_/g, ' ')}`;
};

const formatTimeOnly = (timeStr) => {
  if (!timeStr) return '--:--';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatActivityTime = (timeStr) => {
  if (!timeStr) return 'Unknown time';
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return 'Unknown time';
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const passwordSet = useAuthStore((state) => state.passwordSet)
  const fetchMe = useAuthStore((state) => state.fetchMe)

  // Trạng thái modal đóng project
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false)
  const [reopening, setReopening] = useState(false)
  const [exportingTracking, setExportingTracking] = useState(false)

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

  // Real dashboard data
  const [dashboardData, setDashboardData] = useState(null)
  const [loadingDashboard, setLoadingDashboard] = useState(false)
  const [visibleActivities, setVisibleActivities] = useState(5)

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

  const handleExportTracking = async (projectId) => {
    setExportingTracking(true)
    try {
      const res = await axiosInstance.get(`/v1/projects/${projectId}/export-tracking`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `project-tracking-${projectId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Exported Excel file successfully!')
    } catch {
      toast.error('Failed to export Excel file.')
    } finally {
      setExportingTracking(false)
    }
  }
  const handleReopen = async (projectId) => {
    const reason = window.prompt('Enter reason to reopen project (min 10 characters):')
    if (!reason || reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters.')
      return
    }
    setReopening(true)
    try {
      await axiosInstance.post(`/v1/projects/${projectId}/reopen`, { reason: reason.trim() })
      toast.success('Project has been reopened!')
      fetchProjects()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reopen project.')
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
      toast.error('GitHub connection failed: ' + (err.response?.data?.message || err.message))
    }
  }

  // Tạo Repo mới trên GitHub
  const handleCreateGithubRepo = async () => {
    if (!newRepoData.name.trim()) {
      toast.error('GitHub repository name cannot be empty!')
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
      toast.error('Failed to create GitHub repository: ' + (err.response?.data?.message || err.message))
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

  // ================================
  // BUG 1 FIX: Memoize AI Score
  // ================================
  const aiPredictionScore = useMemo(() => {
    if (!activeProject || !dashboardData) return 50;
    if (activeProject?.status === 'COMPLETED') return 100;
    if (activeProject?.status === 'ARCHIVED') return 0;
    
    let score = 60;
    const rtm = dashboardData?.rtmCoveragePercent || 0;
    const tasks = dashboardData?.taskCount || 0;
    const bugs = dashboardData?.bugCount || 0;
    const progress = activeProject?.progress || 0;
    
    score += (progress * 0.25);
    score += (rtm * 0.15);
    
    if (tasks > 0) {
        score -= (bugs / tasks) * 30;
    } else if (bugs > 0) {
        score -= bugs * 5;
    }
    
    if (activeProject?.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(activeProject.deadline);
        
        if (deadline < today) {
            score -= 40;
        } else if (activeProject?.startDate) {
            const startDate = new Date(activeProject.startDate);
            const totalDuration = deadline.getTime() - startDate.getTime();
            const elapsed = today.getTime() - startDate.getTime();
            
            if (totalDuration > 0 && elapsed > 0) {
                const timeElapsedPercent = (elapsed / totalDuration) * 100;
                if (timeElapsedPercent > progress + 10) {
                    score -= (timeElapsedPercent - progress) * 0.5;
                } else {
                    score += 5;
                }
            }
        }
    }
    
    return Math.min(Math.max(Math.round(score), 5), 99);
  }, [activeProject, dashboardData]);

  useEffect(() => {
    if (isGlobalDashboard && activeProject) {
      clearActiveProject()
    }
  }, [location.pathname, activeProject, clearActiveProject, isGlobalDashboard])

  // Fetch real dashboard stats when activeProject changes (with LIVE POLLING)
  useEffect(() => {
    if (activeProject && !isGlobalDashboard) {
      // BUG 5 FIX: Reset visibleActivities when project changes
      setVisibleActivities(5)
      
      const fetchDashboardStats = async (isBackground = false) => {
        if (!isBackground) setLoadingDashboard(true)
        try {
          const res = await axiosInstance.get(`/v1/projects/${activeProject.id}/dashboard`)
          setDashboardData(res.data?.data)
        } catch (err) {
          console.error("Failed to fetch dashboard stats", err)
        } finally {
          if (!isBackground) setLoadingDashboard(false)
        }
      }
      
      // Lần đầu tải trang sẽ có hiệu ứng xoay loading
      fetchDashboardStats(false)
      
      // BUG 2 FIX: Increase polling interval to 30s instead of 1s
      const intervalId = setInterval(() => {
        fetchDashboardStats(true) 
      }, 30000)
      
      return () => clearInterval(intervalId)
    }
  }, [activeProject, isGlobalDashboard])

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
      toast.error(error || 'Failed to create project, please try again!')
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
            <h3 className="font-bold text-lg text-on-surface">Failed to load projects</h3>
            <p className="text-sm text-on-surface-variant">{error}</p>
            <button
              onClick={() => fetchProjects()}
              className="bg-[#1E707D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#165964] transition-all shadow-md mt-2"
            >
              Retry
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
              <h4 className="font-bold text-amber-950 dark:text-amber-200">Secure your account</h4>
              <p className="mt-1">
                Your account does not have a standard password set (logged in via GitHub). 
                For better security and to enable standard login, please click{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/profile`)}
                  className="font-bold underline text-amber-700 hover:text-amber-850 focus:outline-none cursor-pointer"
                >
                  Change Password
                </button>{' '}
                in your Profile page to set up a new password.
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
              <h3 className="font-bold text-base text-on-surface">No projects found</h3>
              <p className="text-xs text-on-surface-variant mt-1">Try different search keywords or create a new project.</p>
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
                Showing <span className="font-bold text-on-surface">{Math.min(visibleCount, filteredProjects.length)}</span>
                {' '}of <span className="font-bold text-on-surface">{totalCount}</span> projects
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
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">expand_more</span>
                      <span>Load more ({nextBatchCount > 0 ? nextBatchCount : 3} more projects)</span>
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
                  <label htmlFor="projName" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="projName"
                    type="text"
                    required
                    placeholder="E.g., DevTrack Management System"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline/50 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Chuyên ngành */}
                  <div className="space-y-1.5">
                    <label htmlFor="projMajor" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
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
                          : 'bg-surface-container-lowest border-outline/50 text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D]'
                      }`}
                    />
                  </div>

                  {/* Loại dự án */}
                  <div className="space-y-1.5">
                    <label htmlFor="projType" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      Project Type
                    </label>
                    <select
                      id="projType"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline/50 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#1E707D] cursor-pointer hover:bg-surface-container transition-colors"
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
                    <label htmlFor="projStartDate" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
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
                          : 'bg-surface-container-lowest border-outline/50 text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D]'
                      }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="projDeadline" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
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
                          : 'bg-surface-container-lowest border-outline/50 text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D]'
                      }`}
                    />
                  </div>
                </div>

                {/* Mô tả */}
                <div className="space-y-1.5">
                  <label htmlFor="projDesc" className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Project Description
                  </label>
                  <textarea
                    id="projDesc"
                    rows="4"
                    placeholder="Provide a high-level overview of your project, target audience, and core features..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline/50 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all resize-none"
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
                            You need to link your GitHub account before connecting a repository.
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

      <div className="relative z-10 w-full max-w-[1400px] mx-auto space-y-6">

        {/* 1. HEADER BANNER (Restored Original Effects & Colors) */}
        {(() => {
          const role = (activeProject.role || '').toUpperCase()
          const isLeaderOrMentor = role.includes('LEADER') || role === 'MENTOR'
          const isArchived = activeProject.status === 'ARCHIVED'
          
          return (
            <div className={`p-5 md:p-6 rounded-2xl text-white shadow-lg flex flex-col gap-4 ${isArchived ? 'bg-gradient-to-r from-gray-600 to-gray-700' : 'bg-gradient-to-r from-primary to-primary-container'}`}>
              
              {/* Top Section: Info & Sprint */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-5">
                
                {/* Left Side: Info */}
                <div className="space-y-2.5 flex-1">
                  {/* Top Badges Row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-white/15 text-white text-[10px] font-extrabold tracking-wider px-3 py-1.5 rounded-[8px] uppercase shadow-sm border border-white/10">
                      {activeProject.type || 'Web app'} • {activeProject.major || 'Personal'} • 2026
                    </span>
                    
                    {isArchived && (
                      <span className="bg-gray-500/40 text-white text-[10px] font-extrabold tracking-wider px-3 py-1.5 rounded-[8px] uppercase border border-white/20 shadow-sm">
                        ARCHIVED
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl md:text-2xl font-black tracking-tight mt-1">
                    {activeProject.title || 'DevTrack Alpha Test'}
                  </h1>
                  <p className="text-white/80 text-xs md:text-sm font-medium">
                    Welcome back • role <strong className="text-white font-black">{activeProject.role || 'Project lead'}</strong>
                  </p>
                </div>

                {/* Right Side: Elegant Sprint Progress */}
                <div className="flex flex-col items-end shrink-0 self-start">
                  <div className="flex items-center gap-4 bg-white/10 px-5 py-3.5 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/20 transition-all cursor-default">
                    {/* Badge Text */}
                    <div className="flex flex-col text-right">
                       <span className="text-xs md:text-[13px] uppercase font-black tracking-wide text-white">
                          {(() => {
                              const sprint = dashboardData?.activeSprint;
                              if (!sprint || sprint.status === 'NO_SPRINTS') return 'PROJECT PROGRESS';
                              if (sprint.status === 'IN_PROGRESS') return `ACTIVE: ${sprint.name}`;
                              if (sprint.status === 'UPCOMING') return `NEXT: ${sprint.name}`;
                              if (sprint.status === 'COMPLETED') return `LAST: ${sprint.name}`;
                              return `${sprint.name} PROGRESS`;
                          })()}
                       </span>
                       <span className="text-white/80 text-[11px] md:text-xs font-semibold tracking-wide mt-1">
                          {(() => {
                              const sprint = dashboardData?.activeSprint;
                              if (!sprint || sprint.status === 'NO_SPRINTS') {
                                  return (
                                    <>
                                      {activeProject.startDate ? `Started ${new Date(activeProject.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Not Started'}
                                      {activeProject.deadline ? ` • Deadline: ${new Date(activeProject.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                                    </>
                                  );
                              }
                              
                              const startStr = sprint.startDate ? new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                              const endStr = sprint.endDate ? new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                              const daysLeft = sprint.endDate ? Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
                              const daysUntil = sprint.startDate ? Math.max(0, Math.ceil((new Date(sprint.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;

                              if (sprint.status === 'UPCOMING') {
                                  return `Starts in ${daysUntil} days (${startStr})`;
                              } else if (sprint.status === 'COMPLETED') {
                                  return `Ended on ${endStr}`;
                              } else {
                                  return `Started ${startStr} • ${daysLeft} days left`;
                              }
                          })()}
                       </span>
                    </div>

                    {/* Divider */}
                    <div className="w-[1.5px] h-10 bg-white/20 mx-1 rounded-full"></div>

                    {/* Ring */}
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 36 36">
                        <path className="text-white/20" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-white" strokeWidth="4" strokeDasharray={`${(() => {
                            const sprint = dashboardData?.activeSprint;
                            if (!sprint || sprint.status === 'NO_SPRINTS') return activeProject.progress || 0;
                            return sprint.progressPercent || 0;
                        })()}, 100`} stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      </svg>
                      <span className="absolute text-white font-black text-xs">
                        {(() => {
                            const sprint = dashboardData?.activeSprint;
                            if (!sprint || sprint.status === 'NO_SPRINTS') return `${activeProject.progress || 0}%`;
                            return `${sprint.progressPercent || 0}%`;
                        })()}
                      </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Action Buttons */}
            {isLeaderOrMentor && (
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10 w-full">
                <button
                  onClick={() => handleExportTracking(activeProject.id)}
                  disabled={exportingTracking}
                  className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-bold shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"></div>
                  <span className="material-symbols-outlined text-base group-hover:-translate-y-0.5 transition-transform duration-300 relative z-10">download</span>
                  <span className="relative z-10">{exportingTracking ? 'Exporting...' : 'Export Tracking'}</span>
                </button>

                {!isArchived && (
                  <button
                    onClick={() => setIsClosureModalOpen(true)}
                    className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-500/80 hover:bg-red-500 backdrop-blur-md border border-red-400/50 text-white text-xs font-bold shadow-[0_4px_12px_rgba(239,68,68,0.2)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.5)] active:scale-95 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"></div>
                    <span className="material-symbols-outlined text-base group-hover:rotate-12 transition-transform duration-300 relative z-10">lock</span>
                    <span className="relative z-10">Close Project</span>
                  </button>
                )}

                {isArchived && (
                  <button
                    onClick={() => handleReopen(activeProject.id)}
                    disabled={reopening}
                    className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/80 hover:bg-emerald-500 backdrop-blur-md border border-emerald-400/50 text-white text-xs font-bold shadow-[0_4px_12px_rgba(16,185,129,0.2)] hover:shadow-[0_4px_20px_rgba(16,185,129,0.5)] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 z-0"></div>
                    <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform duration-300 relative z-10">lock_open</span>
                    <span className="relative z-10">{reopening ? 'Reopening...' : 'Reopen Project'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
          )
        })()}

        {/* 2. STAT CARDS ROW (Fixed 5 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Card 1: Requirement */}
          <div className="relative overflow-hidden bg-surface-container-lowest border border-gray-200/80 rounded-xl p-5 shadow-md group hover:shadow-lg hover:border-emerald-500/50 transition-all duration-300 min-h-[120px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">fact_check</span>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Requirements</span>
            </div>
            <div className="text-3xl text-on-surface font-black leading-none mb-3 relative z-10">
              {loadingDashboard ? '...' : (dashboardData?.reqCount || 0)}
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mb-2 overflow-hidden relative z-10">
              <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold relative z-10">Total captured requirements</div>
          </div>

          {/* Card 2: Tasks */}
          <div className="relative overflow-hidden bg-surface-container-lowest border border-gray-200/80 rounded-xl p-5 shadow-md group hover:shadow-lg hover:border-blue-500/50 transition-all duration-300 min-h-[120px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">task</span>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasks</span>
            </div>
            <div className="text-3xl text-on-surface font-black leading-none mb-3 relative z-10">
              {loadingDashboard ? '...' : (dashboardData?.taskCount || 0)}
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mb-2 overflow-hidden relative z-10">
              <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-[11px] text-blue-600 font-semibold relative z-10">Total project tasks</div>
          </div>

          {/* Card 3: Bugs */}
          <div className="relative overflow-hidden bg-surface-container-lowest border border-gray-200/80 rounded-xl p-5 shadow-md group hover:shadow-lg hover:border-red-500/50 transition-all duration-300 min-h-[120px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-6 h-6 rounded-md bg-red-500/20 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">bug_report</span>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bugs</span>
            </div>
            <div className="text-3xl text-red-500 font-black leading-none mb-3 relative z-10">
              {loadingDashboard ? '...' : (dashboardData?.bugCount || 0)}
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mb-2 overflow-hidden relative z-10">
              <div className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-[11px] text-red-600 font-semibold relative z-10">Open issues & bugs</div>
          </div>

          {/* Card 4: RTM coverage */}
          <div className="relative overflow-hidden bg-surface-container-lowest border border-gray-200/80 rounded-xl p-5 shadow-md group hover:shadow-lg hover:border-teal-500/50 transition-all duration-300 min-h-[120px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">rule</span>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Coverage</span>
            </div>
            <div className="text-3xl text-on-surface font-black leading-none mb-3 relative z-10">
              {loadingDashboard ? '...' : `${(dashboardData?.rtmCoveragePercent || 0).toFixed(1)}%`}
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mb-2 overflow-hidden relative z-10">
              <div className="bg-gradient-to-r from-teal-400 to-teal-600 h-full rounded-full" style={{ width: `${dashboardData?.rtmCoveragePercent || 0}%` }}></div>
            </div>
            <div className="text-[11px] text-teal-600 font-semibold relative z-10">Test cases / Req</div>
          </div>

          {/* Card 5: Final deadline */}
          <div className="relative overflow-hidden bg-surface-container-lowest border border-gray-200/80 rounded-xl p-5 shadow-md group hover:shadow-lg hover:border-amber-500/50 transition-all duration-300 min-h-[120px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[14px]">event</span>
              </div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deadline</span>
            </div>
            <div className="text-xl text-on-surface font-black leading-none mb-3 relative z-10">
              {loadingDashboard ? '...' : (activeProject?.deadline ? new Date(activeProject.deadline).toLocaleDateString() : 'N/A')}
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mb-2 overflow-hidden relative z-10">
              <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <div className="text-[11px] text-amber-600 font-semibold relative z-10">Scheduled End Date</div>
          </div>

        </div>

        {/* 3. LIVE AI AUDIT & GITHUB COMMAND CENTER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Live AI Stream (Terminal Vibe) */}
          <div className="bg-surface-container-lowest border border-gray-200/80 rounded-xl shadow-md relative overflow-hidden flex flex-col h-[350px]">
            {/* Terminal Header */}
            <div className="bg-primary/20 border-b border-primary/30 p-3 px-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#105663]">
                <span className="material-symbols-outlined text-[18px] animate-pulse">terminal</span>
                <span className="text-xs font-bold font-mono tracking-widest">GITHUB_WEBHOOK_STREAM</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></div>
              </div>
            </div>

            {/* Terminal Content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-[13px] pr-2 custom-scrollbar text-on-surface-variant relative z-10">
              {loadingDashboard ? (
                <div className="text-primary/80 animate-pulse">
                  <span className="text-gray-400">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span> INITIALIZING GITHUB LISTENER...
                </div>
              ) : (() => {
                  const githubKeywords = ['github', 'commit', 'push', 'pull', 'pr', 'branch', 'merge', 'issue'];
                  const githubEvents = dashboardData?.recentActivities?.filter(act => githubKeywords.some(kw => act.text.toLowerCase().includes(kw))) || [];
                  return githubEvents.length > 0 ? (
                    githubEvents.map((act, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2 w-full">
                    <span className="text-gray-400 shrink-0">[{formatTimeOnly(act.time)}]</span>
                    <span className="text-on-surface flex-1 break-words min-w-0">
                      {act.icon === 'bug_report' ? (
                         <span className="text-red-500 font-bold">[ALERT]</span>
                      ) : act.icon === 'task' ? (
                         <span className="text-blue-500 font-bold">[SYNC]</span>
                      ) : (
                         <span className="text-primary font-bold">[SCAN]</span>
                      )}
                      <span className="text-on-surface-variant ml-2 font-medium break-words">
                        {act.username && <span className="text-primary font-bold mr-1">@{act.username}</span>}
                        {act.text}
                      </span>
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2 text-primary/60 mt-2">
                    <span className="w-2 h-4 bg-primary animate-ping"></span>
                    Waiting for GitHub webhook events...
                  </div>
                </>
              )})()}
            </div>
            
            {/* Background pattern */}
            <div className="absolute inset-0 top-[49px] bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
          </div>

          {/* Right: Traceability Radar & AI Health */}
          <div className="bg-surface-container-lowest border border-gray-200/80 rounded-xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">radar</span>
                <div className="text-xs font-bold text-on-surface uppercase tracking-wider">Traceability Radar</div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                System Healthy
              </div>
            </div>
            
            <div className="relative z-10 space-y-6 flex-1 flex flex-col justify-center">
              {/* Coverage Radar Bar */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-teal-500">rule</span>
                    <span className="text-xs font-bold text-gray-600 uppercase">Requirement Coverage</span>
                  </div>
                  <span className="text-sm font-black text-on-surface">{loadingDashboard ? '...' : `${Math.round(dashboardData?.rtmCoveragePercent || 0)}%`}</span>
                </div>
                <div className="w-full bg-surface-container-highest h-2.5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 relative overflow-hidden transition-all duration-1000" style={{ width: `${dashboardData?.rtmCoveragePercent || 0}%` }}>
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
              
              {/* Code Quality Bar */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-amber-500">code_blocks</span>
                    <span className="text-xs font-bold text-gray-600 uppercase">Code Velocity vs Bugs</span>
                  </div>
                  <span className="text-sm font-black text-on-surface">{loadingDashboard ? '...' : `${dashboardData?.taskCount || 0} Tasks`}</span>
                </div>
                <div className="w-full flex h-2.5 rounded-full overflow-hidden shadow-inner bg-surface-container-highest gap-0.5">
                   {/* Fake ratio based on tasks vs bugs */}
                   <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000" style={{ flex: (dashboardData?.taskCount || 1) }}></div>
                   <div className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-1000" style={{ flex: (dashboardData?.bugCount || 0) * 2 }}></div>
                </div>
                <div className="text-[10px] text-gray-500 mt-1.5 flex justify-between">
                  <span>Dev Velocity</span>
                  <span className="text-red-500/80 font-semibold">{dashboardData?.bugCount || 0} Active Bugs</span>
                </div>
              </div>
              
              {/* AI Confidence Score */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-teal-500/5 border border-primary/20 relative overflow-hidden group">
                 {/* Decorative AI Glow */}
                 <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700"></div>
                 <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-all duration-700"></div>
                 
                 <div className="relative z-10 flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px] animate-pulse">auto_awesome</span>
                        <span className="text-xs font-bold text-on-surface uppercase tracking-wider">AI Prediction</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">Project Success Probability</span>
                    </div>
                    
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary via-teal-500 to-emerald-500 drop-shadow-sm">
                        {aiPredictionScore}%
                      </span>
                    </div>
                 </div>
                 
                 {/* Mini progress bar for AI */}
                 <div className="relative z-10 mt-3 w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 relative" style={{ width: `${aiPredictionScore}%` }}>
                       <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. TWO-COLUMN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
          
          {/* Recent activity */}
          <div className="bg-surface-container-lowest border border-gray-200/80 rounded-xl p-6 shadow-md flex flex-col max-h-[450px]">
            <div className="text-xs font-bold text-on-surface uppercase tracking-wider mb-6 shrink-0">Recent activity</div>
            <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
              {(dashboardData?.recentActivities?.length > 0 ? dashboardData.recentActivities : []).slice(0, visibleActivities).map((act, i) => (
                <div key={i} className="flex gap-2.5 items-start py-2 px-3 rounded-lg hover:bg-surface-container transition-all cursor-default">
                  <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${act.iconColor ? act.iconColor.replace('text-', 'text-').replace('-600', '-500') : 'text-primary'}`}>
                    {act.icon || 'circle'}
                  </span>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="text-[13px] text-on-surface/90 leading-tight">
                      <span className="font-bold text-on-surface">
                        {act.username ? `@${act.username}` : 'System'}
                      </span>
                      <span className="text-on-surface/70 mx-1">
                        {formatActivityText(act.text)}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      {formatActivityTime(act.time)}
                    </div>
                  </div>
                </div>
              ))}
              
              {dashboardData?.recentActivities?.length > visibleActivities && (
                <div className="pt-2 pb-2 text-center">
                  <button 
                    onClick={() => setVisibleActivities(prev => prev + 5)}
                    className="text-[11px] font-bold text-primary uppercase tracking-wider px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors shadow-sm"
                  >
                    Xem thêm...
                  </button>
                </div>
              )}

              {(!dashboardData?.recentActivities || dashboardData.recentActivities.length === 0) && (
                <div className="text-sm text-gray-500 italic text-center py-4">No recent activity</div>
              )}
            </div>
          </div>

          {/* Team members */}
          <div className="bg-surface-container-lowest border border-gray-200/80 rounded-xl p-6 shadow-md">
            <div className="text-xs font-bold text-on-surface uppercase tracking-wider mb-6">Team members ({uniqueMembers.length})</div>
            <div className="space-y-4">
              {uniqueMembers.length > 0 ? (
                uniqueMembers.map((member, idx) => {
                  const colors = ['bg-primary/20 text-primary', 'bg-blue-500/20 text-blue-700', 'bg-emerald-500/20 text-emerald-700', 'bg-amber-500/20 text-amber-700', 'bg-rose-500/20 text-rose-700'];
                  const colorClass = member.bg || colors[idx % colors.length];
                  const displayName = member.name || member.username || 'Unknown';
                  const initials = member.initials || displayName.substring(0, 2).toUpperCase();
                  return (
                    <div 
                      key={member.id || idx} 
                      className="group flex items-center p-1.5 pr-4 bg-gradient-to-r from-surface-container-lowest to-surface-container-low hover:from-primary/10 hover:to-transparent border border-outline-variant/60 hover:border-primary/40 rounded-full transition-all duration-300 cursor-default shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm border border-white/20 relative overflow-hidden ${colorClass}`}>
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>
                        <span className="relative z-10">{initials}</span>
                      </div>
                      <div className="ml-3 flex-1 flex flex-col justify-center overflow-hidden">
                        <div className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate leading-tight">{displayName}</div>
                        <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mt-0.5 truncate">{member.role || 'MEMBER'}</div>
                      </div>
                      <div 
                        className="w-2.5 h-2.5 rounded-full border-2 border-surface-container-lowest shrink-0 ml-2 transition-transform duration-300 group-hover:scale-125"
                        style={{ backgroundColor: member.isOnline ? '#10b981' : '#9ca3af', boxShadow: member.isOnline ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none' }}
                      ></div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500 italic text-center py-4">No team members</div>
              )}
            </div>
          </div>

        </div>

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
