import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KanbanColumn from '../components/KanbanColumn'
import KanbanFilters from '../components/KanbanFilters'
import KanbanHeader from '../components/KanbanHeader'
import TaskDetailDrawer from '../components/TaskDetailDrawer'
import TaskFormModal from '../components/TaskFormModal'
import useProjectStore from '@store/useProjectStore'
import useKanbanStore, { TASK_STATUSES, priorityOptions } from '../store/useKanbanStore'

const unique = (items) => [...new Set(items.filter(Boolean))]

const KanbanBoardPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialOpenTaskIdRef = useRef(location.state?.openTaskId || null)
  const [draggingTaskId, setDraggingTaskId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const [justDraggedTaskId, setJustDraggedTaskId] = useState(null)
  const activeProject = useProjectStore((state) => state.activeProject)
  const {
    tasks,
    filters,
    selectedTaskId,
    isTaskFormOpen,
    editingTaskId,
    loading,
    error,
    fetchProjectTasks,
    setFilter,
    openTask,
    closeTask,
    openTaskForm,
    openEditTaskForm,
    closeTaskForm,
    addTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    toggleChecklistItem,
  } = useKanbanStore()

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null
  const editingTask = tasks.find((task) => task.id === editingTaskId) || null

  useEffect(() => {
    fetchProjectTasks(activeProject?.id)
  }, [activeProject?.id, fetchProjectTasks])

  useEffect(() => {
    const taskId = initialOpenTaskIdRef.current
    if (taskId) {
      openTask(taskId)
      navigate(location.pathname, { replace: true, state: null })
      return
    }

    closeTask()
  }, [])

  const filterOptions = {
    sprints: unique(tasks.map((task) => task.sprint)),
    assignees: unique(tasks.map((task) => task.assignee.name)),
    requirements: unique(tasks.map((task) => task.requirement)),
    priorities: priorityOptions,
  }

  const filteredTasks = tasks.filter((task) => {
    const sprintMatch = filters.sprint === 'ALL' || task.sprint === filters.sprint
    const assigneeMatch = filters.assignee === 'ALL' || task.assignee.name === filters.assignee
    const requirementMatch = filters.requirement === 'ALL' || task.requirement === filters.requirement
    const priorityMatch = filters.priority === 'ALL' || task.priority === filters.priority

    return sprintMatch && assigneeMatch && requirementMatch && priorityMatch
  })

  const tasksByStatus = TASK_STATUSES.reduce((result, status) => {
    result[status.id] = filteredTasks.filter((task) => task.status === status.id)
    return result
  }, {})

  const handleDragStart = (event, taskId) => {
    setDraggingTaskId(taskId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
  }

  const handleDragOver = (event, status) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverStatus(status)
  }

  const handleDragLeave = (event) => {
    const nextTarget = event.relatedTarget
    if (!event.currentTarget.contains(nextTarget)) {
      setDragOverStatus(null)
    }
  }

  const handleDrop = (event, status) => {
    event.preventDefault()
    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId
    if (taskId) {
      updateTaskStatus(taskId, status)
      setJustDraggedTaskId(taskId)
      window.setTimeout(() => setJustDraggedTaskId(null), 250)
    }
    setDraggingTaskId(null)
    setDragOverStatus(null)
  }

  const handleDragEnd = () => {
    setDraggingTaskId(null)
    setDragOverStatus(null)
  }

  const handleOpenTask = (taskId) => {
    if (justDraggedTaskId === taskId) return
    openTask(taskId)
  }

  const handleDeleteTask = (taskId) => {
    const task = tasks.find((item) => item.id === taskId)
    const confirmed = window.confirm(`Delete ${task?.id || 'this task'}? This cannot be undone in the current board state.`)
    if (confirmed) {
      deleteTask(taskId)
    }
  }

  const handleSubmitTaskForm = (payload) => {
    if (editingTaskId) {
      updateTask(editingTaskId, payload)
      return
    }
    addTask(activeProject?.id, payload)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-bright relative">
      <KanbanHeader onCreateTask={openTaskForm} />
      <KanbanFilters
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={setFilter}
      />
      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-error/25 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-x-auto kanban-scroll p-6 flex space-x-6 h-full items-start">
        {loading && tasks.length === 0 && (
          <div className="text-sm text-on-surface-variant">Loading tasks...</div>
        )}
        {TASK_STATUSES.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] || []}
            selectedTaskId={selectedTaskId}
            draggingTaskId={draggingTaskId}
            dragOverStatus={dragOverStatus}
            onOpenTask={handleOpenTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onEditTask={openEditTaskForm}
            onDeleteTask={handleDeleteTask}
          />
        ))}
        <div className="w-4 shrink-0" />
      </div>

      {selectedTask && (
        <button
          type="button"
          className="absolute inset-0 bg-black/20 z-40"
          onClick={closeTask}
          aria-label="Close task drawer backdrop"
        />
      )}

      <TaskDetailDrawer
        task={selectedTask}
        onClose={closeTask}
        onStatusChange={updateTaskStatus}
        onToggleChecklist={toggleChecklistItem}
      />

      <TaskFormModal
        isOpen={isTaskFormOpen}
        task={editingTask}
        assigneeOptions={activeProject?.members || []}
        onClose={closeTaskForm}
        onSubmit={handleSubmitTaskForm}
      />
    </div>
  )
}

export default KanbanBoardPage
