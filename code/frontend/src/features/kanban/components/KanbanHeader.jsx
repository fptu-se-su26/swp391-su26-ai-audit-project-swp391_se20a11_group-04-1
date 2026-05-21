const KanbanHeader = ({ onCreateTask }) => {
  return (
    <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest shrink-0 z-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-background mb-1">Task Board</h2>
          <p className="text-body-md text-on-surface-variant">
            Manage sprint tasks and trace work back to requirements.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="h-[36px] px-4 bg-secondary-container text-on-secondary-container rounded-lg font-semibold flex items-center space-x-2 hover:bg-secondary-fixed transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">psychology</span>
            <span>AI Generate Tasks</span>
          </button>
          <button
            type="button"
            onClick={onCreateTask}
            className="h-[36px] px-4 bg-primary text-on-primary rounded-lg font-semibold flex items-center space-x-2 hover:bg-surface-tint transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>New Task</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default KanbanHeader
