import { useEffect, useState } from 'react'
import useProjectStore from '@store/useProjectStore'
import { TASK_STATUSES, priorityOptions, typeOptions } from '../store/useKanbanStore'
import { formatTaskType, normalizeTaskType } from '../utils/taskMapper'

const emptyFormData = {
  title: '',
  description: '',
  requirementId: '',
  assigneeId: '',
  assigneeName: '',
  sprintId: '',
  startDate: '',
  deadline: '',
  weight: '1.0',
  estimatedHours: '',
  type: 'DEVELOPMENT',
  priority: 'MEDIUM',
  status: 'TODO',
  columnId: '',
  blockedReason: '',
}

const TaskFormModal = ({
  isOpen,
  task,
  assigneeOptions = [],
  requirementOptions = [],
  sprintOptions = [],
  columnOptions = TASK_STATUSES,
  isLeaderRole = true,
  onClose,
  onSubmit,
}) => {
  const activeProject = useProjectStore((state) => state.activeProject)
  const [formData, setFormData] = useState({
    ...emptyFormData,
  })
  const [errors, setErrors] = useState({})

  const isEditMode = Boolean(task)

  useEffect(() => {
    if (!isOpen) return

    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        requirementId: task.requirementId ? String(task.requirementId) : '',
        assigneeId: task.assignee?.id ? String(task.assignee.id) : '',
        assigneeName: task.assignee?.name || '',
        sprintId: task.sprintId ? String(task.sprintId) : '',
        startDate: task.startDate || '',
        deadline: task.deadline || '',
        weight: task.weight ? String(task.weight) : '1.0',
        estimatedHours: task.estimatedHours ? String(task.estimatedHours) : '',
        type: normalizeTaskType(task.type),
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        columnId: task.columnId || columnOptions.find((column) => column.statusKey === task.status)?.id || '',
        blockedReason: task.blockedReason || '',
      })
    } else {
      setFormData({ ...emptyFormData })
    }
    setErrors({})
  }, [isOpen, task])

  if (!isOpen) return null

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}

    if (!formData.title.trim()) {
      nextErrors.title = 'Title is required.'
    }

    if (!formData.startDate) {
      nextErrors.startDate = 'Start date is required.'
    }

    if (!formData.deadline) {
      nextErrors.deadline = 'Deadline is required.'
    }

    if (formData.status === 'BLOCKED' && !formData.blockedReason.trim()) {
      nextErrors.blockedReason = 'Reason is required.'
    }

    if (formData.weight && (Number(formData.weight) < 1 || Number(formData.weight) > 2)) {
      nextErrors.weight = 'Weight must be 1.0 - 2.0.'
    }

    if (formData.startDate && formData.deadline && formData.deadline < formData.startDate) {
      nextErrors.deadline = 'Deadline must be after start date.'
    }

    if (activeProject?.deadline && formData.deadline && formData.deadline > activeProject.deadline) {
      nextErrors.deadline = `Deadline cannot exceed project deadline (${activeProject.deadline}).`
    }

    if (formData.sprintId && formData.deadline) {
      const selectedSprint = sprintOptions.find(s => String(s.id) === String(formData.sprintId))
      if (selectedSprint?.endDate && formData.deadline > selectedSprint.endDate) {
        nextErrors.deadline = `Deadline cannot exceed sprint end date (${selectedSprint.endDate}).`
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSubmit(formData)
    setFormData({ ...emptyFormData })
    setErrors({})
  }

  return (
    <div className="fixed inset-y-0 right-0 z-[60] flex justify-end bg-transparent pointer-events-none">
      <div className="h-full w-full md:w-[420px] xl:w-[30vw] xl:min-w-[420px] bg-surface-container-lowest border-l border-outline-variant shadow-2xl overflow-hidden flex flex-col pointer-events-auto">
        <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1E707D]">{isEditMode ? 'edit' : 'add_task'}</span>
            <h3 className="font-bold text-on-surface">{isEditMode ? `Edit ${task.id}` : 'New Task'}</h3>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high" aria-label="Close task form">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 kanban-scroll">
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Title <span className="text-error">*</span></label>
            <input
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
              aria-invalid={Boolean(errors.title)}
              className={`w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 ${
                errors.title ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-[#1E707D]'
              }`}
              placeholder="Implement task feature"
              autoFocus
            />
            {errors.title && (
              <p className="text-xs font-semibold text-error">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Description</label>
            <textarea
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D] resize-none h-20"
              placeholder="What should be done?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Requirement</label>
              <select
                value={formData.requirementId}
                onChange={(event) => updateField('requirementId', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
              >
                <option value="">No requirement</option>
                {requirementOptions.map((requirement) => (
                  <option key={requirement.id} value={requirement.id}>
                    {requirement.code} - {requirement.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Assignee</label>
              {assigneeOptions.length > 0 ? (
                <select
                  value={formData.assigneeId}
                  onChange={(event) => {
                    const member = assigneeOptions.find((item) => String(item.id) === event.target.value)
                    updateField('assigneeId', event.target.value)
                    updateField('assigneeName', member?.name || '')
                  }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
                >
                  <option value="">Unassigned</option>
                  {assigneeOptions.map((member) => (
                    <option key={member.id || member.name} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={formData.assigneeName}
                  onChange={(event) => updateField('assigneeName', event.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
                  placeholder="Member name"
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Type</label>
              <select
                value={formData.type}
                onChange={(event) => updateField('type', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
              >
                {typeOptions.map((type) => <option key={type} value={type}>{formatTaskType(type)}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Priority</label>
              <select
                value={formData.priority}
                onChange={(event) => updateField('priority', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
              >
                {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Sprint</label>
              <select
                value={formData.sprintId}
                onChange={(event) => updateField('sprintId', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
              >
                <option value="">No sprint</option>
                {sprintOptions.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}{sprint.status ? ` (${sprint.status})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Status</label>
              <select
                value={formData.columnId || columnOptions.find((column) => column.statusKey === formData.status)?.id || ''}
                onChange={(event) => {
                  const column = columnOptions.find((item) => item.id === event.target.value)
                  updateField('columnId', event.target.value)
                  updateField('status', column?.statusKey || formData.status)
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
              >
                {columnOptions.map((column) => <option key={column.id} value={column.id}>{column.title}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Start date <span className="text-error">*</span></label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(event) => updateField('startDate', event.target.value)}
                aria-invalid={Boolean(errors.startDate)}
                className={`w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 ${
                  errors.startDate ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-[#1E707D]'
                }`}
              />
              {errors.startDate && <p className="text-xs font-semibold text-error">{errors.startDate}</p>}
            </div>
            {isLeaderRole && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Deadline <span className="text-error">*</span></label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(event) => updateField('deadline', event.target.value)}
                  aria-invalid={Boolean(errors.deadline)}
                  className={`w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 ${
                    errors.deadline ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-[#1E707D]'
                  }`}
                />
                {errors.deadline && <p className="text-xs font-semibold text-error">{errors.deadline}</p>}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Weight</label>
              <input
                type="number"
                min="1"
                max="2"
                step="0.1"
                value={formData.weight}
                onChange={(event) => updateField('weight', event.target.value)}
                aria-invalid={Boolean(errors.weight)}
                className={`w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 ${
                  errors.weight ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-[#1E707D]'
                }`}
              />
              {errors.weight && <p className="text-xs font-semibold text-error">{errors.weight}</p>}
            </div>
            {isLeaderRole && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Estimated hours</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(event) => updateField('estimatedHours', event.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
                  placeholder="4"
                />
              </div>
            )}
          </div>

          {formData.status === 'BLOCKED' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Blocked reason</label>
              <input
                value={formData.blockedReason}
                onChange={(event) => updateField('blockedReason', event.target.value)}
                aria-invalid={Boolean(errors.blockedReason)}
                className={`w-full bg-surface-container-lowest border rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 ${
                  errors.blockedReason ? 'border-error focus:ring-error' : 'border-outline-variant focus:ring-[#1E707D]'
                }`}
                placeholder="Waiting for..."
              />
              {errors.blockedReason && (
                <p className="text-xs font-semibold text-error">{errors.blockedReason}</p>
              )}
            </div>
          )}

          <div className="sticky bottom-0 -mx-5 -mb-4 flex justify-end border-t border-outline-variant bg-surface-container-lowest px-5 py-3">
            <button type="submit" className="h-9 px-4 rounded-lg bg-[#1E707D] text-white hover:bg-surface-tint text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">{isEditMode ? 'save' : 'add_task'}</span>
              <span>{isEditMode ? 'Save' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskFormModal
