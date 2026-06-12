import { badgeClasses } from '@features/sprint-report/utils/sprintReportUtils'

export default function SprintSelector({ sprints, selectedSprint, selectedSprintId, onChange }) {
  return (
    <section className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <label className="text-xs font-black uppercase tracking-wider text-on-surface-variant">
            Sprint
          </label>
          <select
            value={selectedSprintId || ''}
            onChange={(event) => onChange(Number(event.target.value))}
            className="mt-1 w-full min-w-[260px] rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary md:w-auto"
          >
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.status})
              </option>
            ))}
          </select>
        </div>
        {selectedSprint && (
          <div className="flex flex-wrap gap-2 text-xs text-on-surface-variant">
            <span className={`rounded-md px-2 py-1 font-bold ${badgeClasses[selectedSprint.status] || badgeClasses.COMPLETED}`}>
              {selectedSprint.status}
            </span>
            <span className="rounded-md bg-surface-container-high px-2 py-1 font-semibold">
              {selectedSprint.startDate} - {selectedSprint.endDate}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
