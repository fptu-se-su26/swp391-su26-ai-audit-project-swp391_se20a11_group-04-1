import { useEffect, useMemo, useState } from 'react'

const statusTone = {
  TODO: 'bg-outline/15 text-on-surface-variant border-outline-variant',
  IN_PROGRESS: 'bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim',
  IN_REVIEW: 'bg-[#f3e8ff] text-[#6b21a8] border-[#d8b4fe]',
  DONE: 'bg-[#dcfce7] text-[#166534] border-[#86efac]',
  BLOCKED: 'bg-error-container text-on-error-container border-error/30',
}

const toDate = (value) => {
  const [year, month, day] = String(value).split('-').map(Number)
  return new Date(year, month - 1, day)
}

const toIsoDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const formatDay = (date) => date.toLocaleDateString('en-US', { weekday: 'short' })
const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const clampWeekStart = (candidate, sprintStart, sprintEnd) => {
  if (candidate < sprintStart) return sprintStart
  if (candidate > sprintEnd) return sprintEnd
  return candidate
}

const TaskMiniCard = ({ task, onDragStart, onRemove }) => (
  <div
    draggable
    onDragStart={(event) => onDragStart(event, task.id)}
    className="group rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 transition-colors"
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase text-primary">{task.requirementCode || 'No Requirement'}</p>
        <h4 className="text-sm font-bold text-on-surface leading-snug truncate">{task.title}</h4>
      </div>
      <button
        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-error-container text-on-surface-variant hover:text-error"
        onClick={(event) => {
          event.stopPropagation()
          onRemove(task.id)
        }}
        title="Remove from sprint"
      >
        <span className="material-symbols-outlined text-base">link_off</span>
      </button>
    </div>
    <div className="mt-3 flex items-center justify-between gap-2">
      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${statusTone[task.status] || statusTone.TODO}`}>
        {String(task.status || 'TODO').replaceAll('_', ' ')}
      </span>
      <span className="text-[10px] font-bold text-on-surface-variant">{task.estimatedHours || 0}h</span>
    </div>
  </div>
)

const WeeklyPlanner = ({ sprint, tasks, onPlanDateChange, onRemoveTask }) => {
  const [weekStart, setWeekStart] = useState(() => sprint?.startDate || '')

  useEffect(() => {
    setWeekStart(sprint?.startDate || '')
  }, [sprint?.id, sprint?.startDate])

  const weekDays = useMemo(() => {
    if (!sprint?.startDate || !sprint?.endDate) return []
    const start = toDate(weekStart || sprint.startDate)
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
      .filter((date) => date >= toDate(sprint.startDate) && date <= toDate(sprint.endDate))
  }, [sprint?.startDate, sprint?.endDate, weekStart])

  if (!sprint?.startDate || !sprint?.endDate) return null

  const sprintStart = toDate(sprint.startDate)
  const sprintEnd = toDate(sprint.endDate)
  const canGoPrevious = weekDays.length > 0 && weekDays[0] > sprintStart
  const canGoNext = weekDays.length > 0 && weekDays[weekDays.length - 1] < sprintEnd

  const moveWeek = (offset) => {
    const candidate = addDays(toDate(weekStart || sprint.startDate), offset)
    setWeekStart(toIsoDate(clampWeekStart(candidate, sprintStart, sprintEnd)))
  }

  const onDragStart = (event, taskId) => {
    event.dataTransfer.setData('text/task-id', String(taskId))
  }

  const onDrop = (event, date) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/task-id')
    if (taskId) onPlanDateChange(taskId, date)
  }

  const unplannedTasks = tasks.filter((task) => !task.sprintPlanDate)

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-on-surface">Weekly Planning</h3>
          <p className="text-xs text-on-surface-variant">Drag tasks into a sprint day. Unplanned keeps them in the sprint backlog.</p>
        </div>
        <div className="flex items-center gap-2">
          <button disabled={!canGoPrevious} className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-40" onClick={() => moveWeek(-7)}>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-xs font-black uppercase text-on-surface-variant px-2">
            {formatDate(weekDays[0] || sprintStart)} - {formatDate(weekDays[weekDays.length - 1] || sprintEnd)}
          </span>
          <button disabled={!canGoNext} className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-high disabled:opacity-40" onClick={() => moveWeek(7)}>
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div
        className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-low/50 p-4"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => onDrop(event, null)}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-on-surface-variant">Unplanned</h4>
          <span className="text-[10px] font-black px-2 py-1 rounded-md bg-surface-container-high text-on-surface-variant">{unplannedTasks.length}</span>
        </div>
        {unplannedTasks.length === 0 ? (
          <p className="text-sm text-on-surface-variant">All sprint tasks are placed on the weekly plan.</p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {unplannedTasks.map((task) => (
              <TaskMiniCard key={task.id} task={task} onDragStart={onDragStart} onRemove={onRemoveTask} />
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-3">
        {weekDays.map((date) => {
          const isoDate = toIsoDate(date)
          const dayTasks = tasks.filter((task) => task.sprintPlanDate === isoDate)
          return (
            <div
              key={isoDate}
              className="min-h-56 rounded-2xl border border-outline-variant/70 bg-surface-container-low p-3"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, isoDate)}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-black text-on-surface">{formatDay(date)}</p>
                  <p className="text-[10px] font-bold uppercase text-on-surface-variant">{formatDate(date)}</p>
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-md bg-surface-container-high text-on-surface-variant">{dayTasks.length}</span>
              </div>
              <div className="space-y-2">
                {dayTasks.length === 0 ? (
                  <div className="h-24 rounded-xl border border-dashed border-outline-variant flex items-center justify-center text-xs text-on-surface-variant">
                    Drop tasks here
                  </div>
                ) : dayTasks.map((task) => (
                  <TaskMiniCard key={task.id} task={task} onDragStart={onDragStart} onRemove={onRemoveTask} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default WeeklyPlanner
