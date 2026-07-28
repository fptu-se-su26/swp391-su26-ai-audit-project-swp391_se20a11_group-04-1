import React from 'react'

export default function SprintKpiBar({ summary, displayMetrics }) {
  const overdue = displayMetrics?.overdueTasks ?? displayMetrics?.totalOverdueTasks ?? summary.overdue
  const penalty = displayMetrics?.penalizedTasks ?? displayMetrics?.totalPenalizedTasks ?? summary.penalty
  const redMembers = displayMetrics?.redMemberCount ?? 0
  const issuesTotal = summary.blocked + overdue + penalty + redMembers

  const kpis = [
    {
      label: 'Done Tasks',
      value: `${summary.done}/${summary.total}`,
      helper: `${summary.progress}% complete`,
      icon: 'check_circle',
      tone: 'text-[#166534]',
    },
    {
      label: 'SLA Health',
      value: `${summary.health}%`,
      helper: summary.health >= 75 ? 'Healthy' : summary.health >= 45 ? 'Needs attention' : 'Critical',
      icon: 'monitor_heart',
      tone: summary.health >= 75 ? 'text-[#166534]' : summary.health >= 45 ? 'text-[#854d0e]' : 'text-error',
    },
    {
      label: 'Progress',
      value: `${summary.progress}%`,
      helper: `${summary.total - summary.done} tasks remaining`,
      icon: 'trending_up',
      tone: 'text-[#1E707D]',
    },
    {
      label: 'Issues',
      value: issuesTotal,
      helper: `${summary.blocked} blocked · ${overdue} overdue · ${penalty} penalty · ${redMembers} red`,
      icon: 'warning',
      tone: issuesTotal > 0 ? 'text-rose-600' : 'text-[#166534]',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((metric) => (
        <div key={metric.label} className="flex min-h-[88px] flex-col justify-between rounded-lg border border-[#D9E7E4] bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="mr-1 text-[10px] font-black uppercase tracking-wider text-[#278A99]">
              {metric.label}
            </p>
            <span className={`material-symbols-outlined flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F0F9FA] text-lg ${metric.tone}`}>{metric.icon}</span>
          </div>
          <div>
            <p className="text-2xl font-black leading-tight text-slate-900">{metric.value}</p>
            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{metric.helper}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
