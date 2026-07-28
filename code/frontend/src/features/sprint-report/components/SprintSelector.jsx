import { badgeClasses } from '@features/sprint-report/utils/sprintReportUtils'

export default function SprintSelector({ sprints, selectedSprint, selectedSprintId, onChange }) {
  return (
    <section className="rounded-lg border border-[#D9E7E4] bg-white px-3 py-2 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-[#278A99]">
            Sprint
          </label>
          <select
            value={selectedSprintId || ''}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-9 w-full min-w-[240px] rounded-lg border border-[#D9E7E4] bg-[#F0F9FA] px-3 text-sm font-semibold text-slate-800 focus:border-[#1E707D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D7EEF1] sm:w-auto"
          >
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status})
              </option>
            ))}
          </select>
        </div>
        {selectedSprint && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className={`rounded-md px-2 py-1 font-bold ${badgeClasses[selectedSprint.status] || badgeClasses.COMPLETED}`}>
              {selectedSprint.status}
            </span>
            <span className="rounded-md bg-[#F0F9FA] px-2 py-1 font-semibold text-[#165964]">
              {selectedSprint.startDate} - {selectedSprint.endDate}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
