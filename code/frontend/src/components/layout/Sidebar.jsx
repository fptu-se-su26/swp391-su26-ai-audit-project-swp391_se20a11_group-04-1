import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '@store/useAuthStore'
import useProjectStore from '@store/useProjectStore'
import toast from 'react-hot-toast'
import { getInitials } from '@utils/avatarHelper'
import { recoveryPlanService } from '@features/sla/services/recoveryPlanService'

const W_FULL = 272
const W_RAIL = 68
const EASE   = [0.4, 0, 0.2, 1]
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const EASE_S = 'cubic-bezier(0.4, 0, 0.2, 1)'

/* ─── iOS sliding pill NavGroup ─────────────────────────────── */
function NavGroup({ items, activeKey, collapsed }) {
  const groupRef   = useRef(null)
  const itemRefs   = useRef({})
  const pillRef    = useRef(null)
  const prevKey    = useRef(null)
  const mounted    = useRef(false)
  const prevItems  = useRef('')
  const itemsKey   = items.map(i => i.key).join('|')

  if (prevItems.current !== itemsKey) {
    prevItems.current = itemsKey
    mounted.current   = false
  }

  const movePill = () => {
    const pill    = pillRef.current
    const activeEl = itemRefs.current[activeKey]
    if (!pill) return
    if (!activeKey || !activeEl) { pill.style.opacity = '0'; mounted.current = false; return }

    const top = activeEl.offsetTop
    const h   = activeEl.offsetHeight

    if (!mounted.current) {
      pill.style.transition = 'none'
      pill.style.transform  = `translateY(${top}px)`
      pill.style.height     = `${h}px`
      pill.style.opacity    = '1'
      void pill.offsetHeight   // flush
      mounted.current = true
      prevKey.current = activeKey
      return
    }
    if (prevKey.current === activeKey) return
    pill.style.transition = `transform 400ms ${SPRING}, height 260ms ${EASE_S}, opacity 150ms ${EASE_S}`
    pill.style.transform  = `translateY(${top}px)`
    pill.style.height     = `${h}px`
    pill.style.opacity    = '1'
    prevKey.current = activeKey
  }

  useEffect(() => { movePill() }, [activeKey])
  // Re-position after collapse/expand (layout changes)
  useEffect(() => { mounted.current = false; requestAnimationFrame(movePill) }, [collapsed])

  return (
    <div ref={groupRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Sliding pill */}
      <div ref={pillRef} aria-hidden style={{
        position:      'absolute', left: 0, right: 0, top: 0, height: 40,
        borderRadius:  12,
        background:    'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
        boxShadow:     '0 6px 20px rgba(30,112,125,0.28), 0 0 0 1px rgba(78,198,216,0.20)',
        opacity:       0, pointerEvents: 'none', zIndex: 0, willChange: 'transform, height',
      }} />

      {items.map(({ key, icon, label, onClick, badge }) => (
        <NavRow key={key} navKey={key} icon={icon} label={label}
          isActive={key === activeKey} onClick={onClick}
          itemRefs={itemRefs} collapsed={collapsed} badge={badge} />
      ))}
    </div>
  )
}

/* ─── Single nav row ────────────────────────────────────────── */
function NavRow({ navKey, icon, label, isActive, onClick, itemRefs, collapsed, badge }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      ref={el => { itemRefs.current[navKey] = el }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{
        position:       'relative', zIndex: 1,
        display:        'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap:            collapsed ? 0 : 10,
        height:         40, borderRadius: 12,
        padding:        collapsed ? '0' : '0 12px',
        cursor:         'pointer', userSelect: 'none',
        color:          isActive ? '#fff' : (hov ? '#1E707D' : '#374151'),
        transform:      !isActive && hov && !collapsed ? 'translateX(3px)' : 'none',
        transition:     `transform 180ms ${EASE_S}, color 180ms ${EASE_S}`,
      }}
    >
      {/* Icon */}
      <span className="material-symbols-outlined" style={{
        fontSize:              18, flexShrink: 0,
        color:                 isActive ? '#fff' : (hov ? '#1E707D' : '#6B7280'),
        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
        transition:            `color 180ms ${EASE_S}`,
      }}>{icon}</span>

      {/* Label — fade+slide when collapsing */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span key="lbl"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.14, ease: EASE }}
            style={{
              fontSize: 13, fontWeight: isActive ? 700 : (hov ? 600 : 500),
              letterSpacing: '-0.01em', flex: 1, whiteSpace: 'nowrap',
              overflow: 'hidden', pointerEvents: 'none',
              fontFamily: 'Inter,-apple-system,sans-serif',
            }}
          >{label}</motion.span>
        )}
      </AnimatePresence>

      {/* Glow dot OR Badge */}
      {!collapsed && badge > 0 && (
          <div style={{
            background: '#EF4444', color: '#FFF', fontSize: 10, fontWeight: 700,
            padding: '2px 6px', borderRadius: 10, flexShrink: 0,
            boxShadow: '0 0 6px rgba(239, 68, 68, 0.4)'
          }}>
            {badge > 99 ? '99+' : badge}
          </div>
      )}
      {isActive && !collapsed && !(badge > 0) && (
        <div style={{
          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
          background: '#4EC6D8',
          boxShadow: '0 0 6px #4EC6D8, 0 0 14px rgba(78,198,216,0.40)',
        }} />
      )}
    </div>
  )
}

/* ─── Section label ─────────────────────────────────────────── */
function SectionLabel({ children, collapsed }) {
  return (
    <div style={{ padding: collapsed ? '10px 0 4px' : '12px 12px 4px', overflow: 'hidden' }}>
      <div style={{ height: 1, background: '#EBF5F7', marginBottom: collapsed ? 0 : 6 }} />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span key="sl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
              textTransform: 'uppercase', color: '#9CA3AF',
              fontFamily: 'Inter,-apple-system,sans-serif',
            }}
          >{children}</motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
export default function Sidebar() {
  const navigate           = useNavigate()
  const location           = useLocation()
  const userRole           = useAuthStore(s => s.userRole)
  const activeProject      = useProjectStore(s => s.activeProject)
  const clearActiveProject = useProjectStore(s => s.clearActiveProject)

  const [collapsed, setCollapsed] = useState(false)
  const [pendingRecoveryCount, setPendingRecoveryCount] = useState(0)

  useEffect(() => {
    if (activeProject?.id && (activeProject?.role === 'LEADER' || activeProject?.role === 'PROJECT_LEADER' || userRole === 'MENTOR')) {
      recoveryPlanService.getProjectRecoveryPlans(activeProject.id, { status: 'PENDING_APPROVAL' })
        .then(plans => {
          if (Array.isArray(plans)) {
            setPendingRecoveryCount(plans.length)
          }
        })
        .catch(() => setPendingRecoveryCount(0))
    } else {
      setPendingRecoveryCount(0)
    }
  }, [activeProject?.id, userRole])

  // Keep main content in sync via CSS custom property (single source of truth)
  useEffect(() => {
    // Sidebar: position fixed, left:12. Gap between sidebar right edge and content: 12px.
    // offset = left(12) + sidebarWidth + gap(12)
    const offset = 12 + (collapsed ? W_RAIL : W_FULL) + 12
    document.documentElement.style.setProperty('--sidebar-offset', `${offset}px`)
  }, [collapsed])

  // Set initial value on mount
  useEffect(() => {
    const offset = 12 + W_FULL + 12   // 296px — matches CSS default
    document.documentElement.style.setProperty('--sidebar-offset', `${offset}px`)
  }, [])

  /* ── Item builders ── */
  const buildProjectItems = pid => [
    { key: 'dashboard',           icon: 'dashboard',          label: 'Dashboard',           path: `/projects/${pid}/dashboard` },
    { key: 'requirements',        icon: 'description',        label: 'Requirements',        path: `/projects/${pid}/requirements` },
    { key: 'use-cases',           icon: 'account_tree',       label: 'Use Cases',           path: `/projects/${pid}/use-cases` },
    { key: 'task-board',          icon: 'assignment',         label: 'Task Board',          path: `/projects/${pid}/task-board` },
    { key: 'my-tasks',            icon: 'assignment_ind',     label: 'My Tasks',            path: `/projects/${pid}/my-tasks` },
    { key: 'sprints',             icon: 'history_toggle_off', label: 'Sprints',             path: `/projects/${pid}/sprints` },
    { key: 'test-cases',          icon: 'checklist_rtl',      label: 'Test Cases',          path: `/projects/${pid}/test-cases` },
    { key: 'issues',              icon: 'crisis_alert',       label: 'Issues',              path: `/projects/${pid}/issues` },
    { key: 'bugs',                icon: 'bug_report',         label: 'Bugs',                path: `/projects/${pid}/bugs` },
    { key: 'evidence',            icon: 'inventory_2',        label: 'Evidence Vault',      path: `/projects/${pid}/evidence` },
    { key: 'traceability-matrix', icon: 'reorder',            label: 'Traceability Matrix', path: `/projects/${pid}/traceability-matrix` },
  ]
  const buildIntelItems = pid => [
    { key: 'ai-assistant',  icon: 'smart_toy',  label: 'AI Assistant',  path: `/projects/${pid}/ai-assistant` },
    { key: 'github-config', icon: 'hub',        label: 'GitHub Config', path: `/projects/${pid}/github-config` },
    { key: 'task-reviews',  icon: 'fact_check', label: 'Task Review',   path: `/projects/${pid}/task-reviews` },
    { key: 'recovery-plans',icon: 'shield',     label: 'Recovery Plans',path: `/projects/${pid}/recovery-plans`, badge: pendingRecoveryCount },
    { key: 'architecture',  icon: 'schema',     label: 'Kiến trúc hệ thống', path: `/projects/${pid}/architecture` },
  ]
  const buildTeamItems = (pid, role) => {
    const base = [
      { key: 'contribution',     icon: 'groups',     label: 'Contribution',     path: `/projects/${pid}/contribution` },
      { key: 'mentor-view',      icon: 'visibility', label: 'Mentor View',      path: `/projects/${pid}/mentor-view` },
    ]
    if (role === 'MENTOR') base.push({ key: 'mentor', icon: 'supervisor_account', label: 'Mentor Dashboard', path: `/projects/${pid}/mentor` })
    base.push({ key: 'project-settings', icon: 'settings', label: 'Project Settings', path: `/projects/${pid}/project-settings` })
    return base
  }

  const getActiveKey = items => {
    let best = null, bestLen = -1
    for (const item of items) {
      const t = item.path.replace(/\/$/, '')
      const p = location.pathname
      if ((p === t || p.startsWith(t + '/')) && t.length > bestLen) { best = item.key; bestLen = t.length }
    }
    return best
  }

  const enrich = items => items.map(i => ({ ...i, onClick: () => navigate(i.path) }))

  const portfolioRaw = [
    { key: 'projects',   icon: 'grid_view',    label: 'My Projects',     path: '/dashboard' },
    { key: 'classrooms', icon: 'school',       label: 'Classrooms',      path: '/classrooms' },
    { key: 'archived',   icon: 'inbox',        label: 'Archived',        path: '#' },
    { key: 'settings',   icon: 'settings',     label: 'Global Settings', path: '#' },
  ]
  if (userRole !== 'ADMIN') portfolioRaw.push({ key: 'verify', icon: 'verified_user', label: 'Verify Account', path: '/verify' })

  const portfolioItems = portfolioRaw.map(item => ({
    ...item,
    onClick: () => {
      if (item.path === '#') { toast.success(`"${item.label}" đang được phát triển!`); return }
      clearActiveProject(); navigate(item.path)
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
    <motion.aside
      animate={{ width: collapsed ? W_RAIL : W_FULL }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{
        position: 'fixed', top: 12, left: 12, bottom: 12, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        background: '#FFFFFF', border: '1px solid #E5EEEC',
        borderRadius: 20,
        boxShadow: '0 4px 20px rgba(30,112,125,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        padding: `14px ${collapsed ? 10 : 12}px 14px`,
      }}
    >
      {/* ── HEADER ROW: logo + collapse toggle ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        marginBottom: 12, flexShrink: 0,
      }}>
        {/* Logo / project badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, overflow: 'hidden' }}>
          {!activeProject ? (
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14,
              boxShadow: '0 3px 10px rgba(30,112,125,0.25)',
            }}>D</div>
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #278A99, #1E707D)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14,
              boxShadow: '0 3px 10px rgba(30,112,125,0.22)',
            }}>{activeProject.title.charAt(0).toUpperCase()}</div>
          )}

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div key="hdr-text"
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.14, ease: EASE }}
                style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}
              >
                {!activeProject ? (
                  <>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', lineHeight: 1.2, letterSpacing: '-0.02em' }}>DevTrack</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1, fontWeight: 500 }}>Portfolio</p>
                  </>
                ) : (
                  <>
                    <p style={{
                      fontSize: 12, fontWeight: 700, color: '#1F2937', lineHeight: 1.2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }} title={activeProject.title}>
                      {activeProject.title.length > 18 ? activeProject.title.slice(0, 16) + '…' : activeProject.title}
                    </p>
                    <span style={{
                      fontSize: 9, fontWeight: 700, color: '#1E707D',
                      background: 'rgba(30,112,125,0.10)', padding: '1px 5px',
                      borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{activeProject.role}</span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle button — always visible */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            background: '#F4F7F6', border: '1px solid #E5EEEC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', outline: 'none', padding: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            transition: `transform 180ms ${EASE_S}, box-shadow 180ms ${EASE_S}`,
            marginLeft: collapsed ? 0 : 4,
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.12)'; e.currentTarget.style.boxShadow = '0 3px 10px rgba(30,112,125,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.07)' }}
        >
          <motion.span
            className="material-symbols-outlined"
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.26, ease: EASE }}
            style={{ fontSize: 14, color: '#1E707D', display: 'block', lineHeight: 1 }}
          >
            chevron_right
          </motion.span>
        </button>
      </div>

      {/* ── Back to Portfolio ── */}
      <AnimatePresence initial={false}>
        {activeProject && !collapsed && (
          <motion.button key="back"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 30, marginBottom: 8 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.16, ease: EASE }}
            onClick={() => { clearActiveProject(); navigate('/dashboard') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              padding: '0 10px', borderRadius: 8,
              background: '#D7EEF1', border: '1px solid rgba(30,112,125,0.18)',
              color: '#1E707D', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              alignSelf: 'flex-start', whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_back</span>
            Back to Portfolio
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── NAV ── */}
      <nav style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 1,
        scrollbarWidth: 'none',
      }}>
        {!activeProject ? (
          <NavGroup items={portfolioItems} activeKey={portfolioActiveKey} collapsed={collapsed} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <NavGroup
              items={enrich(buildProjectItems(activeProject.id))}
              activeKey={getActiveKey(buildProjectItems(activeProject.id))}
              collapsed={collapsed}
            />
            <SectionLabel collapsed={collapsed}>Intelligence</SectionLabel>
            <NavGroup
              items={enrich(buildIntelItems(activeProject.id))}
              activeKey={getActiveKey(buildIntelItems(activeProject.id))}
              collapsed={collapsed}
            />
            <SectionLabel collapsed={collapsed}>Team</SectionLabel>
            <NavGroup
              items={enrich(buildTeamItems(activeProject.id, userRole))}
              activeKey={getActiveKey(buildTeamItems(activeProject.id, userRole))}
              collapsed={collapsed}
            />
          </div>
        )}
      </nav>
    </motion.aside>
  )
}
