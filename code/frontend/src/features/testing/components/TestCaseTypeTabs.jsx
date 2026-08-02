import { useMemo } from 'react'
import { C, T } from '../utils/theme'

const TABS = [
  { key: 'ALL',    label: 'All'    },
  { key: 'UI',     label: 'UI'     },
  { key: 'API',    label: 'API'    },
  { key: 'UNIT',   label: 'Unit'   },
  { key: 'MANUAL', label: 'Manual' },
]

const typeColors = {
  UI:     { color: C.typeUI,     bg: C.typeUIBg    },
  API:    { color: C.typeAPI,    bg: C.typeAPIBg   },
  UNIT:   { color: C.typeUNIT,   bg: C.typeUNITBg  },
  MANUAL: { color: C.typeMANUAL, bg: C.typeMANUALBg},
}

/**
 * Horizontal test-type tab bar.
 * Tab state is controlled from the parent (activeTab / onTabChange).
 * Filters `testCases` client-side — no extra API calls.
 * renderTable(filteredCases, tabKey) — tabKey lets the parent know which tab
 * is active so it can adjust pagination accordingly.
 */
export default function TestCaseTypeTabs({ testCases, activeTab, onTabChange, renderTable, renderEmpty }) {
  // Count per type
  const counts = useMemo(() => {
    const c = { ALL: testCases.length, UI: 0, API: 0, UNIT: 0, MANUAL: 0 }
    testCases.forEach(tc => { if (c[tc.type] !== undefined) c[tc.type]++ })
    return c
  }, [testCases])

  const filteredCases = useMemo(() => {
    if (activeTab === 'ALL') return testCases
    return testCases.filter(tc => tc.type === activeTab)
  }, [testCases, activeTab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: `1px solid ${C.border}`,
        background: C.surface,
        borderRadius: '12px 12px 0 0',
        padding: '0 16px',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          const tc = typeColors[tab.key]
          const count = counts[tab.key] || 0
          const activeColor = tc ? tc.color : C.primary
          const activeBg    = tc ? tc.bg    : C.primaryLt
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '11px 14px',
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? activeColor : C.textSec,
                borderBottom: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
                marginBottom: -1,
                transition: T.transition.default,
                whiteSpace: 'nowrap',
                outline: 'none',
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '1px 6px', borderRadius: 12,
                background: isActive ? activeBg : C.borderLt,
                color: isActive ? activeColor : C.textMuted,
                minWidth: 20, textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden',
      }}>
        {filteredCases.length === 0
          ? renderEmpty(activeTab)
          : renderTable(filteredCases, activeTab)}
      </div>
    </div>
  )
}
