import StatusIndicator from './StatusIndicator'

export function RtmToolbar({
  filters,
  onFilterChange,
  priorityOptions,
  statusOptions,
  onRefresh,
  onSaveSnapshot,
  onToggleSnapshots,
  loading,
  saving,
}) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4 shadow-sm flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        {['DONE', 'IN_PROGRESS', 'AT_RISK', 'NOT_STARTED'].map((status) => (
          <StatusIndicator key={status} status={status} compact />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="bg-surface border border-outline-variant rounded-xl py-2 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="ALL">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(e) => onFilterChange('priority', e.target.value)}
          className="bg-surface border border-outline-variant rounded-xl py-2 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="ALL">All Priorities</option>
          {priorityOptions.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-black uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>

        <button
          type="button"
          onClick={onToggleSnapshots}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-black uppercase tracking-wider transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          Snapshots
        </button>

        <button
          type="button"
          onClick={onSaveSnapshot}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-black uppercase tracking-wider transition-colors shadow-md disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>save</span>
          Save Snapshot
        </button>
      </div>
    </section>
  )
}

export default RtmToolbar
