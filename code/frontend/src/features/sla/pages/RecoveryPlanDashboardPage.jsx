import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import { useProjectRole } from '@/hooks/useProjectRole'
import { sprintService } from '@features/sprint/services/sprintService'
import { recoveryPlanService } from '../services/recoveryPlanService'
import RecoveryEvidenceModal from '../components/RecoveryEvidenceModal'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const STATUS_STYLES = {
  PENDING_APPROVAL: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-700 border-blue-200',
  EXECUTING: 'bg-violet-50 text-violet-700 border-violet-200',
  EXECUTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  REJECTED: 'bg-slate-100 text-slate-700 border-slate-200',
  DECLINED: 'bg-orange-50 text-orange-700 border-orange-200',
}

const RISK_STYLES = {
  BREACH: { badge: 'bg-red-50 text-red-700 border-red-200', rail: 'bg-red-500', icon: 'warning', label: 'Breach' },
  WARNING: { badge: 'bg-amber-50 text-amber-700 border-amber-200', rail: 'bg-amber-500', icon: 'priority_high', label: 'Warning' },
}

const TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'NO_PLAN', label: 'Needs Plan' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
]

const ACTION_TYPES = [
  'NOTIFY_ASSIGNEE',
  'ESCALATE_LEADER',
  'ASK_BLOCKER_UPDATE',
  'CREATE_RECOVERY_CHECKLIST',
  'SCHEDULE_FOLLOW_UP',
  'SUGGEST_SPLIT_TASK',
  'SUGGEST_REASSIGN',
]

const parseActionPayload = (payload) => {
  if (!payload) return {}
  if (typeof payload === 'object') return payload
  try {
    return JSON.parse(payload)
  } catch {
    return {}
  }
}

const labelize = (value) => String(value || 'N/A').replace(/_/g, ' ')

const normalizeStringList = (items) => Array.isArray(items)
  ? items.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
  : []

const formatDateTime = (value) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatDate = (value) => {
  if (!value) return 'No deadline'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

const getRiskStyle = (riskLevel) => RISK_STYLES[riskLevel] || RISK_STYLES.WARNING

const getActionIcon = (actionType) => {
  const icons = {
    ESCALATE_LEADER: 'record_voice_over',
    CREATE_RECOVERY_CHECKLIST: 'checklist',
    ASK_BLOCKER_UPDATE: 'chat_info',
    SUGGEST_SPLIT_TASK: 'call_split',
    SUGGEST_REASSIGN: 'person_add',
    NOTIFY_ASSIGNEE: 'notifications_active',
    SCHEDULE_FOLLOW_UP: 'event_repeat',
  }
  return icons[actionType] || 'task_alt'
}

const isFallbackPlan = (plan) => {
  if (!plan) return false
  return plan.generatedSource === 'RULE'
    || plan.generationMode === 'RULE_FALLBACK'
    || plan.generationMode === 'AI_FAILED_FALLBACK'
}

const Badge = ({ children, className = '', icon }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-black uppercase ${className}`}>
    {icon && <span className="material-symbols-outlined text-[15px]">{icon}</span>}
    {children}
  </span>
)

const MetricCard = ({ label, value, helper, icon, tone = 'text-primary' }) => (
  <Card style={{ padding: 20 }} className="h-full">
    <div className="flex items-start justify-between gap-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">{label}</p>
      <span className={`material-symbols-outlined text-xl ${tone}`}>{icon}</span>
    </div>
    <p className="mt-3 text-3xl font-black tracking-tight text-on-surface">{value}</p>
    <p className="mt-1 text-xs text-on-surface-variant">{helper}</p>
  </Card>
)

const EmptyState = ({ loading }) => (
  <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
    <span className={`material-symbols-outlined text-5xl text-primary ${loading ? 'animate-spin' : ''}`}>
      {loading ? 'progress_activity' : 'shield_question'}
    </span>
    <h3 className="mt-4 text-xl font-black text-on-surface">
      {loading ? 'Loading recovery tasks' : 'No risky tasks found'}
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
      {loading ? 'Checking tasks that need recovery review.' : 'Try another sprint or refresh SLA data.'}
    </p>
  </section>
)

export default function RecoveryPlanDashboardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeProject = useProjectStore(state => state.activeProject)
  const { isLeader } = useProjectRole()

  const [sprints, setSprints] = useState([])
  const [selectedSprintId, setSelectedSprintId] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [generatingTaskId, setGeneratingTaskId] = useState(null)
  const [evidencePlan, setEvidencePlan] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [editingPlan, setEditingPlan] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [editDraft, setEditDraft] = useState({ summary: '', actions: [] })

  useEffect(() => {
    if (!activeProject?.id) return
    sprintService.getSprints(activeProject.id).then(data => {
      const list = Array.isArray(data) ? data : []
      setSprints(list)
      const active = list.find(s => s.status === 'ACTIVE')
      setSelectedSprintId(active ? active.id : '')
    })
  }, [activeProject?.id])

  const loadTasks = async () => {
    if (!activeProject?.id) return
    setLoading(true)
    try {
      const data = await recoveryPlanService.getProjectRecoveryTasks(activeProject.id, {
        sprintId: selectedSprintId || undefined,
      })
      const list = Array.isArray(data) ? data : []
      setTasks(list)

      const taskIdFromUrl = searchParams.get('taskId')
      if (taskIdFromUrl && !selectedTask) {
        const task = list.find(item => String(item.taskId) === taskIdFromUrl)
        if (task) openTaskDetails(task)
      }
    } catch (err) {
      toast.error('Failed to load recovery tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [activeProject?.id, selectedSprintId])

  const buildEditDraft = (plan) => ({
    summary: plan?.summary || '',
    actions: (Array.isArray(plan?.actions) ? plan.actions : []).map(action => {
      const payload = parseActionPayload(action.payload)
      return {
        id: action.id,
        _tempId: null,
        actionType: action.actionType,
        priority: action.priority || 'MEDIUM',
        message: action.message || payload.actionDetails || payload.rationale || '',
        checklistItems: normalizeStringList(payload.checklistItems),
        recommendedAssigneeId: payload.recommendedAssigneeId || '',
        recommendedAssigneeName: payload.recommendedAssigneeName || '',
        recommendedReason: payload.recommendedReason || '',
        notRecommendedAssignees: normalizeStringList(payload.notRecommendedAssignees),
      }
    }),
  })

  const syncTaskPlan = (taskId, plan) => {
    setTasks(current => current.map(task => {
      if (task.taskId !== taskId) return task
      const history = Array.isArray(task.planHistory) ? task.planHistory : []
      const nextHistory = [plan, ...history.filter(item => item.id !== plan.id)]
      return { ...task, activePlan: plan, planHistory: nextHistory }
    }))
    setSelectedTask(current => {
      if (!current || current.taskId !== taskId) return current
      const history = Array.isArray(current.planHistory) ? current.planHistory : []
      const nextHistory = [plan, ...history.filter(item => item.id !== plan.id)]
      return { ...current, activePlan: plan, planHistory: nextHistory }
    })
  }

  const openTaskDetails = (task) => {
    const plan = task.activePlan || null
    setSelectedTask(task)
    setSelectedPlan(plan)
    setEditingPlan(false)
    setEditDraft(buildEditDraft(plan))
  }

  const handleGenerateTaskPlan = async (task) => {
    if (!activeProject?.id || !task?.taskId || generatingTaskId) return
    setGeneratingTaskId(task.taskId)
    try {
      const plan = await recoveryPlanService.generateRecoveryPlan(activeProject.id, task.taskId)
      toast.success('Plan generated')
      setSelectedPlan(plan)
      setEditDraft(buildEditDraft(plan))
      syncTaskPlan(task.taskId, plan)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate plan')
    } finally {
      setGeneratingTaskId(null)
    }
  }

  const handleApprove = async (plan) => {
    if (!plan) return
    try {
      const updated = await recoveryPlanService.approveRecoveryPlan(activeProject.id, plan.id)
      toast.success('Plan approved')
      setSelectedPlan(updated)
      syncTaskPlan(updated.taskId, updated)
    } catch (err) {
      toast.error('Failed to approve plan')
    }
  }

  const handleExecute = async (plan) => {
    if (!plan) return
    try {
      const updated = await recoveryPlanService.executeRecoveryPlan(activeProject.id, plan.id)
      toast.success('Plan executed')
      setSelectedPlan(updated)
      syncTaskPlan(updated.taskId, updated)
      await loadTasks()
    } catch (err) {
      toast.error('Failed to execute plan')
    }
  }

  const updateDraftAction = (actionKey, patch) => {
    setEditDraft(current => ({
      ...current,
      actions: current.actions.map(action => (
        (action.id ?? action._tempId) === actionKey ? { ...action, ...patch } : action
      )),
    }))
  }

  const addNewDraftAction = () => {
    const tempId = Date.now()
    setEditDraft(current => ({
      ...current,
      actions: [
        ...current.actions,
        {
          id: null,
          _tempId: tempId,
          actionType: 'NOTIFY_ASSIGNEE',
          priority: 'MEDIUM',
          message: '',
          checklistItems: [],
          recommendedAssigneeId: '',
          recommendedAssigneeName: '',
          recommendedReason: '',
          notRecommendedAssignees: [],
        },
      ],
    }))
  }

  const removeDraftAction = (actionKey) => {
    setEditDraft(current => ({
      ...current,
      actions: current.actions.filter(action => (action.id ?? action._tempId) !== actionKey),
    }))
  }

  const updateDraftChecklistItem = (actionKey, index, value) => {
    setEditDraft(current => ({
      ...current,
      actions: current.actions.map(action => {
        if ((action.id ?? action._tempId) !== actionKey) return action
        const checklistItems = [...(action.checklistItems || [])]
        checklistItems[index] = value
        return { ...action, checklistItems }
      }),
    }))
  }

  const handleSavePlan = async () => {
    if (!selectedPlan || savingPlan) return
    setSavingPlan(true)
    try {
      const updatedPlan = await recoveryPlanService.updateRecoveryPlan(activeProject.id, selectedPlan.id, {
        summary: editDraft.summary,
        actions: editDraft.actions.map(action => ({
          id: action.id || null,
          newAction: action.id === null,
          actionType: action.actionType,
          priority: action.priority,
          message: action.message,
          checklistItems: action.checklistItems,
          recommendedAssigneeId: action.recommendedAssigneeId || null,
          recommendedAssigneeName: action.recommendedAssigneeName,
          recommendedReason: action.recommendedReason,
          notRecommendedAssignees: action.notRecommendedAssignees,
        })),
      })
      toast.success('Plan updated')
      setSelectedPlan(updatedPlan)
      setEditDraft(buildEditDraft(updatedPlan))
      syncTaskPlan(updatedPlan.taskId, updatedPlan)
      setEditingPlan(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update plan')
    } finally {
      setSavingPlan(false)
    }
  }

  const stats = useMemo(() => ({
    total: tasks.length,
    noPlan: tasks.filter(task => !task.activePlan).length,
    pending: tasks.filter(task => task.activePlan?.status === 'PENDING_APPROVAL').length,
    approved: tasks.filter(task => task.activePlan?.status === 'APPROVED').length,
  }), [tasks])

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (activeTab === 'NO_PLAN') return !task.activePlan
    if (activeTab === 'PENDING') return task.activePlan?.status === 'PENDING_APPROVAL'
    if (activeTab === 'APPROVED') return task.activePlan?.status === 'APPROVED'
    return true
  }), [tasks, activeTab])

  const tabCount = (tabId) => {
    if (tabId === 'NO_PLAN') return stats.noPlan
    if (tabId === 'PENDING') return stats.pending
    if (tabId === 'APPROVED') return stats.approved
    return stats.total
  }

  const renderPlanActions = (plan) => {
    const actions = Array.isArray(plan?.actions) ? plan.actions : []
    if (!actions.length) {
      return (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
          No actions yet.
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {actions.map(action => {
          const payload = parseActionPayload(action.payload)
          const checklist = normalizeStringList(payload.checklistItems)
          const notRecommended = normalizeStringList(payload.notRecommendedAssignees)
          return (
            <div key={action.id || action.actionType} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                  <span className="material-symbols-outlined text-[18px]">{getActionIcon(action.actionType)}</span>
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-on-surface">{labelize(action.actionType)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-on-surface">
                {action.message || 'No action message provided.'}
              </p>

              {action.actionType === 'SUGGEST_REASSIGN' && (
                <div className="mt-3 rounded-xl border border-primary/15 bg-primary-fixed/30 p-3 text-sm">
                  <p className="font-black text-on-surface">Should assign: {payload.recommendedAssigneeName || 'No suggestion'}</p>
                  {payload.recommendedReason && <p className="mt-1 text-on-surface-variant">Reason: {payload.recommendedReason}</p>}
                  {notRecommended.length > 0 && (
                    <div className="mt-2">
                      <p className="font-black text-on-surface">Should not assign</p>
                      <div className="mt-1 space-y-1 text-on-surface-variant">
                        {notRecommended.map((item, index) => <p key={`${action.id}-avoid-${index}`}>{item}</p>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {checklist.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {checklist.map((item, index) => (
                    <div key={`${action.id}-check-${index}`} className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined mt-0.5 text-[15px] text-primary">check_box_outline_blank</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const getReasonLabel = (candidate) => {
    if (candidate.recommended === false) return 'Không gợi ý'
    if (candidate.recommendedReason) {
      const r = String(candidate.recommendedReason).toLowerCase()
      if (r.includes('overload') || r.includes('nhiều task')) return 'Ít task'
      if (r.includes('available') || r.includes('rảnh')) return 'Có thời gian'
      if (r.includes('skill') || r.includes('kỹ năng')) return 'Phù hợp kỹ năng'
      if (r.includes('overdue') || r.includes('quá hạn') === false) return 'Không quá hạn'
      // Short: first 3 words
      return candidate.recommendedReason.split(' ').slice(0, 3).join(' ')
    }
    if (candidate.activeTaskCount !== undefined && candidate.activeTaskCount <= 2) return 'Ít task'
    if (candidate.overdueTaskCount === 0) return 'Không quá hạn'
    return 'Khả dụng'
  }

  const renderEditablePlanActions = () => {
    const candidates = Array.isArray(selectedPlan?.memberCandidates) ? selectedPlan.memberCandidates : []
    return (
      <div className="space-y-3">
        {editDraft.actions.map(action => {
          const actionKey = action.id ?? action._tempId
          const isNewAction = action.id === null
          return (
            <div key={actionKey} className={`rounded-xl border bg-surface-container-lowest p-4 ${isNewAction ? 'border-primary/40 bg-primary-fixed/10' : 'border-outline-variant'}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                    <span className="material-symbols-outlined text-[18px]">{getActionIcon(action.actionType)}</span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-on-surface">{labelize(action.actionType)}</p>
                    <p className="text-xs text-on-surface-variant">{isNewAction ? 'New action' : 'Edit before approval'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={action.actionType}
                    onChange={(event) => updateDraftAction(actionKey, { actionType: event.target.value })}
                    className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary"
                  >
                    {ACTION_TYPES.map(type => (
                      <option key={type} value={type}>{labelize(type)}</option>
                    ))}
                  </select>
                  {isNewAction && (
                    <button
                      type="button"
                      onClick={() => removeDraftAction(actionKey)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove action"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={action.message}
                onChange={(event) => updateDraftAction(actionKey, { message: event.target.value })}
                rows={3}
                className="mt-3 w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm leading-relaxed text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />

              {action.actionType === 'CREATE_RECOVERY_CHECKLIST' && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase text-on-surface-variant">Checklist</p>
                    <button
                      type="button"
                      onClick={() => updateDraftAction(actionKey, { checklistItems: [...(action.checklistItems || []), ''] })}
                      className="rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary-container"
                    >
                      Add item
                    </button>
                  </div>
                  {(action.checklistItems || []).map((item, index) => (
                    <div key={`${actionKey}-edit-check-${index}`} className="flex gap-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(event) => updateDraftChecklistItem(actionKey, index, event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={() => updateDraftAction(actionKey, {
                          checklistItems: (action.checklistItems || []).filter((_, itemIndex) => itemIndex !== index),
                        })}
                        className="rounded-lg px-2 text-on-surface-variant hover:bg-surface"
                        aria-label="Remove checklist item"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {action.actionType === 'SUGGEST_REASSIGN' && (
                <div className="mt-3 space-y-3">
                  {/* AI candidate cards */}
                  {candidates.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-black uppercase text-on-surface-variant">AI Priority Suggestions</p>
                      <div className="flex flex-wrap gap-2">
                        {candidates.map((candidate, ci) => {
                          const name = candidate.displayName || candidate.recommendedAssigneeName || ''
                          if (!name) return null
                          const isSelected = action.recommendedAssigneeName === name
                          const isRecommended = candidate.recommended !== false
                          const reasonLabel = getReasonLabel(candidate)
                          const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
                          return (
                            <button
                              key={`cand-${ci}`}
                              type="button"
                              disabled={!isRecommended}
                              onClick={() => isRecommended && updateDraftAction(actionKey, {
                                recommendedAssigneeName: name,
                                recommendedAssigneeId: candidate.userId || '',
                                recommendedReason: candidate.recommendedReason || reasonLabel,
                              })}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary text-on-primary shadow-sm'
                                  : isRecommended
                                    ? 'border-primary/30 bg-primary-fixed/20 text-on-surface hover:border-primary hover:bg-primary-fixed/40'
                                    : 'cursor-not-allowed border-outline-variant bg-surface opacity-50 text-on-surface-variant'
                              }`}
                            >
                              <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-primary-fixed text-primary'
                              }`}>
                                {initials}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-bold leading-tight">{name}</span>
                                <span className={`block text-[10px] font-semibold leading-tight ${
                                  isSelected ? 'text-white/80' : isRecommended ? 'text-primary' : 'text-on-surface-variant'
                                }`}>
                                  {reasonLabel}
                                </span>
                              </span>
                              {isSelected && (
                                <span className="material-symbols-outlined ml-auto shrink-0 text-[16px] text-white">check_circle</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-primary/15 bg-primary-fixed/20 p-3 space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="space-y-1">
                        <span className="text-xs font-black uppercase text-on-surface-variant">Should assign</span>
                        <input
                          type="text"
                          value={action.recommendedAssigneeName || ''}
                          onChange={(event) => updateDraftAction(actionKey, { recommendedAssigneeName: event.target.value })}
                          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs font-black uppercase text-on-surface-variant">Reason</span>
                        <input
                          type="text"
                          value={action.recommendedReason || ''}
                          onChange={(event) => updateDraftAction(actionKey, { recommendedReason: event.target.value })}
                          placeholder="e.g. Ít task, có thời gian"
                          className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                        />
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black uppercase text-on-surface-variant">Should not assign</p>
                        <button
                          type="button"
                          onClick={() => updateDraftAction(actionKey, { notRecommendedAssignees: [...(action.notRecommendedAssignees || []), ''] })}
                          className="rounded-lg px-2 py-1 text-xs font-bold text-primary hover:bg-primary-container"
                        >
                          Add
                        </button>
                      </div>
                      {(action.notRecommendedAssignees || []).map((item, index) => (
                        <div key={`${actionKey}-edit-avoid-${index}`} className="flex gap-2">
                          <input
                            type="text"
                            value={item}
                            onChange={(event) => {
                              const next = [...(action.notRecommendedAssignees || [])]
                              next[index] = event.target.value
                              updateDraftAction(actionKey, { notRecommendedAssignees: next })
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => updateDraftAction(actionKey, {
                              notRecommendedAssignees: (action.notRecommendedAssignees || []).filter((_, itemIndex) => itemIndex !== index),
                            })}
                            className="rounded-lg px-2 text-on-surface-variant hover:bg-surface"
                            aria-label="Remove reassignment note"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Add action button */}
        {editDraft.actions.length < 6 && (
          <button
            type="button"
            onClick={addNewDraftAction}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary-fixed/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:border-primary hover:bg-primary-fixed/20"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Add Action
          </button>
        )}
      </div>
    )
  }

  const renderTaskCard = (task) => {
    const riskStyle = getRiskStyle(task.riskLevel)
    const activePlan = task.activePlan
    const historyCount = Array.isArray(task.planHistory) ? task.planHistory.length : 0

    return (
      <Card
        key={task.taskId}
        style={{ padding: 0, overflow: 'hidden', borderRadius: 14, boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)' }}
      >
        <div className="grid grid-cols-[4px_1fr]">
          <div className={riskStyle.rail}></div>
          <div className="px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}/task-board?taskId=${task.taskId}`)}
                    className="shrink-0 text-left text-base font-black tracking-tight text-on-surface hover:text-primary"
                  >
                    Task #{task.taskId}
                  </button>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <Badge icon={riskStyle.icon} className={riskStyle.badge}>{riskStyle.label}</Badge>
                    {activePlan ? (
                      <Badge className={STATUS_STYLES[activePlan.status] || 'bg-slate-50 text-slate-700 border-slate-200'}>
                        {labelize(activePlan.status)}
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-50 text-slate-700 border-slate-200">No plan</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-1 max-w-5xl text-sm font-semibold text-on-surface">
                  {task.taskTitle || `Task #${task.taskId}`}
                </p>
                <p className="mt-1 line-clamp-1 max-w-5xl text-xs leading-relaxed text-on-surface-variant">
                  {activePlan?.summary || task.recommendedAction || 'Open details to create a plan for this task.'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span>
                    {task.assigneeName || 'Unassigned'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    {formatDate(task.deadline)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">monitoring</span>
                    Score {task.slaScore ?? '-'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">history</span>
                    {historyCount} plan{historyCount === 1 ? '' : 's'}
                  </span>
                </div>
              </div>

              <Button variant="outline" onClick={() => openTaskDetails(task)} style={{ height: 36, padding: '0 12px', borderRadius: 9, fontSize: 13 }}>
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Details
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <main className="min-h-full flex-1 overflow-y-auto bg-background p-6 md:p-10">
      <div className="mx-auto w-full max-w-7xl space-y-6 animate-fade-in">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary-fixed px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-on-primary-fixed">
                {activeProject?.title || 'Project'}
              </span>
              {isLeader && (
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700">
                  Leader review
                </span>
              )}
            </div>
            <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-on-surface md:text-3xl">
              <span className="material-symbols-outlined text-3xl text-primary">health_and_safety</span>
              Recovery Tasks
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Open a risky task, create one plan when needed, then edit and approve it.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={selectedSprintId}
              onChange={(event) => setSelectedSprintId(event.target.value)}
              className="h-11 min-w-[220px] rounded-xl border border-outline-variant bg-surface px-3 text-sm font-semibold text-on-surface outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">All sprints</option>
              {sprints.map(sprint => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} {sprint.status === 'ACTIVE' ? '(Active)' : ''}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={loadTasks}>
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Risky Tasks" value={stats.total} icon="warning" helper="Tasks needing recovery review" tone="text-red-600" />
          <MetricCard label="Needs Plan" value={stats.noPlan} icon="add_task" helper="No active plan yet" tone="text-slate-600" />
          <MetricCard label="Pending" value={stats.pending} icon="rate_review" helper="Waiting for approval" tone="text-amber-600" />
          <MetricCard label="Approved" value={stats.approved} icon="verified" helper="Ready to execute" tone="text-blue-600" />
        </section>

        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-black transition-colors ${
                  activeTab === tab.id
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface/70 hover:text-on-surface'
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-md bg-surface-container-low px-2 py-0.5 text-xs text-on-surface-variant">
                  {tabCount(tab.id)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {loading && tasks.length === 0 ? (
          <EmptyState loading />
        ) : filteredTasks.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="space-y-4">
            {filteredTasks.map(renderTaskCard)}
          </section>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge icon={getRiskStyle(selectedTask.riskLevel).icon} className={getRiskStyle(selectedTask.riskLevel).badge}>
                    {getRiskStyle(selectedTask.riskLevel).label}
                  </Badge>
                  {selectedPlan ? (
                    <Badge className={STATUS_STYLES[selectedPlan.status] || 'bg-slate-50 text-slate-700 border-slate-200'}>
                      {labelize(selectedPlan.status)}
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-50 text-slate-700 border-slate-200">No plan</Badge>
                  )}
                </div>
                <h2 className="text-2xl font-black text-on-surface">Task #{selectedTask.taskId}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{selectedTask.taskTitle}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null)
                  setSelectedPlan(null)
                  setEditingPlan(false)
                  setEditDraft({ summary: '', actions: [] })
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
                aria-label="Close recovery task detail"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-5">
                  <section>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Task reason</p>
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                      <p className="text-sm leading-relaxed text-on-surface">
                        {normalizeStringList(selectedTask.reasons).join(' ') || selectedTask.recommendedAction || 'This task is currently risky.'}
                      </p>
                      {Array.isArray(selectedTask.riskCategories) && selectedTask.riskCategories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedTask.riskCategories.map(category => (
                            <span key={category} className="rounded-md bg-surface px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                              {labelize(category)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  {selectedPlan ? (
                    <>
                      <section>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Plan summary</p>
                        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                          {editingPlan ? (
                            <textarea
                              value={editDraft.summary}
                              onChange={(event) => setEditDraft(current => ({ ...current, summary: event.target.value }))}
                              rows={4}
                              className="w-full resize-y rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm leading-relaxed text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          ) : (
                            <p className="text-sm leading-relaxed text-on-surface">{selectedPlan.summary || 'No summary.'}</p>
                          )}
                        </div>
                      </section>

                      <section>
                        <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Proposed actions</p>
                        {editingPlan ? renderEditablePlanActions() : renderPlanActions(selectedPlan)}
                      </section>
                    </>
                  ) : (
                    <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center">
                      <span className="material-symbols-outlined text-4xl text-primary">auto_awesome</span>
                      <h3 className="mt-2 text-lg font-black text-on-surface">No plan for this task yet</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">Generate a plan only for this task when you are ready.</p>
                    </section>
                  )}

                  {Array.isArray(selectedTask.planHistory) && selectedTask.planHistory.length > 0 && (
                    <details className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                      <summary className="cursor-pointer text-sm font-black text-on-surface">
                        Plan history ({selectedTask.planHistory.length})
                      </summary>
                      <div className="mt-3 space-y-2">
                        {selectedTask.planHistory.map(plan => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlan(plan)
                              setEditingPlan(false)
                              setEditDraft(buildEditDraft(plan))
                            }}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left text-sm ${
                              selectedPlan?.id === plan.id
                                ? 'border-primary bg-primary-fixed/30 text-on-surface'
                                : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container'
                            }`}
                          >
                            <span className="font-bold">{labelize(plan.status)}</span>
                            <span className="truncate">{formatDateTime(plan.createdAt)}</span>
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>

                <aside className="space-y-3">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Decision pack</p>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">Assignee</span>
                        <span className="text-sm font-black text-on-surface">{selectedTask.assigneeName || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">Score</span>
                        <span className="text-sm font-black text-on-surface">{selectedTask.slaScore ?? '-'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">Deadline</span>
                        <span className="text-sm font-black text-on-surface">{formatDate(selectedTask.deadline)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">History</span>
                        <span className="text-sm font-black text-on-surface">{selectedTask.planHistory?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-lowest px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-on-surface-variant">
                New AI plan is created only when you click Generate Plan here.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedPlan?.evidenceSnapshotId && (
                  <Button variant="outline" onClick={() => setEvidencePlan(selectedPlan)}>
                    <span className="material-symbols-outlined text-lg">fact_check</span>
                    Evidence
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/tasks/${selectedTask.taskId}`)}>
                  Open Task
                </Button>
                {isLeader && !selectedPlan && (
                  <Button variant="primary" onClick={() => handleGenerateTaskPlan(selectedTask)} disabled={generatingTaskId === selectedTask.taskId}>
                    <span className={`material-symbols-outlined text-lg ${generatingTaskId === selectedTask.taskId ? 'animate-spin' : ''}`}>
                      {generatingTaskId === selectedTask.taskId ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    {generatingTaskId === selectedTask.taskId ? 'Generating...' : 'Generate Plan'}
                  </Button>
                )}
                {isLeader && selectedPlan?.status === 'PENDING_APPROVAL' && (
                  <Button variant="primary" onClick={() => handleGenerateTaskPlan(selectedTask)} disabled={generatingTaskId === selectedTask.taskId}>
                    <span className={`material-symbols-outlined text-lg ${generatingTaskId === selectedTask.taskId ? 'animate-spin' : ''}`}>
                      {generatingTaskId === selectedTask.taskId ? 'progress_activity' : 'auto_awesome'}
                    </span>
                    {generatingTaskId === selectedTask.taskId ? 'Regenerating...' : 'Regenerate AI Plan'}
                  </Button>
                )}
                {isLeader && selectedPlan?.status === 'PENDING_APPROVAL' && (
                  editingPlan ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingPlan(false)
                          setEditDraft(buildEditDraft(selectedPlan))
                        }}
                      >
                        Cancel Edit
                      </Button>
                      <Button variant="primary" onClick={handleSavePlan} disabled={savingPlan}>
                        {savingPlan ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditDraft(buildEditDraft(selectedPlan))
                          setEditingPlan(true)
                        }}
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit Plan
                      </Button>
                      <Button variant="primary" onClick={() => handleApprove(selectedPlan)}>
                        Approve Plan
                      </Button>
                    </>
                  )
                )}
                {isLeader && selectedPlan?.status === 'APPROVED' && (
                  <Button variant="primary" onClick={() => handleExecute(selectedPlan)}>
                    <span className="material-symbols-outlined text-lg">play_arrow</span>
                    Execute Plan
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <RecoveryEvidenceModal plan={evidencePlan} onClose={() => setEvidencePlan(null)} />
    </main>
  )
}
