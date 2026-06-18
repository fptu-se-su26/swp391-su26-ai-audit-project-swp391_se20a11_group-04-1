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

const SlaSummaryPanel = ({ projectId, taskId }) => {
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
      if (err?.response?.status === 404) {
        setData(null)
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load SLA.')
      }
    } finally {
      setLoading(false)
    }
  }, [projectId, taskId])

  useEffect(() => {
    fetchPack()
  }, [fetchPack])

  if (loading && !data) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex items-center justify-center">
        <span className="text-xs text-on-surface-variant flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          Loading SLA...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3">
        <div className="text-error text-xs flex justify-between items-center">
          <span>Failed to load SLA</span>
          <button onClick={fetchPack} className="hover:underline font-semibold">Retry</button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 text-center">
        <span className="text-xs text-on-surface-variant">No SLA decision yet.</span>
      </div>
    )
  }

  const {
    currentScore,
    currentRiskLevel,
    reasons = [],
    recommendedAction,
    evaluatedAt,
  } = data

  const formattedDate = evaluatedAt ? new Date(evaluatedAt).toLocaleString() : 'Not evaluated'
  const displayReasons = reasons.slice(0, 2)
  const remainingReasons = reasons.length > 2 ? reasons.length - 2 : 0

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-on-background flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">robot_2</span>
          AI SLA Summary
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container-low border border-outline-variant p-2 rounded flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-on-surface-variant uppercase">Score</span>
          <span className="text-lg font-bold text-on-surface">{currentScore}/100</span>
        </div>
        <div className="bg-surface-container-low border border-outline-variant p-2 rounded flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-on-surface-variant uppercase mb-0.5">Risk Level</span>
          <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-full uppercase ${getRiskBadgeClass(currentRiskLevel)}`}>
            {currentRiskLevel}
          </span>
        </div>
      </div>

      {reasons.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold text-outline uppercase block mb-1">Reasons</span>
          <ul className="list-disc list-inside text-xs text-on-surface-variant space-y-0.5 pl-1">
            {displayReasons.map((r, idx) => (
              <li key={idx} className="truncate" title={r}>{r}</li>
            ))}
          </ul>
          {remainingReasons > 0 && (
            <div className="text-[10px] text-primary mt-1 font-medium pl-1">
              +{remainingReasons} more reasons...
            </div>
          )}
        </div>
      )}

      {recommendedAction && (
        <div className="p-2 bg-primary/5 border border-primary/20 rounded">
          <span className="text-[10px] font-bold text-primary block mb-0.5">Recommended Action</span>
          <p className="text-xs text-on-surface line-clamp-2" title={recommendedAction}>{recommendedAction}</p>
        </div>
      )}

      <div className="text-[9px] text-on-surface-variant border-t border-outline-variant pt-2">
        <span className="font-semibold">Last evaluated:</span> {formattedDate}
      </div>
    </div>
  )
}

export default SlaSummaryPanel
