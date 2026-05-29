import { useEffect } from 'react'
import StatusIndicator from './StatusIndicator'

function LinkedList({ title, icon, items, emptyText }) {
  return (
    <section>
      <h3 className="font-bold text-sm text-on-surface mb-2 border-b border-outline-variant/60 pb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[18px] text-secondary">{icon}</span>
        {title} ({items?.length || 0})
      </h3>
      <div className="flex flex-col gap-2">
        {items?.length ? items.map((item) => (
          <div key={`${title}-${item.id}`} className="p-3 border border-outline-variant/60 rounded-xl bg-surface-container-lowest flex items-start justify-between gap-3 hover:bg-surface-container-low/40 transition-colors">
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{item.code}: {item.title}</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                {item.owner ? `${item.owner} • ` : ''}{item.meta || 'Linked artifact'}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-surface-container text-on-surface-variant border border-outline-variant">
              {item.status}
            </span>
          </div>
        )) : (
          <div className="p-4 border border-dashed border-outline-variant rounded-xl text-sm text-on-surface-variant bg-surface-container-lowest">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  )
}

export function RtmDetailDrawer({ row, onClose }) {
  useEffect(() => {
    if (!row) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [row, onClose])

  if (!row) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[600px] h-full bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col animate-slide-left"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-outline-variant/60 bg-surface-container-lowest flex justify-between items-start gap-4 sticky top-0 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-label-md text-[11px] bg-secondary-container text-on-secondary-container px-2 py-1 rounded-lg uppercase font-black">
                {row.requirementCode}
              </span>
              <StatusIndicator status={row.traceabilityStatus} compact />
            </div>
            <h2 className="font-black text-xl text-on-surface leading-tight">{row.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <section>
            <h3 className="font-bold text-sm text-on-surface mb-2 border-b border-outline-variant/60 pb-2">Summary</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {row.description || 'No requirement description has been provided yet.'}
            </p>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60">
              <span className="font-label-md text-[10px] text-on-surface-variant uppercase font-black">Owner</span>
              <p className="mt-1 text-sm font-black text-on-surface truncate">{row.ownerName || 'Unassigned'}</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/60">
              <span className="font-label-md text-[10px] text-on-surface-variant uppercase font-black">Evidence</span>
              <p className="mt-1 text-sm font-black text-on-surface">{row.evidenceCount} Accepted</p>
            </div>
          </section>

          {row.riskReasons?.length > 0 && (
            <section className="bg-error-container/25 border border-error/30 rounded-2xl p-4 flex gap-3 items-start">
              <span className="material-symbols-outlined text-error mt-0.5 icon-fill">warning</span>
              <div>
                <h4 className="text-sm font-black text-error mb-1">Traceability Risk Detected</h4>
                <ul className="text-sm text-on-surface-variant list-disc list-inside space-y-1">
                  {row.riskReasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          <LinkedList title="Linked Tasks" icon="assignment" items={row.tasks} emptyText="No implementation tasks are linked." />
          <LinkedList title="Test Cases" icon="checklist_rtl" items={row.testCases} emptyText="No test cases are linked." />
          <LinkedList title="Active Bugs" icon="bug_report" items={row.bugs} emptyText="No bugs are linked to this requirement." />
          <LinkedList title="Evidence" icon="inventory_2" items={row.evidence} emptyText="No accepted evidence is linked directly to this requirement." />
        </div>
      </div>
    </div>
  )
}

export default RtmDetailDrawer
