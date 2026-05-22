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
  onOpenTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onEditTask,
  onDeleteTask,
}) => {
  const isDropTarget = dragOverStatus === column.id

  return (
    <section
      className={`w-[280px] shrink-0 flex flex-col self-stretch rounded-xl transition-colors ${
        isDropTarget ? 'bg-primary/5 ring-2 ring-primary/30 ring-offset-2 ring-offset-transparent' : ''
      }`}
      onDragOver={(event) => onDragOver(event, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(event) => onDrop(event, column.id)}
    >
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <h3 className="font-semibold text-sm text-on-background flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.color}`} />
          {column.title}
        </h3>
        <span className={`${countClasses[column.id] || countClasses.TODO} text-xs font-semibold px-2 py-0.5 rounded-full`}>
          {tasks.length}
        </span>
      </div>
      <div className={`flex-1 min-h-[420px] overflow-y-auto space-y-3 p-1 pb-4 kanban-scroll rounded-lg ${
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
