import { Link, useParams } from 'react-router-dom'
import { TASK_STATUSES } from '../store/useKanbanStore'

const TaskDetailDrawer = ({ task, columns = TASK_STATUSES, onClose, onStatusChange, onToggleChecklist }) => {
  const { projectId } = useParams()
  const taskDetailPath = task && projectId ? `/projects/${projectId}/tasks/${task.id}` : '#'

  return (
    <aside className={`absolute inset-y-0 right-0 w-full sm:w-[420px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
      task ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {task && (
        <>
          <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface">
            <div className="flex items-center space-x-2">
              <span className="font-label-md text-label-md text-primary bg-primary-fixed px-2 py-1 rounded">
                {task.id}
              </span>
              <span className="bg-primary text-white font-label-md text-[10px] px-1.5 py-0.5 rounded">
                {(task.columnName || task.status).replaceAll('_', ' ')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-background p-1"
              aria-label="Close task detail"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 kanban-scroll">
            <div>
              <h2 className="text-xl font-bold text-on-background mb-2">{task.title}</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {task.description || 'No description has been added yet.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={taskDetailPath}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-3 py-2 text-xs font-bold hover:bg-surface-tint transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span>Open full detail</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border border-outline-variant rounded-lg p-4 bg-surface">
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Assignee</span>
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full ${task.assignee.color} flex items-center justify-center font-semibold text-[10px] border border-outline-variant`}>
                    {task.assignee.initials}
                  </div>
                  <span className="text-on-background font-medium">{task.assignee.name}</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Requirement</span>
                <span className="flex items-center space-x-1 text-primary font-medium">
                  <span className="material-symbols-outlined text-[16px]">assignment</span>
                  <span>{task.requirement}</span>
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Priority</span>
                <span className="text-on-background font-medium">{task.priority}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Sprint</span>
                <span className="text-on-background font-medium">{task.sprint}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Start</span>
                <span className="text-on-background font-medium">{task.startDate || 'Not set'}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Deadline</span>
                <span className={task.overduePenaltyApplied ? 'text-error font-semibold' : 'text-on-background font-medium'}>
                  {task.deadline || 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Weight</span>
                <span className="text-on-background font-medium">{task.weight || 1}x</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-outline uppercase block mb-1">Estimate</span>
                <span className="text-on-background font-medium">{task.estimatedHours ? `${task.estimatedHours}h` : 'Not set'}</span>
              </div>
            </div>

            {task.overduePenaltyApplied && (
              <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error">
                Overdue penalty applied{task.overduePenaltyAppliedAt ? ` at ${task.overduePenaltyAppliedAt}` : ''}.
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-on-background border-b border-outline-variant pb-2 mb-3">Status</h3>
              <select
                value={task.columnId || columns.find((column) => column.statusKey === task.status)?.id || ''}
                onChange={(event) => {
                  const column = columns.find((item) => item.id === event.target.value)
                  onStatusChange(task.id, column?.statusKey || task.status, column?.id || null)
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {columns.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.title}
                  </option>
                ))}
              </select>
              {task.status === 'BLOCKED' && task.blockedReason && (
                <div className="mt-3 bg-error/10 border border-error/20 rounded-lg p-3 text-xs text-error">
                  {task.blockedReason}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold text-on-background border-b border-outline-variant pb-2 mb-3">Traceability</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest border border-outline-variant">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-[18px] text-[#ca8a04]">inventory_2</span>
                    <span className="text-sm font-medium text-on-background">Evidence</span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                    {task.evidenceStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-surface-container-lowest border border-outline-variant">
                  <div className="flex items-center space-x-2">
                    <span className="material-symbols-outlined text-[18px] text-outline">fact_check</span>
                    <span className="text-sm font-medium text-on-background">Tests Linked</span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded">
                    {task.testStatus}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-on-background border-b border-outline-variant pb-2 mb-3 flex justify-between items-center">
                Checklist
                <span className="text-xs font-normal text-on-surface-variant">
                  {task.checklist.filter((item) => item.done).length}/{task.checklist.length}
                </span>
              </h3>
              <ul className="space-y-2">
                {task.checklist.length === 0 ? (
                  <li className="text-sm text-on-surface-variant">No checklist items.</li>
                ) : (
                  task.checklist.map((item) => (
                    <li key={item.id} className="flex items-start space-x-2">
                      <input
                        checked={item.done}
                        onChange={() => onToggleChecklist(task.id, item.id)}
                        className="mt-1 rounded text-primary focus:ring-primary h-4 w-4 border-outline-variant"
                        type="checkbox"
                      />
                      <span className={`text-sm ${item.done ? 'text-on-surface-variant line-through' : 'text-on-background'}`}>
                        {item.text}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="bg-secondary-container rounded-lg p-3">
              <span className="text-xs font-semibold text-secondary block mb-1">Git Commit Prefix</span>
              <div className="flex items-center space-x-2 bg-surface-container-lowest p-2 rounded border border-outline-variant">
                <code className="text-sm font-label-md text-on-background flex-1">
                  feat({task.id}): 
                </code>
                <button type="button" className="text-on-surface-variant hover:text-primary" title="Copy prefix">
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

export default TaskDetailDrawer
