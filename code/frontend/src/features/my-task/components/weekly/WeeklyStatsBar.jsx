/**
 * WeeklyStatsBar - 5 chip thống kê tuần
 * Props:
 *   stats: {
 *     total: number,
 *     completed: number,
 *     completedDelta: number,   // so với tuần trước (+ hoặc -)
 *     overdue: number,
 *     overdueDelta: number,
 *     blocked: number,
 *     blockedDelta: number,
 *     rtmCoverage: number,      // % (0-100)
 *     rtmDelta: number,
 *   }
 */
const Chip = ({ dotColor, label, value, delta, deltaColor, valueColor, bgClass = 'bg-[#F9FAFB]', borderClass = 'border-[#E5E7EB]' }) => {
  const deltaSign = delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : '='
  const deltaText = delta !== undefined ? `${deltaSign}${Math.abs(delta)}${label === 'RTM COVERAGE' ? '%' : ''} vs last week` : ''
  const deltaColorClass = delta > 0
    ? (label === 'OVERDUE' || label === 'BLOCKED' ? 'text-[#DC2626]' : 'text-[#16A34A]')
    : delta < 0
    ? (label === 'OVERDUE' || label === 'BLOCKED' ? 'text-[#16A34A]' : 'text-[#DC2626]')
    : 'text-[#9CA3AF]'

  return (
    <div className={`flex-1 ${bgClass} border ${borderClass} rounded-lg p-[10px_12px] hover:border-[#D1D5DB] hover:bg-[#F3F4F6] transition-colors cursor-default flex flex-col items-center text-center`}>
      <div className="flex items-center gap-[6px]">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-[10px] text-[#9CA3AF] uppercase font-bold tracking-[0.04em]">{label}</span>
      </div>
      <div className={`text-[20px] font-medium leading-none mt-1 ${valueColor}`}>
        {label === 'RTM COVERAGE' ? `${value}%` : String(value).padStart(2, '0')}
      </div>
      {deltaText && (
        <div className={`text-[10px] mt-[3px] ${deltaColorClass}`}>{deltaText}</div>
      )}
    </div>
  )
}

const WeeklyStatsBar = ({ stats = {} }) => {
  const {
    total = 0,
    completed = 0,
    completedDelta,
    overdue = 0,
    overdueDelta,
    blocked = 0,
    blockedDelta,
    rtmCoverage = 0,
    rtmDelta,
  } = stats

  return (
    <div className="w-full bg-white border border-[#E5E7EB] rounded-lg p-[10px_16px] shadow-sm flex items-center gap-2">
      <Chip
        dotColor="bg-[#1E3A5F]"
        label="TOTAL TASKS"
        value={total}
        delta={0}
        valueColor="text-[#1E3A5F]"
      />
      <Chip
        dotColor="bg-[#16A34A]"
        label="COMPLETED"
        value={completed}
        delta={completedDelta}
        valueColor="text-[#16A34A]"
      />
      <Chip
        dotColor="bg-[#DC2626]"
        label="OVERDUE"
        value={overdue}
        delta={overdueDelta}
        valueColor="text-[#DC2626]"
        bgClass="bg-[#FEF9F9]"
        borderClass="border-[#FECACA]"
      />
      <Chip
        dotColor="bg-[#F97316]"
        label="BLOCKED"
        value={blocked}
        delta={blockedDelta}
        valueColor="text-[#F97316]"
      />
      <Chip
        dotColor="bg-[#3B82F6]"
        label="RTM COVERAGE"
        value={rtmCoverage}
        delta={rtmDelta}
        valueColor="text-[#3B82F6]"
      />
    </div>
  )
}

export default WeeklyStatsBar
