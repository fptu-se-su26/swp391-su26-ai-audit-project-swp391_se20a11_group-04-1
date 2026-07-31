import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '@store/useAuthStore'
import useProjectStore from '@store/useProjectStore'
import toast from 'react-hot-toast'
import { recoveryPlanService } from '@features/sla/services/recoveryPlanService'
import { TaskReviewService } from '@features/code-insight/services/taskReviewService'
import SyncStatusBadge from '../common/SyncStatusBadge'

const W_FULL = 272
const W_RAIL = 68
const EASE   = [0.4, 0, 0.2, 1]
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const EASE_S = 'cubic-bezier(0.4, 0, 0.2, 1)'

/* ─── Role normalization ─────────────────────────────────────── */
const normalizeRole = (role) =>
  String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_')

/* ─── Path active helpers ────────────────────────────────────── */
function isPathActive(item, pathname) {
  const base = item.path.replace(/\/$/, '')
  if (pathname === base || pathname.startsWith(base + '/')) return true
  for (const mp of (item.matchPaths || [])) {
    const mBase = mp.replace(/\/$/, '')
    if (pathname === mBase || pathname.startsWith(mBase + '/') || pathname.startsWith(mBase)) return true
  }
  return false
}

function getActiveKeyFromSections(sections, pathname) {
  let best = null, bestLen = -1
  for (const section of sections) {
    for (const item of section.items) {
      if (isPathActive(item, pathname)) {
        const len = item.path.length
        if (len > bestLen) { best = item.key; bestLen = len }
      }
    }
  }
  return best
}

/* ─── Section config builder ─────────────────────────────────── */
function buildProjectSections(projectId, pendingReviewCount, pendingRecoveryCount) {
  return [
    {
      key: 'overview', label: 'OVERVIEW', order: null, collapsible: false,
      items: [
        { key: 'dashboard', icon: 'dashboard', label: 'Dashboard', path: `/projects/${projectId}/dashboard`, matchPaths: [] },
      ],
    },
    {
      key: 'plan', label: 'PLAN', order: '01', collapsible: false,
      items: [
        { key: 'requirements', icon: 'description', label: 'Requirements', path: `/projects/${projectId}/requirements`, matchPaths: [`/projects/${projectId}/requirements/staging`, `/projects/${projectId}/requirements/`] },
        { key: 'use-cases', icon: 'account_tree', label: 'Use Cases', path: `/projects/${projectId}/use-cases`, matchPaths: [] },
        { key: 'sprints', icon: 'history_toggle_off', label: 'Sprints', path: `/projects/${projectId}/sprints`, matchPaths: [] },
      ],
    },
    {
      key: 'execute', label: 'EXECUTE', order: '02', collapsible: false,
      items: [
        { key: 'task-board', icon: 'assignment', label: 'Task Board', path: `/projects/${projectId}/task-board`, matchPaths: [`/projects/${projectId}/tasks/`] },
        { key: 'my-tasks', icon: 'assignment_ind', label: 'My Tasks', path: `/projects/${projectId}/my-tasks`, matchPaths: [] },
      ],
    },
    {
      key: 'verify', label: 'VERIFY', order: '03', collapsible: false,
      items: [
        { key: 'test-cases', icon: 'checklist_rtl', label: 'Test Cases', path: `/projects/${projectId}/test-cases`, matchPaths: [] },
        { key: 'bugs', icon: 'bug_report', label: 'Bugs', path: `/projects/${projectId}/bugs`, matchPaths: [] },
        { key: 'evidence', icon: 'inventory_2', label: 'Evidence Vault', path: `/projects/${projectId}/evidence`, matchPaths: [] },
        { key: 'task-reviews', icon: 'fact_check', label: 'Task Review', path: `/projects/${projectId}/task-reviews`, matchPaths: [], badge: pendingReviewCount, badgeTone: 'red' },
      ],
    },
    {
      key: 'report', label: 'REPORT', order: '04', collapsible: false,
      items: [
        { key: 'project-tracking', icon: 'monitoring', label: 'Project Tracking', path: `/projects/${projectId}/tracking`, matchPaths: [] },
        { key: 'contribution', icon: 'groups', label: 'Team Contribution', path: `/projects/${projectId}/contribution`, matchPaths: [] },
        { key: 'sprint-reports', icon: 'summarize', label: 'Sprint Reports', path: `/projects/${projectId}/sprint-reports`, matchPaths: [] },
      ],
    },
    {
      key: 'more', label: 'MORE', order: null, collapsible: true,
      items: [
        { key: 'issues', icon: 'crisis_alert', label: 'GitHub & Issues', path: `/projects/${projectId}/issues`, matchPaths: [`/projects/${projectId}/issues/`, `/projects/${projectId}/features/`, `/projects/${projectId}/github-config`] },
        { key: 'architecture', icon: 'schema', label: 'System Architecture', path: `/projects/${projectId}/architecture`, matchPaths: [] },
        { key: 'recovery-plans', icon: 'shield', label: 'Recovery Plans', path: `/projects/${projectId}/recovery-plans`, matchPaths: [], badge: pendingRecoveryCount, badgeTone: 'red' },
        { key: 'project-settings', icon: 'settings', label: 'Project Settings', path: `/projects/${projectId}/project-settings`, matchPaths: [] },
      ],
    },
  ]
}

/* ─── iOS sliding pill NavGroup ─────────────────────────────── */
function NavGroup({ items, activeKey, collapsed }) {
  const groupRef  = useRef(null)
  const itemRefs  = useRef({})
  const pillRef   = useRef(null)
  const prevKey   = useRef(null)
  const mounted   = useRef(false)
  const prevItems = useRef('')
  const itemsKey  = items.map(i => i.key).join('|')

  if (prevItems.current !== itemsKey) {
    prevItems.current = itemsKey
    mounted.current   = false
  }

  const movePill = () => {
    const pill     = pillRef.current
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
      void pill.offsetHeight
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
  useEffect(() => { mounted.current = false; requestAnimationFrame(movePill) }, [collapsed])

  return (
    <div ref={groupRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div ref={pillRef} aria-hidden style={{
        position: 'absolute', left: 0, right: 0, top: 0, height: 38,
        borderRadius: 10,
        background: 'var(--project-theme, #278A99)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        opacity: 0, pointerEvents: 'none', zIndex: 0, willChange: 'transform, height',
      }} />
      {items.map(({ key, icon, label, onClick, badge }) => (
        <NavRow key={key} navKey={key} icon={icon} label={label}
          isActive={key === activeKey} onClick={onClick}
          itemRefs={itemRefs} collapsed={collapsed} badge={badge} />
      ))}
    </div>
  )
}

/* ─── Single nav row (accessible button) ────────────────────── */
function NavRow({ navKey, icon, label, isActive, onClick, itemRefs, collapsed, badge }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type="button"
      className="sidebar-nav-btn"
      ref={el => { itemRefs.current[navKey] = el }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? label : undefined}
      style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: collapsed ? 0 : 10,
        width: '100%', boxSizing: 'border-box',
        height: 38, borderRadius: 10,
        padding: collapsed ? '0' : '0 12px',
        border: '1px solid transparent',
        background: 'transparent',
        boxShadow: 'none',
        outline: 'none',
        cursor: 'pointer', userSelect: 'none',
        textAlign: 'left',
        color: isActive ? '#fff' : (hov ? 'var(--project-theme, #1E707D)' : '#374151'),
        transform: !isActive && hov && !collapsed ? 'translateX(2px)' : 'none',
        transition: `transform 150ms ${EASE_S}, color 150ms ${EASE_S}`,
      }}
    >
      {/* Icon wrapper — fixed width, relative for badge dot */}
      <span style={{
        position: 'relative', flexShrink: 0,
        width: 20, height: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 18, display: 'block', lineHeight: 1,
          color: isActive ? '#fff' : (hov ? 'var(--project-theme)' : '#6B7280'),
          fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
          transition: `color 150ms ${EASE_S}`,
        }}>{icon}</span>
        {/* Badge dot in collapsed mode */}
        {collapsed && badge > 0 && (
          <div style={{
            position: 'absolute', top: -3, right: -5,
            minWidth: 14, height: 14,
            borderRadius: 7, background: '#EF4444',
            color: '#fff', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1.5px solid #fff', padding: '0 2px', lineHeight: 1,
          }}>
            {badge > 99 ? '99+' : badge}
          </div>
        )}
      </span>

      {/* Label — fade+slide when collapsing */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span key="lbl"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12, ease: EASE }}
            style={{
              fontSize: 13, fontWeight: isActive ? 600 : (hov ? 500 : 450),
              letterSpacing: '-0.01em', flex: 1, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none',
              fontFamily: 'Inter,-apple-system,sans-serif',
              lineHeight: 1.3,
              textAlign: 'left',
            }}
          >{label}</motion.span>
        )}
      </AnimatePresence>

      {/* Badge pill (expanded) */}
      {!collapsed && badge > 0 && (
        <div style={{
          background: '#EF4444', color: '#FFF', fontSize: 10, fontWeight: 700,
          padding: '1px 5px', borderRadius: 8, flexShrink: 0,
          boxShadow: '0 0 4px rgba(239,68,68,0.35)',
        }}>{badge > 99 ? '99+' : badge}</div>
      )}
      {/* Glow dot active+expanded+no badge */}
      {isActive && !collapsed && !(badge > 0) && (
        <div style={{
          width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
          background: '#4EC6D8',
          boxShadow: '0 0 5px #4EC6D8',
        }} />
      )}
    </button>
  )
}

/* ─── Section label ─────────────────────────────────────────── */
function SectionLabel({ children, order, collapsed, collapsible, expanded, onToggle }) {
  const labelText = order ? `${order} · ${children}` : children
  return (
    <div style={{ marginTop: collapsed ? 8 : 10, marginBottom: 4, padding: collapsed ? '0' : '0 12px', overflow: 'hidden' }}>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div key="sl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {collapsible ? (
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls="more-section"
                onClick={onToggle}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%',
                  background: 'transparent', border: 'none', padding: '0',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: '#9CA3AF',
                  fontFamily: 'Inter,-apple-system,sans-serif',
                }}>{labelText}</span>
                <span className="material-symbols-outlined" style={{
                  fontSize: 14, color: '#9CA3AF', display: 'block', lineHeight: 1,
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: '180ms',
                }}>expand_more</span>
              </button>
            ) : (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#9CA3AF',
                fontFamily: 'Inter,-apple-system,sans-serif',
                display: 'block',
              }}>{labelText}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Thin separator — only show when collapsed */}
      {collapsed && (
        <div style={{ height: 1, background: '#EBF5F7', margin: '2px 8px' }} />
      )}
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

  /* ── localStorage-persisted state ── */
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('devtrack.sidebar.collapsed') === 'true' } catch { return false }
  })
  const [moreExpanded, setMoreExpanded] = useState(() => {
    try { return localStorage.getItem('devtrack.sidebar.moreExpanded') === 'true' } catch { return false }
  })
  const [pendingRecoveryCount, setPendingRecoveryCount] = useState(0)
  const [pendingReviewCount, setPendingReviewCount]     = useState(0)

  /* ── Toggle helpers ── */
  const toggleCollapsed = () => setCollapsed(c => {
    const next = !c
    try { localStorage.setItem('devtrack.sidebar.collapsed', String(next)) } catch {}
    return next
  })
  const toggleMore = () => setMoreExpanded(e => {
    const next = !e
    try { localStorage.setItem('devtrack.sidebar.moreExpanded', String(next)) } catch {}
    return next
  })

  /* ── Role normalization — memoized để tránh re-derive mỗi render ── */
  const normalizedProjectRole = useMemo(
    () => normalizeRole(activeProject?.role || userRole),
    [activeProject?.role, userRole]
  )
  const isLeader = normalizedProjectRole === 'LEADER' || normalizedProjectRole === 'PROJECT_LEADER'
  const isMentor = normalizedProjectRole === 'MENTOR'

  /* ── Badge fetch ── */
  useEffect(() => {
    if (!activeProject?.id) {
      setPendingRecoveryCount(0)
      setPendingReviewCount(0)
      return
    }
    if (isLeader || isMentor) {
      recoveryPlanService.getProjectRecoveryPlans(activeProject.id, { status: 'PENDING_APPROVAL' })
        .then(plans => { if (Array.isArray(plans)) setPendingRecoveryCount(plans.length) })
        .catch(() => setPendingRecoveryCount(0))
    } else {
      setPendingRecoveryCount(0)
    }
    if (isLeader) {
      TaskReviewService.getReviewQueue(activeProject.id)
        .then(queue => { if (Array.isArray(queue)) setPendingReviewCount(queue.length) })
        .catch(() => setPendingReviewCount(0))
    } else {
      setPendingReviewCount(0)
    }
  }, [activeProject?.id, isLeader, isMentor])

  /* ── CSS variable for main content margin ── */
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-offset', `${12 + (collapsed ? W_RAIL : W_FULL) + 12}px`)
  }, [collapsed])

  /* ── Build project sections ── */
  const sections = useMemo(
    () => activeProject?.id ? buildProjectSections(activeProject.id, pendingReviewCount, pendingRecoveryCount) : [],
    [activeProject?.id, pendingReviewCount, pendingRecoveryCount]
  )

  /* ── Active key ── */
  const activeKey = useMemo(
    () => getActiveKeyFromSections(sections, location.pathname),
    [sections, location.pathname]
  )

  /* ── Auto-open MORE when route is inside it ── */
  const moreItems = useMemo(() => sections.find(s => s.key === 'more')?.items || [], [sections])
  const isInMore  = useMemo(() => moreItems.some(item => isPathActive(item, location.pathname)), [moreItems, location.pathname])
  useEffect(() => {
    if (isInMore) {
      setMoreExpanded(true)
      try { localStorage.setItem('devtrack.sidebar.moreExpanded', 'true') } catch {}
    }
  }, [isInMore])

  /* ── Enrich items with navigate handler — memoized ── */
  const enrich = useMemo(
    () => (items) => items.map(i => ({ ...i, onClick: () => navigate(i.path) })),
    [navigate]
  )

  /* ── Portfolio items ── */
  const portfolioItems = useMemo(() => {
    const raw = [
      { key: 'projects',   icon: 'grid_view',    label: 'My Projects',     path: '/dashboard' },
      { key: 'classrooms', icon: 'school',        label: 'Classrooms',      path: '/classrooms' },
      { key: 'archived',   icon: 'inbox',         label: 'Archived',        path: '/archived' },
      { key: 'settings',   icon: 'settings',      label: 'Global Settings', path: '#' },
    ]
    if (userRole !== 'ADMIN') raw.push({ key: 'verify', icon: 'verified_user', label: 'Verify Account', path: '/verify' })
    if (userRole === 'ADMIN') {
      raw.push({ key: 'admin',      icon: 'admin_panel_settings', label: 'Admin Dashboard', path: '/admin' })
      raw.push({ key: 'admin-jobs', icon: 'monitor_heart',        label: 'Job Dashboard',   path: '/admin/jobs' })
    }
    return raw.map(item => ({
      ...item,
      onClick: () => {
        if (item.path === '#') { toast.success(`"${item.label}" đang được phát triển!`); return }
        clearActiveProject(); navigate(item.path)
      },
    }))
  }, [userRole, clearActiveProject, navigate])
  const portfolioActiveKey = useMemo(() => {
    const p = location.pathname
    if (p === '/dashboard') return 'projects'
    if (p.startsWith('/classrooms')) return 'classrooms'
    if (p.startsWith('/archived')) return 'archived'
    if (p.startsWith('/verify')) return 'verify'
    if (p === '/admin') return 'admin'
    if (p.startsWith('/admin/jobs')) return 'admin-jobs'
    return null
  }, [location.pathname])

  return (
    <motion.aside
      animate={{ width: collapsed ? W_RAIL : W_FULL }}
      transition={{ duration: 0.28, ease: EASE }}
      style={{
        position: 'fixed', top: 12, left: 12, bottom: 12, zIndex: 40,
        display: 'flex', flexDirection: 'column',
        height: 'calc(100vh - 24px)',
        overflow: 'hidden',
        background: '#FFFFFF', border: '1px solid #E5EEEC',
        borderRadius: 20,
        boxShadow: '0 4px 20px rgba(30,112,125,0.07), 0 1px 4px rgba(0,0,0,0.04)',
        padding: `12px ${collapsed ? 8 : 12}px 12px`,
      }}
    >
      {/* ── HEADER ROW ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        marginBottom: 8, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, overflow: 'hidden' }}>
          {!activeProject ? (
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--project-theme-light) 0%, var(--project-theme) 55%, var(--project-theme-dark) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14,
              boxShadow: '0 3px 10px rgba(30,112,125,0.25)',
            }}>D</div>
          ) : (
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--project-theme-hover), var(--project-theme))',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 3 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: 'var(--project-theme)',
                        background: 'var(--project-theme-light)', padding: '1px 5px',
                        borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
                        display: 'inline-block',
                      }}>{activeProject.role}</span>
                      <SyncStatusBadge projectId={activeProject.id} />
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={toggleCollapsed}
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
            style={{ fontSize: 14, color: 'var(--project-theme)', display: 'block', lineHeight: 1 }}
          >chevron_right</motion.span>
        </button>
      </div>

      {/* ── Back to Portfolio ── */}
      <AnimatePresence initial={false}>
        {activeProject && !collapsed && (
          <motion.button key="back"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 32, marginBottom: 8 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.16, ease: EASE }}
            onClick={() => { clearActiveProject(); navigate('/dashboard') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
              padding: '0 10px', borderRadius: 8,
              background: 'var(--project-theme-light)', border: '1px solid rgba(0,0,0,0.08)',
              color: 'var(--project-theme)', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              alignSelf: 'flex-start', whiteSpace: 'nowrap', overflow: 'hidden',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_back</span>
            Back to Portfolio
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── NAV ── */}
      <nav className="sidebar-navigation" style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <style>{`
          .sidebar-navigation::-webkit-scrollbar {
            width: 0;
            height: 0;
            display: none;
          }
          
          .sidebar-nav-btn:focus:not(:focus-visible) {
            outline: none;
            box-shadow: none;
          }
          
          .sidebar-nav-btn:focus-visible {
            outline: 2px solid color-mix(in srgb, var(--project-theme, #278A99) 45%, transparent);
            outline-offset: 2px;
          }
        `}</style>
        {!activeProject ? (
          <NavGroup items={portfolioItems} activeKey={portfolioActiveKey} collapsed={collapsed} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sections.map(section => {
              const isMore = section.key === 'more'
              const sectionActiveKey = section.items.some(i => i.key === activeKey) ? activeKey : null

              return (
                <div key={section.key}>
                  <SectionLabel
                    order={section.order}
                    collapsed={collapsed}
                    collapsible={section.collapsible}
                    expanded={isMore ? moreExpanded : undefined}
                    onToggle={isMore ? toggleMore : undefined}
                  >
                    {section.label}
                  </SectionLabel>

                  {isMore ? (
                    <AnimatePresence initial={false}>
                      {(moreExpanded || collapsed) && (
                        <motion.div
                          id="more-section"
                          key="more-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          style={{ overflow: 'hidden' }}
                        >
                          <NavGroup
                            items={enrich(section.items)}
                            activeKey={sectionActiveKey}
                            collapsed={collapsed}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  ) : (
                    <NavGroup
                      items={enrich(section.items)}
                      activeKey={sectionActiveKey}
                      collapsed={collapsed}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </nav>
    </motion.aside>
  )
}
