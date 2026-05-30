/**
 * WeeklyControlBar - Thanh điều hướng tuần
 * Props:
 *   weekLabel: string  e.g. "Week 21 · 19/05 – 25/05/2026"
 *   onPrevWeek: function
 *   onNextWeek: function
 *   onThisWeek: function
 */
const WeeklyControlBar = ({ weekLabel, onPrevWeek, onNextWeek, onThisWeek }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-outline-variant rounded-xl shadow-sm">
      <div className="flex items-center gap-4">
        {/* Prev / Next buttons */}
        <div className="flex border border-outline-variant rounded-lg overflow-hidden">
          <button
            onClick={onPrevWeek}
            className="p-1.5 hover:bg-surface-container-low border-r border-outline-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            onClick={onNextWeek}
            className="p-1.5 hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>

        {/* This Week button */}
        <button
          onClick={onThisWeek}
          className="px-4 py-1.5 border border-outline-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-colors"
        >
          This Week
        </button>

        {/* Week label */}
        <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
          {weekLabel}
        </span>
      </div>
    </div>
  )
}

export default WeeklyControlBar
