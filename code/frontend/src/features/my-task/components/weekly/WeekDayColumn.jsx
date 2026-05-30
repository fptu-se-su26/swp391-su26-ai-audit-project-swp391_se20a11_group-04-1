import WeeklyTaskCard from './WeeklyTaskCard'

/**
 * WeekDayColumn - 1 cột ngày trong weekly grid
 * Props:
 *   date: Date
 *   tasks: array
 *   isToday: boolean
 *   isPast: boolean
 *   isWeekend: boolean
 *   isHeavy: boolean  (nhiều task)
 *   todayKey: string  'YYYY-MM-DD'
 *   onTaskClick: function
 *   onDayClick: function(Date)
 */

const DAY_LABELS_EN = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

const toDateKey = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
}

const WeekDayColumn = ({
  date,
  tasks = [],
  isToday = false,
  isPast = false,
  isWeekend = false,
  isHeavy = false,
  todayKey,
  spanOffset = 0,
  onTaskClick,
  onDayClick,
}) => {
  // Xác định index ngày trong tuần (0=T2 ... 6=CN)
  const jsDay = date.getDay() // 0=CN, 1=T2...
  const idx = jsDay === 0 ? 6 : jsDay - 1
  const dayLabel = DAY_LABELS_EN[idx]

  // Đếm overdue trong cột này — dùng displayStatus từ backend
  const overdueCount = tasks.filter(
    (t) => t.displayStatus === 'OVERDUE' || t.displayStatus === 'BLOCKED'
  ).length

  // Style cột
  const colBg = isToday
    ? 'today-col'
    : isWeekend
    ? 'weekend-bg'
    : isHeavy
    ? 'heavy-day'
    : 'bg-white'

  // Style header
  const headerBg = isToday ? 'bg-[#1E3A5F]' : 'bg-white'
  const headerBorder = isToday ? '' : 'border-b border-outline-variant'
  const dayLabelColor = isToday ? 'text-white' : isWeekend ? 'text-[#D1D5DB]' : 'text-[#9CA3AF]'
  const dateColor = isToday ? 'text-white font-bold text-[20px]' : isWeekend ? 'text-[#9CA3AF] text-[18px] font-medium' : 'text-[#111827] text-[18px] font-medium'

  // Border cột
  const colBorder = isToday
    ? ''
    : 'border-r border-outline-variant'

  return (
    <div
      className={`${colBg} ${colBorder} flex flex-col`}
      style={isToday ? { borderLeft: '1.5px solid #93C5FD', borderRight: '1.5px solid #93C5FD' } : {}}
    >
      {/* Day Header */}
      <div
        className={`h-[52px] ${headerBg} ${headerBorder} flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${isToday ? 'rounded-t-[8px]' : ''}`}
        onClick={() => onDayClick && onDayClick(date)}
      >
        <p className={`text-[11px] font-bold uppercase ${dayLabelColor}`}>{dayLabel}</p>
        <p className={dateColor}>{date.getDate()}</p>
      </div>

      {/* Task list */}
      <div 
        className="p-2 flex-1 flex flex-col min-h-[500px]"
        style={{ paddingTop: `calc(0.5rem + ${spanOffset}px)` }}
      >
        <div className="flex-1 space-y-2 relative">
          {/* Grid lines can go here if needed */}
          {tasks.map((task) => (
            <WeeklyTaskCard
              key={task.id}
              task={task}
              onClick={onTaskClick}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-outline-variant mt-2">
          <p className={`text-[10px] ${isToday ? 'text-[#1E3A5F] font-bold' : 'text-on-surface-variant'}`}>
            &nbsp;
          </p>
        </div>
      </div>
    </div>
  )
}

export default WeekDayColumn
