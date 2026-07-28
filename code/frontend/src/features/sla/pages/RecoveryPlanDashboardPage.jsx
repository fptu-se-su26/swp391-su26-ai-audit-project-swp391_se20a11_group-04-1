import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import { useProjectRole } from '@/hooks/useProjectRole'
import { sprintService } from '@features/sprint/services/sprintService'
import { recoveryPlanService } from '../services/recoveryPlanService'
import RecoveryEvidenceModal from '../components/RecoveryEvidenceModal'
import { AiRecoverySummary } from '../components/AiRecoverySummary'
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

const GENERATION_MODE_STYLES = {
  AI_GENERATED: {
    label: 'AI generated',
    icon: 'auto_awesome',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  AI_FAILED_FALLBACK: {
    label: 'AI fallback',
    icon: 'shield',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  RULE_FALLBACK: {
    label: 'Rule fallback',
    icon: 'rule',
    className: 'bg-slate-50 text-slate-700 border-slate-200',
  },
}

const TABS = [
  { id: 'ALL', label: 'All', statuses: '' },
  { id: 'PENDING', label: 'Pending Review', statuses: 'PENDING_APPROVAL' },
  { id: 'APPROVED', label: 'Approved', statuses: 'APPROVED' },
  { id: 'DONE', label: 'Closed', statuses: 'EXECUTED,FAILED,DECLINED,REJECTED' },
]

const RISK_STYLES = {
  BREACH: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    rail: 'bg-red-500',
    icon: 'warning',
    label: 'Breach',
  },
  CRITICAL: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    rail: 'bg-orange-500',
    icon: 'report',
    label: 'Critical',
  },
  AT_RISK: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    rail: 'bg-amber-500',
    icon: 'priority_high',
    label: 'At risk',
  },
}

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

const getRiskStyle = (riskLevel) => RISK_STYLES[riskLevel] || RISK_STYLES.AT_RISK

const getActionIcon = (actionType) => {
  const icons = {
    ESCALATE_LEADER: 'record_voice_over',
    CREATE_RECOVERY_CHECKLIST: 'checklist',
    ASK_BLOCKER_UPDATE: 'chat_info',
    SUGGEST_SPLIT_TASK: 'call_split',
    REASSIGN_OWNER: 'person_add',
  }
  return icons[actionType] || 'task_alt'
}

const getActionPayload = (action) => parseActionPayload(action?.payload)

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
      {loading ? 'Loading recovery plans' : 'No recovery plans found'}
    </h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
      {loading
        ? 'Checking the latest SLA recovery proposals for this project.'
        : 'Try another sprint or status filter. New plans appear when risky tasks are detected.'}
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
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [rejectingPlanId, setRejectingPlanId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [evidencePlan, setEvidencePlan] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    if (activeProject?.id) {
      sprintService.getSprints(activeProject.id).then(data => {
        const list = Array.isArray(data) ? data : []
        setSprints(list)
        if (list.length) {
          const active = list.find(s => s.status === 'ACTIVE')
          setSelectedSprintId(active ? active.id : '')
        }
      })
    }
  }, [activeProject?.id])

  const loadPlans = async () => {
    if (!activeProject?.id) return
    setLoading(true)
    try {
      const tabConfig = TABS.find(t => t.id === activeTab)
      const data = await recoveryPlanService.getProjectRecoveryPlans(activeProject.id, {
        sprintId: selectedSprintId || undefined,
        status: tabConfig.statuses || undefined,
      })
      const list = Array.isArray(data) ? data : []
      setPlans(list)

      const taskIdFromUrl = searchParams.get('taskId')
      if (taskIdFromUrl && !selectedPlan) {
        // Automatically open the modal for the requested task if it's in the current list
        // And it hasn't been selected yet
        const planForTask = list.find(p => String(p.taskId) === taskIdFromUrl)
        if (planForTask) {
          setSelectedPlan(planForTask)
        } else {
          // If the plan is not in the current list (e.g., might be in a different tab or sprint)
          // We can try to fetch it specifically or at least show a toast
          // For now, let's just attempt to select if found in current filtered list.
        }
      }
    } catch (err) {
      toast.error('Failed to load recovery plans')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlans()
  }, [activeProject?.id, selectedSprintId, activeTab])

  const handleApprove = async (planId) => {
    try {
      await recoveryPlanService.approveRecoveryPlan(activeProject.id, planId)
      toast.success('Plan approved')
      setSelectedPlan(null)
      loadPlans()
    } catch (err) {
      toast.error('Failed to approve plan')
    }
  }

  const handleExecute = async (planId) => {
    try {
      await recoveryPlanService.executeRecoveryPlan(activeProject.id, planId)
      toast.success('Execution started')
      setSelectedPlan(null)
      loadPlans()
    } catch (err) {
      toast.error('Failed to execute plan')
    }
  }

  const handleReject = async (planId) => {
    try {
      const followUpPlan = await recoveryPlanService.rejectRecoveryPlan(activeProject.id, planId, rejectReason.trim() || null)
      toast.success(followUpPlan?.followUp ? 'Plan rejected and a new follow-up plan was created' : 'Plan rejected')
      setRejectingPlanId(null)
      setRejectReason('')
      setSelectedPlan(null)
      loadPlans()
    } catch (err) {
      toast.error('Failed to reject plan')
    }
  }

  const resolveGenerationMode = (plan) => plan.generationMode || (plan.generatedSource === 'AI' ? 'AI_GENERATED' : 'RULE_FALLBACK')

  const renderGenerationBadge = (plan) => {
    const mode = resolveGenerationMode(plan)
    const config = GENERATION_MODE_STYLES[mode] || GENERATION_MODE_STYLES.RULE_FALLBACK
    return (
      <Badge icon={config.icon} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const planStats = useMemo(() => ({
    pending: plans.filter(p => p.status === 'PENDING_APPROVAL').length,
    approved: plans.filter(p => p.status === 'APPROVED').length,
    closed: plans.filter(p => ['EXECUTED', 'FAILED', 'DECLINED', 'REJECTED'].includes(p.status)).length,
    noEvidence: plans.filter(p => !p.evidenceSnapshotId).length,
  }), [plans])

  const tabCount = (tabId) => {
    if (tabId === 'PENDING') return planStats.pending
    if (tabId === 'APPROVED') return planStats.approved
    if (tabId === 'DONE') return planStats.closed
    return plans.length
  }

  const renderPlanActions = (plan, compact = false) => {
    const actions = Array.isArray(plan.actions) ? plan.actions : []
    if (!actions.length) {
      return (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
          No recovery actions attached to this plan yet.
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {actions.slice(0, compact ? 2 : actions.length).map((action) => {
          const payload = getActionPayload(action)
          const checklist = Array.isArray(payload.checklistItems) ? payload.checklistItems : []
          const owner = payload.recommendedAssigneeName || payload.assigneeName
          return (
            <div key={action.id || action.actionType} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary-fixed text-primary">
                      <span className="material-symbols-outlined text-[18px]">{getActionIcon(action.actionType)}</span>
                    </span>
                    <div>
                      <p className="text-sm font-black text-on-surface">{labelize(action.actionType)}</p>
                      <p className="text-xs text-on-surface-variant">{labelize(action.priority)} priority</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                    {action.message || 'No action message provided.'}
                  </p>
                  {owner && (
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Suggested owner: <span className="font-bold text-on-surface">{owner}</span>
                    </p>
                  )}
                </div>
                <Badge className="bg-surface text-on-surface-variant border-outline-variant">
                  {labelize(action.status)}
                </Badge>
              </div>
              {payload.rationale && (
                <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs leading-relaxed text-on-surface-variant">
                  {payload.rationale}
                </p>
              )}
              {checklist.length > 0 && !compact && (
                <div className="mt-3 grid gap-2">
                  {checklist.map((item, index) => (
                    <div key={`${action.id}-check-${index}`} className="flex items-start gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined mt-0.5 text-[15px] text-primary">check_box_outline_blank</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {compact && actions.length > 2 && (
          <p className="text-xs font-bold text-on-surface-variant">+{actions.length - 2} more actions in details</p>
        )}
      </div>
    )
  }

  const renderPlanCard = (plan) => {
    const riskStyle = getRiskStyle(plan.riskLevel)
    const actions = Array.isArray(plan.actions) ? plan.actions : []
    const latestLog = Array.isArray(plan.auditLogs) && plan.auditLogs.length > 0
      ? plan.auditLogs[plan.auditLogs.length - 1]
      : null
    const summary = plan.summary?.length > 150 ? `${plan.summary.slice(0, 150)}...` : plan.summary

    return (
      <Card
        key={plan.id}
        style={{
          padding: 0,
          overflow: 'hidden',
          borderRadius: 14,
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
        }}
        className="group"
      >
        <div className="grid grid-cols-[4px_1fr]">
          <div className={riskStyle.rail}></div>
          <div className="px-4 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${projectId}/task-board?taskId=${plan.taskId}`)}
                    className="shrink-0 text-left text-base font-black tracking-tight text-on-surface hover:text-primary"
                  >
                    Task #{plan.taskId}
                  </button>
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <Badge icon={riskStyle.icon} className={riskStyle.badge}>{riskStyle.label}</Badge>
                    <Badge className={STATUS_STYLES[plan.status] || 'bg-slate-50 text-slate-700 border-slate-200'}>
                      {labelize(plan.status)}
                    </Badge>
                    {plan.priority && (
                      <Badge className="bg-surface-container-low text-on-surface-variant border-outline-variant">
                        {labelize(plan.priority)} priority
                      </Badge>
                    )}
                    {renderGenerationBadge(plan)}
                    <span className="text-[11px] font-bold text-on-surface-variant">
                      {formatDateTime(plan.createdAt)}
                    </span>
                  </div>
                </div>

                <p className="mt-2 line-clamp-1 max-w-5xl text-xs leading-relaxed text-on-surface-variant">
                  {summary || 'No summary was generated for this recovery plan.'}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">fact_check</span>
                    {plan.evidenceSnapshotId ? `Evidence #${plan.evidenceSnapshotId}` : 'Missing evidence'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">task_alt</span>
                    {actions.length} actions
                  </span>
                  <span className="inline-flex min-w-0 max-w-[220px] items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">history</span>
                    <span className="truncate">{labelize(latestLog?.eventType || 'Created')}</span>
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
                <Button variant="outline" onClick={() => setSelectedPlan(plan)} style={{ height: 32, padding: '0 10px', borderRadius: 9, fontSize: 12 }}>
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  Details
                </Button>
                {plan.evidenceSnapshotId && (
                  <Button variant="outline" onClick={() => setEvidencePlan(plan)} style={{ height: 32, padding: '0 10px', borderRadius: 9, fontSize: 12 }}>
                    <span className="material-symbols-outlined text-[15px]">fact_check</span>
                    Evidence
                  </Button>
                )}
                {isLeader && plan.status === 'PENDING_APPROVAL' && rejectingPlanId !== plan.id && (
                  <>
                    <Button variant="outline" onClick={() => setRejectingPlanId(plan.id)} style={{ height: 32, padding: '0 10px', borderRadius: 9, fontSize: 12 }}>
                      Reject
                    </Button>
                    <Button variant="primary" onClick={() => handleApprove(plan.id)} style={{ height: 32, padding: '0 10px', borderRadius: 9, fontSize: 12 }}>
                      Approve
                    </Button>
                  </>
                )}
                {isLeader && plan.status === 'APPROVED' && (
                  <Button variant="primary" onClick={() => handleExecute(plan.id)} style={{ height: 32, padding: '0 10px', borderRadius: 9, fontSize: 12 }}>
                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                    Execute
                  </Button>
                )}
              </div>
            </div>

            {rejectingPlanId === plan.id && (
              <div className="mt-5 flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 p-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Reason for rejecting this plan (optional)"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  className="min-w-[240px] flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm text-on-surface outline-none focus:border-error focus:ring-1 focus:ring-error"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setRejectingPlanId(null)
                    setRejectReason('')
                  }}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(plan.id)}
                  className="rounded-lg bg-error px-3 py-2 text-sm font-semibold text-on-error hover:bg-error/90"
                >
                  Confirm Reject
                </button>
              </div>
            )}
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
              Recovery Plans
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Review risky tasks, inspect suggested actions, and approve the plan before it changes the task board.
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
            <Button variant="outline" onClick={loadPlans}>
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Pending Review" value={planStats.pending} icon="rate_review" helper="Plans waiting for leader action" tone="text-amber-600" />
          <MetricCard label="Approved" value={planStats.approved} icon="verified" helper="Ready to execute" tone="text-blue-600" />
          <MetricCard label="Closed" value={planStats.closed} icon="task_alt" helper="Executed, rejected, or declined" tone="text-emerald-600" />
          <MetricCard label="Missing Evidence" value={planStats.noEvidence} icon="fact_check" helper="Need evidence before review" tone="text-slate-600" />
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

        {loading && plans.length === 0 ? (
          <EmptyState loading />
        ) : plans.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="space-y-4">
            {plans.map(renderPlanCard)}
          </section>
        )}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge icon={getRiskStyle(selectedPlan.riskLevel).icon} className={getRiskStyle(selectedPlan.riskLevel).badge}>
                    {getRiskStyle(selectedPlan.riskLevel).label}
                  </Badge>
                  <Badge className={STATUS_STYLES[selectedPlan.status] || 'bg-slate-50 text-slate-700 border-slate-200'}>
                    {labelize(selectedPlan.status)}
                  </Badge>
                  {renderGenerationBadge(selectedPlan)}
                </div>
                <h2 className="text-2xl font-black text-on-surface">Task #{selectedPlan.taskId}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{formatDateTime(selectedPlan.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
                aria-label="Close recovery plan detail"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="space-y-5">
                  <section>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Why this plan matters</p>
                    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                      <AiRecoverySummary 
                        planDetailsJson={selectedPlan.planDetailsJson} 
                        fallbackSummary={selectedPlan.summary} 
                      />
                      {Array.isArray(selectedPlan.riskCategories) && selectedPlan.riskCategories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selectedPlan.riskCategories.map(category => (
                            <span key={category} className="rounded-md bg-surface px-2.5 py-1 text-xs font-bold text-on-surface-variant">
                              {labelize(category)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Proposed actions</p>
                    {renderPlanActions(selectedPlan)}
                  </section>

                  {selectedPlan.gateReason && (
                    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                      <span className="font-black text-on-surface">Gate note: </span>
                      {selectedPlan.gateReason}
                    </section>
                  )}
                </div>

                <aside className="space-y-3">
                  <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Decision pack</p>
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">Evidence</span>
                        <span className="text-sm font-black text-on-surface">
                          {selectedPlan.evidenceSnapshotId ? `#${selectedPlan.evidenceSnapshotId}` : 'Missing'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">Score</span>
                        <span className="text-sm font-black text-on-surface">
                          {selectedPlan.scoreBeforeExecution != null || selectedPlan.scoreAfterExecution != null
                            ? `${selectedPlan.scoreBeforeExecution ?? '-'} -> ${selectedPlan.scoreAfterExecution ?? '-'}`
                            : 'Tracking'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">Gate</span>
                        <span className="text-sm font-black text-on-surface">{labelize(selectedPlan.gateResult || 'Pending')}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-on-surface-variant">Actions</span>
                        <span className="text-sm font-black text-on-surface">
                          {Array.isArray(selectedPlan.actions) ? selectedPlan.actions.length : 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedPlan.rejectReason && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                      <span className="font-black">Reject reason: </span>
                      {selectedPlan.rejectReason}
                    </div>
                  )}
                </aside>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-lowest px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-on-surface-variant">
                Open the task board to inspect ownership, dates, and current SLA state before executing.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedPlan.evidenceSnapshotId && (
                  <Button variant="outline" onClick={() => setEvidencePlan(selectedPlan)}>
                    <span className="material-symbols-outlined text-lg">fact_check</span>
                    Evidence
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate(`/projects/${projectId}/tasks/${selectedPlan.taskId}`)}>
                  Open Task
                </Button>
                {isLeader && selectedPlan.status === 'PENDING_APPROVAL' && rejectingPlanId !== selectedPlan.id && (
                  <>
                    <Button variant="outline" onClick={() => setRejectingPlanId(selectedPlan.id)}>
                      Reject
                    </Button>
                    <Button variant="primary" onClick={() => handleApprove(selectedPlan.id)}>
                      Approve Plan
                    </Button>
                  </>
                )}
                {isLeader && selectedPlan.status === 'APPROVED' && (
                  <Button variant="primary" onClick={() => handleExecute(selectedPlan.id)}>
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
