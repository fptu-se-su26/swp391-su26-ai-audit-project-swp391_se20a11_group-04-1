import { useMemo } from 'react'
import useTestCaseStore from '../stores/useTestCaseStore'
import SvgDonutChart from './SvgDonutChart'
import { C, T } from '../utils/theme'

const TYPE_KEYS = ['UI', 'API', 'UNIT', 'MANUAL']

const typeColors = {
  UI:     { color: C.typeUI,     bg: C.typeUIBg    },
  API:    { color: C.typeAPI,    bg: C.typeAPIBg   },
  UNIT:   { color: C.typeUNIT,   bg: C.typeUNITBg  },
  MANUAL: { color: C.typeMANUAL, bg: C.typeMANUALBg},
}

/**
 * Compact Coverage Insights side card.
 * Shows AC coverage ring, type breakdown, and a dynamically generated recommendation.
 * Only rendered when a requirement is selected.
 */
export default function CoverageInsightsCard() {
  const { testCases, requirementsTree, selectedRequirementId, openAiGenModal } = useTestCaseStore()

  const { req, typeCounts, coverage, acTotal, acCovered, recommendation } = useMemo(() => {
    const req = requirementsTree.find(r => r.id === selectedRequirementId) || null

    // Type counts from current test cases in store
    const typeCounts = { UI: 0, API: 0, UNIT: 0, MANUAL: 0 }
    testCases.forEach(tc => { if (typeCounts[tc.type] !== undefined) typeCounts[tc.type]++ })

    const acTotal   = req?.acTotal || 0
    const coverage  = req ? (req.coveragePercent || 0) : 0
    const acCovered = acTotal > 0 ? Math.round((acTotal * coverage) / 100) : 0

    // Build recommendation from actual missing data
    const missingTypes = TYPE_KEYS.filter(k => typeCounts[k] === 0)
    const uncovered = acTotal > 0 ? acTotal - acCovered : 0
    const parts = []
    if (missingTypes.length > 0) parts.push(`Add ${missingTypes.join(' & ')} tests.`)
    if (uncovered > 0) parts.push(`${uncovered} AC still uncovered.`)
    const recommendation = parts.length > 0
      ? parts.join(' ')
      : 'Coverage looks healthy. Consider edge-case testing.'

    return { req, typeCounts, coverage, acTotal, acCovered, recommendation }
  }, [testCases, requirementsTree, selectedRequirementId])

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      boxShadow: T.shadow.sm,
      minWidth: 200,
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Coverage Insights
      </div>

      {/* AC coverage ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <SvgDonutChart
          percentage={coverage}
          color={coverage >= 70 ? C.success : C.warning}
          size={68}
          strokeWidth={8}
          tooltipData={[
            { label: 'Covered', value: acCovered },
            { label: 'Total AC', value: acTotal },
          ]}
        />
        <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>
          AC: {acCovered}/{acTotal > 0 ? acTotal : '–'}
        </span>
      </div>

      {/* Type breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {TYPE_KEYS.map(type => {
          const count = typeCounts[type]
          const tc = typeColors[type]
          return (
            <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: tc.color }}>{type}</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '1px 8px', borderRadius: 12,
                background: count > 0 ? tc.bg : C.borderLt,
                color: count > 0 ? tc.color : C.textMuted,
              }}>
                {count}
              </span>
            </div>
          )
        })}
      </div>

      {/* Recommendation */}
      <div style={{
        background: C.bg, border: `1px solid ${C.border}`,
        borderRadius: 8, padding: '8px 10px',
        fontSize: 12, color: C.textSec, lineHeight: 1.5,
      }}>
        {recommendation}
      </div>

      {/* Quick AI action */}
      <button
        onClick={() => openAiGenModal()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          padding: '7px 12px', borderRadius: 8, border: 'none',
          background: '#8B5CF6', color: '#fff',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(139,92,246,0.2)',
          transition: T.transition.default,
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#7C3AED'}
        onMouseLeave={e => e.currentTarget.style.background = '#8B5CF6'}
      >
        <span style={{ fontSize: 13 }}>✨</span> Generate Tests
      </button>
    </div>
  )
}
