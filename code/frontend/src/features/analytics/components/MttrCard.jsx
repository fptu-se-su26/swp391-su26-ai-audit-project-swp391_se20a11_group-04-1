import React from 'react'
import { TrendingDown, TrendingUp, Minus, Clock } from 'lucide-react'

const getBadgeColor = (mttrHours) => {
  if (mttrHours == null) return 'bg-gray-100 text-gray-500 border-gray-200'
  const h = parseFloat(mttrHours)
  if (h < 24) return 'bg-green-100 text-green-700 border-green-200'
  if (h < 48) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

const TrendIcon = ({ trend }) => {
  if (trend === 'IMPROVING') return <TrendingDown className="w-4 h-4 text-green-500" />
  if (trend === 'DEGRADING') return <TrendingUp className="w-4 h-4 text-red-500" />
  if (trend === 'STABLE') return <Minus className="w-4 h-4 text-gray-400" />
  return null
}

export default function MttrCard({ mttrHours, sampleCount, trend }) {
  const hasData = mttrHours != null
  const badgeColor = getBadgeColor(mttrHours)

  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">MTTR</span>
        </div>
        {trend && trend !== 'INSUFFICIENT_DATA' && <TrendIcon trend={trend} />}
      </div>

      <div className="flex items-end gap-2">
        {hasData ? (
          <>
            <span className="text-3xl font-bold text-on-surface">
              {parseFloat(mttrHours).toFixed(1)}
            </span>
            <span className="text-sm text-on-surface-variant mb-1">hours</span>
          </>
        ) : (
          <span className="text-2xl font-semibold text-on-surface-variant">No Data</span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {!hasData ? 'No recovery cycles yet' : parseFloat(mttrHours) < 24 ? 'Excellent' : parseFloat(mttrHours) < 48 ? 'Acceptable' : 'Needs Attention'}
        </span>
        {hasData && sampleCount > 0 && (
          <span className="text-xs text-on-surface-variant">{sampleCount} cycle{sampleCount > 1 ? 's' : ''}</span>
        )}
      </div>

      <p className="text-xs text-on-surface-variant leading-relaxed">
        Mean time from HIGH/CRITICAL risk onset to recovery
      </p>
    </div>
  )
}
