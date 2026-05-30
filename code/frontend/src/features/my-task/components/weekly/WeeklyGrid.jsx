import WeekDayColumn from './WeekDayColumn'
import SpanTaskBar from './SpanTaskBar'

/**
 * WeeklyGrid - 7-column grid hiển thị task theo ngày trong tuần
 * Nhận tasksByDay đã được backend group sẵn theo date key.
 *
 * Props:
 *   weekDays: Date[]           - 7 ngày (T2 → CN)
 *   tasksByDay: object         - { 'YYYY-MM-DD': TaskCalendarItemResponse[] }
 *   todayKey: string           - 'YYYY-MM-DD'
 *   onTaskClick: function
 *   onDayClick: function(Date)
 */

const toDateKey = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
}

const HEAVY_THRESHOLD = 3

const WeeklyGrid = ({ weekDays = [], tasksByDay = {}, spanTasks = [], todayKey, onTaskClick, onDayClick, onNextWeek, onPrevWeek }) => {
  // Height of each span bar is 34px + 6px gap = 40px
  const spanBarHeight = 40;
  
  // Calculate max row index for dynamic height
  const maxRowIndex = spanTasks && spanTasks.length > 0 
    ? Math.max(...spanTasks.map(t => t.topRowIndex || 0)) 
    : -1;
  const spanOffset = maxRowIndex >= 0 ? (maxRowIndex + 1) * spanBarHeight + 12 : 0;

  return (
    <div className="rounded-xl border border-outline-variant bg-white shadow-sm overflow-hidden relative">
      {/* Span Tasks Overlay */}
      {spanTasks && spanTasks.length > 0 && (
        <div className="absolute top-[60px] left-0 w-full z-10 pointer-events-none">
          {spanTasks.map((task) => (
            <div key={task.id} className="pointer-events-auto">
              <SpanTaskBar
                task={task}
                topOffset={(task.topRowIndex || 0) * spanBarHeight}
                onTaskClick={onTaskClick}
                onNextWeek={onNextWeek}
                onPrevWeek={onPrevWeek}
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-7 w-full h-full">
        {weekDays.map((date) => {
          const key      = toDateKey(date)
          const dayTasks = tasksByDay[key] || []
          const jsDay    = date.getDay()
          const isWeekend = jsDay === 0 || jsDay === 6
          const isToday   = key === todayKey
          const isPast    = key < todayKey
          const isHeavy   = !isToday && !isWeekend && dayTasks.length >= HEAVY_THRESHOLD

          return (
            <WeekDayColumn
              key={key}
              date={date}
              tasks={dayTasks}
              isToday={isToday}
              isPast={isPast}
              isWeekend={isWeekend}
              isHeavy={isHeavy}
              todayKey={todayKey}
              spanOffset={spanOffset}
              onTaskClick={onTaskClick}
              onDayClick={onDayClick}
            />
          )
        })}
      </div>
    </div>
  )
}

export default WeeklyGrid
