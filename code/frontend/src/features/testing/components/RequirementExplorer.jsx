import { useState, useMemo } from 'react'
import useTestCaseStore from '../stores/useTestCaseStore'
import { C, T } from '../utils/theme'

const getRiskColor = (level) => {
  switch (level) {
    case 'LOW': return { color: C.success, bg: C.successBg }
    case 'MEDIUM': return { color: C.warning, bg: C.warningBg }
    case 'HIGH': return { color: '#EA580C', bg: '#FFF7ED' } // Orange
    case 'CRITICAL': return { color: C.danger, bg: C.dangerBg }
    default: return { color: C.textSec, bg: C.borderLt }
  }
}

export default function RequirementExplorer() {
  const { requirementsTree, selectedRequirementId, selectRequirement, isLoading } = useTestCaseStore()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTree = useMemo(() => {
    if (!searchTerm) return requirementsTree
    return requirementsTree.filter(req => 
      req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (req.reqCode && req.reqCode.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [requirementsTree, searchTerm])

  const projectStats = useMemo(() => {
    if (!requirementsTree.length) return { reqs: 0, highRisk: 0, cov: 0, pass: 0 }
    const reqs = requirementsTree.length
    const highRisk = requirementsTree.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length
    const avgCov = Math.round(requirementsTree.reduce((sum, r) => sum + r.coveragePercent, 0) / reqs)
    const avgPass = Math.round(requirementsTree.reduce((sum, r) => sum + r.passRate, 0) / reqs)
    return { reqs, highRisk, cov: avgCov, pass: avgPass }
  }, [requirementsTree])

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: C.bg, borderRight: `1px solid ${C.border}`,
      boxShadow: T.shadow.sm, fontFamily: T.font
    }}>
      <div style={{ padding: '24px 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Project Overview */}
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Project Overview
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: C.surface, padding: '12px', borderRadius: T.radius.md, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec }}>Requirements</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.textPri, marginTop: 4 }}>{projectStats.reqs}</div>
            </div>
            <div style={{ background: C.surface, padding: '12px', borderRadius: T.radius.md, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.danger }}>High Risk</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.danger, marginTop: 4 }}>{projectStats.highRisk}</div>
            </div>
            <div style={{ background: C.surface, padding: '12px', borderRadius: T.radius.md, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec }}>Coverage</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginTop: 4 }}>{projectStats.cov}%</div>
            </div>
            <div style={{ background: C.surface, padding: '12px', borderRadius: T.radius.md, border: `1px solid ${C.border}`, boxShadow: T.shadow.sm }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.success }}>Pass Rate</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.success, marginTop: 4 }}>{projectStats.pass}%</div>
            </div>
          </div>
        </div>

        {/* Requirements Explorer */}
        <div>
          <h2 style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Requirements Explorer
          </h2>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 16, color: C.textMuted, pointerEvents: 'none',
            }}>search</span>
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: T.radius.md, fontSize: 13, color: C.textPri, outline: 'none',
                fontFamily: T.font, transition: T.transition.default,
                boxShadow: T.shadow.sm
              }}
              onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 2px ${C.primaryLt}` }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = T.shadow.sm }}
            />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          /* Loading Skeleton */
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ padding: '16px', borderRadius: T.radius.md, background: C.surface, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 14, width: '70%', background: C.borderLt, borderRadius: 4, animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              <div style={{ height: 12, width: '90%', background: C.borderLt, borderRadius: 4, animation: 'pulse 1.5s infinite ease-in-out' }}></div>
              <div style={{ height: 12, width: '40%', background: C.borderLt, borderRadius: 4, animation: 'pulse 1.5s infinite ease-in-out' }}></div>
            </div>
          ))
        ) : (
          filteredTree.map(req => {
            const isSelected = selectedRequirementId === req.id
            const risk = getRiskColor(req.riskLevel)
            
            return (
              <div 
                key={req.id} 
                onClick={() => selectRequirement(req.id)}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = T.shadow.md
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = T.shadow.sm
                  }
                }}
                style={{
                  padding: '16px', borderRadius: T.radius.md, cursor: 'pointer',
                  background: isSelected ? C.primaryLt : C.surface,
                  border: `1px solid ${isSelected ? C.primary : C.border}`,
                  boxShadow: isSelected ? T.shadow.md : T.shadow.sm,
                  display: 'flex', flexDirection: 'column', gap: 10,
                  transition: T.transition.default, transform: 'translateY(0)'
                }}
              >
                {/* Line 1 - Title */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0, flex: 1 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: risk.color, flexShrink: 0, marginTop: 4 }}></div>
                    <div style={{ 
                      fontSize: 13, fontWeight: 700, 
                      color: isSelected ? C.primaryDark : C.textPri,
                      lineHeight: 1.3
                    }}>
                      {req.reqCode || `REQ-${req.id}`} {req.title}
                    </div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: isSelected ? C.primary : C.textMuted }}>chevron_right</span>
                </div>

                {/* Line 2 - Stats */}
                <div style={{ fontSize: 11, color: C.textSec, fontWeight: 500, paddingLeft: 16 }}>
                  {req.testCaseCount} Test Cases · {Math.round((req.acTotal * req.coveragePercent)/100) || 0}/{req.acTotal} AC Covered
                </div>

                {/* Line 3 - Progress Bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 16, marginTop: 4 }}>
                  {/* Coverage */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, width: 50 }}>Coverage</span>
                    <div style={{ flex: 1, height: 6, background: C.borderLt, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${req.coveragePercent}%`, height: '100%', background: C.primary, borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.textPri, width: 28, textAlign: 'right' }}>{req.coveragePercent}%</span>
                  </div>
                  {/* Pass Rate */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, width: 50 }}>Pass Rate</span>
                    <div style={{ flex: 1, height: 6, background: C.borderLt, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${req.passRate}%`, height: '100%', background: C.success, borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.textPri, width: 28, textAlign: 'right' }}>{req.passRate}%</span>
                  </div>
                </div>

                {/* Line 4 - Risk Badge */}
                <div style={{ paddingLeft: 16, marginTop: 4 }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 4, 
                    padding: '2px 8px', borderRadius: 4, background: risk.bg, 
                    color: risk.color, fontSize: 10, fontWeight: 700, border: `1px solid ${risk.color}40`, letterSpacing: '0.05em' 
                  }}>
                    {req.riskLevel === 'HIGH' || req.riskLevel === 'CRITICAL' ? <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span> : null}
                    {req.riskLevel} RISK
                  </span>
                </div>
              </div>
            )
          })
        )}
        {!isLoading && filteredTree.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
            No requirements found
          </div>
        )}
        <style>{`
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}
