import React from 'react'

const getColor = (pct) => {
  if (pct == null) return '#94a3b8'
  if (pct >= 90) return '#22c55e'
  if (pct >= 75) return '#f59e0b'
  return '#ef4444'
}

export default function AvailabilityGauge({ availabilityPct, healthyThreshold, totalIntervals, healthyIntervals }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const pct = availabilityPct != null ? parseFloat(availabilityPct) : null
  const filled = pct != null ? (pct / 100) * circumference : 0
  const color = getColor(pct)

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">monitoring</span>
        <span className="text-xs font-semibold uppercase tracking-wider">Availability</span>
      </div>

      <div className="flex items-center gap-5">
        {/* SVG donut */}
        <svg width="100" height="100" viewBox="0 0 100 100" className="shrink-0">
          {/* Background track */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
          />
          {/* Filled arc */}
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={`${filled} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
          {/* Center text */}
          <text x="50" y="46" textAnchor="middle" fontSize="14" fontWeight="700" fill="currentColor" className="fill-on-surface">
            {pct != null ? `${pct.toFixed(1)}%` : '—'}
          </text>
          <text x="50" y="60" textAnchor="middle" fontSize="8" fill="#94a3b8">
            avail.
          </text>
        </svg>

        <div className="flex flex-col gap-1 min-w-0">
          {totalIntervals > 0 && (
            <>
              <span className="text-xs text-on-surface-variant">
                <span className="font-semibold text-on-surface">{healthyIntervals}</span>/{totalIntervals} intervals healthy
              </span>
              <span className="text-xs text-on-surface-variant">
                Threshold: score ≥ {healthyThreshold}
              </span>
            </>
          )}
          {pct == null && (
            <span className="text-xs text-on-surface-variant">No evaluation data yet</span>
          )}
        </div>
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        % of SLA evaluations where score ≥ {healthyThreshold ?? 75}
      </p>
    </div>
  )
}
