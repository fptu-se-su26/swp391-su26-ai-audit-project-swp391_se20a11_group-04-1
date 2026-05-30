import DailyTopBar from './DailyTopBar'
import DailyProgressBar from './DailyProgressBar'
import TaskColumn from './TaskColumn'
import MiniCalendar from './MiniCalendar'
import AiInsightPanel from './AiInsightPanel'
import MemberProgressPanel from './MemberProgressPanel'
import DailyFilters from './DailyFilters'
import { useState, useMemo } from 'react'

/**
 * DailyView - Render Daily View từ data đã được backend tính toán sẵn.
 * Frontend KHÔNG tính toán gì — chỉ render.
 *
 * Props:
 *   data: DailyViewResponse từ API (có thể null khi đang load)
 *   selectedDate: Date
 *   onPrevDay, onNextDay, onSelectDate, onTaskClick
 */
const DailyView = ({
  data,
  selectedDate,
  onPrevDay,
  onNextDay,
  onSelectDate,
  onTaskClick,
}) => {
  // Khi chưa có data → hiển thị empty state
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <p className="text-sm text-on-surface-variant">No data for this day.</p>
      </div>
    )
  }

  const {
    overdueTasks = [],
    dueTasks = [],
    ongoingTasks = [],
    doneTasks = [],
    stats = {},
    memberProgress = [],
    aiInsight = {},
  } = data

  // --- FILTER STATE ---
  const [selectedAssignees, setSelectedAssignees] = useState([])
  const [selectedPriorities, setSelectedPriorities] = useState([])

  // --- EXTRACT ASSIGNEES ---
  // Sử dụng danh sách memberProgress (chứa tất cả thành viên trong dự án) thay vì chỉ những người có task hôm nay
  const assignees = useMemo(() => {
    if (!memberProgress) return []
    return memberProgress.map(m => ({
      id: m.userId,
      name: m.name,
      email: m.email,
      profile: {
        fullName: m.name,
        avatarUrl: null
      }
    }))
  }, [memberProgress])

  // --- FILTERING LOGIC ---
  const filterList = (list) => {
    return list.filter(task => {
      const assigneeMatches = selectedAssignees.length === 0 || 
        (task.primaryAssignee && selectedAssignees.includes(task.primaryAssignee.id))
      const priorityMatches = selectedPriorities.length === 0 ||
        selectedPriorities.includes(task.priority)
      return assigneeMatches && priorityMatches
    })
  }

  const fOverdue = useMemo(() => filterList(overdueTasks), [overdueTasks, selectedAssignees, selectedPriorities])
  const fDue     = useMemo(() => filterList(dueTasks), [dueTasks, selectedAssignees, selectedPriorities])
  const fOngoing = useMemo(() => filterList(ongoingTasks), [ongoingTasks, selectedAssignees, selectedPriorities])
  const fDone    = useMemo(() => filterList(doneTasks), [doneTasks, selectedAssignees, selectedPriorities])

  // Stats cho TopBar — dùng danh sách đã lọc để luôn đồng bộ
  const topBarStats = {
    overdue:    fOverdue.length,
    due:        fDue.length,
    inProgress: fOngoing.length,
    done:       fDone.length,
  }

  const totalFiltered = fOverdue.length + fDue.length + fOngoing.length + fDone.length

  // tasksByDate cho MiniCalendar — build từ overdue/due/done tasks
  // (chỉ dùng để hiển thị dot màu trên calendar, không cần backend tính)
  const tasksByDate = {}
  const addToMap = (tasks, type) => {
    tasks.forEach((t) => {
      if (!t.deadline) return
      const key = t.deadline.split('T')[0] || t.deadline
      if (!tasksByDate[key]) tasksByDate[key] = { hasOverdue: false, hasDue: false, hasDone: false }
      if (type === 'overdue') tasksByDate[key].hasOverdue = true
      if (type === 'due')     tasksByDate[key].hasDue = true
      if (type === 'done')    tasksByDate[key].hasDone = true
    })
  }
  
  // Chỉ lấy task thực sự Overdue (bỏ qua Blocked có deadline ở tương lai) để đánh dấu chấm đỏ
  const actualOverdue = overdueTasks.filter(t => t.displayStatus === 'OVERDUE')
  addToMap(actualOverdue, 'overdue')
  addToMap(dueTasks, 'due')
  addToMap(doneTasks, 'done')

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Top Bar: date nav + 4 stat chips */}
      <DailyTopBar
        selectedDate={selectedDate}
        onPrevDay={onPrevDay}
        onNextDay={onNextDay}
        stats={topBarStats}
      />

      {/* Progress Bar & Daily Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <DailyProgressBar
            done={fDone.length}
            total={totalFiltered}
          />
        </div>
        <div className="shrink-0 self-stretch flex items-center">
          <DailyFilters 
            assignees={assignees}
            selectedAssignees={selectedAssignees}
            onAssigneesChange={setSelectedAssignees}
            selectedPriorities={selectedPriorities}
            onPrioritiesChange={setSelectedPriorities}
          />
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex items-stretch gap-4 flex-1">
        {/* Left: 4 Columns (was 3) */}
        <div className="flex-1 flex items-start gap-3 min-w-0">
          <TaskColumn variant="overdue" tasks={fOverdue} onTaskClick={onTaskClick} />
          <TaskColumn variant="due"     tasks={fDue}     onTaskClick={onTaskClick} />
          <TaskColumn variant="ongoing" tasks={fOngoing} onTaskClick={onTaskClick} />
          <TaskColumn variant="done"    tasks={fDone}    onTaskClick={onTaskClick} />
        </div>

        {/* Right Panel */}
        <aside className="w-[260px] flex flex-col gap-4 shrink-0">
          <MiniCalendar
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            tasksByDate={tasksByDate}
          />
          <AiInsightPanel
            stats={{
              overdue:        aiInsight.velocityWarning ? topBarStats.overdue : 0,
              blockedMembers: [],
              bottleneck:     aiInsight.overloadedMember || '',
              velocityWarning: aiInsight.velocityWarning,
              alerts:         aiInsight.alerts || [],
              suggestions:    aiInsight.suggestions || [],
            }}
            lastUpdated={aiInsight.generatedAt ? 'just now' : '5m ago'}
          />
          <MemberProgressPanel members={memberProgress} />
        </aside>
      </div>
    </div>
  )
}

export default DailyView
