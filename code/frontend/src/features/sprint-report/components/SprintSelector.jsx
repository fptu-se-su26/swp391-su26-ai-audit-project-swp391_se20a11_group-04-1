import { badgeClasses } from '@features/sprint-report/utils/sprintReportUtils'

export default function SprintSelector({ sprints, selectedSprint, selectedSprintId, onChange }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Sprint
          </label>
          <select
            value={selectedSprintId || ''}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mt-1 w-full min-w-[260px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 md:w-auto"
          >
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status})
              </option>
            ))}
          </select>
        </div>
        {selectedSprint && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            <span className={`rounded-md px-2 py-1 font-bold ${badgeClasses[selectedSprint.status] || badgeClasses.COMPLETED}`}>
              {selectedSprint.status}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700">
              {selectedSprint.startDate} - {selectedSprint.endDate}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
