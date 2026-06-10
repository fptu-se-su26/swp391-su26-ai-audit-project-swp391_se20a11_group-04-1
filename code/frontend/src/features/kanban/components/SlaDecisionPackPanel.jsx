import React, { useEffect, useState, useCallback } from 'react'
import taskService from '../services/taskService'

const getRiskBadgeClass = (riskLevel = '') => {
  const norm = riskLevel.toUpperCase()
  if (norm === 'NORMAL') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (norm === 'LOW') return 'bg-teal-50 text-teal-700 border-teal-200'
  if (norm === 'MEDIUM') return 'bg-yellow-50 text-yellow-800 border-yellow-200'
  if (norm === 'HIGH') return 'bg-orange-50 text-orange-700 border-orange-200'
  if (norm === 'CRITICAL') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

const SlaDecisionPackPanel = ({ projectId, taskId }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchPack = useCallback(async () => {
    if (!projectId || !taskId) return
    setLoading(true)
    setError(null)
    try {
      const res = await taskService.getSlaDecisionPack(projectId, taskId)
      setData(res)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load SLA decision pack.')
    } finally {
      setLoading(false)
    }
  }, [projectId, taskId])

  useEffect(() => {
    fetchPack()
  }, [fetchPack])

  if (loading && !data) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center min-h-[150px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-on-surface-variant mt-2">Loading SLA data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
        <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant flex justify-between items-center">
          <span>SLA Decision Pack</span>
          <button onClick={fetchPack} className="text-primary text-xs font-bold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-[14px]">refresh</span> Retry
          </button>
        </h3>
        <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-xs">
          {error}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 text-center">
        <h3 className="font-headline-sm text-body-lg text-on-surface mb-2">SLA Decision Pack</h3>
        <p className="text-sm text-on-surface-variant">No SLA decision yet.</p>
      </div>
    )
  }

  const {
    currentScore,
    currentRiskLevel,
    slaCategories = [],
    reasons = [],
    recommendedAction,
    evaluatedAt,
    latestEventType,
    latestActionTaken,
    recentDecisions = []
  } = data

  const formattedDate = evaluatedAt ? new Date(evaluatedAt).toLocaleString() : 'Not evaluated'

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
        <h3 className="font-headline-sm text-body-lg text-on-surface">SLA Decision Pack</h3>
        <button
          onClick={fetchPack}
          className="text-primary hover:text-surface-tint p-1 rounded transition-colors"
          title="Refresh SLA Status"
          disabled={loading}
        >
          <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low border border-outline-variant p-3 rounded flex flex-col items-center justify-center text-center">
          <span className="text-xs text-on-surface-variant uppercase">SLA Score</span>
          <span className="text-2xl font-bold text-on-surface mt-1">{currentScore}/100</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant p-3 rounded flex flex-col items-center justify-center text-center">
          <span className="text-xs text-on-surface-variant uppercase mb-1">Risk Level</span>
          <span className={`text-xs font-bold border px-2 py-1 rounded-full uppercase ${getRiskBadgeClass(currentRiskLevel)}`}>
            {currentRiskLevel}
          </span>
        </div>
      </div>

      {slaCategories.length > 0 && (
        <div>
          <span className="text-xs text-on-surface-variant uppercase block mb-1">Categories</span>
          <div className="flex flex-wrap gap-1.5">
            {slaCategories.map((cat, idx) => (
              <span key={idx} className="bg-surface-container-high border border-outline-variant text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                {cat.replaceAll('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {reasons.length > 0 && (
        <div>
          <span className="text-xs text-on-surface-variant uppercase block mb-1">Reasons</span>
          <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-1 pl-1">
            {reasons.map((r, idx) => (
              <li key={idx} className="leading-relaxed">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {recommendedAction && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded">
          <span className="text-xs font-bold text-primary block mb-0.5">Recommended Action</span>
          <p className="text-xs text-on-surface leading-relaxed">{recommendedAction}</p>
        </div>
      )}

      <div className="text-[10px] text-on-surface-variant flex flex-col gap-1 border-t border-outline-variant pt-3">
        <div><span className="font-semibold">Last evaluated:</span> {formattedDate}</div>
        <div><span className="font-semibold">Latest event:</span> {latestEventType}</div>
        <div><span className="font-semibold">Latest action:</span> {latestActionTaken}</div>
      </div>

      {recentDecisions.length > 0 && (
        <div className="border-t border-outline-variant pt-3">
          <span className="text-xs font-bold text-on-surface block mb-2">Recent Decisions</span>
          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
            {recentDecisions.map((dec, idx) => (
              <div key={idx} className="text-[11px] p-2 bg-surface-container-low border border-outline-variant rounded flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-on-surface truncate" title={dec.eventType}>
                    {dec.eventType}
                  </div>
                  <div className="text-[9px] text-on-surface-variant mt-0.5">
                    {new Date(dec.evaluatedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right shrink-0 flex flex-col justify-center">
                  <div className="font-semibold text-on-surface">
                    {dec.previousScore !== null ? `${dec.previousScore} → ` : ''}{dec.newScore}
                  </div>
                  <div className="text-[9px] text-on-surface-variant">
                    {dec.newRiskLevel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SlaDecisionPackPanel
