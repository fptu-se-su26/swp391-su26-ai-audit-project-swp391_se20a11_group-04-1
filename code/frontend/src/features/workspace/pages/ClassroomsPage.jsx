import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import toast from 'react-hot-toast'
import { getInitials } from '@utils/avatarHelper'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { classroomApi } from '@api/classroomApi'
import axiosClient from '@api/axiosConfig'

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

// Color palette for member avatars
const AVATAR_COLORS = [
  'bg-sky-500 text-white',
  'bg-teal-500 text-white',
  'bg-[#1E707D] text-white',
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
  const verifyStatus = useAuthStore((s) => s.verifyStatus)
  const queryClient = useQueryClient()

  const canCreateClassroom = userRole === 'ADMIN' || verifyStatus === 'VERIFIED'

  const [selectedSemester, setSelectedSemester] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedClassroom, setExpandedClassroom] = useState(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [inviteLinkModal, setInviteLinkModal] = useState(null)

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear().toString();
  const defaultSemester = currentMonth >= 5 && currentMonth <= 8 ? 'SUMMER' : currentMonth >= 9 ? 'FALL' : 'SPRING';

  const [newClassroom, setNewClassroom] = useState({
    subjectCode: '',
    classCode: '',
    semester: defaultSemester,
    academicYear: currentYear,
    maxMembers: 50
  });

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

  // API Fetch
  const { data: classroomsData, isLoading } = useQuery({
    queryKey: ['classrooms', selectedSemester, searchQuery],
    queryFn: async () => {
      const params = {
        page: 0,
        size: 50,
      }
      if (selectedSemester !== 'all') {
        // Need to extract SPRING, SUMMER, FALL from SP26 etc if possible, but our backend expects SPRING, SUMMER, FALL, PERSONAL
        // Let's just pass the selectedSemester, the backend currently handles exact matches or we can adjust logic.
        // Actually, backend expects AcademicSeason enum: SPRING, SUMMER, FALL, PERSONAL.
        let season = selectedSemester;
        if (season.startsWith('SP')) season = 'SPRING';
        else if (season.startsWith('SU')) season = 'SUMMER';
        else if (season.startsWith('FA')) season = 'FALL';
        params.semester = season;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const response = await classroomApi.getMyClassrooms(params);
      return response.data.data;
    }
  })

  const fetchedClassrooms = classroomsData?.items || [];

  // Filter and search classrooms
  const filteredClassrooms = fetchedClassrooms;

  // Stats
  const totalClassrooms = fetchedClassrooms.length
  const activeClassrooms = fetchedClassrooms.filter((c) => c.status === 'ACTIVE').length
  const totalStudents = fetchedClassrooms.reduce((sum, c) => sum + (c.memberCount || 0), 0)

  // Mutation
  const createMutation = useMutation({
    mutationFn: (data) => classroomApi.createClassroom(data),
    onSuccess: () => {
      toast.success('Classroom created successfully!');
      setIsCreateModalOpen(false);
      setNewClassroom({ ...newClassroom, subjectCode: '', classCode: '' });
      queryClient.invalidateQueries(['classrooms']);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'An error occurred while creating the classroom';
      toast.error(message);
    }
  });



  const handleCopyInviteLink = (classroom) => {
    const realLink = `${window.location.origin}/classrooms/join?token=${classroom.realToken}`
    navigator.clipboard.writeText(realLink).then(() => {
      toast.success('Copied invite link to clipboard!')
    })
    setInviteLinkModal(null)
  }

  const handleOpenInviteLinkModal = async (classroom, e) => {
    e.stopPropagation();
    try {
      // Use axiosClient to fetch the token instead of classroomApi if classroomApi doesn't have it
      // I'll assume classroomApi doesn't have it yet, so we'll import axiosClient
      const { data } = await axiosClient.get(`/v1/classrooms/${classroom.id}/invite-link`);
      if (data.success && data.data) {
        setInviteLinkModal({ ...classroom, realToken: data.data });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Only the classroom creator can generate invite links.');
    }
  }

  const handleCreateClassroom = () => {
    if (!newClassroom.subjectCode || !newClassroom.classCode) {
      toast.error('Please enter the subject code and class code!');
      return;
    }

    let finalSubject = '';
    if (newClassroom.semester === 'PERSONAL') {
      finalSubject = `${newClassroom.subjectCode} - ${newClassroom.classCode}`;
    } else {
      let prefix = '';
      if (newClassroom.semester === 'SPRING') prefix = 'SP';
      else if (newClassroom.semester === 'SUMMER') prefix = 'SU';
      else if (newClassroom.semester === 'FALL') prefix = 'FA';
      const yearSuffix = newClassroom.academicYear.substring(2, 4);
      prefix = prefix + yearSuffix;

      finalSubject = `${prefix}-${newClassroom.subjectCode}-${newClassroom.classCode}`;
    }

    createMutation.mutate({
      subject: finalSubject,
      semester: newClassroom.semester,
      academicYear: newClassroom.academicYear,
      maxMembers: newClassroom.maxMembers
    });
  }

  return (
    <main className="flex-1 px-6 py-2 md:px-10 md:py-4 overflow-y-auto relative bg-background select-none">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full bg-[#D7EEF1] opacity-[0.10] blur-[90px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[450px] h-[450px] rounded-full bg-secondary-fixed opacity-[0.12] blur-[110px]"></div>
      </div>

      <div className="relative z-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-[#1E707D] text-3xl">school</span>
              My Classrooms
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Manage classrooms, view member lists, and track group progress.
            </p>
          </div>
          {canCreateClassroom && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-[#1E707D] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#165964] transition-all shadow-md shadow-[#1E707D]/10 shrink-0"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Create Classroom</span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        {showStats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#1E707D]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#1E707D] text-xl">school</span>
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
                  className="w-12 h-12 bg-[#1E707D] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-dark transition-all"
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
                      ? 'bg-[#D7EEF1] text-white border-primary-container shadow-sm'
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
                className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl pl-10 pr-4 py-2 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all"
              />
            </div>
          </div>
        )}

        {/* Classroom Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1E707D]/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-on-surface-variant font-medium">Loading classroom list...</p>
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="py-20 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm">
            <span className="material-symbols-outlined text-5xl text-outline mb-3">school</span>
            <h3 className="font-bold text-base text-on-surface">No classrooms found</h3>
            <p className="text-xs text-on-surface-variant mt-1">Try changing the filters or create a new classroom.</p>
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
                    <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-[#1E707D]/20 blur-2xl pointer-events-none"></div>

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
                          onClick={(e) => handleOpenInviteLinkModal(classroom, e)}
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
                            capacityPercent >= 100 ? 'bg-red-500' : isNearFull ? 'bg-amber-500' : 'bg-[#1E707D]'
                          }`}
                          style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-on-surface-variant mt-1.5 text-right">{capacityPercent}% filled</p>
                    </div>

                    {/* Member Avatars Preview */}
                    <div className="mt-auto flex items-center -space-x-2 overflow-hidden">
                      {(classroom.members || []).slice(0, 3).map((member, idx) => (
                        <div
                          key={member.id}
                          title={member.fullName}
                          className={`w-7 h-7 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-[9px] font-extrabold shadow-sm shrink-0 ${getAvatarColor(idx)}`}
                        >
                          {getInitials(member.fullName)}
                        </div>
                      ))}
                      {classroom.memberCount > 3 && (
                        <div className="w-7 h-7 rounded-full border-2 border-surface-container-lowest bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[9px] font-bold shadow-sm shrink-0">
                          +{classroom.memberCount - 3}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="border-t border-outline-variant/40 px-5 py-3.5 flex items-center justify-end bg-surface-container-low/20">
                    <button
                      onClick={() => navigate(`/classrooms/${classroom.id}`)}
                      className="bg-[#1E707D] text-white hover:bg-[#165964] px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
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
              <span className="material-symbols-outlined text-sm text-[#1E707D]">check_circle</span>
              <span>
                Showing <span className="font-bold text-on-surface">{filteredClassrooms.length}</span> of{' '}
                <span className="font-bold text-on-surface">{totalClassrooms}</span> classrooms
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
                <span className="material-symbols-outlined text-[#1E707D] text-xl font-bold">school</span>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                    {newClassroom.semester === 'PERSONAL' ? 'Project Name' : 'Subject Code'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={newClassroom.semester === 'PERSONAL' ? "E.g., DevTrack" : "E.g., SWP391"}
                    value={newClassroom.subjectCode}
                    onChange={(e) => setNewClassroom({ ...newClassroom, subjectCode: e.target.value.toUpperCase() })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all uppercase placeholder:normal-case placeholder:text-outline-variant"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                    {newClassroom.semester === 'PERSONAL' ? 'Group Name' : 'Class Code'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={newClassroom.semester === 'PERSONAL' ? "E.g., Group 04" : "E.g., SE20A11"}
                    value={newClassroom.classCode}
                    onChange={(e) => setNewClassroom({ ...newClassroom, classCode: e.target.value.toUpperCase() })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all uppercase placeholder:normal-case placeholder:text-outline-variant"
                  />
                </div>
              </div>

              {newClassroom.subjectCode && newClassroom.classCode && (
                <div className="bg-[#1E707D]/5 border border-[#1E707D]/20 rounded-xl p-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#1E707D] text-xl shrink-0">info</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Classroom name to be saved: <br />
                    <span className="font-bold text-[#1E707D] mt-1 block text-sm">
                      {newClassroom.semester === 'PERSONAL' 
                        ? `${newClassroom.subjectCode} - ${newClassroom.classCode}`
                        : `${newClassroom.semester === 'SPRING' ? 'SP' : newClassroom.semester === 'SUMMER' ? 'SU' : 'FA'}${newClassroom.academicYear.substring(2, 4)}-${newClassroom.subjectCode}-${newClassroom.classCode}`
                      }
                    </span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select 
                    value={newClassroom.semester}
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected !== 'PERSONAL' && selected !== defaultSemester) {
                        toast.error(`You can only create classrooms for the current semester (${defaultSemester}) or PERSONAL.`);
                        setNewClassroom({ ...newClassroom, semester: defaultSemester });
                      } else {
                        setNewClassroom({ ...newClassroom, semester: selected });
                      }
                    }}
                    className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-[#1E707D] cursor-pointer hover:bg-surface-container transition-colors"
                  >
                    <option value="SPRING">Spring</option>
                    <option value="SUMMER">Summer</option>
                    <option value="FALL">Fall</option>
                    <option value="PERSONAL">Personal</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={`block text-xs font-bold uppercase tracking-wider transition-colors ${newClassroom.semester === 'PERSONAL' ? 'text-outline/40' : 'text-outline'}`}>
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., 2026"
                    value={newClassroom.semester === 'PERSONAL' ? '' : newClassroom.academicYear}
                    disabled={true}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm transition-all bg-surface-container-low/50 border-outline-variant/30 text-on-surface-variant/70 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-outline">
                  Max Members
                </label>
                <input
                  type="number"
                  value={newClassroom.maxMembers}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (val > 50) val = 50;
                    setNewClassroom({ ...newClassroom, maxMembers: val });
                  }}
                  min={5}
                  max={50}
                  className="w-full bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-2.5 text-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] transition-all"
                />
                <p className="text-[10px] text-on-surface-variant">Maximum member limit (5-50).</p>
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
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-[#1E707D] text-white hover:bg-[#165964] text-xs font-bold shadow-md shadow-[#1E707D]/20 transition-all flex items-center justify-center min-w-[120px]"
                >
                  {createMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></div>
                  ) : (
                    'Create'
                  )}
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
                <span className="material-symbols-outlined text-[#1E707D] text-xl">link</span>
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
                Share the link below to invite students to join classroom <strong className="text-on-surface">{inviteLinkModal.subject} - {inviteLinkModal.semester}</strong>.
              </p>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface-container border border-outline-variant/40 rounded-lg px-3 py-2.5 text-xs text-on-surface-variant font-mono truncate">
                  {`${window.location.origin}/classrooms/join?token=${inviteLinkModal.realToken}`}
                </div>
                <button
                  onClick={() => handleCopyInviteLink(inviteLinkModal)}
                  className="shrink-0 bg-[#1E707D] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#165964] transition-all shadow-sm"
                >
                  Copy
                </button>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>This invite link has been generated by the system.</span>
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
                <div className="w-10 h-10 rounded-xl bg-[#1E707D]/10 flex items-center justify-center border border-[#1E707D]/10">
                  <span className="text-[#1E707D] font-black text-sm">{expandedClassroom.subject.slice(0, 3)}</span>
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
                  <span className="material-symbols-outlined text-base text-[#1E707D]">groups</span>
                  Members ({expandedClassroom.members.length} shown / {expandedClassroom.memberCount} total)
                </h4>
                {expandedClassroom.status !== 'ARCHIVED' && (
                  <button
                    onClick={() => toast.success('Member management will be activated later!')}
                    className="text-xs font-bold text-[#1E707D] hover:text-[#165964] flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Add Member
                  </button>
                )}
              </div>

              {expandedClassroom.members.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">group_off</span>
                  <p className="text-xs font-semibold">No detailed member data for archived classrooms.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {expandedClassroom.members.map((member, idx) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/30 border border-outline-variant/30 hover:border-[#1E707D]/20 hover:shadow-sm transition-all"
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
                              ? 'bg-[#1E707D]/10 text-[#1E707D]'
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
                  onClick={() => toast.success('Comment function will be integrated later!')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-sm">comment</span>
                  Comments
                </button>
                <button
                  onClick={() => toast.success('Report export will be integrated later!')}
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
                  <span className="text-[11px] font-bold mt-1 text-slate-300 group-hover/btn:text-white transition-colors">Create</span>
                </button>
              </div>

              {/* Top-Right: Làm mới */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setAssistiveOpen(false);
                    toast.success('Data refreshed!');
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-sky-500 text-sky-400 flex items-center justify-center hover:bg-sky-500/10 transition-colors shadow-sm shadow-sky-500/10">
                    <span className="material-symbols-outlined text-2xl font-bold">sync</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-slate-300 group-hover/btn:text-white transition-colors">Refresh</span>
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
                  <span className={`text-[11px] font-bold mt-1 transition-colors ${showStats ? 'text-sky-400 font-extrabold' : 'text-slate-300 group-hover/btn:text-white'}`}>Stats</span>
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
                  <span className={`text-[11px] font-bold mt-1 transition-colors ${showFilters ? 'text-sky-400 font-extrabold' : 'text-slate-300 group-hover/btn:text-white'}`}>Filters</span>
                </button>
              </div>
            </div>

            {/* Center Home Button for collapsing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#141a24] rounded-2xl border border-slate-800 shadow-md flex items-center justify-center pointer-events-auto">
              <button
                type="button"
                onClick={() => setAssistiveOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-400 hover:bg-slate-300 border border-slate-500/50 cursor-pointer shadow-inner transition-colors flex items-center justify-center outline-none"
                title="Close menu"
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
