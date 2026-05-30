/**
 * SprintOverviewCard - Donut chart + bar chart daily completion (Weekly right panel)
 * Nhận SprintProgress từ backend (đã tính sẵn percent, dailyCompletion)
 *
 * Props:
 *   sprintProgress: {
 *     percent: number,
 *     tasksDone: number,
 *     tasksTotal: number,
 *     storyPointsDone: number,
 *     storyPointsTotal: number,
 *     dailyCompletion: number[]  // 7 giá trị T2→CN
 *   }
 */

const DAY_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const SprintOverviewCard = ({ sprintProgress = {}, activeSprint = null }) => {
  const {
    percent          = 0,
    tasksDone        = 0,
    tasksTotal       = 0,
    dailyCompletion  = [0, 0, 0, 0, 0, 0, 0],
  } = sprintProgress

  const activeTasks = tasksTotal - tasksDone

  // SVG donut
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (percent / 100) * circumference

  const maxVal = Math.max(...dailyCompletion, 1)

  // Index ngày hôm nay trong tuần (0=T2 ... 6=CN)
  const jsDay = new Date().getDay()
  const todayIdx = jsDay === 0 ? 6 : jsDay - 1

  // Tính Time Elapsed (Thời gian trôi qua)
  let timeElapsedStr = '0%'
  if (activeSprint && activeSprint.startDate && activeSprint.endDate) {
    const start = new Date(activeSprint.startDate)
    const end = new Date(activeSprint.endDate)
    const today = new Date()
    
    if (today < start) {
      timeElapsedStr = '0%'
    } else if (today > end) {
      timeElapsedStr = '100%'
    } else {
      const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      const passedDays = Math.ceil((today - start) / (1000 * 60 * 60 * 24))
      if (totalDays > 0) {
        timeElapsedStr = `${Math.min(100, Math.round((passedDays / totalDays) * 100))}%`
      }
    }
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
      <h3 className="text-[15px] font-black text-gray-800 mb-5 tracking-tight">Sprint Overview</h3>

      {/* Donut + stats */}
      <div className="flex items-center gap-5 mb-7">
        <div className="relative w-[72px] h-[72px] shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="transparent"
              stroke="#F3F4F6" strokeWidth="8" />
            <circle cx="40" cy="40" r={radius} fill="transparent"
              stroke="currentColor" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-blue-600 transition-all duration-1000 ease-out"
              strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-black text-gray-800 tracking-tight">
            {percent}%
          </span>
        </div>

        <div className="space-y-3 flex-1">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Time Elapsed</span>
            <span className="font-black text-[15px] text-orange-500 leading-tight">{timeElapsedStr}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tasks Done</span>
            <span className="font-black text-[15px] text-emerald-600 leading-tight">{tasksDone}/{tasksTotal}</span>
          </div>
        </div>
      </div>

      {/* Daily completion bar chart */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-wider">
          DAILY COMPLETION
        </p>
        <div className="flex items-end justify-between h-20 gap-1.5 px-1">
          {dailyCompletion.map((val, idx) => {
            const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 5
            const isToday = idx === todayIdx
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                {/* Hiển thị số task done ở trên cột nếu có */}
                {val > 0 && (
                  <span className="text-[10px] font-bold text-gray-600 mb-1">
                    {val}
                  </span>
                )}
                
                <div
                  className={`w-full rounded-t-[4px] transition-all duration-700 ease-out ${
                    val > 0
                      ? isToday ? 'bg-blue-600' : 'bg-blue-300'
                      : 'bg-gray-100'
                  }`}
                  style={{ height: `${Math.max(heightPct, 5)}%` }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-2 px-1">
          {DAY_SHORT.map((d, i) => (
            <span 
              key={i} 
              className={`flex-1 text-center text-[10px] font-bold ${i === todayIdx ? 'text-blue-600' : 'text-gray-400'}`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SprintOverviewCard
