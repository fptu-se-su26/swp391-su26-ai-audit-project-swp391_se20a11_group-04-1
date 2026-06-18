import {
  badgeClasses,
  getAssigneeName,
  getTaskId,
  statusLabels,
} from '@features/sprint-report/utils/sprintReportUtils'

export default function SlaRiskTable({ activeProject, riskTasks, onOpenTask, reportResultRef }) {
  return (
    <section ref={reportResultRef} className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5 scroll-mt-6">
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-black text-on-surface">SLA Risks</h2>
        <p className="text-xs font-semibold text-on-surface-variant">
          Focused list from blocked, overdue, penalty, and missing-evidence tasks.
        </p>
      </div>

      {riskTasks.length === 0 ? (
        <div className="rounded-lg bg-[#dcfce7] px-4 py-6 text-center text-sm font-bold text-[#166534]">
          No SLA risks in this sprint.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-outline-variant/60 text-xs uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-3 font-black">Task</th>
                <th className="px-3 py-3 font-black">Assignee</th>
                <th className="px-3 py-3 font-black">SLA reason</th>
                <th className="px-3 py-3 font-black">Deadline</th>
                <th className="px-3 py-3 font-black">Status</th>
                <th className="px-3 py-3 font-black text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {riskTasks.map((task) => (
                <tr key={getTaskId(task)} className="border-b border-outline-variant/60 last:border-0">
                  <td className="max-w-[280px] px-3 py-3">
                    <p className="truncate font-bold text-on-surface">{task.title}</p>
                    <p className="text-xs text-on-surface-variant">#{getTaskId(task)}</p>
                  </td>
                  <td className="px-3 py-3 text-on-surface-variant">{getAssigneeName(task)}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {task.risk.reasons.map((reason) => (
                        <span
                          key={`${getTaskId(task)}-${reason.type}`}
                          className={`inline-flex min-w-[78px] justify-center rounded-md px-2 py-1 text-[10px] font-black ${badgeClasses[reason.type]}`}
                        >
                          {reason.label}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-on-surface-variant">{task.deadline || 'No due date'}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-surface-container-high px-2 py-1 text-[10px] font-black text-on-surface-variant">
                      {statusLabels[task.status] || task.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenTask(activeProject.id, getTaskId(task))}
                      className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-high"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
