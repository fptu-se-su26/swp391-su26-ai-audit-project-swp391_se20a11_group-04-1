import TaskCard from './TaskCard'

const countClasses = {
  TODO: 'bg-surface-container-highest text-on-surface-variant',
  IN_PROGRESS: 'bg-primary-container text-on-primary-container',
  IN_REVIEW: 'bg-surface-container-highest text-on-surface-variant',
  DONE: 'bg-[#dcfce7] text-[#166534]',
  BLOCKED: 'bg-error-container text-on-error-container',
}

const KanbanColumn = ({
  column,
  tasks,
  selectedTaskId,
  draggingTaskId,
  dragOverStatus,
  draggingColumnId,
  dragOverColumnId,
  isCompact,
  canManageColumns,
  onOpenTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditTask,
  onDeleteTask,
  onRenameColumn,
  onArchiveColumn,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDrop,
  onColumnDragEnd,
}) => {
  const isDropTarget = dragOverStatus === column.id
  const isColumnDragTarget = dragOverColumnId === column.id && draggingColumnId !== column.id
  const isDraggingColumn = draggingColumnId === column.id
  const widthClass = isCompact ? 'w-[204px]' : 'w-[280px]'
  const countClass = countClasses[column.statusKey || column.id] || countClasses.TODO

  return (
    <section
      className={`${widthClass} shrink-0 flex flex-col self-stretch rounded-xl transition-all ${
        isDropTarget ? 'bg-primary/5 ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent' : ''
      } ${
        isColumnDragTarget ? 'ring-2 ring-primary/40 bg-primary/5' : ''
      } ${
        isDraggingColumn ? 'opacity-60 scale-[0.99]' : ''
      }`}
      onDragOver={(event) => {
        if (draggingColumnId) {
          onColumnDragOver(event, column.id)
          return
        }
        onDragOver(event, column.id)
      }}
      onDragLeave={onDragLeave}
      onDrop={(event) => {
        if (draggingColumnId) {
          onColumnDrop(event, column.id)
          return
        }
        onDrop(event, column.id)
      }}
    >
      <div className={`flex items-center justify-between px-1 shrink-0 ${isCompact ? 'mb-2' : 'mb-3'}`}>
        <h3 className="font-semibold text-sm text-on-background flex items-center gap-2">
          {canManageColumns && (
            <button
              type="button"
              draggable
              data-kanban-no-pan
              onDragStart={(event) => onColumnDragStart(event, column.id)}
              onDragOver={(event) => onColumnDragOver(event, column.id)}
              onDrop={(event) => onColumnDrop(event, column.id)}
              onDragEnd={onColumnDragEnd}
              className="w-5 h-5 flex items-center justify-center rounded text-on-surface-variant cursor-grab active:cursor-grabbing hover:bg-surface-container-high hover:text-on-surface"
              title="Drag to reorder column"
              aria-label={`Reorder ${column.title} column`}
            >
              <span className="material-symbols-outlined text-[17px]">drag_indicator</span>
            </button>
          )}
          <span className={`w-2 h-2 rounded-full ${column.color}`} />
          {column.title}
        </h3>
        <div className="flex items-center gap-1">
          <span className={`${countClass} text-xs font-semibold px-2 py-0.5 rounded-full`}>
            {tasks.length}
          </span>
          {canManageColumns && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onRenameColumn(column)}
                className="w-6 h-6 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                title="Rename column"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
              </button>
              {!column.isDefault && (
                <button
                  type="button"
                  onClick={() => onArchiveColumn(column)}
                  className="w-6 h-6 flex items-center justify-center rounded text-on-surface-variant hover:bg-error/10 hover:text-error"
                  title="Hide column"
                >
                  <span className="material-symbols-outlined text-[15px]">visibility_off</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${isCompact ? 'space-y-2' : 'space-y-3'} p-1 pb-4 kanban-scroll rounded-lg ${
        isDropTarget ? 'bg-primary/5' : ''
      }`}>
        {tasks.length === 0 ? (
          <div className="border border-dashed border-outline-variant rounded-lg p-4 text-center text-xs text-on-surface-variant bg-surface-container-lowest/50">
            No tasks
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              isDragging={draggingTaskId === task.id}
              isCompact={isCompact}
              onClick={onOpenTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default KanbanColumn
