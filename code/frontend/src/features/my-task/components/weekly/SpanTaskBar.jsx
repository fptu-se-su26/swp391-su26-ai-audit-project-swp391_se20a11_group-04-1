import React from 'react'

/**
 * SpanTaskBar - Render horizontal bar for multi-day tasks in WeeklyView.
 */
const SpanTaskBar = ({ task, topOffset, onTaskClick, onNextWeek, onPrevWeek }) => {
  const { spanStartIndex, spanLength, isStartCut, isEndCut } = task

  // Calculate position (each column is 1/7 or 14.28%)
  const leftPercent = (spanStartIndex / 7) * 100
  const widthPercent = (spanLength / 7) * 100

  // Border radius based on cuts
  const borderRadius = `${isStartCut ? '0px' : '8px'} ${isEndCut ? '0px' : '8px'} ${isEndCut ? '0px' : '8px'} ${isStartCut ? '0px' : '8px'}`

  // Colors based on status
  let bgClass = 'bg-gradient-to-r from-blue-500 to-blue-600' // default ongoing
  let textClass = 'text-white'
  
  if (task.displayStatus === 'DONE') {
    bgClass = 'bg-gradient-to-r from-emerald-500 to-emerald-600 opacity-80'
  } else if (task.displayStatus === 'OVERDUE') {
    bgClass = 'bg-gradient-to-r from-red-500 to-red-600'
  } else if (task.displayStatus === 'BLOCKED') {
    bgClass = 'bg-gradient-to-r from-rose-700 to-red-900'
  }

  // Priority Dot
  const pColor = {
    CRITICAL: 'bg-rose-300 shadow-[0_0_5px_rgba(253,164,175,0.8)]',
    HIGH: 'bg-orange-300',
    MEDIUM: 'bg-yellow-300',
    LOW: 'bg-green-300',
  }[task.priority] || 'bg-gray-300'

  // Assignee Avatar
  const assigneeInfo = task.primaryAssignee
  const initials = assigneeInfo?.initials || '?'
  const avatarBg = assigneeInfo ? 'bg-indigo-900/40' : 'bg-gray-900/30'

  return (
    <div
      className={`absolute h-[34px] ${bgClass} shadow-md cursor-pointer flex items-center hover:-translate-y-[1px] hover:shadow-lg transition-all z-10`}
      style={{
        left: `calc(${leftPercent}% + 5px)`,
        width: `calc(${widthPercent}% - 10px)`,
        top: `${topOffset}px`,
        borderRadius: borderRadius,
      }}
      onClick={() => onTaskClick && onTaskClick(task)}
    >
      {/* Start Cut Arrow */}
      {isStartCut && (
        <div 
          className="h-full flex items-center px-1.5 hover:bg-white/20 transition-colors"
          onClick={(e) => { e.stopPropagation(); onPrevWeek && onPrevWeek(); }}
        >
          <span className="material-symbols-outlined text-white/90 text-[14px]">
            arrow_back_ios
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex items-center overflow-hidden ${isStartCut ? 'pl-1' : 'pl-3'} ${isEndCut ? 'pr-1' : 'pr-2'}`}>
        {/* Priority Indicator */}
        <div className={`w-2 h-2 rounded-full ${pColor} mr-2 shrink-0`}></div>
        
        {/* Text */}
        <div className="flex items-center overflow-hidden mr-3">
          <span className="text-white font-bold text-[11px] whitespace-nowrap mr-1.5 opacity-90">
            {task.taskCode}
          </span>
          <span className="text-white font-bold text-[9px] uppercase px-1 py-0.5 rounded-sm bg-white/20 whitespace-nowrap mr-1.5 leading-none mt-0.5">
            {task.priority}
          </span>
          <span className="text-white text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis opacity-100">
            {task.title}
          </span>
        </div>
        
        {/* Assignee Avatar (pushed to right) */}
        <div className="ml-auto flex items-center justify-center shrink-0">
          <div className={`w-[22px] h-[22px] rounded-full ${avatarBg} border border-white/20 flex items-center justify-center`}>
            <span className="text-white text-[9px] font-bold">{initials}</span>
          </div>
        </div>
      </div>

      {/* End Cut Arrow */}
      {isEndCut && (
        <div 
          className="h-full flex items-center px-1.5 hover:bg-white/20 transition-colors"
          onClick={(e) => { e.stopPropagation(); onNextWeek && onNextWeek(); }}
        >
          <span className="material-symbols-outlined text-white/90 text-[14px]">
            arrow_forward_ios
          </span>
        </div>
      )}
      
      {/* Subtle Progress Bar animation effect */}
      {task.displayStatus !== 'DONE' && (
        <div className="absolute top-0 left-0 h-full w-[100px] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_3s_infinite] pointer-events-none"></div>
      )}
    </div>
  )
}

export default SpanTaskBar
