import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TaskFormModal from '../components/TaskFormModal'
import useProjectStore from '@store/useProjectStore'
import useKanbanStore, { TASK_STATUSES } from '../store/useKanbanStore'

const TaskDetailPage = () => {
  const { projectId, id } = useParams()
  const navigate = useNavigate()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const activeProject = useProjectStore((state) => state.activeProject)
  const { tasks, columns, loading, fetchTaskById, updateTask, deleteTask, updateTaskStatus, toggleChecklistItem } = useKanbanStore()
  const task = tasks.find((item) => item.id === id)
  const taskBoardPath = projectId ? `/projects/${projectId}/task-board` : '/dashboard'

  useEffect(() => {
    if (!task) {
      fetchTaskById(id)
    }
  }, [fetchTaskById, id, task])

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-bright p-6">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-error text-[48px] mb-3">error</span>
          <h1 className="text-2xl font-bold text-on-surface mb-2">{loading ? 'Loading task...' : 'Task not found'}</h1>
          <p className="text-sm text-on-surface-variant mb-5">
            {loading ? 'Please wait while the task detail is loaded.' : <>The task id <strong>{id}</strong> does not exist in the current board data.</>}
          </p>
          <Link to={taskBoardPath} className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-semibold">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Task Board
          </Link>
        </div>
      </div>
    )
  }

  const completedChecklist = task.checklist.filter((item) => item.done).length

  const handleDeleteTask = () => {
    const confirmed = window.confirm(`Delete ${task.id}? This cannot be undone in the current board state.`)
    if (confirmed) {
      deleteTask(task.id)
      navigate(taskBoardPath)
    }
  }

  const handleUpdateTask = (payload) => {
    updateTask(task.id, payload)
    setIsEditOpen(false)
  }

  const handleCollapseToPanel = () => {
    navigate(taskBoardPath, { state: { openTaskId: task.id } })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-surface-bright">
      <div className="max-w-[1200px] w-full mx-auto px-6 py-6 md:py-8">
        <div className="flex items-center text-label-md font-label-md text-on-surface-variant mb-6">
          <Link className="hover:text-primary transition-colors" to={taskBoardPath}>Task Board</Link>
          <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
          <span className="text-on-surface">{task.id}</span>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleCollapseToPanel}
                className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-fixed transition-colors"
                aria-label="Collapse to task panel"
                title="Collapse to panel"
              >
                <span className="material-symbols-outlined text-[22px]">keyboard_return</span>
              </button>
              <span className="bg-primary-fixed text-on-primary-fixed px-2 py-1 rounded text-label-md font-label-md uppercase">
                {task.id}
              </span>
              <h1 className="font-headline-md text-headline-md text-on-surface truncate">{task.title}</h1>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="h-[36px] px-4 flex items-center gap-2 bg-surface-container-low text-on-surface-variant border border-outline-variant hover:bg-surface-container-high rounded transition-colors text-body-md font-body-md"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="h-[36px] px-4 flex items-center gap-2 bg-error/10 text-error border border-error/25 hover:bg-error/20 rounded transition-colors text-body-md font-body-md"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete
              </button>
              <button className="h-[36px] px-4 flex items-center gap-2 bg-primary text-on-primary hover:bg-on-primary-fixed-variant rounded transition-colors text-body-md font-body-md shadow-sm">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                AI Review
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-outline-variant pt-4 mt-2">
            <label className="flex items-center gap-2">
              <span className="text-on-surface-variant text-body-md font-body-md">Status:</span>
              <select
                value={task.status}
                onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-label-md font-label-md border border-transparent focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant text-body-md font-body-md">Priority:</span>
              <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-label-md font-label-md">
                {task.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
              <span className="text-on-surface text-body-md font-body-md">{task.assignee.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">link</span>
              <span className="text-primary text-body-md font-body-md">{task.requirement}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">speed</span>
              <span className="text-on-surface text-body-md font-body-md">{task.sprint}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">event_available</span>
              <span className="text-on-surface text-body-md font-body-md">Start: {task.startDate || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">event</span>
              <span className={`${task.overduePenaltyApplied ? 'text-error font-semibold' : 'text-on-surface'} text-body-md font-body-md`}>
                Deadline: {task.deadline || 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">fitness_center</span>
              <span className="text-on-surface text-body-md font-body-md">Weight: {task.weight || 1}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">timer</span>
              <span className="text-on-surface text-body-md font-body-md">
                Estimate: {task.estimatedHours ? `${task.estimatedHours}h` : 'Not set'}
              </span>
            </div>
            {task.overduePenaltyApplied && (
              <div className="flex items-center gap-2 rounded bg-error/10 px-2 py-1 text-error">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span className="text-body-md font-body-md">
                  Penalty applied{task.overduePenaltyAppliedAt ? ` at ${task.overduePenaltyAppliedAt}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant">Description</h3>
              <p className="text-body-md font-body-md text-on-surface-variant whitespace-pre-line leading-relaxed">
                {task.description || 'No description has been added yet.'}
              </p>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant flex justify-between">
                <span>Checklist</span>
                <span className="text-sm text-on-surface-variant">{completedChecklist}/{task.checklist.length}</span>
              </h3>
              <div className="space-y-2">
                {task.checklist.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No checklist items.</p>
                ) : (
                  task.checklist.map((item) => (
                    <label key={item.id} className="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded transition-colors cursor-pointer">
                      <input
                        checked={item.done}
                        onChange={() => toggleChecklistItem(task.id, item.id)}
                        className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary"
                        type="checkbox"
                      />
                      <span className={`text-body-md font-body-md ${item.done ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                        {item.text}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-4 pb-2 border-b border-outline-variant">Comments</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-fixed flex-shrink-0 flex items-center justify-center">
                  <span className="text-on-primary-fixed font-label-md">ME</span>
                </div>
                <div className="flex-1">
                  <textarea className="w-full border border-outline-variant rounded p-2 text-body-md focus:border-primary focus:ring-1 focus:ring-primary bg-transparent resize-none h-[80px]" placeholder="Add a comment..." />
                  <div className="flex justify-end mt-2">
                    <button className="h-[32px] px-4 bg-primary text-on-primary hover:bg-on-primary-fixed-variant rounded text-body-md font-body-md transition-colors">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant">Git Workflow</h3>
              <span className="text-label-md text-on-surface-variant uppercase mb-1 block">Commit Prefix</span>
              <div className="flex items-center bg-surface-container-low rounded border border-outline-variant p-2">
                <code className="font-label-md text-on-surface flex-1">feat({task.id}): </code>
                <button className="text-on-surface-variant hover:text-primary transition-colors" title="Copy to clipboard">
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant">Related Items</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 border border-outline-variant rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">inventory_2</span>
                    <span className="text-body-md font-body-md text-on-surface">Evidence</span>
                  </div>
                  <span className="text-label-md font-label-md text-on-surface-variant">{task.evidenceStatus}</span>
                </div>
                <div className="flex items-center justify-between p-2 border border-outline-variant rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">checklist_rtl</span>
                    <span className="text-body-md font-body-md text-on-surface">Tests</span>
                  </div>
                  <span className="text-label-md font-label-md text-on-surface-variant">{task.testStatus}</span>
                </div>
                {task.status === 'BLOCKED' && task.blockedReason && (
                  <div className="p-3 rounded bg-error/10 border border-error/20 text-error text-sm">
                    {task.blockedReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <TaskFormModal
        isOpen={isEditOpen}
        task={task}
        assigneeOptions={activeProject?.members || []}
        columnOptions={columns}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateTask}
      />
    </div>
  )
}

export default TaskDetailPage
