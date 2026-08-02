import { useMemo } from 'react'
import useTestCaseStore from '../stores/useTestCaseStore'
import { C, T } from '../utils/theme'

const riskColors = {
  LOW:      { color: C.success,  bg: C.successBg },
  MEDIUM:   { color: C.warning,  bg: C.warningBg },
  HIGH:     { color: '#EA580C',  bg: '#FFF7ED'   },
  CRITICAL: { color: C.danger,   bg: C.dangerBg  },
}

/**
 * Compact selected-requirement summary bar.
 * Shows code · title · metadata chips.
 */
export default function SelectedRequirementHeader({ onClear }) {
  const { requirementsTree, selectedRequirementId } = useTestCaseStore()

  const req = useMemo(
    () => requirementsTree.find(r => r.id === selectedRequirementId),
    [requirementsTree, selectedRequirementId]
  )

  if (!req) return null

  const risk = riskColors[req.riskLevel] || { color: C.textSec, bg: C.borderLt }
  const acTotal    = req.acTotal || 0
  const acCovered  = acTotal > 0 ? Math.round((acTotal * req.coveragePercent) / 100) : 0
  const executed   = req.testCaseCount - (req.notRunCount || 0)

  const chips = [
    { icon: 'checklist_rtl', label: `${req.testCaseCount} Test Case${req.testCaseCount !== 1 ? 's' : ''}` },
    { icon: 'task_alt',       label: `${acCovered}/${acTotal} AC Covered` },
    { icon: 'play_circle',    label: `${executed}/${req.testCaseCount} Executed` },
  ]

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      boxShadow: T.shadow.sm,
      borderLeft: `3px solid ${C.primary}`,
    }}>
      {/* Left: code + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, flexShrink: 0 }}>
          {req.reqCode || `REQ-${req.id}`}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {req.title}
        </span>
      </div>

      {/* Center: chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {chips.map(chip => (
          <span key={chip.label} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 500, color: C.textSec,
            background: C.bg, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: C.textMuted }}>{chip.icon}</span>
            {chip.label}
          </span>
        ))}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, fontWeight: 700,
          background: risk.bg, color: risk.color,
          border: `1px solid ${risk.color}40`,
          borderRadius: 20, padding: '3px 10px',
          textTransform: 'uppercase', letterSpacing: '0.03em',
        }}>
          Risk: {req.riskLevel}
        </span>
      </div>

      {/* Right: clear */}
      <button
        onClick={onClear}
        title="Clear selection"
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', color: C.textMuted,
          borderRadius: 6, padding: 4,
          transition: T.transition.default,
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.color = C.textSec}
        onMouseLeave={e => e.currentTarget.style.color = C.textMuted}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>
    </div>
  )
}
