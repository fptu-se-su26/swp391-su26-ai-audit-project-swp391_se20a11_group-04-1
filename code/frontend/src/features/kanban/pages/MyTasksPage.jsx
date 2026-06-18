import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import useKanbanStore from '../store/useKanbanStore'

const MyTasksPage = () => {
  const { projectId } = useParams()
  const { tasks, loading, error, fetchMyTasks } = useKanbanStore()
  const taskBoardPath = projectId ? `/projects/${projectId}/task-board` : '/dashboard'
  const getTaskDetailPath = (taskId) => (projectId ? `/projects/${projectId}/tasks/${taskId}` : '#')

  useEffect(() => {
    fetchMyTasks()
  }, [fetchMyTasks])

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-surface-bright">
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">My Tasks</h2>
            <p className="text-secondary mt-1">Manage your assigned work and deliverables.</p>
          </div>
          <Link to={taskBoardPath} className="h-9 px-4 bg-primary text-on-primary rounded-lg font-body-md shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">view_kanban</span>
            Task Board
          </Link>
        </header>

        {error && (
          <div className="rounded-lg border border-error/25 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading && tasks.length === 0 ? (
          <div className="text-sm text-on-surface-variant">Loading your tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-8 text-center text-on-surface-variant">
            No tasks assigned to you yet.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={getTaskDetailPath(task.id)}
                className="block bg-surface-container-lowest border border-outline-variant rounded-lg p-4 shadow-sm hover:border-primary transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-label-md text-label-md text-secondary">TASK-{task.id}</span>
                      <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed font-label-md text-[10px] rounded uppercase">
                        {task.status.replaceAll('_', ' ')}
                      </span>
                      <span className="text-label-md text-primary">{task.requirement}</span>
                    </div>
                    <h3 className="font-body-md text-body-md font-semibold text-on-surface">{task.title}</h3>
                    <p className="text-secondary text-sm line-clamp-2 mt-1">{task.description || 'No description.'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded border border-outline-variant text-xs text-on-surface-variant self-start">
                    {task.priority}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyTasksPage
