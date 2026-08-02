import { useState, useMemo, useEffect, useRef } from 'react'
import useTestCaseStore from '../stores/useTestCaseStore'
import { C, T } from '../utils/theme'

const riskColors = {
  LOW:      { color: C.success,  bg: C.successBg  },
  MEDIUM:   { color: C.warning,  bg: C.warningBg  },
  HIGH:     { color: '#EA580C',  bg: '#FFF7ED'    },
  CRITICAL: { color: C.danger,   bg: C.dangerBg   },
}

const EXECUTION_STATE = {
  all_run: { label: 'Executed', color: C.success   },
  partial: { label: 'Partial',  color: C.warning   },
  not_run: { label: 'Not Run',  color: C.textMuted },
}

function getExecState(req) {
  const total = req.testCaseCount || 0
  if (total === 0) return EXECUTION_STATE.not_run
  const notRun = req.notRunCount || 0
  if (notRun === 0) return EXECUTION_STATE.all_run
  if (notRun < total) return EXECUTION_STATE.partial
  return EXECUTION_STATE.not_run
}

const RISK_OPTIONS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
const COV_OPTIONS  = [
  { value: 'all',    label: 'All'    },
  { value: 'high',   label: '≥ 70%' },
  { value: 'medium', label: '30–69%'},
  { value: 'low',    label: '< 30%' },
]

export default function RequirementExplorer() {
  const { requirementsTree, selectedRequirementId, selectRequirement } = useTestCaseStore()

  // Use a local loading flag tied specifically to the requirements tree.
  // The store's `isLoading` reflects test-case fetching and would incorrectly
  // show skeleton on every row-click; we track first-load ourselves.
  const [reqsLoading, setReqsLoading] = useState(true)
  const prevTreeLenRef = useRef(-1)

  useEffect(() => {
    if (requirementsTree.length !== prevTreeLenRef.current) {
      prevTreeLenRef.current = requirementsTree.length
      setReqsLoading(false)
    }
  }, [requirementsTree])

  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [covFilter,  setCovFilter]  = useState('all')

  const filteredTree = useMemo(() => {
    return requirementsTree.filter(req => {
      const matchSearch =
        !searchTerm ||
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.reqCode && req.reqCode.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchRisk = riskFilter === 'ALL' || req.riskLevel === riskFilter

      const cov = req.coveragePercent || 0
      const matchCov =
        covFilter === 'all'    ? true :
        covFilter === 'high'   ? cov >= 70 :
        covFilter === 'medium' ? (cov >= 30 && cov < 70) :
        covFilter === 'low'    ? cov < 30 : true

      return matchSearch && matchRisk && matchCov
    })
  }, [requirementsTree, searchTerm, riskFilter, covFilter])

  return (
    /*
     * FLEX CONTAINMENT
     * The root must have minHeight:0 so it can shrink inside the bounded parent
     * flex container.  overflow:hidden clips any overflow from children.
     */
    <div style={{
      width: '100%',
      height: '100%',
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: C.surface,
      borderRight: `1px solid ${C.border}`,
      fontFamily: T.font,
    }}>
      {/* ── Header — flexShrink:0 keeps it visible while list scrolls ── */}
      <div style={{
        flexShrink: 0,
        padding: '18px 14px 10px',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: C.textPri, margin: 0 }}>Requirements</h2>
          <span style={{
            fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 12,
            background: C.primaryLt, color: C.primary,
          }}>
            {filteredTree.length}
          </span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
            fontSize: 15, color: C.textMuted, pointerEvents: 'none',
          }}>search</span>
          <input
            type="text"
            placeholder="Search requirements..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px 7px 30px',
              background: C.bg, border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 12, color: C.textPri, outline: 'none',
              fontFamily: T.font, transition: T.transition.default,
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 2px ${C.primaryLt}` }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              style={{
                width: '100%', appearance: 'none', WebkitAppearance: 'none',
                padding: '5px 24px 5px 8px', fontSize: 11, fontWeight: 500,
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 6, color: C.textSec, cursor: 'pointer',
                outline: 'none', fontFamily: T.font,
              }}
            >
              {RISK_OPTIONS.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Risk' : r}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: C.textMuted, pointerEvents: 'none',
            }}>expand_more</span>
          </div>

          <div style={{ position: 'relative', flex: 1 }}>
            <select
              value={covFilter}
              onChange={e => setCovFilter(e.target.value)}
              style={{
                width: '100%', appearance: 'none', WebkitAppearance: 'none',
                padding: '5px 24px 5px 8px', fontSize: 11, fontWeight: 500,
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 6, color: C.textSec, cursor: 'pointer',
                outline: 'none', fontFamily: T.font,
              }}
            >
              {COV_OPTIONS.map(o => <option key={o.value} value={o.value}>Cov: {o.label}</option>)}
            </select>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
              fontSize: 13, color: C.textMuted, pointerEvents: 'none',
            }}>expand_more</span>
          </div>
        </div>
      </div>

      {/* ── List — sole scrollable region ── */}
      {/*
       * flex:'1 1 0%' + minHeight:0 gives this div a definite height equal to the
       * remaining space inside the parent, enabling overflowY:auto to actually scroll
       * instead of just growing to fit content.
       * overscrollBehavior:contain stops scroll from propagating to the page.
       * scrollbarGutter:stable prevents layout shift when scrollbar appears/disappears.
       */}
      <div style={{
        flex: '1 1 0%',
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        scrollbarGutter: 'stable',
        padding: '8px 10px 16px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {reqsLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                padding: '12px', borderRadius: 8,
                background: C.bg, border: `1px solid ${C.border}`,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ height: 12, width: '70%', background: C.borderLt, borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: 10, width: '90%', background: C.borderLt, borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
              </div>
            ))
          : filteredTree.map(req => {
              const isSelected = selectedRequirementId === req.id
              const risk    = riskColors[req.riskLevel] || { color: C.textSec, bg: C.borderLt }
              const exec    = getExecState(req)
              const acTotal   = req.acTotal || 0
              const acCovered = acTotal > 0 ? Math.round((acTotal * (req.coveragePercent || 0)) / 100) : 0
              const cov       = req.coveragePercent || 0

              return (
                <div
                  key={req.id}
                  onClick={() => selectRequirement(isSelected ? null : req.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: isSelected ? C.primaryLt : C.surface,
                    border: `1px solid ${isSelected ? C.primary : C.border}`,
                    borderLeft: `3px solid ${isSelected ? C.primary : 'transparent'}`,
                    transition: T.transition.default,
                    display: 'flex', flexDirection: 'column', gap: 7,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.bg }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = C.surface }}
                >
                  {/* Row 1: code + title + risk badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? C.primaryDark : C.primary }}>
                        {req.reqCode || `REQ-${req.id}`}
                      </span>
                      <div style={{
                        fontSize: 12, fontWeight: 600,
                        color: isSelected ? C.primaryDark : C.textPri,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginTop: 1,
                      }}>
                        {req.title}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, flexShrink: 0,
                      padding: '2px 6px', borderRadius: 4,
                      background: risk.bg, color: risk.color,
                      border: `1px solid ${risk.color}40`,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>
                      {req.riskLevel}
                    </span>
                  </div>

                  {/* Row 2: stats */}
                  <div style={{ fontSize: 11, color: C.textSec, fontWeight: 500, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span>{req.testCaseCount} test{req.testCaseCount !== 1 ? 's' : ''}</span>
                    <span style={{ color: C.border }}>·</span>
                    <span>{acCovered}/{acTotal} AC</span>
                    <span style={{ color: C.border }}>·</span>
                    <span style={{ color: exec.color, fontWeight: 600 }}>{exec.label}</span>
                  </div>

                  {/* Row 3: coverage bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: C.borderLt, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        width: `${cov}%`, height: '100%',
                        background: cov >= 70 ? C.success : cov >= 30 ? C.warning : C.danger,
                        borderRadius: 2,
                        transition: T.transition.slow,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.textSec, width: 28, textAlign: 'right' }}>
                      {cov}%
                    </span>
                  </div>
                </div>
              )
            })
        }

        {!reqsLoading && filteredTree.length === 0 && (
          <div style={{ padding: 20, textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
            No requirements match your filters.
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}
