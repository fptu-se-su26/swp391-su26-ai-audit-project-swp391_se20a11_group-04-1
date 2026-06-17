/**
 * TaskCard - Hiển thị 1 card task trong Daily View
 * Nhận data trực tiếp từ TaskCalendarItemResponse (backend đã tính sẵn displayStatus)
 *
 * Props:
 *   task: TaskCalendarItemResponse
 *   variant: 'overdue' | 'due' | 'done'
 *   onClick: function
 */

const PRIORITY_STYLE = {
  CRITICAL: 'bg-[#DC2626] text-white',
  HIGH:     'bg-[#D97706] text-white',
  MEDIUM:   'bg-[#3B82F6] text-white',
  LOW:      'bg-[#16A34A] text-white',
}

const STATUS_STYLE = {
  OVERDUE:     'bg-[#DC2626] text-white',
  BLOCKED:     'bg-[#D97706] text-white',
  IN_PROGRESS: 'bg-[#3B82F6] text-white',
  IN_REVIEW:   'bg-[#a855f7] text-white',
  DONE:        'bg-[#16A34A] text-white',
  TODO:        'bg-[#9CA3AF] text-white',
  UPCOMING:    'bg-[#DBEAFE] text-[#1D4ED8]',
}

const TaskCard = ({ task, variant = 'due', onClick }) => {
  const cardBg    = variant === 'done' ? 'bg-[#F0FDF4]' : 'bg-white'
  const titleColor = variant === 'done' ? 'text-[#166534]' : 'text-[#111827]'

  // Backend đã tính sẵn displayStatus
  const displayStatus = task.displayStatus || task.status || 'TODO'

  // Assignee từ backend: task.primaryAssignee.name / .initials
  const assignee = task.primaryAssignee || null
  const assigneeName    = assignee?.name     || ''
  const assigneeInitials = assignee?.initials || (assigneeName ? assigneeName.slice(0, 2).toUpperCase() : '?')

  // Req code
  const reqCode = task.requirementCode || (task.requirementId ? `REQ-${task.requirementId}` : null)

  // Deadline display
  const formatDeadline = (deadline) => {
    if (!deadline) return null
    const d = new Date(deadline)
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short' })
  }

  const formatTime = (updatedAt) => {
    if (!updatedAt) return null
    const d = new Date(updatedAt)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const calculateOngoingDays = () => {
    if (variant !== 'ongoing') return null
    const start = task.startDate
    if (!start) return 1
    const startDateObj = new Date(start)
    const today = new Date()
    startDateObj.setHours(0,0,0,0)
    today.setHours(0,0,0,0)
    const diffTime = today - startDateObj
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays + 1 : 1
  }

  const ongoingDays = calculateOngoingDays()
  const isStale = ongoingDays > 3

  return (
    <div
      onClick={() => onClick && onClick(task)}
      className={`${cardBg} p-[12px_14px] rounded-[10px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.07)] cursor-pointer hover:-translate-y-0.5 transition-transform duration-200`}
    >
      {/* Header: ID + Priority */}
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-[11px] text-[#6B7280] uppercase">
          {task.taskCode || `T-${task.id}`}
          {reqCode && ` • ${reqCode}`}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] uppercase ${PRIORITY_STYLE[task.priority] || 'bg-gray-400 text-white'}`}>
          {task.priority}
        </span>
      </div>

      {/* Title */}
      <h4 className={`font-semibold ${titleColor} text-[14px] leading-[1.45] mb-2 line-clamp-2`}>
        {task.title}
      </h4>

      {/* Type + Status badge */}
      <div className="flex flex-wrap gap-2 mb-3">
        {task.type && (
          <span className="bg-[#F3F4F6] text-[#374151] text-[10px] px-2 py-0.5 rounded font-medium">
            {task.type}
          </span>
        )}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${STATUS_STYLE[displayStatus] || 'bg-gray-400 text-white'}`}>
          {displayStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Footer: Assignee + deadline/time */}
      <div className="border-t border-[#F3F4F6] pt-2 mt-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-bold">
            {assigneeInitials}
          </div>
          <span className="text-[11px] text-[#6B7280]">
            {task.evidenceCount > 0 ? 'Evidence Logged' : 'No Evidence'}
          </span>
        </div>

        {variant === 'done' && task.updatedAt ? (
          <span className="text-[12px] font-bold text-[#16A34A]">
            {formatTime(task.updatedAt)}
          </span>
        ) : variant === 'ongoing' ? (
          <span className={`text-[11px] font-bold flex items-center gap-1 ${isStale ? 'text-[#DC2626]' : 'text-[#3B82F6]'}`}>
            <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
            Day {ongoingDays}
          </span>
        ) : task.deadline ? (
          <span className={`text-[12px] font-bold ${variant === 'overdue' ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
            {formatDeadline(task.deadline)}
          </span>
        ) : task.estimatedHours ? (
          <span className="text-[12px] font-bold text-[#374151]">{task.estimatedHours}h</span>
        ) : null}
      </div>
    </div>
  )
}

export default TaskCard
