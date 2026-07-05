import { useState, Fragment } from 'react'
import StatusIndicator from './StatusIndicator'
import { getInitials, getAvatarColor } from '@utils/avatarHelper'
import Card from '../../../components/ui/Card'

const priorityClass = {
  CRITICAL: 'bg-error-container text-on-error-container border-error/20',
  HIGH: 'bg-error-container text-on-error-container border-error/20',
  MEDIUM: 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary/20',
  LOW: 'bg-secondary-container text-on-secondary-container border-secondary/20',
}

function TestDots({ row }) {
  const dots = [
    ...Array(row.testPassed || 0).fill('PASS'),
    ...Array(row.testFailed || 0).fill('FAIL'),
    ...Array(row.testBlocked || 0).fill('BLOCKED'),
    ...Array(row.testNotRun || 0).fill('NOT_RUN'),
  ].slice(0, 8)

  if (!dots.length) {
    return <span className="text-xs text-on-surface-variant font-medium">No tests</span>
  }

  return (
    <div>
      <div className="flex gap-1 justify-center">
        {dots.map((status, index) => {
          const className = status === 'PASS'
            ? 'bg-[#10b981]'
            : status === 'FAIL'
              ? 'bg-[#ef4444]'
              : status === 'BLOCKED'
                ? 'bg-[#f59e0b]'
                : 'bg-outline'
          const icon = status === 'PASS' ? 'check' : status === 'FAIL' ? 'close' : 'remove'
          return (
            <span key={`${status}-${index}`} className={`w-3.5 h-3.5 rounded-md flex items-center justify-center ${className}`}>
              <span className="material-symbols-outlined text-[9px] text-white">{icon}</span>
            </span>
          )
        })}
      </div>
      <span className={`text-[10px] mt-1 block text-center ${row.testFailed > 0 ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
        {row.testPassed || 0} Passed{row.testFailed ? `, ${row.testFailed} F` : ''}
      </span>
    </div>
  )
}

function LinkedItemsList({ items, type, emptyMsg }) {
  if (!items || !items.length) {
    return <p className="text-xs text-on-surface-variant italic">{emptyMsg}</p>
  }

  return (
    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col p-2 bg-surface-container/50 border border-outline-variant/30 rounded-lg text-xs hover:bg-surface-container transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-primary font-black uppercase">{item.code || `#${item.id}`}</span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
              item.status === 'DONE' || item.status === 'PASSED' || item.status === 'RESOLVED' || item.status === 'ACCEPTED'
                ? 'bg-[#d1fae5] text-[#065f46]'
                : item.status === 'BLOCKED' || item.status === 'FAILED'
                  ? 'bg-[#fee2e2] text-[#991b1b]'
                  : 'bg-[#fef3c7] text-[#92400e]'
            }`}>
              {item.status || 'N/A'}
            </span>
          </div>
          <span className="font-bold text-on-surface mt-0.5 truncate" title={item.title}>
            {item.title}
          </span>
          {item.owner && (
            <span className="text-[10px] text-on-surface-variant mt-0.5">Owner: {item.owner}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function RtmMatrixTable({ rows, onSelectRow }) {
  const [expandedRowId, setExpandedRowId] = useState(null)

  if (!rows.length) {
    return (
      <Card style={{ padding: '40px' }} className="text-center shadow-sm">
        <span className="material-symbols-outlined text-5xl text-primary">reorder</span>
        <h3 className="mt-3 text-lg font-black text-on-surface">No requirements found</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Once requirements are created for this project, their traceability chain will appear here.
        </p>
      </Card>
    )
  }

  const toggleExpand = (rowId, event) => {
    if (event.target.closest('button') || event.target.closest('.drawer-trigger')) {
      return
    }
    setExpandedRowId(expandedRowId === rowId ? null : rowId)
  }

  return (
    <Card style={{ padding: 0 }} className="overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-black text-[10px] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              <th className="px-3 py-3 w-[40px] text-center"></th>
              <th className="px-3 py-3 w-[40px] text-center">#</th>
              <th className="px-4 py-3">Requirement</th>
              <th className="px-3 py-3">Priority</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-3 py-3 text-center">Tasks</th>
              <th className="px-3 py-3 text-center">Test Cases</th>
              <th className="px-3 py-3 text-center">Bugs</th>
              <th className="px-3 py-3 text-center">Evidence</th>
              <th className="px-3 py-3 text-center">Risk</th>
              <th className="px-3 py-3 text-center">Status</th>
              <th className="px-3 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {rows.map((row, index) => {
              const percent = row.taskTotal ? Math.round((row.taskDone / row.taskTotal) * 100) : 0
              const testPercent = row.testTotal ? Math.round((row.testPassed / row.testTotal) * 100) : 0
              const ownerName = row.ownerName || 'Unassigned'
              const isExpanded = expandedRowId === row.requirementId

              // Compute Risk Level
              let riskLevel = 'LOW'
              if (row.traceabilityStatus === 'AT_RISK') {
                riskLevel = 'HIGH'
              } else if (row.traceabilityStatus === 'IN_PROGRESS') {
                if (row.openBugCount > 0 || row.testFailed > 0 || row.taskBlocked > 0) {
                  riskLevel = 'MEDIUM'
                }
              }

              return (
                <Fragment key={row.requirementId}>
                  <tr
                    onClick={(e) => toggleExpand(row.requirementId, e)}
                    className={`cursor-pointer transition-colors group hover:bg-primary-fixed/20 ${row.traceabilityStatus === 'AT_RISK' ? 'bg-error-container/5' : ''} ${isExpanded ? 'bg-surface-container-low/40' : ''}`}
                  >
                    {/* Preview (Chevron) */}
                    <td className="px-3 py-4 text-center">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant transition-transform duration-200 block" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>
                        chevron_right
                      </span>
                    </td>
                    
                    {/* Index (#) */}
                    <td className="px-3 py-4 text-center text-xs font-black text-on-surface-variant">
                      {index + 1}
                    </td>

                    {/* Requirement */}
                    <td className="px-4 py-4 max-w-[240px]">
                      <div className="flex flex-col">
                        <span className="font-label-md text-[11px] text-primary font-black">{row.requirementCode}</span>
                        <span className="text-sm font-bold text-on-surface truncate" title={row.title}>{row.title}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${priorityClass[row.priority] || 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
                        {row.priority || 'None'}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${getAvatarColor(ownerName)}`}>
                          {getInitials(ownerName)}
                        </div>
                        <span className="text-xs font-semibold text-on-surface-variant max-w-[100px] truncate" title={ownerName}>{ownerName}</span>
                      </div>
                    </td>

                    {/* Progress */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 min-w-[90px]">
                        <div className="w-12 bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              percent >= 80 ? 'bg-[#10b981]' : percent >= 40 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                            }`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className={`text-[10px] font-black ${
                          percent >= 80 ? 'text-[#10b981]' : percent >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>{percent}%</span>
                      </div>
                    </td>

                    {/* Tasks */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-on-surface">{row.taskDone}/{row.taskTotal}</span>
                        <span className={`text-[9px] font-black mt-0.5 ${
                          percent === 100 ? 'text-[#10b981]' : percent >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>{percent}%</span>
                      </div>
                    </td>

                    {/* Test Cases */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-on-surface">{row.testPassed}/{row.testTotal}</span>
                        <span className={`text-[9px] font-black mt-0.5 ${
                          testPercent === 100 ? 'text-[#10b981]' : testPercent >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>{testPercent}%</span>
                      </div>
                    </td>

                    {/* Bugs */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-on-surface">{row.openBugCount}</span>
                        <span className={`text-[9px] font-black mt-0.5 ${
                          row.openBugCount > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'
                        }`}>
                          {row.openBugCount > 0 ? `${row.openBugCount} open` : '0 open'}
                        </span>
                      </div>
                    </td>

                    {/* Evidence */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-on-surface">{row.evidenceCount}</span>
                        <span className={`text-[9px] font-black mt-0.5 ${
                          row.evidenceCount > 0 ? 'text-[#10b981]' : row.evidenceRequired ? 'text-[#ef4444]' : 'text-on-surface-variant'
                        }`}>
                          {row.evidenceCount > 0 ? `${row.evidenceCount} accepted` : '0 accepted'}
                        </span>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        riskLevel === 'LOW'
                          ? 'bg-[#d1fae5] text-[#065f46] border border-[#10b981]/20'
                          : riskLevel === 'MEDIUM'
                            ? 'bg-[#fef3c7] text-[#92400e] border border-[#f59e0b]/20'
                            : 'bg-[#fee2e2] text-[#991b1b] border border-[#ef4444]/20'
                      }`}>
                        {riskLevel}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-3 py-4 text-center">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        row.traceabilityStatus === 'DONE'
                          ? 'bg-[#d1fae5] text-[#065f46]'
                          : row.traceabilityStatus === 'AT_RISK'
                            ? 'bg-[#fee2e2] text-[#991b1b]'
                            : row.traceabilityStatus === 'IN_PROGRESS'
                              ? 'bg-primary-container/20 text-primary'
                              : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {row.traceabilityStatus?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-3 py-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectRow(row)
                        }}
                        className="drawer-trigger p-1 rounded-full hover:bg-surface-container text-primary transition-colors inline-flex items-center justify-center"
                        title="View Full Details"
                      >
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </button>
                    </td>
                  </tr>

                  {/* Accordion expand */}
                  {isExpanded && (
                    <tr className="bg-surface-container-lowest/30">
                      <td colSpan={13} className="px-6 py-4 border-b border-outline-variant/40">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {/* Business Requirement info */}
                          <div className="border border-outline-variant/30 rounded-xl p-3 bg-surface-container-lowest shadow-sm flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-black text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
                                <span className="material-symbols-outlined text-[16px]">description</span>
                                Business Requirement
                              </h4>
                              <p className="text-xs text-on-surface-variant font-bold leading-relaxed">
                                {row.title}
                              </p>
                              <p className="text-[11px] text-on-surface-variant/80 mt-1.5 leading-relaxed">
                                {row.description || 'No additional description for this requirement.'}
                              </p>
                            </div>
                            {row.evidenceRequired && (
                              <div className="mt-3 pt-2 border-t border-outline-variant/20 flex items-center gap-1.5 text-error text-[10px] font-black uppercase">
                                <span className="material-symbols-outlined text-xs">warning</span>
                                Evidence Required
                              </div>
                            )}
                          </div>

                          <div className="border border-outline-variant/30 rounded-xl p-3 bg-surface-container-lowest shadow-sm">
                            <h4 className="text-xs font-black text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
                              <span className="material-symbols-outlined text-[16px]">assignment</span>
                              Tasks ({row.tasks?.length || 0})
                            </h4>
                            <LinkedItemsList items={row.tasks} type="task" emptyMsg="No linked tasks" />
                          </div>
                          
                          <div className="border border-outline-variant/30 rounded-xl p-3 bg-surface-container-lowest shadow-sm">
                            <h4 className="text-xs font-black text-tertiary uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
                              <span className="material-symbols-outlined text-[16px]">checklist_rtl</span>
                              Test Cases ({row.testCases?.length || 0})
                            </h4>
                            <LinkedItemsList items={row.testCases} type="testCase" emptyMsg="No linked test cases" />
                          </div>

                          <div className="border border-outline-variant/30 rounded-xl p-3 bg-surface-container-lowest shadow-sm">
                            <h4 className="text-xs font-black text-error uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
                              <span className="material-symbols-outlined text-[16px]">bug_report</span>
                              Bugs ({row.bugs?.length || 0})
                            </h4>
                            <LinkedItemsList items={row.bugs} type="bug" emptyMsg="No linked bugs" />
                          </div>

                          <div className="border border-outline-variant/30 rounded-xl p-3 bg-surface-container-lowest shadow-sm">
                            <h4 className="text-xs font-black text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5 border-b border-outline-variant/20 pb-1">
                              <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                              Evidence ({row.evidence?.length || 0})
                            </h4>
                            <LinkedItemsList items={row.evidence} type="evidence" emptyMsg="No linked evidence" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export default RtmMatrixTable
