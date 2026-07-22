import React from 'react'
import { statusLabels } from '@features/sprint-report/utils/sprintReportUtils'

export default function SprintReportPdfTemplate({
  project,
  sprint,
  summary,
  riskTasks,
  members,
  report,
}) {
  const generatedDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const decisionPack = report?.decisionPack
  const riskTone = decisionPack?.overallRiskLevel === 'HIGH' || decisionPack?.overallRiskLevel === 'CRITICAL'
    ? 'border-rose-200 bg-rose-50 text-rose-800'
    : 'border-[#B9D8D4] bg-[#F0F9FA] text-[#154F59]'
  const metricCards = [
    { label: 'Progress', value: `${summary?.progress ?? 0}%` },
    { label: 'Health Score', value: `${summary?.health ?? 0}/100` },
    { label: 'Completed', value: `${summary?.done ?? 0}/${summary?.total ?? 0}` },
    { label: 'Issues', value: `${summary?.blocked ?? 0} blocked` },
  ]

  return (
    <div className="mx-auto bg-white p-10 text-slate-900" style={{ width: '800px', minHeight: '1122px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="mb-7 border-b-4 border-[#1E707D] pb-5">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="mb-2 inline-flex rounded-full bg-[#D7EEF1] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-[#1E707D]">
              AI Audit System
            </div>
            <h1 className="m-0 text-3xl font-black uppercase tracking-wide text-[#154F59]">Sprint Report</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Project: <span className="font-black text-slate-900">{project?.name || project?.title}</span>
            </p>
          </div>
          <div className="rounded-lg border border-[#D9E7E4] bg-[#F8FBFC] px-4 py-3 text-right text-xs font-semibold text-slate-500">
            <p className="mb-1">Generated: <span className="text-slate-800">{generatedDate}</span></p>
            <p>Role: <span className="text-slate-800">{project?.role || 'Member'}</span></p>
          </div>
        </div>
      </div>

      {/* Sprint Info */}
      <div className="mb-7 rounded-xl border border-[#D9E7E4] bg-[#F8FBFC] p-4">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-[#154F59]">Sprint Information</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="font-semibold text-slate-500">Sprint Name:</span> <span className="font-black">{sprint?.name}</span></div>
          <div><span className="font-semibold text-slate-500">Status:</span> <span className="font-black">{sprint?.status}</span></div>
          <div><span className="font-semibold text-slate-500">Start Date:</span> {sprint?.startDate}</div>
          <div><span className="font-semibold text-slate-500">End Date:</span> {sprint?.endDate}</div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-7">
        <h2 className="mb-3 border-l-4 border-[#1E707D] pl-3 text-base font-black uppercase tracking-wide text-slate-900">Executive Summary</h2>
        <div className="mb-4 grid grid-cols-4 gap-3">
          {metricCards.map(card => (
            <div key={card.label} className="rounded-lg border border-[#D9E7E4] bg-white p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-xl font-black text-[#154F59]">{card.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-[#D9E7E4] bg-[#F8FBFC] p-3">
            <p className="text-xs font-black uppercase text-slate-500">Total Tasks</p>
            <p className="mt-1 text-lg font-black">{summary?.total ?? 0}</p>
          </div>
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
            <p className="text-xs font-black uppercase text-rose-600">Overdue</p>
            <p className="mt-1 text-lg font-black text-rose-700">{summary?.overdue ?? 0}</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-black uppercase text-amber-700">Penalty</p>
            <p className="mt-1 text-lg font-black text-amber-800">{summary?.penalty ?? 0}</p>
          </div>
        </div>

        {decisionPack && (
          <div className={`mt-4 rounded-xl border p-4 ${riskTone}`}>
            <h3 className="mb-2 text-sm font-black uppercase tracking-wide">System Risk Evaluation: {decisionPack.overallRiskLevel} (Score: {decisionPack.riskScore})</h3>
            <ul className="mb-3 list-disc pl-5 text-sm text-slate-700">
              {decisionPack.mainReasons?.map((reason, i) => <li key={i}>{reason}</li>)}
            </ul>
            <p className="text-sm font-black">Recommended Actions</p>
            <ul className="list-disc pl-5 text-sm text-slate-700">
              {decisionPack.recommendedActions?.map((action, i) => <li key={i}>{action}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Risk Tasks Table */}
      <div className="mb-7">
        <h2 className="mb-3 border-l-4 border-[#1E707D] pl-3 text-base font-black uppercase tracking-wide text-slate-900">High Risk Tasks</h2>
        {riskTasks && riskTasks.length > 0 ? (
          <table className="w-full border-collapse overflow-hidden rounded-lg text-xs">
            <thead className="bg-[#1E707D] text-white">
              <tr>
                <th className="border border-[#D9E7E4] p-2 text-left">Task</th>
                <th className="border border-[#D9E7E4] p-2 text-left">Assignee</th>
                <th className="border border-[#D9E7E4] p-2 text-left">Status</th>
                <th className="border border-[#D9E7E4] p-2 text-left">Risk Reasons</th>
              </tr>
            </thead>
            <tbody>
              {riskTasks.map(task => (
                <tr key={task.id} className="odd:bg-white even:bg-[#F8FBFC]">
                  <td className="border border-[#D9E7E4] p-2 font-bold text-slate-900">{task.title}</td>
                  <td className="border border-[#D9E7E4] p-2">
                    {task.assignees?.map(a => a.profile?.fullName || a.username).join(', ') || 'Unassigned'}
                  </td>
                  <td className="border border-[#D9E7E4] p-2">{statusLabels[task.status] || task.status}</td>
                  <td className="border border-[#D9E7E4] p-2 text-rose-700">
                    <ul className="list-disc pl-4">
                      {task.risk?.reasons?.map((r, i) => (
                        <li key={i}>{r.message}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded-lg border border-[#D9E7E4] bg-[#F8FBFC] p-3 text-sm font-medium text-slate-500">No high risk tasks detected.</p>
        )}
      </div>

      {/* Member Analytics */}
      <div className="mb-7">
        <h2 className="mb-3 border-l-4 border-[#1E707D] pl-3 text-base font-black uppercase tracking-wide text-slate-900">Member Performance</h2>
        {members && members.length > 0 ? (
          <table className="w-full border-collapse text-xs">
            <thead className="bg-[#E7F4F5] text-[#154F59]">
              <tr>
                <th className="border border-[#D9E7E4] p-2 text-left">Member</th>
                <th className="border border-[#D9E7E4] p-2 text-center">Total Tasks</th>
                <th className="border border-[#D9E7E4] p-2 text-center">Done</th>
                <th className="border border-[#D9E7E4] p-2 text-center">At Risk</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-[#F8FBFC]">
                  <td className="border border-[#D9E7E4] p-2 font-bold">{member.name}</td>
                  <td className="border border-[#D9E7E4] p-2 text-center">{member.total}</td>
                  <td className="border border-[#D9E7E4] p-2 text-center font-bold text-emerald-600">{member.done}</td>
                  <td className="border border-[#D9E7E4] p-2 text-center font-black text-rose-700">{member.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded-lg border border-[#D9E7E4] bg-[#F8FBFC] p-3 text-sm font-medium text-slate-500">No member data available.</p>
        )}
      </div>

      <div className="mt-10 border-t border-[#D9E7E4] pt-4 text-center text-xs font-semibold text-slate-500">
        <p>This document is automatically generated by AI Audit System.</p>
      </div>
    </div>
  )
}
