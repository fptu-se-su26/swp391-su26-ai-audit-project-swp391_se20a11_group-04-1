import React, { useState, useEffect } from 'react';
import { ShieldAlert, Wand2, CheckCircle2, XCircle, AlertCircle, PlayCircle } from 'lucide-react';
import taskService from '../services/taskService';
import RecoveryEvidenceModal from '@features/sla/components/RecoveryEvidenceModal';
import { AiRecoverySummary } from '@features/sla/components/AiRecoverySummary';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  EXECUTING: 'bg-purple-100 text-purple-800 border-purple-200',
  EXECUTED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  REJECTED: 'bg-gray-100 text-gray-800 border-gray-200',
  DECLINED: 'bg-orange-100 text-orange-800 border-orange-200',
};

const ACTION_STATUS_ICONS = {
  PENDING: <div className="w-2 h-2 rounded-full bg-yellow-400" />,
  APPROVED: <div className="w-2 h-2 rounded-full bg-blue-400" />,
  EXECUTED: <CheckCircle2 className="text-green-500 w-4 h-4" />,
  SKIPPED: <div className="w-2 h-2 rounded-full bg-gray-400" />,
  FAILED: <XCircle className="text-red-500 w-4 h-4" />
};

const GENERATION_MODE_STYLES = {
  AI_GENERATED: 'bg-blue-50 text-blue-700 border-blue-200',
  AI_FAILED_FALLBACK: 'bg-amber-50 text-amber-700 border-amber-200',
  RULE_FALLBACK: 'bg-slate-50 text-slate-700 border-slate-200',
};

const GENERATION_MODE_LABELS = {
  AI_GENERATED: 'AI generated',
  AI_FAILED_FALLBACK: 'AI fallback',
  RULE_FALLBACK: 'Rule fallback',
};

const parseActionPayload = (payload) => {
  if (!payload) return {};
  if (typeof payload === 'object') return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
};

export default function RecoveryPlanPanel({ projectId, taskId, isLeader, compact = true }) {
  const [loading, setLoading] = useState(true);
  const [riskLevel, setRiskLevel] = useState(null);
  const [plan, setPlan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [projectId, taskId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [packRes, planRes] = await Promise.all([
        taskService.getSlaDecisionPack(projectId, taskId).catch(() => null),
        taskService.getRecoveryPlan(projectId, taskId).catch(() => null)
      ]);
      if (packRes) setRiskLevel(packRes.currentRiskLevel);
      if (planRes) setPlan(planRes);
    } catch (error) {
      console.error('Failed to fetch recovery plan data', error);
    } finally {
      setLoading(false);
    }
  };

  const extractErrorMessage = (error, fallback) => {
    const msg = error.response?.data?.message
      || error.response?.data?.error
      || error.message
      || fallback;
    console.error('[RecoveryPlanPanel] Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: msg
    });
    return msg;
  };

  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      const newPlan = await taskService.generateRecoveryPlan(projectId, taskId);
      setPlan(newPlan);
      toast.success('Recovery plan generated');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to generate recovery plan'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const updatedPlan = await taskService.approveRecoveryPlan(projectId, plan.id);
      setPlan(updatedPlan);
      toast.success('Recovery plan approved');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to approve plan'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Reject reason is required');
      return;
    }
    setActionLoading(true);
    try {
      const updatedPlan = await taskService.rejectRecoveryPlan(projectId, plan.id, rejectReason);
      setPlan(updatedPlan);
      setShowRejectInput(false);
      setRejectReason('');
      toast.success('Recovery plan rejected');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to reject plan'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecute = async () => {
    setActionLoading(true);
    try {
      const updatedPlan = await taskService.executeRecoveryPlan(projectId, plan.id);
      setPlan(updatedPlan);
      toast.success('Recovery plan execution started');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to execute plan'));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded-md mt-4"></div>;
  }

  const isHighRisk = riskLevel === 'WARNING' || riskLevel === 'BREACH';
  if (!isHighRisk && !plan) return null;

  const renderStatusBadge = (status) => {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const resolveGenerationMode = () => plan?.generationMode || (plan?.generatedSource === 'AI' ? 'AI_GENERATED' : 'RULE_FALLBACK');

  const renderGenerationBadge = () => {
    if (!plan) return null;
    const mode = resolveGenerationMode();
    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${GENERATION_MODE_STYLES[mode] || GENERATION_MODE_STYLES.RULE_FALLBACK}`}>
        {GENERATION_MODE_LABELS[mode] || GENERATION_MODE_LABELS.RULE_FALLBACK}
      </span>
    );
  };

  const openEvidence = () => setEvidenceOpen(true);

  const renderActionsList = (actions, maxActions = 2, showFailedOnly = false) => {
    if (!actions || actions.length === 0) return null;
    
    let displayActions = actions;
    if (showFailedOnly) {
      displayActions = actions.filter(a => a.status === 'FAILED' || a.status === 'SKIPPED');
    }

    const hasMore = displayActions.length > maxActions;
    const visibleActions = displayActions.slice(0, maxActions);

    return (
      <div className="mt-2 space-y-1">
        {visibleActions.map(action => {
          const payload = parseActionPayload(action.payload);
          return (
            <div key={action.id} className="flex items-start gap-2 bg-white p-2 rounded border border-gray-100 shadow-sm text-xs">
              <div className="mt-0.5">{ACTION_STATUS_ICONS[action.status]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 line-clamp-1">{action.actionType.replace(/_/g, ' ')}</p>
                <p className="text-gray-500 whitespace-pre-wrap break-words">{action.resultMessage || action.message}</p>
                {payload.rationale && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Reason: <span className="font-medium text-gray-700">{payload.rationale}</span>
                  </p>
                )}
                {Array.isArray(payload.checklistItems) && payload.checklistItems.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-[11px] text-gray-500 space-y-0.5">
                    {payload.checklistItems.slice(0, 3).map((item, index) => (
                      <li key={`${action.id}-check-${index}`}>{item}</li>
                    ))}
                  </ul>
                )}
                {payload.recommendedAssigneeName && (
                  <p className="mt-1 text-[11px] text-[#1E707D] font-semibold">
                    Suggested owner: {payload.recommendedAssigneeName}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        {hasMore && (
          <div className="text-xs text-center text-gray-500 mt-1 italic">
            +{displayActions.length - maxActions} more action{displayActions.length - maxActions > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  };

  const renderAuditLogs = () => {
    if (!plan?.auditLogs || plan.auditLogs.length === 0) return null;
    const recentLogs = [...plan.auditLogs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);
    
    return (
      <details className="mt-3 text-xs">
        <summary className="text-gray-500 cursor-pointer hover:text-gray-700 font-medium">Recent activity</summary>
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-200">
          {recentLogs.map(log => (
            <div key={log.id} className="relative">
              <div className="absolute -left-[13px] top-1.5 w-2 h-2 rounded-full bg-gray-300"></div>
              <p className="text-gray-700 font-medium">{log.eventType.replace(/_/g, ' ')}</p>
              <p className="text-gray-500 whitespace-pre-wrap break-words">{log.message}</p>
              <p className="text-gray-400 text-[10px]">{new Date(log.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </details>
    );
  };

  const renderEffectiveness = () => {
    if (!plan || plan.scoreBeforeExecution == null || !['EXECUTED', 'DECLINED'].includes(plan.status)) return null;

    const hasAfterScore = plan.scoreAfterExecution != null;
    const improved = hasAfterScore && plan.scoreAfterExecution > plan.scoreBeforeExecution;
    const declined = hasAfterScore && plan.scoreAfterExecution < plan.scoreBeforeExecution;
    const afterClass = improved
      ? 'text-green-600'
      : declined
        ? 'text-red-600'
        : 'text-gray-700';

    return (
      <div className="mb-2 text-xs bg-white border border-gray-100 rounded p-2 text-center shadow-sm">
        <span className="text-gray-500">SLA Score: </span>
        <span className="font-bold text-gray-800">{plan.scoreBeforeExecution}</span>
        <span className="text-gray-400 mx-1">-&gt;</span>
        {hasAfterScore ? (
          <span className={`font-bold ${afterClass}`}>
            {plan.scoreAfterExecution}
            {improved ? ' improved' : declined ? ' declined' : ' unchanged'}
          </span>
        ) : (
          <span className="text-gray-400 italic">tracking...</span>
        )}
      </div>
    );
  };

  const renderEvidence = () => {
    if (!plan) return null;

    return (
      <div className="mb-2 text-xs bg-white border border-gray-100 rounded p-2 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-700 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">fact_check</span>
            Evidence
          </span>
          {plan.evidenceSnapshotId ? (
            <button
              onClick={openEvidence}
              className="text-[#1E707D] hover:underline font-semibold"
              type="button"
            >
              Snapshot #{plan.evidenceSnapshotId}
            </button>
          ) : (
            <span className="text-gray-400 italic">pending</span>
          )}
        </div>
        {plan.gateResult && (
          <p className="mt-1 text-gray-500">
            Gate: <span className="font-semibold text-gray-700">{plan.gateResult.replace(/_/g, ' ')}</span>
            {plan.gateReason ? ` - ${plan.gateReason}` : ''}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={`mt-4 bg-gray-50 border border-gray-200 rounded-lg ${compact ? 'p-3' : 'p-5'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-500 w-5 h-5" />
          <h3 className="font-semibold text-gray-800 text-sm">Recovery Plan</h3>
        </div>
        {plan && (
          <div className="flex flex-wrap justify-end gap-1">
            {renderGenerationBadge()}
            {renderStatusBadge(plan.status)}
          </div>
        )}
      </div>

      {!plan ? (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-100 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>High risk task. No recovery plan generated yet.</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={actionLoading}
            className="flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-[#1E707D] hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            Generate Recovery Plan
          </button>
        </div>
      ) : (
        <div className="flex flex-col">
          {plan.status === 'PENDING_APPROVAL' && (
            <>
              <div className="mb-2">
                <AiRecoverySummary 
                  planDetailsJson={plan.planDetailsJson} 
                  fallbackSummary={plan.summary} 
                />
              </div>
              {renderEvidence()}
              <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-1">
                <span>{plan.actions?.length || 0} Actions</span>
              </div>
              {renderActionsList(plan.actions, 2)}
              
              {isLeader && (
                <div className="mt-3 flex flex-col gap-2">
                  {!showRejectInput ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectInput(true)}
                        disabled={actionLoading}
                        className="flex-1 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          disabled={actionLoading || !rejectReason.trim()}
                          className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => setShowRejectInput(false)}
                          disabled={actionLoading}
                          className="py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {plan.status === 'APPROVED' && (
            <>
              <p className="text-xs text-[#1E707D] bg-[#1E707D]/10 p-2 rounded border border-blue-100 mb-2">
                Approved and ready to execute.
              </p>
              {renderEvidence()}
              {renderActionsList(plan.actions, 2)}
              {isLeader && (
                <button
                  onClick={handleExecute}
                  disabled={actionLoading}
                  className="mt-3 flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <PlayCircle className="w-4 h-4" />
                  Execute Actions
                </button>
              )}
            </>
          )}

          {(plan.status === 'EXECUTED' || plan.status === 'FAILED' || plan.status === 'DECLINED') && (
            <>
              <div className="flex gap-3 text-xs text-gray-600 mb-2 font-medium bg-white p-2 rounded border border-gray-100 shadow-sm justify-center">
                <span className="text-green-600">Executed: {plan.actions?.filter(a => a.status === 'EXECUTED').length || 0}</span>
                <span className="text-gray-500">Skipped: {plan.actions?.filter(a => a.status === 'SKIPPED').length || 0}</span>
                <span className="text-red-600">Failed: {plan.actions?.filter(a => a.status === 'FAILED').length || 0}</span>
              </div>
              {renderEffectiveness()}
              {renderEvidence()}
              {renderActionsList(plan.actions, 2, true)}
              {(plan.status === 'FAILED' || plan.status === 'DECLINED') && isLeader && (
                <button
                  onClick={handleGenerate}
                  disabled={actionLoading}
                  className="mt-3 flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-[#1E707D] hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate New Plan
                </button>
              )}
            </>
          )}

          {plan.status === 'REJECTED' && (
            <>
              <div className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 mb-2 shadow-sm">
                <span className="font-semibold">Reason:</span>
                <p className="text-gray-600 mt-0.5 whitespace-pre-wrap break-words">{plan.rejectReason}</p>
              </div>
              {isLeader && (
                <button
                  onClick={handleGenerate}
                  disabled={actionLoading}
                  className="mt-2 flex items-center justify-center gap-1 w-full py-1.5 px-3 bg-[#1E707D] hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate New Plan
                </button>
              )}
            </>
          )}

          {renderAuditLogs()}
          <RecoveryEvidenceModal plan={evidenceOpen ? plan : null} onClose={() => setEvidenceOpen(false)} />
        </div>
      )}
    </div>
  );
}
