import { useEffect } from 'react'

function formatDate(value) {
  if (!value) return 'Unknown time'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function RtmSnapshotPanel({ open, snapshots, loading, onClose }) {
  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-black/30 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <aside
        className="w-full sm:w-[420px] h-full bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-5 border-b border-outline-variant/60 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-black text-lg text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              RTM Snapshots
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">Saved matrix states for reporting and review.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              Loading snapshots...
            </div>
          ) : snapshots.length ? snapshots.map((snapshot) => (
            <article key={snapshot.id} className="border border-outline-variant/60 rounded-2xl p-4 bg-surface-container-lowest hover:bg-surface-container-low/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-on-surface">Snapshot #{snapshot.id}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{formatDate(snapshot.createdAt)}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg bg-primary-fixed text-on-primary-fixed">
                  {snapshot.rowCount} Rows
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="rounded-xl bg-surface-container p-2">
                  <p className="text-lg font-black text-[#047857]">{snapshot.summary?.doneCount || 0}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Done</p>
                </div>
                <div className="rounded-xl bg-surface-container p-2">
                  <p className="text-lg font-black text-error">{snapshot.summary?.atRiskCount || 0}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Risk</p>
                </div>
                <div className="rounded-xl bg-surface-container p-2">
                  <p className="text-lg font-black text-on-surface">{snapshot.summary?.openBugs || 0}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold">Bugs</p>
                </div>
              </div>
            </article>
          )) : (
            <div className="text-center py-12 border border-dashed border-outline-variant rounded-2xl">
              <span className="material-symbols-outlined text-5xl text-primary">history</span>
              <h3 className="mt-3 text-sm font-black text-on-surface">No snapshots yet</h3>
              <p className="mt-1 text-xs text-on-surface-variant">Save a snapshot from the RTM toolbar.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

export default RtmSnapshotPanel
