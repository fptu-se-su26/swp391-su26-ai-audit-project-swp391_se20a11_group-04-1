import { useState } from 'react'

const priorityClasses = {
  LOW: 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]',
  MEDIUM: 'bg-[#fefce8] text-[#a16207] border-[#fde68a]',
  HIGH: 'bg-[#fff7ed] text-[#c2410c] border-[#fed7aa]',
  CRITICAL: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]',
}

const typeClasses = {
  DEV: 'bg-[#f5f3ff] text-[#6d28d9] border-[#ddd6fe]',
  'UI/UX': 'bg-[#f0f9ff] text-[#0284c7] border-[#bae6fd]',
  QA: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
  BUG: 'bg-error text-white border-error',
  DOCS: 'bg-[#f8fafc] text-[#475569] border-[#cbd5e1]',
}

const getEvidenceClass = (status) => {
  if (status === 'Accepted') return 'text-[#16a34a]'
  if (status === 'Pending') return 'text-[#ca8a04]'
  if (status === 'Missing') return 'text-error'
  return 'text-outline'
}

const TaskCard = ({ task, isSelected, isDragging, onClick, onEdit, onDelete, onDragStart, onDragEnd }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const completed = task.checklist.filter((item) => item.done).length
  const isDone = task.status === 'DONE'
  const isBlocked = task.status === 'BLOCKED'

  const handleMenuClick = (event) => {
    event.stopPropagation()
    setIsMenuOpen((current) => !current)
  }

  const handleEditClick = (event) => {
    event.stopPropagation()
    setIsMenuOpen(false)
    onEdit(task.id)
  }

  const handleDeleteClick = (event) => {
    event.stopPropagation()
    setIsMenuOpen(false)
    onDelete(task.id)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onClick={() => onClick(task.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick(task.id)
        }
      }}
      onDragStart={(event) => onDragStart(event, task.id)}
      onDragEnd={onDragEnd}
      className={`w-full text-left rounded-lg p-3 transition-all group border relative ${
        isBlocked
          ? 'bg-[#fef2f2] border-[#fca5a5]'
          : isDone
            ? 'bg-surface border-outline-variant opacity-80 hover:opacity-100'
            : isSelected
              ? 'bg-surface-container-lowest border-2 border-primary shadow-[0_0_0_2px_rgba(0,60,144,0.1)] cursor-grab active:cursor-grabbing'
              : 'bg-surface-container-lowest border-outline-variant hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'opacity-50 scale-[0.98]' : ''}`}
    >
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className={`font-label-md text-label-md ${isSelected ? 'text-primary font-bold' : isDone ? 'text-outline line-through' : isBlocked ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
          {task.id}
        </span>
        <div className="flex items-start justify-end gap-1">
          <div className="flex flex-wrap justify-end gap-1">
            <span className={`${typeClasses[task.type] || typeClasses.DOCS} font-label-md text-[10px] px-1.5 py-0.5 rounded border`}>
              {task.type}
            </span>
            <span className={`${priorityClasses[task.priority] || priorityClasses.MEDIUM} font-label-md text-[10px] px-1.5 py-0.5 rounded border`}>
              {task.priority}
            </span>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handleMenuClick}
              onMouseDown={(event) => event.stopPropagation()}
              draggable={false}
              className="w-6 h-6 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              aria-label={`Open actions for ${task.id}`}
            >
              <span className="material-symbols-outlined text-[18px]">more_vert</span>
            </button>
            {isMenuOpen && (
              <div
                className="absolute right-0 top-7 z-30 w-32 rounded-lg border border-outline-variant bg-surface-container-lowest shadow-lg overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-on-surface hover:bg-surface-container flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="w-full px-3 py-2 text-left text-xs font-semibold text-error hover:bg-error/10 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h4 className={`text-sm font-semibold mb-3 leading-snug ${isDone ? 'text-on-surface-variant line-through' : 'text-on-background'}`}>
        {task.title}
      </h4>

      {isBlocked && task.blockedReason && (
        <div className="bg-surface-container-lowest p-2 rounded text-xs border border-error-container mb-3 flex items-start space-x-1">
          <span className="material-symbols-outlined text-[14px] text-error mt-0.5">block</span>
          <span className="text-on-surface-variant">{task.blockedReason}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-on-surface-variant mb-3 border-t border-surface-container-high pt-2">
        <div className="flex items-center space-x-1 bg-surface-container px-1.5 py-0.5 rounded text-[11px] font-medium">
          <span className="material-symbols-outlined text-[14px]">assignment</span>
          <span>{task.requirement}</span>
        </div>
        <div className={`w-6 h-6 rounded-full ${task.assignee.color} flex items-center justify-center font-semibold text-[10px] border border-outline-variant`}>
          {task.assignee.initials}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className={`flex items-center space-x-1 text-[11px] ${getEvidenceClass(task.evidenceStatus)}`} title="Evidence status">
          <span className="material-symbols-outlined text-[14px]">inventory_2</span>
          <span>{task.evidenceStatus}</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-outline" title="Test status">
          <span className="material-symbols-outlined text-[14px]">fact_check</span>
          <span>{task.testStatus}</span>
        </div>
        <div className="flex items-center space-x-1 text-[11px] text-outline" title="Checklist">
          <span className="material-symbols-outlined text-[14px]">checklist</span>
          <span>{completed}/{task.checklist.length}</span>
        </div>
      </div>
    </div>
  )
}

export default TaskCard
