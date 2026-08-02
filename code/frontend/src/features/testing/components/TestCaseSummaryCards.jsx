import { useMemo } from 'react'
import useTestCaseStore from '../stores/useTestCaseStore'
import { C, T } from '../utils/theme'

/**
 * Compact KPI row — 5 cards
 * Requirements · Total Test Cases · Coverage · Pass Rate · High Risk Requirements
 */
export default function TestCaseSummaryCards() {
  const { testCases, requirementsTree, selectedRequirementId } = useTestCaseStore()

  const stats = useMemo(() => {
    const totalReqs = requirementsTree.length

    // Total test cases — from all fetched test cases (full list when a req is selected, paginated otherwise)
    const totalTCs = testCases.length

    // Coverage — per-req when selected, avg project otherwise
    let coverage = 0
    if (selectedRequirementId) {
      const req = requirementsTree.find(r => r.id === selectedRequirementId)
      coverage = req ? req.coveragePercent : 0
    } else if (totalReqs > 0) {
      coverage = Math.round(requirementsTree.reduce((s, r) => s + r.coveragePercent, 0) / totalReqs)
    }

    // Pass Rate — only executed tests; exclude NOT_RUN from denominator
    let passRateDisplay = 'N/A'
    const passed = testCases.filter(t => t.status === 'PASS').length
    const failed = testCases.filter(t => t.status === 'FAIL').length
    const executed = passed + failed
    if (executed > 0) {
      passRateDisplay = `${Math.round((passed / executed) * 100)}%`
    }

    const highRisk = requirementsTree.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length

    return { totalReqs, totalTCs, coverage, passRateDisplay, highRisk }
  }, [testCases, requirementsTree, selectedRequirementId])

  const cards = [
    {
      label: 'Requirements',
      value: stats.totalReqs,
      icon: 'description',
      color: C.primary,
      lightBg: C.primaryLt,
    },
    {
      label: 'Total Test Cases',
      value: stats.totalTCs,
      icon: 'checklist_rtl',
      color: '#6366F1',
      lightBg: '#EEF2FF',
    },
    {
      label: selectedRequirementId ? 'Req Coverage' : 'Avg Coverage',
      value: `${stats.coverage}%`,
      icon: 'donut_large',
      color: stats.coverage >= 70 ? C.success : C.warning,
      lightBg: stats.coverage >= 70 ? C.successBg : C.warningBg,
    },
    {
      label: 'Pass Rate',
      value: stats.passRateDisplay,
      icon: 'verified',
      color: stats.passRateDisplay === 'N/A' ? C.textMuted : (parseFloat(stats.passRateDisplay) >= 70 ? C.success : C.warning),
      lightBg: stats.passRateDisplay === 'N/A' ? C.borderLt : (parseFloat(stats.passRateDisplay) >= 70 ? C.successBg : C.warningBg),
    },
    {
      label: 'High Risk Reqs',
      value: stats.highRisk,
      icon: 'warning',
      color: stats.highRisk === 0 ? C.success : '#EA580C',
      lightBg: stats.highRisk === 0 ? C.successBg : '#FFF7ED',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
      {cards.map(card => (
        <div
          key={card.label}
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: T.shadow.sm,
            transition: T.transition.default,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {card.label}
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: card.color, lineHeight: 1.2 }}>
              {card.value}
            </span>
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: card.lightBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: card.color }}>{card.icon}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
