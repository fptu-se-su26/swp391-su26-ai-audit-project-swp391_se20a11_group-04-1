import { useEffect, useMemo, useState } from 'react'
import WeeklyPlanner from './WeeklyPlanner'

const statusClasses = {
  PLANNED: 'bg-primary-fixed text-on-primary-fixed',
  ACTIVE: 'bg-[#dcfce7] text-[#166534]',
  COMPLETED: 'bg-surface-container-high text-on-surface-variant',
}

const taskStatusClasses = {
  TODO: 'bg-outline/15 text-on-surface-variant',
  IN_PROGRESS: 'bg-primary-fixed text-on-primary-fixed',
  IN_REVIEW: 'bg-[#f3e8ff] text-[#6b21a8]',
  DONE: 'bg-[#dcfce7] text-[#166534]',
  BLOCKED: 'bg-error-container text-on-error-container',
}

const formatUpdatedAt = (value) => {
  if (!value) return 'Last updated not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Last updated recently'
  return `Last updated ${date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const TaskPicker = ({ tasks, onAssign, assigning }) => {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return tasks.filter((task) => {
      if (!keyword) return true
      return `${task.title} ${task.requirementCode || ''}`.toLowerCase().includes(keyword)
    })
  }, [query, tasks])

  return (
    <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest p-4 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-on-surface">Assign Existing Task</h3>
          <p className="text-xs text-on-surface-variant">Only tasks without a sprint are listed here.</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
          <input
            className="pl-9 rounded-lg border-outline-variant bg-surface text-sm"
            placeholder="Search tasks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-4">No unassigned tasks available.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
          {filtered.map((task) => (
            <div key={task.id} className="rounded-xl border border-outline-variant/60 bg-surface p-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase text-primary">{task.requirementCode || 'No Requirement'}</p>
                <h4 className="font-bold text-sm text-on-surface truncate">{task.title}</h4>
                <p className="text-xs text-on-surface-variant">{task.estimatedHours || 0}h estimated</p>
              </div>
              <button
                disabled={assigning}
                className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-black hover:bg-primary-container disabled:opacity-60"
                onClick={() => onAssign(task.id)}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Metric = ({ label, value, icon }) => (
  <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">{label}</p>
      <span className="material-symbols-outlined text-lg text-primary">{icon}</span>
    </div>
    <p className="mt-2 text-2xl font-black text-on-surface">{value}</p>
  </div>
)

const SprintDetailDrawer = ({
  open,
  sprint,
  sprintTasks,
  availableTasks,
  loading,
  assigning,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onAssignTask,
  onRemoveTask,
  onPlanDateChange,
}) => {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !sprint) return null

  const statusLabel = String(sprint.status || 'PLANNED').replaceAll('_', ' ')
  const capacity = Number(sprint.capacityHours || 0)
  const estimated = Number(sprint.estimatedHours || 0)

  return (
    <div className="fixed inset-0 z-[70] bg-on-surface/40 backdrop-blur-sm flex justify-end" onMouseDown={onClose}>
      <aside
        className="h-full w-full max-w-6xl bg-background border-l border-outline-variant shadow-2xl overflow-y-auto"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur border-b border-outline-variant px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-md ${statusClasses[sprint.status] || statusClasses.PLANNED}`}>{statusLabel}</span>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-surface-container-high text-on-surface-variant">
                  {sprint.startDate} to {sprint.endDate}
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant">
                  {formatUpdatedAt(sprint.updatedAt)}
                </span>
              </div>
              <h2 className="text-2xl font-black text-on-surface truncate">{sprint.name}</h2>
              <p className="text-sm text-on-surface-variant mt-1">{sprint.goal || 'No sprint goal recorded yet.'}</p>
            </div>
            <div className="flex items-center gap-2">
              <select className="rounded-lg border-outline-variant bg-surface text-sm font-bold" value={sprint.status || 'PLANNED'} onChange={(event) => onStatusChange(event.target.value)}>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high" onClick={() => onEdit(sprint)}>
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button className="p-2 rounded-lg border border-error/30 text-error hover:bg-error-container" onClick={() => onDelete(sprint)}>
                <span className="material-symbols-outlined">delete</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-surface-container-high" onClick={onClose}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Progress" value={`${sprint.progressPercent || 0}%`} icon="donut_large" />
            <Metric label="Tasks" value={sprint.totalTasks || 0} icon="assignment" />
            <Metric label="Capacity" value={capacity ? `${sprint.capacityUsagePercent || 0}%` : 'Unset'} icon="speed" />
            <Metric label="Risks" value={sprint.riskCount || 0} icon="warning" />
          </div>

          <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black uppercase text-on-surface-variant">Capacity Usage</h3>
              <p className="text-sm font-bold text-on-surface">{estimated}h{capacity ? ` / ${capacity}h` : ''}</p>
            </div>
            <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(sprint.capacityUsagePercent || 0, 100)}%` }}></div>
            </div>
          </div>

          <TaskPicker tasks={availableTasks} onAssign={onAssignTask} assigning={assigning} />

          <section className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden">
            <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
              <h3 className="text-sm font-black text-on-surface">Linked Tasks</h3>
              <span className="text-xs font-bold text-on-surface-variant">{sprintTasks.length} tasks</span>
            </div>
            {loading ? (
              <p className="p-6 text-sm text-on-surface-variant">Loading sprint tasks...</p>
            ) : sprintTasks.length === 0 ? (
              <p className="p-6 text-sm text-on-surface-variant">No tasks assigned yet.</p>
            ) : (
              <div className="divide-y divide-outline-variant/60">
                {sprintTasks.map((task) => (
                  <div key={task.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase text-primary">{task.requirementCode || 'No Requirement'}</p>
                      <h4 className="font-bold text-on-surface truncate">{task.title}</h4>
                      <p className="text-xs text-on-surface-variant">{task.sprintPlanDate ? `Planned ${task.sprintPlanDate}` : 'Unplanned'} - {task.estimatedHours || 0}h</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${taskStatusClasses[task.status] || taskStatusClasses.TODO}`}>
                      {String(task.status || 'TODO').replaceAll('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <WeeklyPlanner
            sprint={sprint}
            tasks={sprintTasks}
            onPlanDateChange={onPlanDateChange}
            onRemoveTask={onRemoveTask}
          />
        </div>
      </aside>
    </div>
  )
}

export default SprintDetailDrawer
