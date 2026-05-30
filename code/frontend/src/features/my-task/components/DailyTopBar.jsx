/**
 * DailyTopBar - Thanh chứa date navigation + 4 stat chips
 * Props:
 *   selectedDate: Date object
 *   onPrevDay: function
 *   onNextDay: function
 *   stats: { overdue, due, inProgress, done }
 */
const DailyTopBar = ({ selectedDate, onPrevDay, onNextDay, stats }) => {
  const isToday = () => {
    const today = new Date()
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    )
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).toUpperCase()
  }

  const getDayName = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  return (
    <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-5 py-3 flex items-center">
      {/* ZONE 1: Date Navigation */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onPrevDay}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#F3F4F6] text-[#1E3A5F] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        <div className="flex flex-col cursor-default">
          <span className="text-[14px] font-bold text-[#1E3A5F] leading-tight uppercase">
            {formatDate(selectedDate)}
          </span>
          <span className="text-[12px] text-[#6B7280] leading-none capitalize">
            {getDayName(selectedDate)}
          </span>
        </div>

        <button
          onClick={onNextDay}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#F3F4F6] text-[#1E3A5F] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>

        {isToday() && (
          <span className="bg-[#1E3A5F] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
            TODAY
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-8 w-[1px] bg-[#E5E7EB] mx-6" />

      {/* ZONE 2: 4 Stat Chips */}
      <div className="flex-1 flex items-center justify-between">
        {/* Quá hạn */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[#DC2626] text-[20px]">error</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#6B7280] font-bold leading-none uppercase">OVERDUE</span>
            <span className="text-[15px] font-bold text-[#DC2626] leading-tight">
              {String(stats.overdue).padStart(2, '0')} task
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-[#E5E7EB]" />

        {/* Đến hạn */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[#D97706] text-[20px]">schedule</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#6B7280] font-bold leading-none uppercase">DUE</span>
            <span className="text-[15px] font-bold text-[#D97706] leading-tight">
              {String(stats.due).padStart(2, '0')} task
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-[#E5E7EB]" />

        {/* Đang làm */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[#3B82F6] text-[20px]">sync</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#6B7280] font-bold leading-none uppercase">IN PROGRESS</span>
            <span className="text-[15px] font-bold text-[#3B82F6] leading-tight">
              {String(stats.inProgress).padStart(2, '0')} task
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-[#E5E7EB]" />

        {/* Hoàn thành */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[#16A34A] text-[20px]">check_circle</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#6B7280] font-bold leading-none uppercase">DONE</span>
            <span className="text-[15px] font-bold text-[#16A34A] leading-tight">
              {String(stats.done).padStart(2, '0')} task
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyTopBar
