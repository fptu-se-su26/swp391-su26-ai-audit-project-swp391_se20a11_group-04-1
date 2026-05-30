import WeeklyControlBar from './weekly/WeeklyControlBar'
import SprintBanner from './weekly/SprintBanner'
import WeeklyStatsBar from './weekly/WeeklyStatsBar'
import WeeklyGrid from './weekly/WeeklyGrid'
import WeeklyRightPanel from './weekly/WeeklyRightPanel'
import WeeklyFilters from './weekly/WeeklyFilters'
import { useState, useMemo } from 'react'

/**
 * WeeklyView - Render Weekly View từ data đã được backend tính toán sẵn.
 * Frontend KHÔNG tính toán gì — chỉ render.
 *
 * Props:
 *   data: WeeklyViewResponse từ API (có thể null khi đang load)
 *   onPrevWeek, onNextWeek, onThisWeek, onTaskClick, onDayClick
 */

const toDateKey = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
}

const WeeklyView = ({
  data,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onTaskClick,
  onDayClick,
}) => {
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-sm text-on-surface-variant">Không có dữ liệu cho tuần này.</p>
      </div>
    )
  }

  const {
    weekLabel      = '',
    tasksByDay     = {},
    weekStats      = {},
    activeSprint   = null,
    sprintProgress = {},
    teamWorkload   = [],
    aiInsight      = {},
    spanTasks      = [],
    weekStart,
  } = data

  // Tạo mảng 7 ngày từ weekStart backend trả về
  const weekDays = weekStart
    ? Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
      })
    : []

  const todayKey = toDateKey(new Date())

  // --- FILTER STATE ---
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [selectedPriorities, setSelectedPriorities] = useState([])

  // --- EXTRACT ASSIGNEES ---
  // Sử dụng danh sách teamWorkload (chứa tất cả thành viên trong dự án)
  const assignees = useMemo(() => {
    if (!teamWorkload) return []
    return teamWorkload.map(m => ({
      id: m.userId,
      name: m.name,
      email: m.email,
      profile: {
        fullName: m.name,
        avatarUrl: null
      }
    }))
  }, [teamWorkload])

  // --- FILTERING & ROW PACKING ALGORITHM (FRONTEND) ---
  const packedSpanTasks = useMemo(() => {
    // 1. Filter
    let filtered = spanTasks.filter(task => {
      // Filter by status
      const statusMatches = selectedStatuses.length === 0 || 
        selectedStatuses.includes(task.displayStatus)
      // Filter by assignee
      const assigneeMatches = selectedAssignees.length === 0 || 
        (task.primaryAssignee && selectedAssignees.includes(task.primaryAssignee.id))
      // Filter by priority
      const priorityMatches = selectedPriorities.length === 0 ||
        selectedPriorities.includes(task.priority)
      
      return statusMatches && assigneeMatches && priorityMatches
    })

    // 2. Clone to avoid mutating original props
    let packed = filtered.map(t => ({ ...t }))

    // Helper tính trọng số độ ưu tiên
    const getPriorityWeight = (priority) => {
      switch(priority) {
        case 'URGENT': return 4;
        case 'HIGH': return 3;
        case 'MEDIUM': return 2;
        case 'LOW': return 1;
        default: return 0;
      }
    }

    // 3. Sort by: start index -> priority -> length
    packed.sort((a, b) => {
      // 3.1. Ngày bắt đầu (Sớm hơn xếp trên)
      if (a.spanStartIndex !== b.spanStartIndex) {
        return (a.spanStartIndex || 0) - (b.spanStartIndex || 0)
      }
      
      // 3.2. Độ ưu tiên (Cao hơn xếp trên)
      const weightA = getPriorityWeight(a.priority)
      const weightB = getPriorityWeight(b.priority)
      if (weightA !== weightB) {
        return weightB - weightA
      }
      
      // 3.3. Độ dài (Dài hơn xếp trên để làm khung xương)
      return (b.spanLength || 0) - (a.spanLength || 0)
    })

    // 4. Row Packing
    const rowEnds = []
    packed.forEach(task => {
      const start = task.spanStartIndex || 0
      const length = task.spanLength || 1
      const end = start + length - 1
      
      let rowIndex = -1
      for (let i = 0; i < rowEnds.length; i++) {
        if (rowEnds[i] < start) {
          rowIndex = i
          rowEnds[i] = end
          break
        }
      }
      if (rowIndex === -1) {
        rowIndex = rowEnds.length
        rowEnds.push(end)
      }
      task.topRowIndex = rowIndex
    })

    return packed
  }, [spanTasks, selectedStatuses, selectedAssignees, selectedPriorities])

  // Sprint info cho SprintBanner
  const sprintForBanner = activeSprint
    ? {
        name:      activeSprint.name,
        startDate: activeSprint.startDate,
        endDate:   activeSprint.endDate,
        goal:      activeSprint.goal,
        daysLeft:  activeSprint.daysLeft,
      }
    : null

  // AI insight cho right panel
  const aiInsightForPanel = {
    velocityWarning:  aiInsight.velocityWarning  || null,
    overloadedMember: aiInsight.overloadedMember || null,
    suggestions:      aiInsight.suggestions      || [],
    alerts:           aiInsight.alerts           || [],
  }

  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* ── Left: Main content (col-span-9) ── */}
      <div className="col-span-9 space-y-4">
        <WeeklyControlBar
          weekLabel={weekLabel}
          onPrevWeek={onPrevWeek}
          onNextWeek={onNextWeek}
          onThisWeek={onThisWeek}
        />

        <SprintBanner sprint={sprintForBanner} />

        <WeeklyStatsBar stats={{
          total:       weekStats.total       ?? 0,
          completed:   weekStats.completed   ?? 0,
          overdue:     weekStats.overdue     ?? 0,
          blocked:     weekStats.blocked     ?? 0,
          rtmCoverage: weekStats.rtmCoverage ?? 0,
        }} />

        <WeeklyFilters 
          assignees={assignees}
          selectedAssignees={selectedAssignees}
          onAssigneesChange={setSelectedAssignees}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
          selectedPriorities={selectedPriorities}
          onPrioritiesChange={setSelectedPriorities}
        />

        <WeeklyGrid
          weekDays={weekDays}
          tasksByDay={tasksByDay}
          spanTasks={packedSpanTasks}
          todayKey={todayKey}
          onTaskClick={onTaskClick}
          onDayClick={onDayClick}
          onNextWeek={onNextWeek}
          onPrevWeek={onPrevWeek}
        />
      </div>

      {/* ── Right Panel (col-span-3) ── */}
      <WeeklyRightPanel
        sprintProgress={sprintProgress}
        activeSprint={sprintForBanner}
        teamWorkload={teamWorkload}
        aiInsight={aiInsightForPanel}
        onViewReport={() => {}}
      />
    </div>
  )
}

export default WeeklyView
