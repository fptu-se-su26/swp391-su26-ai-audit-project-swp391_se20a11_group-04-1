const backendToUiType = {
  DEVELOPMENT: 'DEV',
  TESTING: 'QA',
  DOCUMENTATION: 'DOCS',
  UI_UX: 'UI/UX',
  RESEARCH: 'DOCS',
  DEPLOYMENT: 'DEV',
  BUG_FIX: 'BUG',
  REVIEW: 'QA',
}

const uiToBackendType = {
  DEV: 'DEVELOPMENT',
  QA: 'TESTING',
  DOCS: 'DOCUMENTATION',
  'UI/UX': 'UI_UX',
  BUG: 'BUG_FIX',
}

const getInitials = (name = 'Unassigned') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UA'

const buildAssignee = (assignee) => {
  const name = assignee?.name || assignee?.email || 'Unassigned'

  return {
    id: assignee?.id || null,
    name,
    email: assignee?.email || '',
    initials: getInitials(name),
    color: 'bg-surface-container-highest text-on-surface-variant',
  }
}

export const mapTaskFromApi = (task) => ({
  id: String(task.id),
  title: task.title || 'Untitled task',
  description: task.description || '',
  type: backendToUiType[task.type] || 'DEV',
  priority: task.priority || 'MEDIUM',
  status: task.status || 'TODO',
  sprint: task.sprintName || (task.sprintId ? `Sprint ${task.sprintId}` : 'No Sprint'),
  sprintId: task.sprintId || null,
  assignee: buildAssignee(task.primaryAssignee),
  requirement: task.requirementCode || (task.requirementId ? `REQ-${String(task.requirementId).padStart(2, '0')}` : 'No Requirement'),
  requirementId: task.requirementId || null,
  evidenceStatus: 'Not Uploaded',
  testStatus: 'Not Run',
  blockedReason: task.blockedReason || '',
  checklist: (task.checklist || []).map((item) => ({
    id: String(item.id),
    text: item.content,
    done: item.done,
  })),
})

const parseRequirementId = (value) => {
  if (!value) return null
  const match = String(value).match(/\d+/)
  return match ? Number(match[0]) : null
}

export const mapTaskToApi = (payload) => ({
  title: payload.title?.trim(),
  description: payload.description?.trim() || '',
  requirementId: payload.requirementId ? Number(payload.requirementId) : parseRequirementId(payload.requirement),
  sprintId: payload.sprintId ? Number(payload.sprintId) : null,
  type: uiToBackendType[payload.type] || 'DEVELOPMENT',
  primaryAssigneeId: payload.assigneeId ? Number(payload.assigneeId) : null,
  priority: payload.priority || 'MEDIUM',
  status: payload.status || 'TODO',
  blockedReason: payload.status === 'BLOCKED' ? payload.blockedReason?.trim() || 'Reason not provided yet' : '',
  checklist: (payload.checklist || []).map((item, index) => ({
    id: Number.isFinite(Number(item.id)) ? Number(item.id) : null,
    content: item.text || item.content || '',
    done: Boolean(item.done),
    orderIndex: index,
  })),
})
