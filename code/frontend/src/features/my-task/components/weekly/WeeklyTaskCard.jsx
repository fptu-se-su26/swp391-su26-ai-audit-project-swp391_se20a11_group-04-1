/**
 * WeeklyTaskCard - Card task nhỏ gọn trong weekly grid
 * Nhận TaskCalendarItemResponse từ backend (đã có displayStatus sẵn)
 *
 * Props:
 *   task: TaskCalendarItemResponse
 *   onClick: function
 */

const STATUS_DOT = {
  DONE:        'bg-green-500',
  IN_PROGRESS: 'bg-orange-500',
  IN_REVIEW:   'bg-blue-500',
  BLOCKED:     'bg-red-500',
  TODO:        'bg-gray-300',
  OVERDUE:     'bg-red-500',
  UPCOMING:    'bg-gray-300',
}

const STATUS_BADGE = {
  DONE:        'bg-green-600 text-white',
  IN_PROGRESS: 'bg-orange-500 text-white',
  IN_REVIEW:   'bg-blue-500 text-white',
  BLOCKED:     'bg-red-600 text-white',
  TODO:        'bg-gray-400 text-white',
  OVERDUE:     'bg-red-600 text-white',
  UPCOMING:    'bg-[#DBEAFE] text-[#1D4ED8]',
}

const PRIORITY_BADGE = {
  CRITICAL: 'text-red-600 border-red-200',
  HIGH:     'text-red-600 border-red-200',
  MEDIUM:   'text-on-surface-variant border-outline-variant',
  LOW:      'text-on-surface-variant border-outline-variant',
}

const WeeklyTaskCard = ({ task, onClick }) => {
  // Backend đã tính sẵn displayStatus
  const displayStatus = task.displayStatus || task.status || 'TODO'

  const isOverdue  = displayStatus === 'OVERDUE'
  const isUpcoming = displayStatus === 'UPCOMING'
  const isDone     = displayStatus === 'DONE'

  // Card style theo displayStatus
  const cardStyle = isOverdue
    ? 'bg-[#FEF2F2] border-red-200 border-l-red-600'
    : isDone
    ? 'bg-[#F0FDF4] border-green-200 border-l-green-600'
    : isUpcoming
    ? 'bg-[#F8F9FF] border-outline-variant border-l-[#93C5FD]'
    : task.status === 'IN_PROGRESS'
    ? 'bg-white border-outline-variant border-l-orange-500'
    : task.status === 'IN_REVIEW'
    ? 'bg-white border-outline-variant border-l-blue-500'
    : 'bg-white border-outline-variant border-l-gray-300'

  const titleStyle = isOverdue
    ? 'text-red-700'
    : isDone
    ? 'text-green-700 line-through'
    : 'text-on-surface'

  const dotStyle  = STATUS_DOT[displayStatus]  || 'bg-gray-300'
  const badgeStyle = STATUS_BADGE[displayStatus] || 'bg-gray-400 text-white'

  // Assignee từ backend
  const assignee = task.primaryAssignee || null
  const assigneeInitials = assignee?.initials
    || (assignee?.name ? assignee.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : null)

  const reqCode = task.requirementCode || (task.requirementId ? `REQ-${task.requirementId}` : null)

  return (
    <div
      onClick={() => onClick && onClick(task)}
      className={`${cardStyle} border border-l-[3px] rounded-[10px] p-[10px_12px] shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow`}
    >
      {/* Header: REQ code + status dot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {reqCode && (
            <span className="text-[9px] font-medium text-outline uppercase">{reqCode}</span>
          )}
          {task.type && (
            <span className="bg-blue-100 text-blue-700 text-[8px] font-bold px-1 rounded">
              {task.type}
            </span>
          )}
        </div>
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyle}`} />
      </div>

      {/* Title */}
      <h4 className={`text-[13px] font-semibold ${titleStyle} leading-tight line-clamp-2`}>
        {task.title}
      </h4>

      {/* Priority */}
      {task.priority && (
        <div className="flex items-center gap-[6px]">
          <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded ${PRIORITY_BADGE[task.priority] || 'text-on-surface-variant border-outline-variant'}`}>
            {task.priority}
          </span>
        </div>
      )}

      {/* Status badge */}
      <div className="flex justify-start">
        <span className={`${badgeStyle} text-[10px] font-bold py-1 px-3 rounded-full uppercase tracking-wide`}>
          {displayStatus.replace('_', ' ')}
        </span>
      </div>

      {/* Assignee */}
      {assigneeInitials && (
        <div className="flex items-center gap-1.5">
          <div className="w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[9px] text-white font-bold">
            {assigneeInitials}
          </div>
          {assignee?.name && (
            <span className="text-[10px] text-[#6B7280] font-medium">
              {assignee.name.split(' ').slice(-1)[0]}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default WeeklyTaskCard
