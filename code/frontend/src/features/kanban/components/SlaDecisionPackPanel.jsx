import React, { useEffect, useState, useCallback } from 'react'
import taskService from '../services/taskService'

const SCORE_BREAKDOWN_LABEL = {
  deadlinePenalty: {
    label: 'Trễ hạn (Deadline urgency)',
    hint: 'Task sắp tới hạn hoặc đã quá hạn mà chưa hoàn thành.',
  },
  burnRatePenalty: {
    label: 'Tiến độ chậm (Burn rate penalty)',
    hint: 'Thời gian trôi qua nhiều nhưng khối lượng công việc hoàn thành quá ít.',
  },
  blockerPenalty: {
    label: 'Bị chặn (Blocker penalty)',
    hint: 'Task bị kẹt (blocked) không thể làm tiếp được.',
  },
  workloadPenalty: {
    label: 'Quá tải (Workload penalty)',
    hint: 'Người được giao (assignee) đang phải ôm đồm quá nhiều task cùng một lúc.',
  },
}

const CATEGORY_LABEL = {
  DUE_IN_3_DAYS: 'Deadline in 3 days',
  DUE_IN_2_DAYS: 'Deadline in 2 days',
  DUE_TOMORROW: 'Deadline tomorrow',
  DUE_TODAY: 'Deadline is today',
  DUE_SOON: 'Deadline approaching',
  OVERDUE_SHORT: 'Overdue 1-2 days (warning, no penalty yet)',
  OVERDUE_PENALTY: 'Overdue 3+ days (penalty applied)',
  BLOCKED: 'Task is blocked',
  NORMAL: 'On track',
}

const ACTION_CATEGORY_LABEL = {
  CRITICAL_RISK: 'Critical risk - score 0-20',
  HIGH_RISK: 'High risk - score 21-45',
  MEDIUM_RISK: 'Needs attention - score 46-75',
  OVERDUE_PENALTY: 'Penalty applied',
  NORMAL: 'Resolved',
}

const ACTION_TYPE_LABEL = {
  NOTIFY_ASSIGNEE: 'Reminded assignee',
  NOTIFY_LEADER: 'Escalated to leader',
  APPLY_PENALTY: 'Penalty applied',
  RESOLVE_SLA: 'SLA resolved',
}

const RISK_SCORE_HINT = {
  HEALTHY: '100 points',
  ON_TRACK: '76-99 points',
  AT_RISK: '46-75 points',
  WARNING: '21-45 points',
  BREACH: '0-20 points',
}

const BURN_RATE_DESCRIPTION = {
  LOW: 'Time and progress are balanced',
  MEDIUM: 'Slightly behind pace',
  HIGH: 'Falling behind',
  CRITICAL: 'Work pace far behind time used',
}

const getRiskBadgeClass = (riskLevel = '') => {
  const norm = riskLevel.toUpperCase()
  if (norm === 'HEALTHY') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (norm === 'ON_TRACK') return 'bg-teal-50 text-teal-700 border-teal-200'
  if (norm === 'AT_RISK') return 'bg-yellow-50 text-yellow-800 border-yellow-200'
  if (norm === 'WARNING') return 'bg-orange-50 text-orange-700 border-orange-200'
  if (norm === 'BREACH') return 'bg-rose-50 text-rose-700 border-rose-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

const getBurnRateClass = (burnRateLevel = '') => {
  if (burnRateLevel === 'CRITICAL') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (burnRateLevel === 'HIGH') return 'bg-orange-50 text-orange-700 border-orange-200'
  if (burnRateLevel === 'MEDIUM') return 'bg-yellow-50 text-yellow-800 border-yellow-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

const formatDuration = (minutes) => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'Not evaluated')

const formatSpi = (value) => {
  if (value == null) return 'Not available'
  const number = Number(value)
  const formatted = number.toFixed(2)
  if (number >= 0.9) return `${formatted} - On schedule`
  if (number >= 0.7) return `${formatted} - Slightly behind`
  if (number >= 0.5) return `${formatted} - Behind schedule`
  return `${formatted} - Significantly behind`
}

const getFriendlyLabel = (map, value) => map[value] || value?.replaceAll('_', ' ') || 'Unknown'

const getPenaltyExplanation = (item, context) => {
  const { slaCategories, burnGap, burnRateLevel } = context
  const categories = new Set(slaCategories)

  if (item.key === 'deadlinePenalty') {
    if (categories.has('OVERDUE_PENALTY')) return 'Deadline is 3+ days overdue, so the backend subtracts 35 points.'
    if (categories.has('OVERDUE_SHORT')) return 'Deadline is 1-2 days overdue, so the backend subtracts 25 points.'
    if (categories.has('DUE_TODAY')) return 'Deadline is today, so the backend subtracts 15 points.'
    if (categories.has('DUE_TOMORROW')) return 'Deadline is tomorrow, so the backend subtracts 10 points.'
    if (categories.has('DUE_SOON') || categories.has('DUE_IN_2_DAYS') || categories.has('DUE_IN_3_DAYS')) {
      return 'Deadline is within 3 days, so the backend subtracts 5 points.'
    }
    return `Deadline rule matched and subtracted ${item.value} points.`
  }

  if (item.key === 'burnRatePenalty') {
    if (burnRateLevel === 'CRITICAL') return `Burn gap is ${Number(burnGap || 0).toFixed(1)}%. CRITICAL pace uses 30 base points x 1.3 = 39 points.`
    if (burnRateLevel === 'HIGH') return `Burn gap is ${Number(burnGap || 0).toFixed(1)}%. HIGH pace uses 18 base points x 1.2 = 22 points.`
    if (burnRateLevel === 'MEDIUM') return `Burn gap is ${Number(burnGap || 0).toFixed(1)}%. MEDIUM pace uses 8 base points x 1.1 = 9 points.`
    return `Progress is behind time used, so the backend subtracted ${item.value} points.`
  }

  if (item.key === 'blockerPenalty') {
    if (item.value >= 20) return 'Task is blocked without enough blocker detail, so the backend subtracts 20 points.'
    return 'Task is blocked but has blocker detail, so the backend subtracts 15 points.'
  }

  if (item.key === 'workloadPenalty') {
    if (item.value >= 10) return 'The assignee has 6 or more active tasks, so the backend subtracts 10 points.'
    return 'The assignee has 3-5 active tasks, so the backend subtracts 5 points.'
  }

  return `Backend subtracted ${item.value} points for this rule.`
}

const SlaDecisionPackPanel = ({ projectId, taskId }) => {
  const [data, setData] = useState(null)
  const [pauseData, setPauseData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedPenaltyKey, setExpandedPenaltyKey] = useState(null)
  const [showDeductions, setShowDeductions] = useState(false)

  const fetchPack = useCallback(async () => {
    if (!projectId || !taskId) return
    setLoading(true)
    setError(null)
    try {
      const [res, pauseRes] = await Promise.all([
        taskService.getSlaDecisionPack(projectId, taskId),
        taskService.getSlaPauseLogs(projectId, taskId).catch(err => {
          console.error("Failed to load SLA pause logs:", err)
          return null
        })
      ])
      setData(res)
      setPauseData(pauseRes)
    } catch (err) {
      if (err?.response?.status === 404) {
        setData(null)
        setPauseData(null)
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to load SLA decision pack.')
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
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex flex-col items-center justify-center min-h-[150px]">
        <div className="w-8 h-8 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm text-on-surface-variant mt-2">Loading SLA data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
        <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant flex justify-between items-center">
          <span>SLA Decision Pack</span>
          <button onClick={fetchPack} className="text-[#1E707D] text-xs font-bold flex items-center gap-1 hover:underline">
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
    evaluatedAt,
    recentDecisions = [],
    recentActions = [],
    burnGap,
    burnRateLevel,
    spi,
    predictedRiskLevel,
    predictionReasons = [],
    scoreBreakdown,
  } = data

  const formattedDate = formatDateTime(evaluatedAt)
  const normalizedRiskLevel = currentRiskLevel || 'HEALTHY'
  const showForecast = predictedRiskLevel && predictedRiskLevel !== currentRiskLevel
  const visibleActions = recentActions.filter(action =>
    action.status === 'EXECUTED'
    && action.actionType !== 'DIGEST_ONLY'
    && action.actionType !== 'NO_DIRECT_REMINDER'
  )
  const breakdownRows = Object.entries(SCORE_BREAKDOWN_LABEL)
    .map(([key, config]) => ({
      key,
      ...config,
      value: Number(scoreBreakdown?.[key] || 0),
    }))
    .filter(item => item.value > 0)
  const totalDeducted = breakdownRows.reduce((sum, item) => sum + item.value, 0)
  const finalScore = Number.isFinite(Number(currentScore))
    ? Number(currentScore)
    : Math.max(0, 100 - totalDeducted)

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
        <h3 className="font-headline-sm text-body-lg text-on-surface">SLA Decision Pack</h3>
        <button
          onClick={fetchPack}
          className="text-[#1E707D] hover:text-surface-tint p-1 rounded transition-colors"
          title="Refresh SLA Status"
          disabled={loading}
        >
          <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setShowDeductions(!showDeductions)}
          className="bg-surface-container-low hover:bg-surface-container border border-outline-variant p-3 rounded flex flex-col items-center justify-center text-center cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
          title="Click to toggle SLA score details"
        >
          <span className="text-xs text-on-surface-variant uppercase flex items-center gap-1">
            SLA Score
            <span className="material-symbols-outlined text-[16px] select-none">
              {showDeductions ? 'expand_less' : 'expand_more'}
            </span>
          </span>
          <span className="text-2xl font-bold text-on-surface mt-1">{finalScore}/100</span>
        </button>
        <div className="bg-surface-container-low border border-outline-variant p-3 rounded flex flex-col items-center justify-center text-center">
          <span className="text-xs text-on-surface-variant uppercase mb-1">Risk Level</span>
          <span
            className={`text-xs font-bold border px-2 py-1 rounded-full uppercase ${getRiskBadgeClass(normalizedRiskLevel)}`}
            title={RISK_SCORE_HINT[normalizedRiskLevel] || 'Score-based risk level'}
          >
            {normalizedRiskLevel}
          </span>
          <span className="text-[10px] text-on-surface-variant mt-1">Score: {finalScore} / 100</span>
        </div>
      </div>

      {showDeductions && (
        <section className="bg-surface-container-low border border-outline-variant rounded p-3 animate-fade-in">
          <div className="flex items-center justify-between gap-3 mb-2">
            <h4 className="text-sm font-bold text-on-surface">Why points were deducted</h4>
            <span className="text-[10px] text-on-surface-variant">Starts at 100</span>
          </div>

          {breakdownRows.length > 0 ? (
            <div className="divide-y divide-outline-variant">
              {breakdownRows.map(item => (
                <div key={item.key} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-on-surface">{item.label}</div>
                      <div className="text-[11px] text-on-surface-variant leading-relaxed">{item.hint}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedPenaltyKey(expandedPenaltyKey === item.key ? null : item.key)}
                      className="text-sm font-bold text-error tabular-nums shrink-0 rounded px-1.5 py-0.5 hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error/30 transition-colors"
                      title="Show how this deduction was calculated"
                      aria-expanded={expandedPenaltyKey === item.key}
                    >
                      -{item.value}
                    </button>
                  </div>
                  {expandedPenaltyKey === item.key && (
                    <div className="mt-2 rounded border border-error/20 bg-error/5 px-3 py-2 text-[11px] leading-relaxed text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Calculation: </span>
                      {getPenaltyExplanation(item, { slaCategories, burnGap, burnRateLevel })}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-3 space-y-1">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="font-semibold text-on-surface">Total deducted:</span>
                  <span className="font-bold text-error tabular-nums">-{totalDeducted} pts</span>
                </div>
                <div className="flex justify-between gap-3 text-xs">
                  <span className="font-semibold text-on-surface">Final score:</span>
                  <span className="font-bold text-on-surface tabular-nums">{finalScore} / 100</span>
                </div>
              </div>
            </div>
          ) : finalScore < 100 ? (
            <div className="py-2">
              <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-3 py-2">
                Penalties were applied, but a detailed breakdown is not available for this older evaluation.
              </p>
              <div className="pt-3 space-y-1 mt-2">
                <div className="flex justify-between gap-3 text-xs">
                  <span className="font-semibold text-on-surface">Final score:</span>
                  <span className="font-bold text-on-surface tabular-nums">{finalScore} / 100</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              No deductions - task is on track
            </p>
          )}

          <div className="border-t border-outline-variant mt-3 pt-3">
            <span className="text-xs font-bold text-on-surface block mb-2">Quy định trừ điểm SLA chi tiết</span>
            <div className="text-[11px] text-on-surface-variant space-y-3">
              <div>
                <strong className="text-on-surface">1. Trễ hạn (Deadline urgency):</strong>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>Quá hạn từ 3 ngày trở lên: <span className="text-error font-medium">-35 điểm</span></li>
                  <li>Quá hạn 1-2 ngày: <span className="text-error font-medium">-25 điểm</span></li>
                  <li>Tới hạn trong hôm nay: <span className="text-error font-medium">-15 điểm</span></li>
                  <li>Tới hạn vào ngày mai: <span className="text-error font-medium">-10 điểm</span></li>
                  <li>Tới hạn trong vòng 3 ngày tới: <span className="text-error font-medium">-5 điểm</span></li>
                </ul>
              </div>
              
              <div>
                <strong className="text-on-surface">2. Tiến độ chậm (Burn rate penalty):</strong>
                <p className="mt-0.5">Đánh giá qua Độ trễ (Gap) = % Thời gian đã dùng - % Tiến độ hoàn thành.</p>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>Gap &gt; 45% (Mức CRITICAL): <span className="text-error font-medium">-39 điểm</span> (30 điểm gốc × 1.3)</li>
                  <li>Gap từ 26% - 45% (Mức HIGH): <span className="text-error font-medium">-22 điểm</span> (18 điểm gốc × 1.2)</li>
                  <li>Gap từ 11% - 25% (Mức MEDIUM): <span className="text-error font-medium">-9 điểm</span> (8 điểm gốc × 1.1)</li>
                  <li>Gap &le; 10% (Mức LOW): Không bị trừ điểm.</li>
                </ul>
              </div>

              <div>
                <strong className="text-on-surface">3. Bị chặn (Blocker penalty):</strong>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>Task bị kẹt và KHÔNG ghi rõ lý do chặn: <span className="text-error font-medium">-20 điểm</span></li>
                  <li>Task bị kẹt nhưng CÓ ghi rõ lý do chặn: <span className="text-error font-medium">-15 điểm</span></li>
                </ul>
              </div>

              <div>
                <strong className="text-on-surface">4. Quá tải (Workload penalty):</strong>
                <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                  <li>Assignee đang ôm 6 task cùng lúc trở lên: <span className="text-error font-medium">-10 điểm</span></li>
                  <li>Assignee đang ôm 3-5 task cùng lúc: <span className="text-error font-medium">-5 điểm</span></li>
                  <li>Assignee xử lý dưới 3 task: Không bị trừ điểm.</li>
                </ul>
              </div>
            </div>
          </div>

          {recentDecisions.length > 0 && (
            <div className="border-t border-outline-variant mt-3 pt-3">
              <span className="text-xs font-bold text-on-surface block mb-2">Score history</span>
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {recentDecisions.map((dec, idx) => (
                  <div key={`${dec.evaluatedAt}-${idx}`} className="text-[11px] p-2 bg-surface-container-lowest border border-outline-variant rounded flex justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-on-surface-variant">
                        {formatDateTime(dec.evaluatedAt)}
                      </div>
                      <div className="font-semibold text-on-surface mt-0.5 tabular-nums">
                        {dec.previousScore !== null && dec.previousScore !== undefined && dec.previousScore !== dec.newScore ? (
                          <span>{dec.previousScore} <span className="text-on-surface-variant mx-1">&rarr;</span> {dec.newScore}</span>
                        ) : (
                          <span>{dec.newScore} pts</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col justify-center">
                      <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full uppercase ${getRiskBadgeClass(dec.newRiskLevel)}`}>
                        {dec.newRiskLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {burnRateLevel && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-container-low border border-outline-variant p-3 rounded">
            <span className="text-[10px] text-on-surface-variant uppercase block mb-1">Progress speed</span>
            <span className={`inline-flex text-xs font-bold uppercase border px-2 py-0.5 rounded-full ${getBurnRateClass(burnRateLevel)}`}>
              {burnRateLevel}
            </span>
            <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
              {BURN_RATE_DESCRIPTION[burnRateLevel] || 'Progress speed is not available'}
            </p>
            {burnGap != null && (
              <span className="text-[10px] text-on-surface-variant block mt-1">Gap: {Number(burnGap).toFixed(1)}%</span>
            )}
          </div>
          <div className="bg-surface-container-low border border-outline-variant p-3 rounded">
            <span className="text-[10px] text-on-surface-variant uppercase block mb-1">SPI</span>
            <span className={`text-sm font-bold ${
              spi >= 0.9 ? 'text-emerald-600' :
              spi >= 0.7 ? 'text-yellow-700' :
              spi >= 0.5 ? 'text-orange-600' : 'text-rose-600'
            }`}>
              {formatSpi(spi)}
            </span>
          </div>
        </div>
      )}

      {showForecast && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded flex items-start gap-2">
          <span className="material-symbols-outlined text-orange-600 text-[16px] mt-0.5 shrink-0">trending_up</span>
          <div className="text-xs text-orange-800">
            <span className="font-bold">Risk forecast: </span>
            Risk may increase to{' '}
            <span className={`font-bold uppercase ${getRiskBadgeClass(predictedRiskLevel)} px-1.5 py-0.5 rounded-full border`}>
              {predictedRiskLevel}
            </span>
            {predictionReasons.length > 0 && (
              <ul className="list-disc list-inside mt-2 space-y-0.5 text-orange-700">
                {predictionReasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {pauseData && (pauseData.totalPausedMinutes > 0 || pauseData.currentlyPaused) && (
        <div className={`p-3 rounded border text-xs flex items-center gap-2 ${
          pauseData.currentlyPaused
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {pauseData.currentlyPaused ? 'pause_circle' : 'info'}
          </span>
          <div className="flex-1">
            {pauseData.currentlyPaused ? (
              <div>
                <span className="font-semibold">SLA is paused</span> since {formatDateTime(pauseData.currentPauseStartedAt)}
              </div>
            ) : (
              <div>
                SLA was paused for <span className="font-semibold">{formatDuration(pauseData.totalPausedMinutes)}</span> because the task was blocked.
              </div>
            )}
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
        <div className="p-3 bg-[#1E707D]/5 border border-[#1E707D]/20 rounded">
          <span className="text-xs font-bold text-[#1E707D] block mb-0.5">Recommended Action</span>
          <p className="text-xs text-on-surface leading-relaxed">{recommendedAction}</p>
        </div>
      )}

      <div className="text-[10px] text-on-surface-variant flex flex-col gap-1 border-t border-outline-variant pt-3">
        <div><span className="font-semibold">Last evaluated:</span> {formattedDate}</div>
        <div><span className="font-semibold">Latest event:</span> {latestEventType}</div>
        <div><span className="font-semibold">Latest action:</span> {latestActionTaken}</div>
      </div>

      {visibleActions.length > 0 && (
        <div className="border-t border-outline-variant pt-3">
          <span className="text-xs font-bold text-on-surface block mb-2">Recent actions</span>
          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {visibleActions.map((action, idx) => (
              <div key={`${action.actionType}-${action.createdAt}-${idx}`} className="text-[11px] p-2 bg-surface-container-low border border-outline-variant rounded">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-on-surface">
                      {getFriendlyLabel(ACTION_TYPE_LABEL, action.actionType)}
                    </div>
                    {action.slaCategory && (
                      <div className="text-[10px] text-on-surface-variant mt-0.5">
                        {getFriendlyLabel(ACTION_CATEGORY_LABEL, action.slaCategory)}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-on-surface-variant shrink-0">
                    {formatDateTime(action.createdAt)}
                  </span>
                </div>
                {action.message && (
                  <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">{action.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}



      <div className="text-[10px] text-on-surface-variant flex flex-col gap-1 border-t border-outline-variant pt-3">
        <div><span className="font-semibold">Last evaluated:</span> {formattedDate}</div>
      </div>
    </div>
  )
}

export default SlaDecisionPackPanel
