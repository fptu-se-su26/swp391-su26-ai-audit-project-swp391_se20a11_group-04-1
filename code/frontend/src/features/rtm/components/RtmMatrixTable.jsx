import StatusIndicator from './StatusIndicator'
import { getInitials, getAvatarColor } from '@utils/avatarHelper'

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
    return <span className="text-xs text-on-surface-variant">No tests</span>
  }

  return (
    <div>
      <div className="flex gap-1">
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
            <span key={`${status}-${index}`} className={`w-4 h-4 rounded-md flex items-center justify-center ${className}`}>
              <span className="material-symbols-outlined text-[10px] text-white">{icon}</span>
            </span>
          )
        })}
      </div>
      <span className={`text-xs mt-1 block ${row.testFailed > 0 ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
        {row.testPassed || 0} Passed{row.testFailed ? `, ${row.testFailed} Failed` : ''}
      </span>
    </div>
  )
}

export function RtmMatrixTable({ rows, onSelectRow }) {
  if (!rows.length) {
    return (
      <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-10 text-center shadow-sm">
        <span className="material-symbols-outlined text-5xl text-primary">reorder</span>
        <h3 className="mt-3 text-lg font-black text-on-surface">No requirements found</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Once requirements are created for this project, their traceability chain will appear here.
        </p>
      </section>
    )
  }

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1040px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-black text-[10px] uppercase tracking-wider">
              <th className="px-4 py-3">Requirement</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Tasks</th>
              <th className="px-4 py-3">Test Cases</th>
              <th className="px-4 py-3">Bugs</th>
              <th className="px-4 py-3">Evidence</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {rows.map((row) => {
              const percent = row.taskTotal ? Math.round((row.taskDone / row.taskTotal) * 100) : 0
              const ownerName = row.ownerName || 'Unassigned'
              return (
                <tr
                  key={row.requirementId}
                  onClick={() => onSelectRow(row)}
                  className={`cursor-pointer transition-colors group hover:bg-primary-fixed/30 ${row.traceabilityStatus === 'AT_RISK' ? 'bg-error-container/10' : ''}`}
                >
                  <td className="px-4 py-4 max-w-[280px]">
                    <div className="flex flex-col">
                      <span className="font-label-md text-[11px] text-primary font-black">{row.requirementCode}</span>
                      <span className="text-sm font-bold text-on-surface truncate">{row.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${priorityClass[row.priority] || 'bg-surface-container text-on-surface-variant border-outline-variant'}`}>
                      {row.priority || 'None'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black ${getAvatarColor(ownerName)}`}>
                        {getInitials(ownerName)}
                      </div>
                      <span className="text-sm text-on-surface-variant max-w-[120px] truncate">{ownerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 min-w-[110px]">
                      <div className="w-16 bg-surface-container-high rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${row.traceabilityStatus === 'AT_RISK' ? 'bg-[#ef4444]' : percent === 100 ? 'bg-[#10b981]' : 'bg-[#f59e0b]'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-black text-on-surface-variant">{row.taskDone}/{row.taskTotal}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <TestDots row={row} />
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${row.openBugCount > 0 ? 'bg-error-container text-on-error-container border-error/20' : 'bg-surface-container-high text-on-surface-variant border-outline-variant'}`}>
                      {row.openBugCount} Open
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                      <span className="text-sm font-bold">{row.evidenceCount}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <StatusIndicator status={row.traceabilityStatus} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default RtmMatrixTable
