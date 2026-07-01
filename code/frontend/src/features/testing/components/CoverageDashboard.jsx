import { useMemo } from 'react'
import useTestCaseStore from '../stores/useTestCaseStore'
import SvgDonutChart from './SvgDonutChart'
import { C, T } from '../utils/theme'

export default function CoverageDashboard() {
  const { testCases, requirementsTree, selectedRequirementId } = useTestCaseStore()

  const reqNode = useMemo(() => {
    if (!selectedRequirementId) return null
    return requirementsTree.find(r => r.id === selectedRequirementId)
  }, [requirementsTree, selectedRequirementId])

  const testTypeStats = useMemo(() => {
    const types = { UI: 0, API: 0, UNIT: 0, MANUAL: 0 }
    testCases.forEach(tc => {
      if (types[tc.type] !== undefined) {
        types[tc.type]++
      }
    })
    const total = testCases.length || 1
    return Object.keys(types).map(k => ({
      type: k,
      count: types[k],
      percent: Math.round((types[k] / total) * 100)
    }))
  }, [testCases])

  const projectStats = useMemo(() => {
    if (!requirementsTree.length) return { reqs: 0, highRisk: 0, cov: 0, pass: 0 }
    const reqs = requirementsTree.length
    const highRisk = requirementsTree.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length
    const avgCov = Math.round(requirementsTree.reduce((sum, r) => sum + r.coveragePercent, 0) / reqs)
    const avgPass = Math.round(requirementsTree.reduce((sum, r) => sum + r.passRate, 0) / reqs)
    return { reqs, highRisk, cov: avgCov, pass: avgPass }
  }, [requirementsTree])

  const topRisks = useMemo(() => {
    return [...requirementsTree]
      .filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL')
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 5)
  }, [requirementsTree])

  const projectAiInsights = useMemo(() => {
    const noTests = requirementsTree.filter(r => r.testCaseCount === 0).length
    const lowPassRate = requirementsTree.filter(r => r.testCaseCount > 0 && r.passRate < 30).length
    const types = { UI: 0, API: 0, UNIT: 0, MANUAL: 0 }
    testCases.forEach(tc => { if (types[tc.type] !== undefined) types[tc.type]++ })
    const missingTypes = []
    if (types.API === 0) missingTypes.push('API')
    if (types.UI === 0) missingTypes.push('UI')
    if (types.UNIT === 0) missingTypes.push('UNIT')
    return { noTests, lowPassRate, missingTypes }
  }, [requirementsTree, testCases])

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return C.success
      case 'MEDIUM': return C.warning
      case 'HIGH': return '#EA580C' // Orange
      case 'CRITICAL': return C.danger
      default: return C.textSec
    }
  }

  if (!reqNode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: T.font }}>
        {/* Row 1 - Project KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ background: C.surface, padding: 20, borderRadius: T.radius.lg, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requirements</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.textPri, marginTop: 8 }}>{projectStats.reqs}</div>
          </div>
          <div style={{ background: C.surface, padding: 20, borderRadius: T.radius.lg, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.primary }}>{projectStats.cov}%</div>
              <div style={{ flex: 1, height: 6, background: C.borderLt, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${projectStats.cov}%`, height: '100%', background: C.primary, borderRadius: 3 }}></div>
              </div>
            </div>
          </div>
          <div style={{ background: C.surface, padding: 20, borderRadius: T.radius.lg, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pass Rate</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: C.success }}>{projectStats.pass}%</div>
              <div style={{ flex: 1, height: 6, background: C.borderLt, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${projectStats.pass}%`, height: '100%', background: C.success, borderRadius: 3 }}></div>
              </div>
            </div>
          </div>
          <div style={{ padding: 20, borderRadius: T.radius.lg, border: `1px solid ${C.dangerBdr}`, background: C.dangerBg, boxShadow: T.shadow.sm }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.danger, textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Risk Requirements</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.danger, marginTop: 8 }}>{projectStats.highRisk}</div>
          </div>
        </div>

        {/* Row 2 - Heatmap */}
        <div style={{ background: C.surface, padding: 20, borderRadius: T.radius.lg, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.textPri, margin: '0 0 16px 0' }}>Coverage Heatmap</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {requirementsTree.map(req => {
              const color = getRiskColor(req.riskLevel)
              return (
                <div 
                  key={req.id}
                  onClick={() => useTestCaseStore.getState().selectRequirement(req.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 20, border: `1px solid ${C.border}`,
                    background: C.bg, fontSize: 12, fontWeight: 600, color: C.textPri,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 2px 8px ${color}20` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {req.reqCode || `REQ-${req.id}`} <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }}></span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Row 3 - Risks and AI */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Top Risks */}
          <div style={{ background: C.surface, padding: 20, borderRadius: T.radius.lg, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.textPri, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.danger }}>warning</span>
              Top Risk Requirements
            </h3>
            {topRisks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {topRisks.map(req => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: `1px solid ${C.borderLt}` }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: getRiskColor(req.riskLevel) }}></div>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.textPri }}>{req.reqCode || `REQ-${req.id}`} {req.title}</div>
                    <div style={{ fontSize: 12, color: C.textSec }}>Score: <span style={{ fontWeight: 700, color: C.danger }}>{req.healthScore}</span></div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: C.textMuted }}>No high risk requirements detected.</div>
            )}
          </div>

          {/* AI Recommendations */}
          <div style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', padding: 20, borderRadius: T.radius.lg, border: '1px solid #DDD6FE', boxShadow: T.shadow.sm }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#6D28D9', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>✨</span> AI Recommendations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {projectAiInsights.noTests > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4C1D95' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6' }}></span>
                  <strong>{projectAiInsights.noTests} requirements</strong> have no test cases.
                </div>
              )}
              {projectAiInsights.lowPassRate > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4C1D95' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6' }}></span>
                  <strong>{projectAiInsights.lowPassRate} requirements</strong> have a very low pass rate.
                </div>
              )}
              {projectAiInsights.missingTypes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4C1D95' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6' }}></span>
                  Missing <strong>{projectAiInsights.missingTypes.join(', ')}</strong> test coverage across the project.
                </div>
              )}
              {projectAiInsights.noTests === 0 && projectAiInsights.lowPassRate === 0 && projectAiInsights.missingTypes.length === 0 && (
                <div style={{ fontSize: 13, color: '#4C1D95' }}>Project looks healthy! Run an AI deep scan for edge cases.</div>
              )}
            </div>
            <button
              onClick={() => useTestCaseStore.getState().openAiGenModal()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: '#8B5CF6', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#7C3AED'}
              onMouseLeave={e => e.currentTarget.style.background = '#8B5CF6'}
            >
              <span style={{ fontSize: 16 }}>✨</span> Analyze Entire Project
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getRiskDetails = (level) => {
    switch (level) {
      case 'LOW': return { color: C.success, text: 'Good quality' }
      case 'MEDIUM': return { color: C.warning, text: 'Needs attention' }
      case 'HIGH': return { color: '#F97316', text: 'Risky requirement' }
      case 'CRITICAL': return { color: C.danger, text: 'Severe risk' }
      default: return { color: C.textSec, text: 'Unknown state' }
    }
  }

  const risk = getRiskDetails(reqNode.riskLevel)
  const executionRate = reqNode.testCaseCount > 0 ? Math.round(((reqNode.testCaseCount - reqNode.notRunCount) / reqNode.testCaseCount) * 100) : 0

  const warnings = []
  if (reqNode.coveragePercent >= 80 && reqNode.passRate < 30 && reqNode.testCaseCount > 0) {
    warnings.push("High coverage but most tests are failing — review test quality.")
  } else if ((reqNode.riskLevel === 'HIGH' || reqNode.riskLevel === 'CRITICAL') && reqNode.coveragePercent >= 80) {
    warnings.push(`Risk is ${reqNode.riskLevel} because Pass Rate is below threshold despite good coverage.`)
  }
  if (reqNode.testCaseCount > 0 && reqNode.notRunCount === reqNode.testCaseCount) {
    warnings.push("No tests have been executed yet.")
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: T.font }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: T.spacing.md }}>
      
      {/* 1. Pass Rate Widget */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: T.radius.lg, padding: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: T.shadow.sm, transition: T.transition.default
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow.hover}
      onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow.sm}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Pass Rate
        </span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: C.textPri, lineHeight: 1 }}>{reqNode.passRate}%</div>
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 8 }}>
              Passed: <span style={{ fontWeight: 600, color: C.textPri }}>{reqNode.passedCount}</span> &nbsp;&nbsp; Failed: <span style={{ fontWeight: 600, color: C.danger }}>{reqNode.failedCount}</span>
            </div>
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>
              Not Run: <span style={{ fontWeight: 600 }}>{reqNode.notRunCount}</span> &nbsp;&nbsp; Blocked: <span style={{ fontWeight: 600 }}>0</span>
            </div>
          </div>
          <SvgDonutChart 
            percentage={reqNode.passRate} 
            color={C.success} 
            size={72} 
            strokeWidth={10} 
            tooltipData={[
              { label: 'Passed', value: reqNode.passedCount },
              { label: 'Failed', value: reqNode.failedCount }
            ]}
          />
        </div>
      </div>

      {/* 2. Risk Score Widget */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: T.radius.lg, padding: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: T.shadow.sm, transition: T.transition.default
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow.hover}
      onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow.sm}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Risk Score
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: risk.color }}>{reqNode.riskLevel}</span>
          <div style={{ fontSize: 13, color: C.textSec, marginTop: 12 }}>
            Score: <span style={{ fontWeight: 600, color: risk.color }}>{reqNode.healthScore} / 100</span>
          </div>
          <div style={{ fontSize: 13, color: risk.color, marginTop: 4 }}>
            {risk.text}
          </div>
        </div>
      </div>

      {/* 3. Coverage By Type */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: T.radius.lg, padding: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: T.shadow.sm, transition: T.transition.default
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow.hover}
      onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow.sm}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Coverage By Type
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {testTypeStats.map(stat => (
            <div key={stat.type} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, width: 48 }}>{stat.type}</span>
              <div style={{ flex: 1, height: 6, background: C.borderLt, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${stat.percent}%`, height: '100%', background: C.primary, borderRadius: 3 }}></div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.textPri, width: 32, textAlign: 'right' }}>{stat.percent}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Execution Summary */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: T.radius.lg, padding: '20px', display: 'flex', flexDirection: 'column',
        boxShadow: T.shadow.sm, transition: T.transition.default
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = T.shadow.hover}
      onMouseLeave={e => e.currentTarget.style.boxShadow = T.shadow.sm}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
          Execution Summary
        </span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 12, color: C.textSec }}>
              Total Cases <span style={{ fontWeight: 600, color: C.textPri, fontSize: 16, marginLeft: 4 }}>{reqNode.testCaseCount}</span>
            </div>
            <div style={{ fontSize: 12, color: C.textSec }}>
              Executed <span style={{ fontWeight: 600, color: C.success, fontSize: 14, marginLeft: 4 }}>{reqNode.testCaseCount - reqNode.notRunCount}</span>
            </div>
            <div style={{ fontSize: 12, color: C.textSec }}>
              Not Run <span style={{ fontWeight: 600, color: C.textPri, fontSize: 14, marginLeft: 4 }}>{reqNode.notRunCount}</span>
            </div>
          </div>
          <SvgDonutChart 
            percentage={executionRate} 
            color={C.success} 
            size={72} 
            strokeWidth={8}
            label="Executed"
            tooltipData={[
              { label: 'Executed', value: reqNode.testCaseCount - reqNode.notRunCount },
              { label: 'Not Run', value: reqNode.notRunCount }
            ]}
          />
        </div>
      </div>

      </div>
      
      {/* Contextual Warnings */}
      {warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {warnings.map((w, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: C.warningBg, border: `1px solid ${C.warningBdr}`, borderRadius: T.radius.md, color: '#92400E', fontSize: 13, fontWeight: 500 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
