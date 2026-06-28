import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import { sprintService } from '@features/sprint/services/sprintService'
import { recoveryPlanService } from '../services/recoveryPlanService'

const STATUS_COLORS = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  EXECUTING: 'bg-purple-100 text-purple-800 border-purple-200',
  EXECUTED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  REJECTED: 'bg-gray-100 text-gray-800 border-gray-200',
  DECLINED: 'bg-orange-100 text-orange-800 border-orange-200',
}

const TABS = [
  { id: 'ALL', label: 'All', statuses: '' },
  { id: 'PENDING', label: 'Pending Review', statuses: 'PENDING_APPROVAL' },
  { id: 'APPROVED', label: 'Approved', statuses: 'APPROVED' },
  { id: 'DONE', label: 'Executed/Done', statuses: 'EXECUTED,FAILED' },
]

export default function RecoveryPlanDashboardPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore(state => state.activeProject)
  const userRole = useAuthStore(state => state.userRole)
  const isLeader = activeProject?.role === 'LEADER' || activeProject?.role === 'PROJECT_LEADER' || userRole === 'MENTOR'

  const [sprints, setSprints] = useState([])
  const [selectedSprintId, setSelectedSprintId] = useState('')
  const [activeTab, setActiveTab] = useState('ALL')
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [rejectingPlanId, setRejectingPlanId] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

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
        status: tabConfig.statuses || undefined
      })
      setPlans(Array.isArray(data) ? data : [])
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
      toast.success('Plan approved successfully')
      loadPlans()
    } catch (err) {
      toast.error('Failed to approve plan')
    }
  }

  const handleExecute = async (planId) => {
    try {
      await recoveryPlanService.executeRecoveryPlan(activeProject.id, planId)
      toast.success('Execution started')
      loadPlans()
    } catch (err) {
      toast.error('Failed to execute plan')
    }
  }

  const handleReject = async (planId) => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a reject reason')
      return
    }
    try {
      await recoveryPlanService.rejectRecoveryPlan(activeProject.id, planId, rejectReason)
      toast.success('Plan rejected')
      setRejectingPlanId(null)
      setRejectReason('')
      loadPlans()
    } catch (err) {
      toast.error('Failed to reject plan')
    }
  }

  // Calculate pending count for badge (if in ALL tab we can still count from what we got, but usually it's only valid if we fetched all)
  const pendingCount = activeTab === 'ALL' ? plans.filter(p => p.status === 'PENDING_APPROVAL').length : 0

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto min-h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">shield</span>
            Recovery Plans
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Review and manage SLA recovery actions</p>
        </div>
        
        <select
          value={selectedSprintId}
          onChange={(e) => setSelectedSprintId(e.target.value)}
          className="border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface outline-none focus:border-primary transition-all"
        >
          <option value="">All Sprints</option>
          {sprints.map(s => (
            <option key={s.id} value={s.id}>{s.name} {s.status === 'ACTIVE' ? '(Active)' : ''}</option>
          ))}
        </select>
      </div>

      <div className="flex space-x-1 border-b border-outline-variant">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-outline'
            }`}
          >
            {tab.label}
            {tab.id === 'PENDING' && activeTab === 'ALL' && pendingCount > 0 && (
              <span className="bg-error text-on-error text-xs px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="h-32 bg-surface-container rounded-xl animate-pulse" />)
        ) : plans.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-xl border border-outline-variant border-dashed">
            <span className="material-symbols-outlined text-5xl text-outline mb-2">shield_question</span>
            <p className="text-on-surface-variant font-medium">No recovery plans found</p>
          </div>
        ) : (
          plans.map(plan => (
            <div key={plan.id} className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1 w-full">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      plan.riskLevel === 'BREACH' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {plan.riskLevel}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[plan.status] || 'bg-gray-100'}`}>
                      {plan.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-on-surface-variant ml-2">
                      {new Date(plan.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <h3 
                    className="font-semibold text-lg text-primary hover:underline cursor-pointer inline-block mt-1"
                    onClick={() => navigate(`/projects/${projectId}/task-board?taskId=${plan.taskId}`)}
                  >
                    Task #{plan.taskId}
                  </h3>
                  <p className="text-sm text-on-surface line-clamp-2 mt-2">{plan.summary}</p>
                  
                  {(plan.status === 'EXECUTED' || plan.status === 'DECLINED') && plan.gateResult && (
                    <div className={`mt-2 p-2.5 rounded-lg border text-xs ${
                      plan.gateResult === 'PASSED'
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : plan.gateResult === 'FAILED'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                      <div className="flex items-center gap-1.5 font-semibold mb-0.5">
                        <span className="material-symbols-outlined text-[14px]">
                          {plan.gateResult === 'PASSED' ? 'verified' : plan.gateResult === 'FAILED' ? 'cancel' : 'help'}
                        </span>
                        Gate: {plan.gateResult === 'PASSED' ? 'Passed' : plan.gateResult === 'FAILED' ? 'Failed' : 'Insufficient Data'}
                        {plan.scoreBeforeExecution != null && plan.scoreAfterExecution != null && (
                          <span className="font-normal ml-1 opacity-80">
                            ({plan.scoreBeforeExecution}{' -> '}{plan.scoreAfterExecution})
                          </span>
                        )}
                      </div>
                      {plan.gateReason && <p className="opacity-80 leading-relaxed">{plan.gateReason}</p>}
                      {plan.evidenceSnapshotId && (
                        <span
                          className="mt-1 inline-flex items-center gap-1 underline cursor-pointer hover:opacity-70"
                          onClick={() => navigate(`/projects/${projectId}/reliability${plan.sprintId ? `?sprintId=${plan.sprintId}` : ''}`)}
                        >
                          <span className="material-symbols-outlined text-[12px]">analytics</span>
                          View reliability snapshot
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {plan.actions && plan.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {plan.actions.slice(0, 3).map((action, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-lg text-xs font-medium text-on-surface border border-outline-variant">
                      <span className="material-symbols-outlined text-[14px]">
                        {action.status === 'APPROVED' ? 'check_circle' 
                          : action.status === 'EXECUTED' ? 'done_all'
                          : action.status === 'FAILED' ? 'error'
                          : 'schedule'}
                      </span>
                      {action.actionType.replace(/_/g, ' ')}
                    </div>
                  ))}
                  {plan.actions.length > 3 && (
                    <span className="text-xs text-on-surface-variant self-center font-medium">+{plan.actions.length - 3} more</span>
                  )}
                </div>
              )}

              {isLeader && (
                <div className="pt-3 border-t border-outline-variant mt-2 flex justify-end gap-2">
                  {plan.status === 'PENDING_APPROVAL' && rejectingPlanId !== plan.id && (
                    <>
                      <button onClick={() => setRejectingPlanId(plan.id)} className="px-4 py-1.5 text-sm font-medium bg-surface-container-high hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface">
                        Reject
                      </button>
                      <button onClick={() => handleApprove(plan.id)} className="px-4 py-1.5 text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 rounded-lg transition-colors">
                        Approve
                      </button>
                    </>
                  )}
                  {plan.status === 'PENDING_APPROVAL' && rejectingPlanId === plan.id && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input 
                        type="text" 
                        placeholder="Reason for rejection..." 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="flex-1 text-sm border border-outline-variant rounded-lg px-3 py-1.5 focus:border-error focus:ring-1 focus:ring-error outline-none bg-surface text-on-surface"
                        autoFocus
                      />
                      <button onClick={() => { setRejectingPlanId(null); setRejectReason(''); }} className="px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container rounded-lg">
                        Cancel
                      </button>
                      <button onClick={() => handleReject(plan.id)} className="px-3 py-1.5 text-sm bg-error text-on-error hover:bg-error/90 rounded-lg font-medium">
                        Confirm Reject
                      </button>
                    </div>
                  )}
                  {plan.status === 'APPROVED' && (
                    <button onClick={() => handleExecute(plan.id)} className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors">
                      <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                      Execute Plan
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
