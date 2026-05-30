import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KanbanColumn from '../components/KanbanColumn'
import KanbanFilters from '../components/KanbanFilters'
import KanbanHeader from '../components/KanbanHeader'
import TaskDetailDrawer from '../components/TaskDetailDrawer'
import TaskFormModal from '../components/TaskFormModal'
import useProjectStore from '@store/useProjectStore'
import useKanbanStore, { priorityOptions } from '../store/useKanbanStore'

const unique = (items) => [...new Set(items.filter(Boolean))]

const KanbanBoardPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialOpenTaskIdRef = useRef(location.state?.openTaskId || null)
  const boardScrollRef = useRef(null)
  const panStartXRef = useRef(0)
  const panStartScrollLeftRef = useRef(0)
  const [draggingTaskId, setDraggingTaskId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const [draggingColumnId, setDraggingColumnId] = useState(null)
  const [dragOverColumnId, setDragOverColumnId] = useState(null)
  const [justDraggedTaskId, setJustDraggedTaskId] = useState(null)
  const [isCompactBoard, setIsCompactBoard] = useState(false)
  const [isBoardPanning, setIsBoardPanning] = useState(false)
  const activeProject = useProjectStore((state) => state.activeProject)
  const {
    tasks,
    columns,
    filters,
    selectedTaskId,
    isTaskFormOpen,
    editingTaskId,
    loading,
    error,
    requirementOptions,
    sprintOptions,
    fetchProjectTasks,
    fetchTaskFormOptions,
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
    addColumn,
    updateColumn,
    archiveColumn,
  } = useKanbanStore()

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || null
  const editingTask = tasks.find((task) => task.id === editingTaskId) || null
  const isProjectLeader = ['PROJECT_LEADER', 'LEADER', 'Project Leader'].includes(activeProject?.role)

  useEffect(() => {
    fetchProjectTasks(activeProject?.id)
    fetchTaskFormOptions(activeProject?.id)
  }, [activeProject?.id, fetchProjectTasks, fetchTaskFormOptions])

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

  const tasksByStatus = columns.reduce((result, column) => {
    result[column.id] = filteredTasks.filter((task) => {
      if (task.columnId) return task.columnId === column.id
      return task.status === (column.statusKey || column.id)
    })
    return result
  }, {})

  const handleDragStart = (event, taskId) => {
    setDraggingTaskId(taskId)
    setDraggingColumnId(null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', taskId)
    event.dataTransfer.setData('application/x-kanban-drag-type', 'task')
  }

  const handleDragOver = (event, status) => {
    if (draggingColumnId) return
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
    if (draggingColumnId) return
    const taskId = event.dataTransfer.getData('text/plain') || draggingTaskId
    if (taskId) {
      const column = columns.find((item) => item.id === status)
      updateTaskStatus(taskId, column?.statusKey || status, column?.id || null)
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

  const handleColumnDragStart = (event, columnId) => {
    setDraggingColumnId(columnId)
    setDragOverColumnId(columnId)
    setDraggingTaskId(null)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/x-kanban-drag-type', 'column')
    event.dataTransfer.setData('text/plain', columnId)
  }

  const handleColumnDragOver = (event, columnId) => {
    if (!draggingColumnId || draggingColumnId === columnId) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverColumnId(columnId)
  }

  const handleColumnDrop = (event, targetColumnId) => {
    event.preventDefault()
    if (!draggingColumnId || draggingColumnId === targetColumnId) return

    const reorderedColumns = [...columns]
    const fromIndex = reorderedColumns.findIndex((column) => column.id === draggingColumnId)
    const toIndex = reorderedColumns.findIndex((column) => column.id === targetColumnId)
    if (fromIndex === -1 || toIndex === -1) return

    const [movedColumn] = reorderedColumns.splice(fromIndex, 1)
    reorderedColumns.splice(toIndex, 0, movedColumn)
    reorderedColumns.forEach((column, index) => {
      updateColumn(activeProject?.id, column.id, { columnOrder: index })
    })
    setDraggingColumnId(null)
    setDragOverColumnId(null)
  }

  const handleColumnDragEnd = () => {
    setDraggingColumnId(null)
    setDragOverColumnId(null)
  }

  const handleBoardPanStart = (event) => {
    if (event.button !== 0) return
    if (event.target.closest('button, a, input, select, textarea, [data-kanban-no-pan]')) return

    setIsBoardPanning(true)
    panStartXRef.current = event.clientX
    panStartScrollLeftRef.current = boardScrollRef.current?.scrollLeft || 0
  }

  const handleBoardPanMove = (event) => {
    if (!isBoardPanning || !boardScrollRef.current) return
    event.preventDefault()
    const deltaX = event.clientX - panStartXRef.current
    boardScrollRef.current.scrollLeft = panStartScrollLeftRef.current - deltaX
  }

  const handleBoardPanEnd = () => {
    setIsBoardPanning(false)
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

  const handleCreateColumn = () => {
    const name = window.prompt('Column name')
    if (!name?.trim()) return
    addColumn(activeProject?.id, { name: name.trim() })
  }

  const handleRenameColumn = (column) => {
    const name = window.prompt('Column name', column.title)
    if (!name?.trim() || name.trim() === column.title) return
    updateColumn(activeProject?.id, column.id, { name: name.trim() })
  }

  const handleArchiveColumn = (column) => {
    const confirmed = window.confirm(`Hide ${column.title}? Tasks in this column will stay in the database.`)
    if (confirmed) {
      archiveColumn(activeProject?.id, column.id)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface-bright relative">
      <KanbanHeader
        isCompactBoard={isCompactBoard}
        onToggleCompact={() => setIsCompactBoard((current) => !current)}
        onCreateTask={openTaskForm}
      />
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

      <div className="relative flex-1 min-h-0 bg-surface-bright">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-surface-bright to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-surface-bright to-transparent" />
        <div
          ref={boardScrollRef}
          onMouseDown={handleBoardPanStart}
          onMouseMove={handleBoardPanMove}
          onMouseUp={handleBoardPanEnd}
          onMouseLeave={handleBoardPanEnd}
          className={`flex h-full min-h-0 items-stretch overflow-x-auto overflow-y-hidden p-6 pb-7 kanban-scroll ${
            isCompactBoard ? 'gap-3' : 'gap-4'
          } ${isBoardPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
        {loading && tasks.length === 0 && (
          <div className="text-sm text-on-surface-variant">Loading tasks...</div>
        )}
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id] || []}
            selectedTaskId={selectedTaskId}
            draggingTaskId={draggingTaskId}
            dragOverStatus={dragOverStatus}
            draggingColumnId={draggingColumnId}
            dragOverColumnId={dragOverColumnId}
            isCompact={isCompactBoard}
            canManageColumns={isProjectLeader}
            onOpenTask={handleOpenTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onEditTask={openEditTaskForm}
            onDeleteTask={handleDeleteTask}
            onRenameColumn={handleRenameColumn}
            onArchiveColumn={handleArchiveColumn}
            onColumnDragStart={handleColumnDragStart}
            onColumnDragOver={handleColumnDragOver}
            onColumnDrop={handleColumnDrop}
            onColumnDragEnd={handleColumnDragEnd}
          />
        ))}
        {isProjectLeader && (
          <div className={`${isCompactBoard ? 'w-[96px]' : 'w-[120px]'} shrink-0 self-stretch flex items-start justify-center pt-8`}>
            <button
              type="button"
              onClick={handleCreateColumn}
              className="group flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-outline-variant bg-surface-container-lowest text-on-surface-variant shadow-sm transition-all hover:border-primary hover:bg-primary-fixed hover:text-primary hover:shadow-md"
              aria-label="Add board column"
              title="Add column"
            >
              <span className="material-symbols-outlined text-[28px] transition-transform group-hover:scale-110">add</span>
            </button>
          </div>
        )}
        <div className="w-4 shrink-0" />
        </div>
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
        columns={columns}
        onClose={closeTask}
        onStatusChange={updateTaskStatus}
        onToggleChecklist={toggleChecklistItem}
      />

      <TaskFormModal
        isOpen={isTaskFormOpen}
        task={editingTask}
        assigneeOptions={activeProject?.members || []}
        requirementOptions={requirementOptions}
        sprintOptions={sprintOptions}
        columnOptions={columns}
        onClose={closeTaskForm}
        onSubmit={handleSubmitTaskForm}
      />
    </div>
  )
}

export default KanbanBoardPage
