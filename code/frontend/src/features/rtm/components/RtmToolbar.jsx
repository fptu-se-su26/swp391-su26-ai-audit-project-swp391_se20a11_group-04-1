import StatusIndicator from './StatusIndicator'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

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
    <Card style={{ padding: '24px' }} className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
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

        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={loading}
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </Button>

        <Button
          variant="outline"
          onClick={onToggleSnapshots}
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          Snapshots
        </Button>

        <Button
          variant="primary"
          onClick={onSaveSnapshot}
          disabled={saving}
        >
          {saving ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
          )}
          Save Snapshot
        </Button>
      </div>
    </Card>
  )
}

export default RtmToolbar
