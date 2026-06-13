export const TASK_TYPES = [
  'DEVELOPMENT',
  'TESTING',
  'DOCUMENTATION',
  'UI_UX',
  'RESEARCH',
  'DEPLOYMENT',
  'BUG_FIX',
  'REVIEW',
]

const legacyUiToBackendType = {
  DEV: 'DEVELOPMENT',
  QA: 'TESTING',
  DOCS: 'DOCUMENTATION',
  'UI/UX': 'UI_UX',
  BUG: 'BUG_FIX',
}

export const taskTypeLabels = {
  DEVELOPMENT: 'Development',
  TESTING: 'Testing',
  DOCUMENTATION: 'Documentation',
  UI_UX: 'UI/UX',
  RESEARCH: 'Research',
  DEPLOYMENT: 'Deployment',
  BUG_FIX: 'Bug Fix',
  REVIEW: 'Review',
}

export const taskTypeShortLabels = {
  DEVELOPMENT: 'DEV',
  TESTING: 'QA',
  DOCUMENTATION: 'DOCS',
  UI_UX: 'UI/UX',
  RESEARCH: 'R&D',
  DEPLOYMENT: 'DEPLOY',
  BUG_FIX: 'BUG',
  REVIEW: 'REVIEW',
}

export const normalizeTaskType = (value) => {
  if (!value) return 'DEVELOPMENT'
  if (TASK_TYPES.includes(value)) return value
  return legacyUiToBackendType[value] || 'DEVELOPMENT'
}

export const formatTaskType = (value) => taskTypeLabels[normalizeTaskType(value)] || taskTypeLabels.DEVELOPMENT

export const shortTaskType = (value) => taskTypeShortLabels[normalizeTaskType(value)] || taskTypeShortLabels.DEVELOPMENT

const getInitials = (name = 'Unassigned') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'UA'

const buildAssignee = (assignee) => {
  const name = assignee?.fullName || assignee?.name || assignee?.email || 'Unassigned'

  return {
    id: assignee?.id ? String(assignee.id) : null,
    name,
    fullName: name,
    email: assignee?.email || '',
    initials: getInitials(name),
    color: 'bg-surface-container-highest text-on-surface-variant',
  }
}

export const mapTaskFromApi = (task) => {
  const normalizedType = normalizeTaskType(task.type)
  const normalizedSprintId = task.sprintId ? Number(task.sprintId) : null

  return {
    id: String(task.id),
    title: task.title || 'Untitled task',
    backendType: normalizedType,
    description: task.description || '',
    type: normalizedType,
    priority: task.priority || 'MEDIUM',
    status: task.status || 'TODO',
    columnId: task.columnId ? String(task.columnId) : null,
    columnName: task.columnName || '',
    sprint: task.sprintName || (task.sprintId ? `Sprint ${task.sprintId}` : 'No Sprint'),
    sprintId: normalizedSprintId,
    startDate: task.startDate || '',
    deadline: task.deadline || null,
    weight: task.weight ?? 1,
    estimatedHours: task.estimatedHours ?? null,
    overduePenaltyApplied: Boolean(task.overduePenaltyApplied),
    overduePenaltyAppliedAt: task.overduePenaltyAppliedAt || '',
    sprintPlanDate: task.sprintPlanDate || null,
    assignee: buildAssignee(task.primaryAssignee),
    requirement: task.requirementCode || (task.requirementId ? `REQ-${String(task.requirementId).padStart(2, '0')}` : 'No Requirement'),
    requirementId: task.requirementId || null,
    evidenceStatus: 'Not Uploaded',
    testStatus: 'Not Run',
    blockedReason: task.blockedReason || '',
    updatedAt: task.updatedAt || null,
    createdAt: task.createdAt || null,
    evidenceCount: task.evidenceCount || 0,
    checklist: (task.checklist || []).map((item) => ({
      id: String(item.id),
      text: item.content,
      done: item.done,
    })),
    parentId: task.parentId ? String(task.parentId) : null,
    createdById: task.createdById ? String(task.createdById) : null,
    createdByName: task.createdByName || null,
    githubIssueNumber: task.githubIssueNumber || null,
    githubIssueUrl: task.githubIssueUrl || null,
    latestReviewDecision: task.latestReviewDecision || null,
    latestReviewReason: task.latestReviewReason || '',
    latestReviewDecisionAt: task.latestReviewDecisionAt || null,
  }
}

export const isIssueOwnedTask = (task) => {
  if (!task) return false
  return normalizeTaskType(task.backendType || task.type) === 'BUG_FIX'
}

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
  type: normalizeTaskType(payload.type),
  primaryAssigneeId: payload.assigneeId ? Number(payload.assigneeId) : null,
  priority: payload.priority || 'MEDIUM',
  startDate: payload.startDate || null,
  deadline: payload.deadline || null,
  weight: payload.weight ? Number(payload.weight) : 1,
  estimatedHours: payload.estimatedHours ? Number(payload.estimatedHours) : null,
  status: payload.status || 'TODO',
  columnId: payload.columnId ? Number(payload.columnId) : null,
  blockedReason: payload.status === 'BLOCKED' ? payload.blockedReason?.trim() || 'Reason not provided yet' : '',
  checklist: (payload.checklist || []).map((item, index) => ({
    id: Number.isFinite(Number(item.id)) ? Number(item.id) : null,
    content: item.text || item.content || '',
    done: Boolean(item.done),
    orderIndex: index,
  })),
})
