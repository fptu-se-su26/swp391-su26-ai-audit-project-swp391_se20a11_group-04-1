import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import toast from 'react-hot-toast'
import { getInitials } from '@utils/avatarHelper'

/**
 * ClassroomsPage - Classroom management page for Mentors and Admins.
 * Displays classroom list with filtering by semester, search, and member management.
 * Currently using mock data - backend API will be integrated later.
 */

// Semester filter options
const SEMESTER_OPTIONS = [
  { value: 'all', label: 'All Semesters' },
  { value: 'SP26', label: 'Spring 2026' },
  { value: 'SU26', label: 'Summer 2026' },
  { value: 'FA25', label: 'Fall 2025' },
  { value: 'SP25', label: 'Spring 2025' },
]

// Mock classroom data for UI development
const MOCK_CLASSROOMS = [
  {
    id: 1,
    subject: 'SWP391',
    semester: 'SU26',
    academicYear: '2025-2026',
    maxMembers: 50,
    owner: { id: 3, fullName: 'Dr. Nguyen Van A', email: 'nguyenvana@fpt.edu.vn' },
    memberCount: 32,
    projectCount: 8,
    status: 'ACTIVE',
    createdAt: '2026-05-15T10:30:00',
    members: [
      { id: 1, fullName: 'Tran Minh Duc', email: 'ducmt@fpt.edu.vn', role: 'LEADER', joinedAt: '2026-05-16' },
      { id: 2, fullName: 'Le Thi Bich Ngoc', email: 'ngocltb@fpt.edu.vn', role: 'MEMBER', joinedAt: '2026-05-16' },
      { id: 3, fullName: 'Pham Hoang Nam', email: 'namph@fpt.edu.vn', role: 'MEMBER', joinedAt: '2026-05-17' },
      { id: 4, fullName: 'Vo Thanh Phong', email: 'phongvt@fpt.edu.vn', role: 'MEMBER', joinedAt: '2026-05-17' },
      { id: 5, fullName: 'Nguyen Thi Mai', email: 'maintl@fpt.edu.vn', role: 'MEMBER', joinedAt: '2026-05-18' },
    ],
  },
  {
    id: 2,
    subject: 'SWR302',
    semester: 'SU26',
    academicYear: '2025-2026',
    maxMembers: 50,
    owner: { id: 3, fullName: 'Dr. Nguyen Van A', email: 'nguyenvana@fpt.edu.vn' },
    memberCount: 28,
    projectCount: 6,
    status: 'ACTIVE',
    createdAt: '2026-05-20T08:00:00',
    members: [
      { id: 6, fullName: 'Hoang Duc Thinh', email: 'thinhht@fpt.edu.vn', role: 'LEADER', joinedAt: '2026-05-21' },
      { id: 7, fullName: 'Bui Van Kien', email: 'kienbv@fpt.edu.vn', role: 'MEMBER', joinedAt: '2026-05-21' },
      { id: 8, fullName: 'Dang Thu Hien', email: 'hiendt@fpt.edu.vn', role: 'MEMBER', joinedAt: '2026-05-22' },
    ],
  },
  {
    id: 3,
    subject: 'PRJ301',
    semester: 'SP26',
    academicYear: '2025-2026',
    maxMembers: 40,
    owner: { id: 5, fullName: 'ThS. Tran Bao Ngoc', email: 'ngoctb@fpt.edu.vn' },
    memberCount: 40,
    projectCount: 10,
    status: 'FULL',
    createdAt: '2026-01-10T09:00:00',
    members: [
      { id: 9, fullName: 'Ngo Quang Huy', email: 'huynq@fpt.edu.vn', role: 'LEADER', joinedAt: '2026-01-11' },
      { id: 10, fullName: 'Ly Thi Thanh', email: 'thanhlt@fpt.edu.vn', role: 'MEMBER', joinedAt: '2026-01-11' },
    ],
  },
  {
    id: 4,
    subject: 'SWP391',
    semester: 'FA25',
    academicYear: '2025-2026',
    maxMembers: 50,
    owner: { id: 3, fullName: 'Dr. Nguyen Van A', email: 'nguyenvana@fpt.edu.vn' },
    memberCount: 48,
    projectCount: 12,
    status: 'ARCHIVED',
    createdAt: '2025-09-01T08:00:00',
    members: [],
  },
  {
    id: 5,
    subject: 'SWT301',
    semester: 'SP25',
    academicYear: '2024-2025',
    maxMembers: 35,
    owner: { id: 7, fullName: 'TS. Pham Minh Tuan', email: 'tuanpm@fpt.edu.vn' },
    memberCount: 30,
    projectCount: 7,
    status: 'ARCHIVED',
    createdAt: '2025-01-05T10:00:00',
    members: [],
  },
]

// Color palette for member avatars
const AVATAR_COLORS = [
  'bg-sky-500 text-white',
  'bg-teal-500 text-white',
  'bg-indigo-500 text-white',
  'bg-rose-500 text-white',
  'bg-amber-500 text-white',
  'bg-emerald-500 text-white',
  'bg-violet-500 text-white',
  'bg-cyan-500 text-white',
]

function getAvatarColor(index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function getStatusConfig(status) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' }
    case 'FULL':
      return { label: 'Full', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500' }
    case 'ARCHIVED':
      return { label: 'Archived', bg: 'bg-slate-400/10', text: 'text-slate-500', dot: 'bg-slate-400' }
    default:
      return { label: status, bg: 'bg-slate-400/10', text: 'text-slate-500', dot: 'bg-slate-400' }
  }
}

export default function ClassroomsPage() {
  const navigate = useNavigate()
  const userRole = useAuthStore((s) => s.userRole)
  const fullName = useAuthStore((s) => s.fullName)

  const [selectedSemester, setSelectedSemester] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedClassroom, setExpandedClassroom] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [inviteLinkModal, setInviteLinkModal] = useState(null)

  const [assistiveOpen, setAssistiveOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0 })
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (assistiveOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setAssistiveOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [assistiveOpen])

  const handlePointerDown = (e) => {
    if (assistiveOpen) return;
    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragInfo.current.isDragging) return;
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    setPos({
      x: dragInfo.current.initialX + dx,
      y: dragInfo.current.initialY + dy
    });
  };

  const handlePointerUp = (e) => {
    if (!dragInfo.current.isDragging) return;
    dragInfo.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const dx = Math.abs(e.clientX - dragInfo.current.startX);
    const dy = Math.abs(e.clientY - dragInfo.current.startY);
    if (dx < 5 && dy < 5) {
      setAssistiveOpen(true);
    }
  };

  // Filter and search classrooms
  const filteredClassrooms = useMemo(() => {
    return MOCK_CLASSROOMS.filter((cls) => {
      const matchesSemester = selectedSemester === 'all' || cls.semester === selectedSemester
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        cls.subject.toLowerCase().includes(q) ||
        cls.owner.fullName.toLowerCase().includes(q) ||
        cls.semester.toLowerCase().includes(q)
      return matchesSemester && matchesSearch
    })
  }, [selectedSemester, searchQuery])

  // Stats
  const totalClassrooms = MOCK_CLASSROOMS.length
  const activeClassrooms = MOCK_CLASSROOMS.filter((c) => c.status === 'ACTIVE').length
  const totalStudents = MOCK_CLASSROOMS.reduce((sum, c) => sum + c.memberCount, 0)



  const handleCopyInviteLink = (classroom) => {
    const fakeLink = `${window.location.origin}/join-classroom/${classroom.id}?code=${btoa(classroom.subject + '-' + classroom.semester)}`
    navigator.clipboard.writeText(fakeLink).then(() => {
      toast.success('Đã sao chép link mời vào clipboard!')
    })
    setInviteLinkModal(null)
  }

  const handleCreateClassroom = () => {
    toast.success('Chức năng "Tạo Classroom" sẽ được kích hoạt khi hoàn thiện Backend API!')
    setIsCreateModalOpen(false)
  }

  return (
    <main className="flex-1 px-6 py-2 md:px-10 md:py-4 overflow-y-auto relative bg-background select-none">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full bg-primary-fixed opacity-[0.10] blur-[90px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[450px] h-[450px] rounded-full bg-secondary-fixed opacity-[0.12] blur-[110px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">school</span>
              My Classrooms
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Quản lý các lớp học, xem danh sách thành viên và theo dõi tiến độ nhóm.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-on-primary-fixed-variant transition-all shadow-md shadow-primary/10 shrink-0"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Create Classroom</span>
          </button>
        </div>

        {/* Stats Cards */}
        {showStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl">school</span>
              </div>
              <div>
                <p className="text-2xl font-black text-on-surface leading-none">{totalClassrooms}</p>
                <p className="text-[11px] font-semibold text-on-surface-variant mt-0.5 uppercase tracking-wider">Total Classrooms</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-emerald-600 text-xl">radio_button_checked</span>
              </div>
              <div>
                <p className="text-2xl font-black text-on-surface leading-none">{activeClassrooms}</p>
                <p className="text-[11px] font-semibold text-on-surface-variant mt-0.5 uppercase tracking-wider">Active Classes</p>
              </div>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-sky-600 text-xl">groups</span>
              </div>
              <div>
                <p className="text-2xl font-black text-on-surface leading-none">{totalStudents}</p>
                <p className="text-[11px] font-semibold text-on-surface-variant mt-0.5 uppercase tracking-wider">Total Students</p>
              </div>
              {/* Assistive Control Panel */}
              <div className="fixed bottom-6 right-6 z-50">
                <button
                  onClick={() => setAssistiveOpen(!assistiveOpen)}
                  className="w-12 h-12 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-all"
                >
                  <span className="material-symbols-outlined">settings_suggest</span>
                </button>
                {assistiveOpen && (
                  <div className="absolute bottom-16 right-0 bg-surface-container-high p-3 rounded-2xl shadow-xl border border-outline-variant space-y-2 animate-fadeIn">
                    <label className="flex items-center gap-3 px-2">
                      <input type="checkbox" checked={showStats} onChange={() => setShowStats(!showStats)} className="accent-primary" />
                      <span className="text-xs font-bold text-on-surface">Show Stats</span>
                    </label>
                    <label className="flex items-center gap-3 px-2">
                      <input type="checkbox" checked={showFilters} onChange={() => setShowFilters(!showFilters)} className="accent-primary" />
                      <span className="text-xs font-bold text-on-surface">Show Filters</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/60 pb-4">
            {/* Semester Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {SEMESTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSemester(opt.value)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    selectedSemester === opt.value
                      ? 'bg-primary-container text-on-primary border-primary-container shadow-sm'
                      : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">search</span>
              <input
                type="text"
                placeholder="Search classroom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>
        )}

        {/* Classroom Grid */}
        {filteredClassrooms.length === 0 ? (
          <div className="py-20 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-outline mb-3">school</span>
            <h3 className="font-bold text-base text-on-surface">Không tìm thấy lớp học nào</h3>
            <p className="text-xs text-on-surface-variant mt-1">Thử thay đổi bộ lọc hoặc tạo lớp học mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClassrooms.map((classroom) => {
              const statusConfig = getStatusConfig(classroom.status)
              const capacityPercent = Math.round((classroom.memberCount / classroom.maxMembers) * 100)
              const isNearFull = capacityPercent >= 80

              return (
                <div
                  key={classroom.id}
                  className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all duration-300 group"
                >
                  {/* Dark Banner */}
                  <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0c1929] px-5 py-4 relative overflow-hidden">
                    {/* Subtle glow */}
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/20 blur-2xl pointer-events-none"></div>

                    <div className="relative z-10 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 shrink-0">
                          <span className="text-white font-black text-sm">{classroom.subject.slice(0, 3)}</span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base text-white leading-tight">{classroom.subject}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-white/10 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                              {classroom.semester} • {classroom.academicYear}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              classroom.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' :
                              classroom.status === 'FULL' ? 'bg-amber-500/20 text-amber-300' :
                              'bg-white/10 text-white/50'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      {classroom.status !== 'ARCHIVED' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setInviteLinkModal(classroom) }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all shrink-0"
                          title="Copy invite link"
                        >
                          <span className="material-symbols-outlined text-base">link</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col">

                    {/* Info: Mentor + Projects */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">person</span>
                        <span className="truncate">{classroom.owner.fullName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">folder</span>
                          {classroom.projectCount} projects
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          {new Date(classroom.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* KPI Box: Members Capacity */}
                    <div className="bg-surface-container-low/50 border border-outline-variant/30 rounded-xl p-3 mb-4">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2">
                        <span className="text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">groups</span>
                          Capacity
                        </span>
                        <span className={isNearFull ? 'text-amber-600' : 'text-on-surface-variant'}>
                          {classroom.memberCount}/{classroom.maxMembers}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            capacityPercent >= 100 ? 'bg-red-500' : isNearFull ? 'bg-amber-500' : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1.5 text-right">{capacityPercent}% filled</p>
                    </div>

                    {/* Member Avatars Preview */}
                    <div className="mt-auto flex items-center -space-x-2 overflow-hidden">
                      {classroom.members.slice(0, 4).map((member, idx) => (
                        <div
                          key={member.id}
                          title={member.fullName}
                          className={`w-7 h-7 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-[9px] font-extrabold shadow-sm shrink-0 ${getAvatarColor(idx)}`}
                        >
                          {getInitials(member.fullName)}
                        </div>
                      ))}
                      {classroom.memberCount > 4 && (
                        <div className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[9px] font-bold shadow-sm shrink-0">
                          +{classroom.memberCount - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-outline-variant/40 px-5 py-3.5 flex items-center justify-between bg-surface-container-low/20">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast.success('Chức năng Comment sẽ được tích hợp sau!')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-all"
                        title="Comments"
                      >
                        <span className="material-symbols-outlined text-base">comment</span>
                      </button>
                      <button
                        onClick={() => toast.success('Chức năng xuất báo cáo sẽ được tích hợp sau!')}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-all"
                        title="Export"
                      >
                        <span className="material-symbols-outlined text-base">download</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setExpandedClassroom(classroom)}
                      className="bg-primary text-on-primary hover:bg-on-primary-fixed-variant px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span>View Details</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Result counter */}
        {filteredClassrooms.length > 0 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/40">
              <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
              <span>
                Hiển thị <span className="font-bold text-on-surface">{filteredClassrooms.length}</span> trên{' '}
                <span className="font-bold text-on-surface">{totalClassrooms}</span> lớp học
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Create Classroom Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030213]/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/35">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl font-bold">school</span>
                <h3 className="font-extrabold text-base text-on-surface">Create New Classroom</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                  Subject Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="E.g., SWP391, SWR302"
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface-variant focus:outline-none focus:border-primary cursor-pointer hover:bg-surface-container transition-colors">
                    <option value="SU26">Summer 2026</option>
                    <option value="FA26">Fall 2026</option>
                    <option value="SP27">Spring 2027</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., 2025-2026"
                    defaultValue="2025-2026"
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                  Max Members
                </label>
                <input
                  type="number"
                  defaultValue={50}
                  min={5}
                  max={100}
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <p className="text-[10px] text-on-surface-variant">Giới hạn số sinh viên tối đa trong lớp (5-100).</p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/40 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClassroom}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-bold transition-all shadow-md shadow-primary/10 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                  <span>Create Classroom</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {inviteLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030213]/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/35">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">link</span>
                <h3 className="font-extrabold text-base text-on-surface">Invite Link</h3>
              </div>
              <button
                onClick={() => setInviteLinkModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-on-surface-variant">
                Chia sẻ link bên dưới để mời sinh viên tham gia lớp <strong className="text-on-surface">{inviteLinkModal.subject} - {inviteLinkModal.semester}</strong>.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 text-xs text-on-surface-variant font-mono truncate">
                  {`${window.location.origin}/join-classroom/${inviteLinkModal.id}?code=${btoa(inviteLinkModal.subject + '-' + inviteLinkModal.semester)}`}
                </div>
                <button
                  onClick={() => handleCopyInviteLink(inviteLinkModal)}
                  className="shrink-0 bg-primary text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-on-primary-fixed-variant transition-all shadow-sm"
                >
                  Copy
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-on-surface-variant bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
                <span>Link mời sẽ được kích hoạt khi Backend API hoàn thiện.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classroom Detail Modal */}
      {expandedClassroom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030213]/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slideUp max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/35 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10">
                  <span className="text-primary font-black text-sm">{expandedClassroom.subject.slice(0, 3)}</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-on-surface">{expandedClassroom.subject}</h3>
                  <span className="text-[10px] font-semibold text-on-surface-variant">{expandedClassroom.semester} • {expandedClassroom.academicYear}</span>
                </div>
              </div>
              <button
                onClick={() => setExpandedClassroom(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Info Summary */}
            <div className="px-6 py-4 border-b border-outline-variant/30 grid grid-cols-3 gap-4 shrink-0">
              <div className="text-center">
                <p className="text-xl font-black text-on-surface">{expandedClassroom.memberCount}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Members</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-on-surface">{expandedClassroom.projectCount}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Projects</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-on-surface">{expandedClassroom.maxMembers}</p>
                <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">Max Slots</p>
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">groups</span>
                  Members ({expandedClassroom.members.length} shown / {expandedClassroom.memberCount} total)
                </h4>
                {expandedClassroom.status !== 'ARCHIVED' && (
                  <button
                    onClick={() => toast.success('Chức năng quản lý thành viên sẽ được kích hoạt sau!')}
                    className="text-xs font-bold text-primary hover:text-on-primary-fixed-variant flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Add Member
                  </button>
                )}
              </div>

              {expandedClassroom.members.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">group_off</span>
                  <p className="text-xs font-semibold">Không có dữ liệu thành viên chi tiết cho lớp đã lưu trữ.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expandedClassroom.members.map((member, idx) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/30 border border-outline-variant/30 hover:border-primary/20 hover:shadow-sm transition-all"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(idx)}`}
                      >
                        {getInitials(member.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs text-on-surface truncate">{member.fullName}</p>
                        <p className="text-[10px] text-on-surface-variant truncate">{member.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant">{member.joinedAt}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            member.role === 'LEADER'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between shrink-0 bg-surface-container-low/20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success('Chức năng Comment sẽ được tích hợp sau!')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-sm">comment</span>
                  Comments
                </button>
                <button
                  onClick={() => toast.success('Chức năng xuất báo cáo sẽ được tích hợp sau!')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Export
                </button>
              </div>
              <button
                onClick={() => setExpandedClassroom(null)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Floating Assistive Menu */}
      <div 
        className="fixed bottom-6 right-6 z-50 flex items-end justify-end touch-none"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      >
        {/* Collapsed button */}
        {!assistiveOpen ? (
          <button
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-14 h-14 bg-[#181f2a]/90 hover:bg-[#181f2a] backdrop-blur shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-2xl flex items-center justify-center transition-all duration-300 border border-slate-700/50 group opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing outline-none"
          >
            <div className="relative flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-md group-hover:bg-sky-500/30 transition-all"></div>
              <div className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-300 shadow-md"></div>
            </div>
          </button>
        ) : (
          /* Expanded menu panel */
          <div ref={menuRef} className="bg-[#181f2a]/95 backdrop-blur-lg border border-slate-700/50 shadow-2xl rounded-[32px] w-64 h-64 p-5 relative transition-all duration-300 scale-100 ease-out text-white">
            {/* 2x2 grid container */}
            <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
              {/* Top-Left: Tạo lớp */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setAssistiveOpen(false);
                    setIsCreateModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-sky-500 text-sky-400 flex items-center justify-center hover:bg-sky-500/10 transition-colors shadow-sm shadow-sky-500/10">
                    <span className="material-symbols-outlined text-2xl font-bold">add</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-slate-300 group-hover/btn:text-white transition-colors">Tạo Lớp</span>
                </button>
              </div>

              {/* Top-Right: Làm mới */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setAssistiveOpen(false);
                    toast.success('Đã làm mới dữ liệu!');
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-sky-500 text-sky-400 flex items-center justify-center hover:bg-sky-500/10 transition-colors shadow-sm shadow-sky-500/10">
                    <span className="material-symbols-outlined text-2xl font-bold">sync</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-slate-300 group-hover/btn:text-white transition-colors">Làm mới</span>
                </button>
              </div>

              {/* Bottom-Left: Thống kê */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowStats(prev => !prev)}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center hover:bg-white/10 transition-all ${showStats ? 'border-sky-500 text-sky-400 shadow-sm shadow-sky-500/10' : 'border-slate-500 text-slate-300'}`}>
                    <span className="material-symbols-outlined text-2xl">bar_chart</span>
                  </div>
                  <span className={`text-[11px] font-bold mt-1 transition-colors ${showStats ? 'text-sky-400 font-extrabold' : 'text-slate-300 group-hover/btn:text-white'}`}>Thống kê</span>
                </button>
              </div>

              {/* Bottom-Right: Bộ lọc */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowFilters(prev => !prev)}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center hover:bg-white/10 transition-all ${showFilters ? 'border-sky-500 text-sky-400 shadow-sm shadow-sky-500/10' : 'border-slate-500 text-slate-300'}`}>
                    <span className="material-symbols-outlined text-2xl">filter_alt</span>
                  </div>
                  <span className={`text-[11px] font-bold mt-1 transition-colors ${showFilters ? 'text-sky-400 font-extrabold' : 'text-slate-300 group-hover/btn:text-white'}`}>Bộ lọc</span>
                </button>
              </div>
            </div>

            {/* Center Home Button for collapsing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#141a24] rounded-2xl border border-slate-800 shadow-md flex items-center justify-center pointer-events-auto">
              <button
                type="button"
                onClick={() => setAssistiveOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-400 hover:bg-slate-300 border border-slate-500/50 cursor-pointer shadow-inner transition-colors flex items-center justify-center outline-none"
                title="Đóng menu"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#141a24]"></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
