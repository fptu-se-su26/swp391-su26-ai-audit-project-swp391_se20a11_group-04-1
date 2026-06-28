import React from 'react'

export default function ErrorBudgetBar({ consumedPct, remainingPct, totalTasks, penalizedTasks, budgetPct }) {
  const consumed = consumedPct != null ? parseFloat(consumedPct) : null
  const remaining = remainingPct != null ? parseFloat(remainingPct) : null
  const hasData = consumed != null

  const barConsumedWidth = hasData ? `${Math.min(consumed, 100)}%` : '0%'
  const isExhausted = hasData && consumed >= 100
  const isWarning = hasData && consumed >= 80

  const budgetStatus = !hasData
    ? { label: 'No Data', color: 'text-on-surface-variant' }
    : isExhausted
    ? { label: 'Exhausted', color: 'text-red-600' }
    : isWarning
    ? { label: 'Warning', color: 'text-yellow-600' }
    : { label: 'Healthy', color: 'text-green-600' }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">savings</span>
          <span className="text-xs font-semibold uppercase tracking-wider">Error Budget</span>
        </div>
        <span className={`text-xs font-semibold ${budgetStatus.color}`}>{budgetStatus.label}</span>
      </div>

      {/* Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className={`h-4 rounded-full transition-all duration-700 ${isExhausted ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-green-500'}`}
          style={{ width: barConsumedWidth }}
        />
      </div>

      <div className="flex justify-between text-xs">
        <span className="text-on-surface-variant">
          Consumed: <span className="font-semibold text-on-surface">{hasData ? `${consumed.toFixed(1)}%` : '—'}</span>
        </span>
        <span className="text-on-surface-variant">
          Remaining: <span className="font-semibold text-on-surface">{hasData ? `${remaining.toFixed(1)}%` : '—'}</span>
        </span>
      </div>

      {hasData && (
        <div className="text-xs text-on-surface-variant">
          {penalizedTasks}/{totalTasks} tasks penalized &bull; {budgetPct ?? 10}% budget allowed
        </div>
      )}

      <p className="text-xs text-on-surface-variant leading-relaxed">
        Allowable SLA breach per sprint before alerting
      </p>
    </div>
  )
}
