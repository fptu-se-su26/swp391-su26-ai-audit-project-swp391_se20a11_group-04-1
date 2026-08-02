import { useMemo, useState, useEffect, useRef } from 'react'
import useTestCaseStore from '../stores/useTestCaseStore'
import { C, T } from '../utils/theme'

/**
 * Compact horizontal AI Insight banner.
 * Shows the most relevant insight message + quick action buttons.
 * Does NOT claim tests are failing if all are NOT_RUN.
 * Resets dismiss state when the selected requirement changes.
 */
export default function TestCaseAiInsight() {
  const { testCases, requirementsTree, selectedRequirementId, openAiGenModal } = useTestCaseStore()
  const [dismissed, setDismissed] = useState(false)
  const prevReqIdRef = useRef(selectedRequirementId)

  useEffect(() => {
    if (prevReqIdRef.current !== selectedRequirementId) {
      prevReqIdRef.current = selectedRequirementId
      setDismissed(false)
    }
  }, [selectedRequirementId])

  const insight = useMemo(() => {
    const types = { UI: 0, API: 0, UNIT: 0, MANUAL: 0 }
    testCases.forEach(tc => { if (types[tc.type] !== undefined) types[tc.type]++ })

    const messages = []
    const actions = []

    if (selectedRequirementId) {
      const req = requirementsTree.find(r => r.id === selectedRequirementId)
      const acTotal   = req?.acTotal || 0
      const acCovered = acTotal > 0 ? Math.round((acTotal * (req?.coveragePercent || 0)) / 100) : 0
      const uncovered = acTotal - acCovered

      if (uncovered > 0) {
        messages.push(`${uncovered} acceptance criteri${uncovered === 1 ? 'on is' : 'a are'} uncovered.`)
      }
      if (types.API === 0) {
        messages.push('No API tests exist for this requirement.')
        actions.push({
          label: 'Generate API Tests',
          onClick: () => openAiGenModal({
            testType: 'API',
            additionalContext: 'Generate API test cases for this requirement using scanned backend endpoints.',
          }),
          primary: true,
        })
      }
      if (types.UI === 0 && types.API > 0) {
        messages.push('No UI tests detected.')
      }
    } else {
      const reqsWithNoTests = requirementsTree.filter(r => r.testCaseCount === 0).length
      if (reqsWithNoTests > 0) {
        messages.push(`${reqsWithNoTests} requirement${reqsWithNoTests === 1 ? '' : 's'} ha${reqsWithNoTests === 1 ? 's' : 've'} no test cases.`)
      }
      if (types.API === 0) {
        messages.push('No API test coverage across the project.')
        actions.push({
          label: 'Generate API Tests',
          onClick: () => openAiGenModal({ testType: 'API' }),
          primary: true,
        })
      }
    }

    actions.push({
      label: 'Generate Recommended Tests',
      onClick: () => openAiGenModal(),
      primary: actions.length === 0,
    })

    if (messages.length === 0) return null
    return { message: messages.join(' '), actions }
  }, [testCases, requirementsTree, selectedRequirementId, openAiGenModal])

  if (!insight || dismissed) return null

  return (
    <div style={{
      background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 60%, #F5F3FF 100%)',
      border: '1px solid #DDD6FE',
      borderRadius: 12,
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 2px 8px rgba(139,92,246,0.07)',
      flexWrap: 'wrap',
    }}>
      {/* Icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 15 }}>✨</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          AI Insight
        </span>
      </div>

      {/* Message */}
      <span style={{ fontSize: 13, color: '#4C1D95', fontWeight: 500, flex: 1, minWidth: 180 }}>
        {insight.message}
      </span>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {insight.actions.map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: 'pointer',
              background: action.primary ? '#8B5CF6' : '#FFFFFF',
              color: action.primary ? '#FFFFFF' : '#6D28D9',
              border: action.primary ? 'none' : '1px solid #C4B5FD',
              transition: T.transition.default,
              boxShadow: action.primary ? '0 2px 6px rgba(139,92,246,0.25)' : 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = action.primary ? '#7C3AED' : '#F5F3FF' }}
            onMouseLeave={e => { e.currentTarget.style.background = action.primary ? '#8B5CF6' : '#FFFFFF' }}
          >
            <span style={{ fontSize: 13 }}>✨</span>
            {action.label}
          </button>
        ))}
        <button
          onClick={() => setDismissed(true)}
          title="Dismiss"
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', color: '#A78BFA', padding: 4,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
        </button>
      </div>
    </div>
  )
}
