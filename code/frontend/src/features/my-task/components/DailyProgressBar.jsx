/**
 * DailyProgressBar - Thanh tiến độ hôm nay
 * Props:
 *   done: number - số task đã xong
 *   total: number - tổng số task
 */
const DailyProgressBar = ({ done, total }) => {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="bg-white rounded-[8px] border border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[13px] font-bold text-[#1E3A5F]">Today's Progress</span>
        <span className="text-[12px] text-[#6B7280] font-medium">
          {done}/{total} tasks completed · team
        </span>
      </div>
      <div className="w-full bg-[#F3F4F6] h-[6px] rounded-full overflow-hidden">
        <div
          className="bg-[#1E3A5F] h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default DailyProgressBar
