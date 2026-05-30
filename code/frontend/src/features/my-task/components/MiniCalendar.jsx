/**
 * MiniCalendar - Lịch mini hiển thị tuần hiện tại
 * Props:
 *   selectedDate: Date
 *   onSelectDate: function(Date)
 *   tasksByDate: object { 'YYYY-MM-DD': { hasOverdue, hasDue, hasDone } }
 */
const MiniCalendar = ({ selectedDate, onSelectDate, tasksByDate = {} }) => {
  // Lấy ngày đầu tuần (Thứ 2)
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay() // 0=CN, 1=T2...
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const weekStart = getWeekStart(selectedDate)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  const toKey = (d) => {
    if (!d) return ''
    const local = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
    return local.toISOString().split('T')[0]
  }

  const isSelected = (date) => toKey(date) === toKey(selectedDate)

  const isToday = (date) => toKey(date) === toKey(new Date())

  const getDotColor = (date) => {
    const info = tasksByDate[toKey(date)]
    if (!info) return null
    if (info.hasOverdue) return 'bg-[#DC2626]'
    if (info.hasDue) return 'bg-[#D97706]'
    if (info.hasDone) return 'bg-[#16A34A]'
    return null
  }

  const monthYear = selectedDate.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-4 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-[13px] text-[#1E3A5F]">Tuần này</h4>
        <span className="text-[12px] font-semibold text-[#1E3A5F] capitalize">{monthYear}</span>
      </div>

      {/* Day labels + dates */}
      <div className="grid grid-cols-7 text-center gap-y-3">
        {/* Labels */}
        {DAY_LABELS.map((label) => (
          <span key={label} className="text-[11px] text-[#6B7280] font-medium">
            {label}
          </span>
        ))}

        {/* Date cells */}
        {days.map((date, idx) => {
          const dotColor = getDotColor(date)
          const selected = isSelected(date)
          const today = isToday(date)

          return (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 cursor-pointer"
              onClick={() => onSelectDate(date)}
            >
              {selected ? (
                <div className="w-6 h-6 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center font-bold text-[12px]">
                  {date.getDate()}
                </div>
              ) : (
                <span className={`text-[12px] font-medium hover:text-[#1E3A5F] transition-colors ${today ? 'text-[#1E3A5F] font-bold' : 'text-[#374151]'}`}>
                  {date.getDate()}
                </span>
              )}
              {/* Dot indicator */}
              {dotColor ? (
                <div className={`w-1 h-1 rounded-full ${dotColor}`} />
              ) : (
                <div className="w-1 h-1" /> // placeholder để giữ layout
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MiniCalendar
