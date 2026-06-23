import { badgeClasses } from '@features/sprint-report/utils/sprintReportUtils'

const formatGeneratedAt = (value) => {
  if (!value) return 'Generated report'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SprintReportResult({
  selectedSprint,
  selectedReport,
  selectedReportId,
  sprintReports,
  reportLoading,
  members,
  liveMetrics,
}) {
  const displayMetrics = liveMetrics || selectedReport || {}
  const liveSummary = selectedReport && liveMetrics
    ? `Sprint ${selectedReport.sprintName || selectedSprint.name} in project ${selectedReport.projectName || 'Project'} has ${liveMetrics.redMemberCount} red-alert member(s), ${liveMetrics.totalOverdueTasks} overdue task(s), and ${liveMetrics.totalPenalizedTasks} penalized task(s).`
    : selectedReport?.summary

  const handlePing = (memberEmail) => {
    alert(`[Mock] Sent SLA Warning notification to ${memberEmail}`);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Report Result</h2>
          <p className="text-sm text-slate-500">
            Generated from SLA rules, penalties, and sprint red-alert evaluation.
          </p>
        </div>
        {selectedReport && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Generated at
            </p>
            <p className="text-sm font-bold text-slate-900">
              {formatGeneratedAt(selectedReport.generatedAt)}
            </p>
          </div>
        )}
      </div>

      {reportLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading report data...</div>
      ) : !selectedReport ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No report generated for this sprint yet. Use Generate Sprint Report when sprint data is ready.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Red members', value: displayMetrics.redMemberCount ?? 0, icon: 'warning', tone: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Overdue', value: displayMetrics.totalOverdueTasks ?? 0, icon: 'schedule', tone: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Penalized', value: displayMetrics.totalPenalizedTasks ?? 0, icon: 'gavel', tone: 'text-rose-700', bg: 'bg-rose-50/50' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${metric.bg}`}>
                    <span className={`material-symbols-outlined text-[18px] ${metric.tone}`}>{metric.icon}</span>
                  </div>
                  <p className="text-3xl font-black tracking-tight text-slate-900">{metric.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
            {liveSummary && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Summary
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {liveSummary}
                </p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Member</th>
                  <th className="px-4 py-3 font-bold">Risk</th>
                  <th className="px-4 py-3 font-bold">Reason</th>
                  <th className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedReport.members?.length ? (
                  selectedReport.members.map((member) => (
                    <tr key={member.userId || member.email} className="transition-colors hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{member.name}</p>
                        <p className="text-xs text-slate-500">{member.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${badgeClasses[member.riskLevel] || badgeClasses.RED}`}>
                          {member.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {member.reason || [
                          member.overdueTaskCount > 0 ? `${member.overdueTaskCount} overdue` : null,
                          member.penalizedTaskCount > 0 ? `${member.penalizedTaskCount} penalized` : null,
                          member.staleExplanationCount > 0 ? `${member.staleExplanationCount} stale` : null,
                        ].filter(Boolean).join(', ')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handlePing(member.email)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                          Ping
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">
                      No red-alert members in this report.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {members.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Live Sprint Member Snapshot</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {members.slice(0, 6).map((member) => (
              <div key={member.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-900">{member.name}</p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${member.risk > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {member.risk > 0 ? `${member.risk} Risk` : 'On Track'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    <span className="text-slate-900 font-bold">{member.done}</span> / {member.total} tasks completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
