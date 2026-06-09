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

  return (
    <section className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-black text-on-surface">Report Result</h2>
          <p className="text-xs text-on-surface-variant">
            Generated from SLA rules, penalties, and sprint red-alert evaluation.
          </p>
        </div>
        {selectedReport && (
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
              Generated at
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {formatGeneratedAt(selectedReport.generatedAt)}
            </p>
          </div>
        )}
      </div>

      {reportLoading ? (
        <div className="py-8 text-center text-sm text-on-surface-variant">Loading report data...</div>
      ) : !selectedReport ? (
        <div className="rounded-lg border border-dashed border-outline-variant p-6 text-center text-sm text-on-surface-variant">
          No report generated for this sprint yet. Use Generate Sprint Report when sprint data is ready.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr]">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Red members', value: displayMetrics.redMemberCount ?? 0, icon: 'warning', tone: 'text-error' },
                { label: 'Overdue', value: displayMetrics.totalOverdueTasks ?? 0, icon: 'schedule', tone: 'text-[#854d0e]' },
                { label: 'Penalized', value: displayMetrics.totalPenalizedTasks ?? 0, icon: 'gavel', tone: 'text-[#991b1b]' },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg border border-outline-variant/60 bg-surface p-3">
                  <span className={`material-symbols-outlined text-lg ${metric.tone}`}>{metric.icon}</span>
                  <p className="mt-1 text-xl font-black text-on-surface">{metric.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
            {liveSummary && (
              <div className="rounded-lg bg-surface p-4">
                <h3 className="mb-2 text-xs font-black uppercase tracking-wider text-on-surface-variant">
                  Summary
                </h3>
                <p className="whitespace-pre-wrap text-sm text-on-surface-variant">
                  {liveSummary}
                </p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-outline-variant/60">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant/60 text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="px-3 py-3 font-black">Member</th>
                  <th className="px-3 py-3 font-black">Risk</th>
                  <th className="px-3 py-3 font-black">Reason</th>
                </tr>
              </thead>
              <tbody>
                {selectedReport.members?.length ? (
                  selectedReport.members.map((member) => (
                    <tr key={member.userId || member.email} className="border-b border-outline-variant/60 last:border-0">
                      <td className="px-3 py-3">
                        <p className="font-bold text-on-surface">{member.name}</p>
                        <p className="text-xs text-on-surface-variant">{member.email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-black ${badgeClasses[member.riskLevel] || badgeClasses.RED}`}>
                          {member.riskLevel}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-on-surface-variant">
                        {member.reason || [
                          member.overdueTaskCount > 0 ? `${member.overdueTaskCount} overdue` : null,
                          member.penalizedTaskCount > 0 ? `${member.penalizedTaskCount} penalized` : null,
                          member.staleExplanationCount > 0 ? `${member.staleExplanationCount} stale` : null,
                        ].filter(Boolean).join(', ')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-sm text-on-surface-variant">
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
        <div className="mt-5 border-t border-outline-variant/60 pt-4">
          <h3 className="mb-3 text-sm font-black text-on-surface">Live sprint member snapshot</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {members.slice(0, 6).map((member) => (
              <div key={member.name} className="flex items-center justify-between rounded-lg bg-surface px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-on-surface">{member.name}</p>
                  <p className="text-xs text-on-surface-variant">{member.done}/{member.total} done</p>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-black ${member.risk > 0 ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#dcfce7] text-[#166534]'}`}>
                  {member.risk} SLA risk
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
