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
  const name = assignee?.fullName || assignee?.name || assignee?.email || 'Unassigned'

  return {
    id: assignee?.id ? String(assignee.id) : null,  // luôn là string để so sánh nhất quán
    name,
    fullName: name,  // thêm fullName để AiInsightPanel dùng
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
  columnId: task.columnId ? String(task.columnId) : null,
  columnName: task.columnName || '',
  sprint: task.sprintName || (task.sprintId ? `Sprint ${task.sprintId}` : 'No Sprint'),
  sprintId: task.sprintId || null,
  startDate: task.startDate || '',
  deadline: task.deadline || '',
  weight: task.weight ?? 1,
  estimatedHours: task.estimatedHours ?? '',
  overduePenaltyApplied: Boolean(task.overduePenaltyApplied),
  overduePenaltyAppliedAt: task.overduePenaltyAppliedAt || '',
  sprintPlanDate: task.sprintPlanDate || null,
  assignee: buildAssignee(task.primaryAssignee),
  requirement: task.requirementCode || (task.requirementId ? `REQ-${String(task.requirementId).padStart(2, '0')}` : 'No Requirement'),
  requirementId: task.requirementId || null,
  evidenceStatus: 'Not Uploaded',
  testStatus: 'Not Run',
  blockedReason: task.blockedReason || '',
  // Thêm các field cần cho Daily/Weekly view
  deadline: task.deadline || null,
  estimatedHours: task.estimatedHours || null,
  updatedAt: task.updatedAt || null,
  createdAt: task.createdAt || null,
  evidenceCount: task.evidenceCount || 0,
  // sprintId giữ nguyên number để match với activeSprint.id
  sprintId: task.sprintId ? Number(task.sprintId) : null,
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
