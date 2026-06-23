import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import useProjectStore from '@store/useProjectStore'
import toast from 'react-hot-toast'

/* ─── Design tokens ─────────────────────────────────────────── */
const S = {
  activeBg:     'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
  activeShadow: '0 8px 24px rgba(30,112,125,0.25), 0 0 20px rgba(78,198,216,0.25)',
  activeBorder: 'rgba(78,198,216,0.20)',
  hoverColor:   '#1E707D',
  hoverBg:      '#D7EEF1',
  textHi:       '#1F2937',
  textMid:      '#374151',
  textLo:       '#6B7280',
  textMuted:    '#9CA3AF',
  accent:       '#1E707D',
  accentMuted:  '#D7EEF1',
  glow:         '#4EC6D8',
  surface:      '#FFFFFF',
  bg:           '#F8FAFC',
  border:       '#D9E7E4',
  borderLight:  '#EBF5F7',
}

const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const EASE   = 'cubic-bezier(0.4, 0, 0.2, 1)'

/* ══════════════════════════════════════════════════════════════
   NavGroup — ONE sliding pill, items stacked on top
══════════════════════════════════════════════════════════════ */
function NavGroup({ items, activeKey }) {
  const containerRef = useRef(null)
  const itemRefs     = useRef({})
  const pillRef      = useRef(null)
  const prevKeyRef   = useRef(null)
  const mountedRef   = useRef(false)

  useEffect(() => {
    const pill      = pillRef.current
    const container = containerRef.current
    const activeEl  = itemRefs.current[activeKey]

    if (!pill) return

    if (!activeKey || !activeEl) {
      pill.style.opacity    = '0'
      mountedRef.current    = false
      return
    }

    // Use offsetTop — reliable inside any overflow/scroll container
    const top    = activeEl.offsetTop
    const height = activeEl.offsetHeight

    if (!mountedRef.current) {
      // First appearance: jump instantly, no spring
      pill.style.transition = 'none'
      pill.style.transform  = `translateY(${top}px)`
      pill.style.height     = `${height}px`
      pill.style.opacity    = '1'
      // Flush so next update can animate
      void pill.offsetHeight
      mountedRef.current = true
      prevKeyRef.current = activeKey
      return
    }

    if (prevKeyRef.current === activeKey) return

    pill.style.transition = [
      `transform 420ms ${SPRING}`,
      `height 280ms ${EASE}`,
      `opacity 150ms ${EASE}`,
    ].join(', ')
    pill.style.transform  = `translateY(${top}px)`
    pill.style.height     = `${height}px`
    pill.style.opacity    = '1'
    prevKeyRef.current    = activeKey
  }, [activeKey])

  // Reset mount state when item list changes (portfolio ↔ project switch)
  const itemsKey = items.map(i => i.key).join('|')
  const prevItemsKey = useRef(null)
  if (prevItemsKey.current !== itemsKey) {
    prevItemsKey.current = itemsKey
    mountedRef.current   = false
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* The one floating pill */}
      <div
        ref={pillRef}
        aria-hidden="true"
        style={{
          position:      'absolute',
          left:          0,
          right:         0,
          top:           0,
          height:        40,
          borderRadius:  14,
          background:    S.activeBg,
          boxShadow:     S.activeShadow,
          border:        `1px solid ${S.activeBorder}`,
          opacity:       0,
          pointerEvents: 'none',
          zIndex:        0,
          willChange:    'transform, height',
        }}
      />
      {items.map(({ key, icon, label, onClick }) => (
        <NavRowItem
          key={key}
          navKey={key}
          icon={icon}
          label={label}
          isActive={key === activeKey}
          onClick={onClick}
          itemRefs={itemRefs}
        />
      ))}
    </div>
  )
}

/* ─── Single nav row ─────────────────────────────────────────── */
function NavRowItem({ navKey, icon, label, isActive, onClick, itemRefs }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      ref={el => { itemRefs.current[navKey] = el }}
      onClick={onClick}
      style={{
        position:    'relative',
        zIndex:      1,
        display:     'flex',
        alignItems:  'center',
        gap:         10,
        padding:     '9px 14px',
        borderRadius: 14,
        cursor:      'pointer',
        color:       isActive ? '#ffffff' : (hovered ? S.hoverColor : S.textMid),
        transform:   hovered && !isActive ? 'translateX(4px)' : 'translateX(0)',
        transition:  `color 250ms ${EASE}, transform 200ms ${EASE}`,
        userSelect:  'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon */}
      <div style={{
        width:          30,
        height:         30,
        borderRadius:   10,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        background:     isActive ? 'rgba(255,255,255,0.18)' : (hovered ? 'rgba(30,112,125,0.10)' : S.bg),
        transition:     `background 250ms ${EASE}, transform 250ms ${SPRING}`,
        transform:      isActive ? 'scale(1.05)' : 'scale(1)',
      }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize:              17,
            color:                 isActive ? '#ffffff' : (hovered ? S.hoverColor : S.textLo),
            fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
            transition:            `color 250ms ${EASE}, font-variation-settings 250ms ${EASE}`,
          }}
        >
          {icon}
        </span>
      </div>

      {/* Label */}
      <span style={{
        fontSize:      13,
        fontWeight:    isActive ? 700 : (hovered ? 600 : 500),
        letterSpacing: '-0.01em',
        fontFamily:    'Inter,-apple-system,BlinkMacSystemFont,sans-serif',
        transition:    `font-weight 150ms ${EASE}`,
        flex:          1,
      }}>
        {label}
      </span>

      {/* Glow dot */}
      <div style={{
        width:        6,
        height:       6,
        borderRadius: '50%',
        flexShrink:   0,
        background:   isActive ? S.glow : 'transparent',
        boxShadow:    isActive ? `0 0 8px ${S.glow}, 0 0 16px rgba(78,198,216,0.40)` : 'none',
        transition:   `background 300ms ${EASE}, box-shadow 300ms ${EASE}`,
      }} />
    </div>
  )
}

/* ─── Section divider ────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{ padding: '16px 14px 6px' }}>
      <div style={{ height: 1, background: S.borderLight, marginBottom: 10 }} />
      <span style={{
        fontSize:      10,
        fontWeight:    700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color:         S.textMuted,
        fontFamily:    'Inter,-apple-system,BlinkMacSystemFont,sans-serif',
      }}>
        {children}
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════════════ */
const Sidebar = () => {
  const navigate           = useNavigate()
  const location           = useLocation()
  const userRole           = useAuthStore((s) => s.userRole)
  const activeProject      = useProjectStore((s) => s.activeProject)
  const clearActiveProject = useProjectStore((s) => s.clearActiveProject)

  /* ── Build item lists ── */
  const buildProjectItems = (pid) => [
    { key: 'dashboard',          icon: 'dashboard',          label: 'Dashboard',          path: `/projects/${pid}/dashboard` },
    { key: 'requirements',       icon: 'description',        label: 'Requirements',       path: `/projects/${pid}/requirements` },
    { key: 'use-cases',          icon: 'account_tree',       label: 'Use Cases',          path: `/projects/${pid}/use-cases` },
    { key: 'task-board',         icon: 'assignment',         label: 'Task Board',         path: `/projects/${pid}/task-board` },
    { key: 'my-tasks',           icon: 'assignment_ind',     label: 'My Tasks',           path: `/projects/${pid}/my-tasks` },
    { key: 'sprints',            icon: 'history_toggle_off', label: 'Sprints',            path: `/projects/${pid}/sprints` },
    { key: 'test-cases',         icon: 'checklist_rtl',      label: 'Test Cases',         path: `/projects/${pid}/test-cases` },
    { key: 'issues',             icon: 'crisis_alert',       label: 'Issues',             path: `/projects/${pid}/issues` },
    { key: 'bugs',               icon: 'bug_report',         label: 'Bugs',               path: `/projects/${pid}/bugs` },
    { key: 'evidence',           icon: 'inventory_2',        label: 'Evidence Vault',     path: `/projects/${pid}/evidence` },
    { key: 'traceability-matrix',icon: 'reorder',            label: 'Traceability Matrix',path: `/projects/${pid}/traceability-matrix` },
  ]

  const buildIntelItems = (pid) => [
    { key: 'ai-assistant',  icon: 'smart_toy',  label: 'AI Assistant',  path: `/projects/${pid}/ai-assistant` },
    { key: 'github-config', icon: 'hub',        label: 'GitHub Config', path: `/projects/${pid}/github-config` },
    { key: 'task-reviews',  icon: 'fact_check', label: 'Task Review',   path: `/projects/${pid}/task-reviews` },
  ]

  const buildTeamItems = (pid, role) => {
    const base = [
      { key: 'contribution',    icon: 'groups',      label: 'Contribution',     path: `/projects/${pid}/contribution` },
      { key: 'mentor-view',     icon: 'visibility',  label: 'Mentor View',      path: `/projects/${pid}/mentor-view` },
    ]
    if (role === 'MENTOR') base.push({ key: 'mentor', icon: 'supervisor_account', label: 'Mentor Dashboard', path: `/projects/${pid}/mentor` })
    base.push({ key: 'project-settings', icon: 'settings', label: 'Project Settings', path: `/projects/${pid}/project-settings` })
    return base
  }

  /* ── Determine active key from pathname ── */
  const getActiveKey = (items) => {
    // Find most-specific (longest path) match to avoid prefix collisions
    let best = null
    let bestLen = -1
    for (const item of items) {
      const p = location.pathname
      const t = item.path.replace(/\/$/, '')
      const isMatch = p === t || p.startsWith(t + '/')
      if (isMatch && t.length > bestLen) {
        best    = item.key
        bestLen = t.length
      }
    }
    return best
  }

  /* ── Enrich with onClick ── */
  const enrich = (items) => items.map(item => ({
    ...item,
    onClick: () => navigate(item.path),
  }))

  /* Portfolio items */
  const portfolioRaw = [
    { key: 'projects',   icon: 'grid_view',    label: 'My Projects',    path: '/dashboard' },
    { key: 'classrooms', icon: 'school',       label: 'Classrooms',     path: '/classrooms' },
    { key: 'archived',   icon: 'inbox',        label: 'Archived',       path: '#' },
    { key: 'settings',   icon: 'settings',     label: 'Global Settings',path: '#' },
  ]
  if (userRole !== 'ADMIN') {
    portfolioRaw.push({ key: 'verify', icon: 'verified_user', label: 'Verify Account', path: '/verify' })
  }

  const portfolioItems = portfolioRaw.map(item => ({
    ...item,
    onClick: () => {
      if (item.path === '#') { toast.success(`"${item.label}" đang được phát triển!`); return }
      clearActiveProject()
      navigate(item.path)
    },
  }))

  const portfolioActiveKey = (() => {
    const p = location.pathname
    if (p === '/dashboard') return 'projects'
    if (p.startsWith('/classrooms')) return 'classrooms'
    if (p.startsWith('/verify')) return 'verify'
    return null
  })()

  return (
    <aside style={{
      width:         280,
      flexShrink:    0,
      position:      'fixed',
      top:           16,
      left:          16,
      bottom:        16,
      zIndex:        40,
      display:       'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        background:    S.surface,
        border:        `1px solid ${S.border}`,
        borderRadius:  24,
        boxShadow:     '0 10px 40px rgba(30,112,125,0.10), 0 2px 8px rgba(0,0,0,0.04)',
        overflow:      'hidden',
        padding:       '20px 12px 16px',
      }}>

        {/* ── HEADER ── */}
        {!activeProject ? (
          <div style={{
            display:      'flex',
            alignItems:   'center',
            gap:          10,
            marginBottom: 20,
            padding:      '10px 12px',
            borderRadius: 18,
            background:   S.bg,
            border:       `1px solid ${S.border}`,
          }}>
            <div style={{
              width:         38,
              height:        38,
              borderRadius:  14,
              flexShrink:    0,
              background:    'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              boxShadow:     '0 6px 16px rgba(30,112,125,0.30)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff', fontVariationSettings: "'FILL' 1" }}>dataset</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: S.textHi, letterSpacing: '-0.02em', lineHeight: 1.2 }}>DevTrack Portfolio</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: S.textLo, marginTop: 1 }}>All Projects</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {/* Back button */}
            <button
              onClick={() => { clearActiveProject(); navigate('/dashboard') }}
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        6,
                padding:    '5px 10px',
                borderRadius: 10,
                background: S.accentMuted,
                border:     '1px solid rgba(30,112,125,0.20)',
                color:      S.accent,
                fontSize:   12,
                fontWeight: 600,
                cursor:     'pointer',
                alignSelf:  'flex-start',
                transition: `all 250ms ${EASE}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#BFDEEA'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = S.accentMuted; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_back</span>
              Back to Portfolio
            </button>

            {/* Project badge */}
            <div style={{
              display:    'flex',
              alignItems: 'center',
              gap:        10,
              padding:    '10px 12px',
              borderRadius: 18,
              background: S.bg,
              border:     `1px solid ${S.border}`,
            }}>
              <div style={{
                width:         34,
                height:        34,
                borderRadius:  11,
                flexShrink:    0,
                background:    'linear-gradient(135deg, #278A99, #1E707D)',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                boxShadow:     '0 4px 10px rgba(30,112,125,0.25)',
                fontSize:      14,
                fontWeight:    700,
                color:         '#fff',
              }}>
                {activeProject.title.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: S.textHi, letterSpacing: '-0.015em', lineHeight: 1.2 }} title={activeProject.title}>
                  {activeProject.title.length > 20 ? activeProject.title.slice(0, 18) + '…' : activeProject.title}
                </p>
                <span style={{
                  display:       'inline-block',
                  marginTop:     3,
                  fontSize:      10,
                  fontWeight:    600,
                  color:         S.accent,
                  background:    'rgba(30,112,125,0.10)',
                  border:        '1px solid rgba(30,112,125,0.20)',
                  padding:       '1px 6px',
                  borderRadius:  6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {activeProject.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── NAV ── */}
        <nav style={{
          flex:            1,
          overflowY:       'auto',
          overflowX:       'hidden',
          display:         'flex',
          flexDirection:   'column',
          gap:             2,
          paddingRight:    2,
          scrollbarWidth:  'none',
          msOverflowStyle: 'none',
        }}>
          {!activeProject ? (
            <NavGroup items={portfolioItems} activeKey={portfolioActiveKey} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <NavGroup
                items={enrich(buildProjectItems(activeProject.id))}
                activeKey={getActiveKey(buildProjectItems(activeProject.id))}
              />
              <SectionLabel>Intelligence</SectionLabel>
              <NavGroup
                items={enrich(buildIntelItems(activeProject.id))}
                activeKey={getActiveKey(buildIntelItems(activeProject.id))}
              />
              <SectionLabel>Team</SectionLabel>
              <NavGroup
                items={enrich(buildTeamItems(activeProject.id, userRole))}
                activeKey={getActiveKey(buildTeamItems(activeProject.id, userRole))}
              />
            </div>
          )}
        </nav>

        <div style={{ height: 8 }} />



      </div>
    </aside>
  )
}

export default Sidebar
