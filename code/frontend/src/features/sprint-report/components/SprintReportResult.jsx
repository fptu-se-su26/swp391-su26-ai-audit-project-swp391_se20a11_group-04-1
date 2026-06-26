import React from 'react'
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
  completionSummary,
}) {
  const displayMetrics = completionSummary || liveMetrics || selectedReport || {}
  const liveSummary = completionSummary?.aiSprintNarrative || selectedReport?.summary

  const renderMarkdown = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-amber-400 mt-5 mb-2 text-[13px] uppercase tracking-wider border-b border-slate-700 pb-1">{line.replace('### ', '')}</h4>
      } else if (line.startsWith('- ')) {
        // parse bold inside list items
        const parts = line.replace('- ', '').split(/(\*\*.*?\*\*)/g);
        return (
          <li key={idx} className="ml-5 list-disc mb-1.5 text-slate-200 marker:text-amber-500/50">
            {parts.map((p, i) => {
              if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-bold text-white">{p.slice(2, -2)}</strong>;
              return p;
            })}
          </li>
        )
      } else if (line.trim() === '') {
        return <div key={idx} className="h-1"></div>
      } else {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return <p key={idx} className="mb-2 leading-relaxed text-slate-200">
          {parts.map((p, i) => {
            if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-bold text-white">{p.slice(2, -2)}</strong>;
            return p;
          })}
        </p>
      }
    });
  }

  const memberSummaries = React.useMemo(() => {
    if (!completionSummary?.memberSummariesJson) return {}
    try {
      const arr = JSON.parse(completionSummary.memberSummariesJson)
      if (!Array.isArray(arr)) return {}
      return Object.fromEntries(arr.map(m => [m.name, m]))
    } catch (e) {
      return {}
    }
  }, [completionSummary])

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">insights</span>
            Sprint Insights & Metrics
          </h2>
          <p className="text-sm text-slate-500">
            High-level overview of SLA performance and potential bottlenecks.
          </p>
        </div>
        {selectedReport && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Snapshot Generated at
            </p>
            <p className="text-sm font-bold text-slate-900">
              {formatGeneratedAt(selectedReport.generatedAt)}
            </p>
          </div>
        )}
      </div>

      {reportLoading ? (
        <div className="py-8 text-center text-sm text-slate-400">Loading insight data...</div>
      ) : !selectedReport ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No report generated for this sprint yet. Use Generate Sprint Report when sprint data is ready.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Red members', value: displayMetrics.redMemberCount ?? 0, icon: 'warning', tone: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Overdue Tasks', value: displayMetrics.overdueTasks ?? displayMetrics.totalOverdueTasks ?? 0, icon: 'schedule', tone: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Penalized Tasks', value: displayMetrics.penalizedTasks ?? displayMetrics.totalPenalizedTasks ?? 0, icon: 'gavel', tone: 'text-rose-700', bg: 'bg-rose-50/50' },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 flex flex-col items-center justify-center text-center">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${metric.bg}`}>
                  <span className={`material-symbols-outlined text-xl ${metric.tone}`}>{metric.icon}</span>
                </div>
                <p className="text-4xl font-black tracking-tight text-slate-900">{metric.value}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {/* AI Summary Block */}
          {liveSummary && (
            <div className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-6 shadow-md text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-400 text-xl">temp_preferences_custom</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Executive Summary
                </h3>
              </div>
              <div className="text-sm font-medium">
                {renderMarkdown(liveSummary)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Sprint Member Snapshot */}
      {members.length > 0 && (
        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">Member Performance Snapshot</h3>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {members.map((member) => {
              const aiSummary = memberSummaries[member.name]
              const riskLevel = aiSummary?.riskLevel || (member.risk > 0 ? 'RED' : 'GREEN')
              const badgeStyles = {
                GREEN: 'bg-emerald-100 text-emerald-800',
                YELLOW: 'bg-amber-100 text-amber-800',
                RED: 'bg-rose-100 text-rose-800',
              }
              const badgeText = aiSummary
                ? (riskLevel === 'GREEN' ? 'On Track' : riskLevel === 'YELLOW' ? 'At Risk' : 'High Risk')
                : (member.risk > 0 ? `${member.risk} Risk` : 'On Track')

              return (
              <div key={member.name} className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-900">{member.name}</p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeStyles[riskLevel] || badgeStyles.GREEN}`}>
                      {badgeText}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    <span className="text-slate-900 font-bold">{member.done}</span> / {member.total} tasks completed
                  </p>
                </div>
              </div>
            )})}
          </div>
        </div>
      )}
    </section>
  )
}
