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

  return (
    <div className="bg-white text-black p-10 mx-auto" style={{ width: '800px', minHeight: '1122px', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase m-0">SPRINT REPORT</h1>
            <p className="text-gray-600 mt-1">Project: <span className="font-bold text-black">{project?.name || project?.title}</span></p>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p>Generated on: {generatedDate}</p>
            <p>Role: {project?.role}</p>
          </div>
        </div>
      </div>

      {/* Sprint Info */}
      <div className="mb-6">
        <h2 className="text-lg font-bold border-l-4 border-black pl-2 mb-3 uppercase">1. Sprint Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-600">Sprint Name:</span> <span className="font-bold">{sprint?.name}</span></div>
          <div><span className="text-gray-600">Status:</span> <span className="font-bold">{sprint?.status}</span></div>
          <div><span className="text-gray-600">Start Date:</span> {sprint?.startDate}</div>
          <div><span className="text-gray-600">End Date:</span> {sprint?.endDate}</div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-bold border-l-4 border-black pl-2 mb-3 uppercase">2. Executive Summary</h2>
        <table className="w-full text-sm border-collapse border border-gray-400 mb-4">
          <tbody>
            <tr className="bg-gray-100">
              <td className="border border-gray-400 p-2 font-bold w-1/4">Progress</td>
              <td className="border border-gray-400 p-2">{summary?.progress}%</td>
              <td className="border border-gray-400 p-2 font-bold w-1/4">Health Score</td>
              <td className="border border-gray-400 p-2">{summary?.health}/100</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-2 font-bold">Total Tasks</td>
              <td className="border border-gray-400 p-2">{summary?.total}</td>
              <td className="border border-gray-400 p-2 font-bold">Completed</td>
              <td className="border border-gray-400 p-2">{summary?.done}</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="border border-gray-400 p-2 font-bold text-red-600">Blocked</td>
              <td className="border border-gray-400 p-2 text-red-600">{summary?.blocked}</td>
              <td className="border border-gray-400 p-2 font-bold text-red-600">Overdue/Penalty</td>
              <td className="border border-gray-400 p-2 text-red-600">{summary?.overdue} / {summary?.penalty}</td>
            </tr>
          </tbody>
        </table>

        {decisionPack && (
          <div className="border border-red-300 bg-red-50 p-4 rounded-sm">
            <h3 className="font-bold text-red-800 mb-2">System Risk Evaluation: {decisionPack.overallRiskLevel} (Score: {decisionPack.riskScore})</h3>
            <ul className="list-disc pl-5 text-sm text-gray-800 mb-2">
              {decisionPack.mainReasons?.map((reason, i) => <li key={i}>{reason}</li>)}
            </ul>
            <p className="text-sm font-bold text-red-800">Recommended Actions:</p>
            <ul className="list-disc pl-5 text-sm text-gray-800">
              {decisionPack.recommendedActions?.map((action, i) => <li key={i}>{action}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* Risk Tasks Table */}
      <div className="mb-6">
        <h2 className="text-lg font-bold border-l-4 border-black pl-2 mb-3 uppercase">3. High Risk Tasks</h2>
        {riskTasks && riskTasks.length > 0 ? (
          <table className="w-full text-sm border-collapse border border-gray-400">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 p-2 text-left">Task</th>
                <th className="border border-gray-400 p-2 text-left">Assignee</th>
                <th className="border border-gray-400 p-2 text-left">Status</th>
                <th className="border border-gray-400 p-2 text-left">Risk Reasons</th>
              </tr>
            </thead>
            <tbody>
              {riskTasks.map(task => (
                <tr key={task.id}>
                  <td className="border border-gray-400 p-2 font-medium">{task.title}</td>
                  <td className="border border-gray-400 p-2">
                    {task.assignees?.map(a => a.profile?.fullName || a.username).join(', ') || 'Unassigned'}
                  </td>
                  <td className="border border-gray-400 p-2">{statusLabels[task.status] || task.status}</td>
                  <td className="border border-gray-400 p-2 text-red-600">
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
          <p className="text-sm text-gray-600 italic">No high risk tasks detected.</p>
        )}
      </div>

      {/* Member Analytics */}
      <div className="mb-6">
        <h2 className="text-lg font-bold border-l-4 border-black pl-2 mb-3 uppercase">4. Member Performance</h2>
        {members && members.length > 0 ? (
          <table className="w-full text-sm border-collapse border border-gray-400">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-400 p-2 text-left">Member</th>
                <th className="border border-gray-400 p-2 text-center">Total Tasks</th>
                <th className="border border-gray-400 p-2 text-center">Done</th>
                <th className="border border-gray-400 p-2 text-center text-red-600">At Risk</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 p-2 font-medium">{member.name}</td>
                  <td className="border border-gray-400 p-2 text-center">{member.total}</td>
                  <td className="border border-gray-400 p-2 text-center text-green-600">{member.done}</td>
                  <td className="border border-gray-400 p-2 text-center text-red-600 font-bold">{member.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-600 italic">No member data available.</p>
        )}
      </div>

      <div className="mt-10 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>This document is automatically generated by AI Audit System.</p>
      </div>
    </div>
  )
}
