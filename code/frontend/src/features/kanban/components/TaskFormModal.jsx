import { useEffect, useState } from 'react'
import { TASK_STATUSES, priorityOptions, typeOptions } from '../store/useKanbanStore'

const emptyFormData = {
  title: '',
  description: '',
  requirementId: '',
  assigneeId: '',
  assigneeName: '',
  sprintId: '',
  type: 'DEV',
  priority: 'MEDIUM',
  status: 'TODO',
  blockedReason: '',
}

const TaskFormModal = ({
  isOpen,
  task,
  assigneeOptions = [],
  requirementOptions = [],
  sprintOptions = [],
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    ...emptyFormData,
  })

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
        type: task.type || 'DEV',
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        blockedReason: task.blockedReason || '',
      })
    } else {
      setFormData({ ...emptyFormData })
    }
  }, [isOpen, task])

  if (!isOpen) return null

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!formData.title.trim()) return
    onSubmit(formData)
    setFormData({ ...emptyFormData })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-surface-container-lowest border border-outline-variant rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{isEditMode ? 'edit' : 'add_task'}</span>
            <h3 className="font-bold text-on-surface">{isEditMode ? `Edit ${task.id}` : 'New Task'}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Title</label>
            <input
              value={formData.title}
              onChange={(event) => updateField('title', event.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Implement task feature"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase">Description</label>
            <textarea
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary resize-none h-24"
              placeholder="What should be done?"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Requirement</label>
              <select
                value={formData.requirementId}
                onChange={(event) => updateField('requirementId', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No requirement</option>
                {requirementOptions.map((requirement) => (
                  <option key={requirement.id} value={requirement.id}>
                    {requirement.code} - {requirement.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Assignee</label>
              {assigneeOptions.length > 0 ? (
                <select
                  value={formData.assigneeId}
                  onChange={(event) => {
                    const member = assigneeOptions.find((item) => String(item.id) === event.target.value)
                    updateField('assigneeId', event.target.value)
                    updateField('assigneeName', member?.name || '')
                  }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Member name"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Type</label>
              <select
                value={formData.type}
                onChange={(event) => updateField('type', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {typeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Priority</label>
              <select
                value={formData.priority}
                onChange={(event) => updateField('priority', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {priorityOptions.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Sprint</label>
              <select
                value={formData.sprintId}
                onChange={(event) => updateField('sprintId', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">No sprint</option>
                {sprintOptions.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}{sprint.status ? ` (${sprint.status})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Status</label>
              <select
                value={formData.status}
                onChange={(event) => updateField('status', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {TASK_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.title}</option>)}
              </select>
            </div>
          </div>

          {formData.status === 'BLOCKED' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Blocked reason</label>
              <input
                value={formData.blockedReason}
                onChange={(event) => updateField('blockedReason', event.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Waiting for..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-surface-tint text-sm font-semibold">
              {isEditMode ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskFormModal
