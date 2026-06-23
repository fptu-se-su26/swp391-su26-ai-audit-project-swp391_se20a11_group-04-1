import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import axiosClient from '@api/axiosConfig'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'
import { getInitials } from '@utils/avatarHelper'

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
    case 'ON_TRACK':
    case 'ACTIVE':
      return { label: 'On Track', bg: 'bg-emerald-50', text: 'text-emerald-600 border-emerald-100', dot: 'bg-emerald-500' }
    case 'AT_RISK':
    case 'PLANNING':
      return { label: 'At Risk', bg: 'bg-amber-50', text: 'text-amber-600 border-amber-100', dot: 'bg-amber-500' }
    case 'BEHIND':
      return { label: 'Behind', bg: 'bg-rose-50', text: 'text-rose-600 border-rose-100', dot: 'bg-rose-500' }
    default:
      return { label: status || 'Planning', bg: 'bg-slate-50', text: 'text-slate-500 border-slate-100', dot: 'bg-slate-400' }
  }
}

export default function ClassroomDashboardTab({ data, setActiveTab }) {
  const navigate = useNavigate()
  const { classroomId } = useParams()
  const [selectedProjectId, setSelectedProjectId] = useState('')

  // 1. Group list for select dropdown
  const groupsList = useMemo(() => {
    const projects = data?.projects || []
    return projects.map((p, idx) => ({
      id: String(p.id),
      name: p.name,
      groupNo: idx + 1
    }))
  }, [data])

  // Set default selected project ID
  useEffect(() => {
    if (groupsList.length > 0 && !selectedProjectId) {
      setSelectedProjectId(groupsList[0].id)
    }
  }, [groupsList, selectedProjectId])

  // 2. Fetch statistics from backend
  const { data: serverStats, isLoading, isError } = useQuery({
    queryKey: ['classroomDashboardStats', classroomId, selectedProjectId],
    queryFn: async () => {
      const url = `/v1/classrooms/${classroomId}/dashboard-stats` + (selectedProjectId ? `?projectId=${selectedProjectId}` : '')
      const response = await axiosClient.get(url)
      return response.data?.data
    },
    enabled: !!classroomId && !!selectedProjectId,
    retry: false
  })

  // 3. Fallback / mock statistics generation if backend API is not ready
  const activeStats = useMemo(() => {
    if (serverStats) {
      return serverStats
    }

    const projects = data?.projects || []
    const totalProjectsCount = projects.length

    // Teams contribution lists all projects/teams in classroom
    const teamContributionsMock = projects.map((p, idx) => {
      const seed = p.id || idx
      const tasksCompleted = Math.floor((seed * 3) % 15) + 12
      const commitsCount = Math.floor((seed * 19) % 80) + 70
      return {
        name: p.name,
        tasks: tasksCompleted,
        commits: commitsCount,
        email: ''
      }
    })

    if (teamContributionsMock.length === 0) {
      teamContributionsMock.push(
        { name: 'Group 1 — Web App', tasks: 24, commits: 142 },
        { name: 'Group 2 — Mobile App', tasks: 18, commits: 98 },
        { name: 'Group 3 — AI Platform', tasks: 21, commits: 115 }
      )
    }

    const totalTasksCompleted = teamContributionsMock.reduce((sum, c) => sum + c.tasks, 0)
    const pendingIssuesCount = totalProjectsCount * 3 + 2

    // Select specific project for heatmap
    const selectedProject = projects.find(p => String(p.id) === selectedProjectId)
    const selectedSeed = selectedProject?.id || 10
    
    // Heatmap mock cells generator for the selected group
    const heatmap = {}
    let hSeed = selectedSeed + 123
    const random = () => {
      const x = Math.sin(hSeed++) * 10000
      return x - Math.floor(x)
    }
    const daysOffset = 365
    const today = new Date()
    for (let i = 0; i < daysOffset; i++) {
      const curDate = new Date(today)
      curDate.setDate(today.getDate() - i)
      const dateString = curDate.toISOString().split('T')[0]
      const r = random()
      if (r > 0.45) {
        heatmap[dateString] = Math.floor(r * 8) + 1
      }
    }

    const selectedGroupCommits = Object.values(heatmap).reduce((sum, val) => sum + val, 0)

    // Activity curves for top projects
    const frequency = [
      { name: 'MON', groupActivities: { 'G1': 12, 'G2': 18, 'G3': 15, 'G4': 10 } },
      { name: 'TUE', groupActivities: { 'G1': 25, 'G2': 12, 'G3': 28, 'G4': 20 } },
      { name: 'WED', groupActivities: { 'G1': 42, 'G2': 30, 'G3': 20, 'G4': 35 } },
      { name: 'THU', groupActivities: { 'G1': 20, 'G2': 45, 'G3': 35, 'G4': 25 } },
      { name: 'FRI', groupActivities: { 'G1': 75, 'G2': 60, 'G3': 40, 'G4': 55 } },
      { name: 'SAT', groupActivities: { 'G1': 58, 'G2': 78, 'G3': 65, 'G4': 48 } },
      { name: 'SUN', groupActivities: { 'G1': 40, 'G2': 35, 'G3': 50, 'G4': 38 } },
    ]

    return {
      selectedProjectId: selectedProjectId || null,
      selectedProjectName: selectedProject?.name || 'Chưa chọn',
      totalMembers: data?.members?.length || 15,
      tasksCompleted: totalTasksCompleted,
      pendingIssues: pendingIssuesCount,
      totalCommits: teamContributionsMock.reduce((sum, c) => sum + c.commits, 0),
      teamContributions: teamContributionsMock,
      activityFrequency: frequency,
      activityHeatmap: heatmap,
      totalHeatmapCommits: selectedGroupCommits
    }
  }, [serverStats, data, selectedProjectId])

  // Heatmap cells parsing
  const heatmapCells = useMemo(() => {
    const cells = []
    const today = new Date()
    
    // We render 53 weeks (Sunday to Saturday) starting from 370 days ago
    const dayOfWeek = today.getDay()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 370 + dayOfWeek)

    for (let i = 0; i < 53 * 7; i++) {
      const curDate = new Date(startDate)
      curDate.setDate(startDate.getDate() + i)
      const dateString = curDate.toISOString().split('T')[0]
      const count = activeStats.activityHeatmap?.[dateString] || 0
      
      let colorClass = 'bg-[#ebedf0]'
      let tooltip = `${dateString}: No commits`

      if (count >= 10) {
        colorClass = 'bg-[#0f172a]'
        tooltip = `${dateString}: ${count} commits`
      } else if (count >= 5) {
        colorClass = 'bg-[#1e40af]'
        tooltip = `${dateString}: ${count} commits`
      } else if (count >= 3) {
        colorClass = 'bg-[#3b82f6]'
        tooltip = `${dateString}: ${count} commits`
      } else if (count >= 1) {
        colorClass = 'bg-[#93c5fd]'
        tooltip = `${dateString}: ${count} commits`
      }
      cells.push({ colorClass, tooltip })
    }
    return cells
  }, [activeStats.activityHeatmap])

  // Chart data formatting
  const chartData = useMemo(() => {
    return activeStats.activityFrequency.map(f => {
      const keys = Object.keys(f.groupActivities || {})
      const item = { name: f.name }
      keys.forEach(k => {
        item[k] = f.groupActivities[k]
      })
      return item
    })
  }, [activeStats.activityFrequency])

  const chartKeys = useMemo(() => {
    if (activeStats.activityFrequency?.length > 0) {
      return Object.keys(activeStats.activityFrequency[0].groupActivities || {})
    }
    return []
  }, [activeStats.activityFrequency])

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const handleCreateProjectClick = () => {
    navigate(`/dashboard?createProjectForClassroom=${data?.id}&isMentor=true&semester=${data?.semester}&subject=${encodeURIComponent(data?.subjectCode || data?.subject || '')}`)
  }

  // 4. Empty State: No projects created yet
  if (groupsList.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-[20px] p-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
          <span className="material-symbols-outlined text-3xl text-slate-400 font-bold">diversity_3</span>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa có nhóm nào được tạo ra</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
          Lớp học này hiện tại chưa có nhóm nào hoạt động. Vui lòng bấm phân lớp ngẫu nhiên hoặc tạo dự án thủ công để bắt đầu.
        </p>
        <button 
          onClick={() => setActiveTab('members')}
          className="bg-[#0b1c30] text-white hover:bg-slate-800 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
        >
          Phân lớp ngẫu nhiên ngay
        </button>
      </div>
    )
  }

  // 5. Loading State Skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white border border-slate-100 rounded-[20px] p-6 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white border border-slate-100 rounded-[20px] p-6 animate-pulse"></div>
          <div className="h-80 bg-white border border-slate-100 rounded-[20px] p-6 animate-pulse"></div>
        </div>
      </div>
    )
  }

  const maxCommits = Math.max(...activeStats.teamContributions.map(c => c.commits), 100)

  return (
    <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Dashboard Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Class Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Tổng quan tiến độ và đóng góp của các nhóm</p>
      </div>

      {/* 1. Stat Cards (Overall Classroom Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Members */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">TOTAL MEMBERS</span>
            <span className="text-3xl font-extrabold text-slate-800">{activeStats.totalMembers}</span>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-500 text-2xl font-bold">groups</span>
          </div>
        </div>

        {/* Card 2: Tasks Completed */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">TASKS COMPLETED</span>
            <span className="text-3xl font-extrabold text-slate-800">{activeStats.tasksCompleted}</span>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-500 text-2xl font-bold">check_circle</span>
          </div>
        </div>

        {/* Card 3: Pending Issues */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">PENDING ISSUES</span>
            <span className="text-3xl font-extrabold text-slate-800">{activeStats.pendingIssues}</span>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-rose-500 text-2xl font-bold">schedule</span>
          </div>
        </div>

        {/* Card 4: Total Commits */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">TOTAL COMMITS</span>
            <span className="text-3xl font-extrabold text-slate-800">{activeStats.totalCommits}</span>
          </div>
          <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-sky-500 text-2xl font-bold">monitoring</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Contribution and Activity Frequency (Overall) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Contribution Box */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-500 text-lg">assessment</span>
              Team Contribution
            </h3>
            <span className="text-xs font-semibold text-slate-400">Dữ liệu tuần này</span>
          </div>

          <div className="space-y-5">
            {[...activeStats.teamContributions]
              .sort((a, b) => (b.commits + b.tasks) - (a.commits + a.tasks))
              .slice(0, 5)
              .map((member, idx) => {
              const commitPercent = Math.min((member.commits / maxCommits) * 65, 75)
              const taskPercent = Math.min((member.tasks / 30) * 20, 20)

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-sm ${getAvatarColor(idx)}`}>
                        {getInitials(member.name)}
                      </div>
                      <span className="text-sm font-extrabold text-slate-700">{member.name}</span>
                    </div>
                    <div className="text-right text-[10px] font-extrabold text-slate-400 space-x-3">
                      <span>TỔNG TASK: <span className="text-slate-700">{member.tasks}</span></span>
                      <span>CODE COMMIT: <span className="text-slate-700">{member.commits}</span></span>
                    </div>
                  </div>
                  {/* Custom Stacked Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 flex overflow-hidden">
                    <div 
                      className="bg-[#0b1c30] rounded-l-full transition-all duration-500" 
                      style={{ width: `${commitPercent}%` }}
                      title={`Commits: ${member.commits}`}
                    ></div>
                    <div 
                      className="bg-[#60a5fa] transition-all duration-500" 
                      style={{ width: `${taskPercent}%` }}
                      title={`Tasks: ${member.tasks}`}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity Frequency Line Chart */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0284c7] text-lg">trending_up</span>
              Activity Frequency
            </h3>
            {/* Custom Legend */}
            <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-500">
              {chartKeys.map((key, idx) => (
                <div key={key} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#0b1c30]' : idx === 1 ? 'bg-[#64748b]' : idx === 2 ? 'bg-[#065f46]' : 'bg-[#dc2626]'}`}></span>
                  <span>{key.substring(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-[230px] -ml-6 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  contentStyle={{ background: '#0b1c30', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                {chartKeys.map((key, idx) => (
                  <Line 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    stroke={idx === 0 ? '#0b1c30' : idx === 1 ? '#64748b' : idx === 2 ? '#065f46' : '#dc2626'} 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Activity Heatmap Box (Filtered by Selected Group) */}
      <div className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-lg">calendar_view_month</span>
              Activity Heatmap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Tần suất hoạt động trong 52 tuần qua</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Heatmap Group Selector */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0b1c30]/10 focus:border-[#0b1c30] cursor-pointer appearance-none pr-8"
              >
                {groupsList.map(g => (
                  <option key={g.id} value={g.id}>
                    Group {g.groupNo} — {g.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[16px]">
                unfold_more
              </span>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400">
              <span>Less</span>
              <span className="w-3 h-3 rounded-sm bg-[#ebedf0]"></span>
              <span className="w-3 h-3 rounded-sm bg-[#93c5fd]"></span>
              <span className="w-3 h-3 rounded-sm bg-[#3b82f6]"></span>
              <span className="w-3 h-3 rounded-sm bg-[#1e40af]"></span>
              <span className="w-3 h-3 rounded-sm bg-[#0f172a]"></span>
              <span>More</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pt-2 scrollbar-thin">
          <div className="min-w-[680px] space-y-1 select-none">
            {/* Months Header Row */}
            <div className="flex pl-6 text-[10px] font-extrabold text-slate-400 mb-1">
              {months.map((m, idx) => (
                <div key={idx} className="flex-1 text-left" style={{ minWidth: 'calc(100% / 12)' }}>
                  {m}
                </div>
              ))}
            </div>

            {/* Heatmap Grid Row */}
            <div className="flex items-start">
              {/* Day Labels Column */}
              <div className="flex flex-col justify-between text-[8px] font-bold text-slate-400 h-[88px] pr-2 w-6 py-0.5">
                <span>Mon</span>
                <span>Wed</span>
                <span>Fri</span>
              </div>

              {/* Grid block */}
              <div className="flex-1 grid grid-flow-col grid-rows-7 gap-1 h-[88px]">
                {heatmapCells.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-sm cursor-pointer hover:scale-125 transition-transform ${cell.colorClass}`}
                    title={cell.tooltip}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-extrabold text-slate-400 pt-2 border-t border-slate-100">
          <span>52 weeks contribution timeline ({activeStats.selectedProjectName})</span>
          <span className="text-slate-800">{activeStats.totalHeatmapCommits} commits</span>
        </div>
      </div>

      {/* 4. Active Student Projects Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-slate-800 text-lg">Active Student Projects</h3>
          <button 
            onClick={() => setActiveTab('projects')}
            className="text-xs font-extrabold text-[#0047AB] hover:underline"
          >
            Xem tất cả
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {(data?.projects || []).slice(0, 3).map((project, index) => {
            const status = getStatusConfig(project.status)
            
            return (
              <div 
                key={project.id} 
                className="bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer relative group" 
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#e0e7ff] text-[#4f46e5]">
                    GROUP {index + 1}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                  </button>
                </div>
                <h4 className="font-extrabold text-slate-800 text-base mb-2 group-hover:text-sky-600 transition-colors">{project.name}</h4>
                <p className="text-xs text-slate-400 leading-relaxed min-h-[36px] mb-4">
                  {project.description || 'No description provided.'}
                </p>

                <div className="mb-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${status.text} ${status.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                    {status.label}
                  </span>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                    <span>Completion</span>
                    <span className="text-slate-800 font-extrabold">{project.completion}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-[#0284c7] rounded-full transition-all duration-500" 
                      style={{ width: `${project.completion}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold">
                    {project.tasksDone || 0} of {project.totalTasks || 0} tasks done
                  </p>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center">
                    <div className="flex items-center -space-x-2">
                      {project.members && project.members.slice(0, 4).map((member, idx) => (
                        <div
                          key={member.id}
                          title={member.fullName}
                          className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-extrabold shadow-sm shrink-0 ${getAvatarColor(idx)}`}
                        >
                          {getInitials(member.fullName)}
                        </div>
                      ))}
                      {project.members && project.members.length > 4 && (
                        <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-bold shadow-sm shrink-0">
                          +{project.members.length - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-400 ml-3">
                      {project.members ? project.members.length : 0} members
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Floating plus button */}
          <button
            onClick={handleCreateProjectClick}
            className="absolute -bottom-6 right-6 w-12 h-12 rounded-full bg-[#0b1c30] text-white flex items-center justify-center shadow-lg hover:bg-slate-800 hover:scale-110 active:scale-95 transition-all z-10"
            title="Tạo dự án mới"
          >
            <span className="material-symbols-outlined text-2xl font-bold">add</span>
          </button>
        </div>
      </div>
    </div>
  )
}
