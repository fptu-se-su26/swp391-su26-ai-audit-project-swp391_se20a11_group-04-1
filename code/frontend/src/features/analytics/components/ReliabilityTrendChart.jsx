import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-on-surface mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value != null ? `${parseFloat(p.value).toFixed(1)}%` : '—'}
        </p>
      ))}
    </div>
  )
}

export default function ReliabilityTrendChart({ trendHistory }) {
  if (!trendHistory || trendHistory.length === 0) {
    return (
      <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-on-surface-variant mb-2">
          <span className="material-symbols-outlined text-[18px]">show_chart</span>
          <span className="text-xs font-semibold uppercase tracking-wider">Reliability Trend</span>
        </div>
        <div className="flex items-center justify-center h-32 text-on-surface-variant text-sm">
          Not enough sprint data to show trend
        </div>
      </div>
    )
  }

  const data = [...trendHistory].reverse().map((p) => ({
    name: p.sprintName ?? `Sprint ${p.sprintId}`,
    availability: p.availabilityPct != null ? parseFloat(p.availabilityPct) : null,
    budgetConsumed: p.errorBudgetConsumedPct != null ? parseFloat(p.errorBudgetConsumedPct) : null,
    reliability: p.reliabilityScore != null ? parseFloat(p.reliabilityScore) : null,
  }))

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">show_chart</span>
        <span className="text-xs font-semibold uppercase tracking-wider">Reliability Trend</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="availability"
            name="Availability"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="budgetConsumed"
            name="Budget Consumed"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="reliability"
            name="Reliability Score"
            stroke="#6366f1"
            strokeWidth={2}
            strokeDasharray="4 2"
            dot={{ r: 3 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
