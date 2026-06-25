export const statusLabels = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
  BLOCKED: 'Blocked',
}

export const statusColors = {
  TODO: '#94a3b8',
  IN_PROGRESS: '#2563eb',
  IN_REVIEW: '#7c3aed',
  DONE: '#16a34a',
  BLOCKED: '#dc2626',
}

export const badgeClasses = {
  ACTIVE: 'bg-[#dcfce7] text-[#166534]',
  PLANNED: 'bg-[#D7EEF1] text-[#1E707D]',
  COMPLETED: 'bg-surface-container-high text-on-surface-variant',
  OVERDUE: 'bg-[#fef08a] text-[#854d0e]',
  PENALTY: 'bg-[#fee2e2] text-[#991b1b]',
  BLOCKED: 'bg-error-container text-on-error-container',
  MISSING_EVIDENCE: 'bg-[#ffedd5] text-[#9a3412]',
  DUE_SOON: 'bg-[#dbeafe] text-[#1d4ed8]',
  RED: 'bg-[#fee2e2] text-[#991b1b]',
}

export const todayStr = () => new Date().toISOString().split('T')[0]

export const daysBetween = (start, end) => {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24))
}

export const getAssigneeName = (task) =>
  task.assigneeName
  || task.primaryAssignee?.name
  || task.primaryAssignee?.fullName
  || task.primaryAssignee?.username
  || task.assignee?.name
  || 'Unassigned'

export const getTaskId = (task) => task.id || task.taskId || task.code

export const canGenerateSprintReport = (role) => {
  const normalized = String(role || '').trim().toUpperCase().replace(/\s+/g, '_')
  return ['PROJECT_LEADER', 'LEADER', 'MENTOR'].includes(normalized)
}

export const getSlaCategorySet = (task) => new Set(Array.isArray(task.slaCategories) ? task.slaCategories : [])

export const taskHasSlaCategory = (task, categories) => {
  const categorySet = getSlaCategorySet(task)
  return categories.some((category) => categorySet.has(category))
}

export const getRiskReasons = (task, today) => {
  const categorySet = getSlaCategorySet(task)
  const hasBackendSla = categorySet.size > 0
  const fallbackOverdueDays = task.deadline && task.status !== 'DONE' && task.deadline < today
    ? daysBetween(task.deadline, today)
    : 0
  const overdueDays = Number(task.overdueDays || 0) || fallbackOverdueDays

  const reasons = [
    categorySet.has('OVERDUE_PENALTY') || (!hasBackendSla && task.overduePenaltyApplied)
      ? { label: 'Penalty', type: 'PENALTY' }
      : null,
    categorySet.has('BLOCKED') || (!hasBackendSla && task.status === 'BLOCKED')
      ? { label: 'Blocked', type: 'BLOCKED' }
      : null,
    categorySet.has('MISSING_EVIDENCE') || (!hasBackendSla && (task.evidenceStatus === 'Missing' || task.evidenceStatus === 'MISSING'))
      ? { label: 'Missing evidence', type: 'MISSING_EVIDENCE' }
      : null,
    categorySet.has('OVERDUE_SHORT') || (!hasBackendSla && overdueDays > 0 && overdueDays <= 2)
      ? { label: `${overdueDays}d overdue`, type: 'OVERDUE' }
      : null,
    categorySet.has('DUE_SOON') ? { label: 'Due soon', type: 'DUE_SOON' } : null,
  ].filter(Boolean)

  return { reasons, overdueDays }
}
