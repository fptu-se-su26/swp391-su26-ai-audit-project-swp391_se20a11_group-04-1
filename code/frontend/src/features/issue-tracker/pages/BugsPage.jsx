import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import bugService from '../services/bugService'
import CreateBugModal from '../components/CreateBugModal'

/* ── Design tokens (matching TestCase module) ──────────────────── */
const C = {
  primary: 'var(--project-theme, #1E707D)', primaryHov: 'var(--project-theme-hover, #278A99)', primaryLt: 'var(--project-theme-light, #D7EEF1)',
  bg: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', borderLt: '#F1F5F9',
  textPri: '#0F172A', textSec: '#475569', textMuted: '#94A3B8',
  success: '#10B981', successBg: '#ECFDF5', successBdr: '#A7F3D0',
  danger: '#EF4444', dangerBg: '#FEF2F2', dangerBdr: '#FECACA',
  warning: '#F59E0B', warningBg: '#FFFBEB', warningBdr: '#FDE68A',
  info: '#3B82F6', infoBg: '#EFF6FF', infoBdr: '#BFDBFE',
}
const T = {
  font: 'Inter, -apple-system, sans-serif',
  radius: { sm: '8px', md: '12px', lg: '16px', full: '9999px' },
  shadow: {
    sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
  },
}

/* ── Status / Severity configs ─────────────────────────────────── */
const STATUS_MAP = {
  DRAFT:       { label: 'Draft',       color: '#64748B', bg: '#F8FAFC', bdr: '#E2E8F0', icon: 'edit_note' },
  OPEN:        { label: 'Open',        color: '#3B82F6', bg: '#EFF6FF', bdr: '#BFDBFE', icon: 'bug_report' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB', bdr: '#FDE68A', icon: 'autorenew' },
  FIXED:       { label: 'Fixed',       color: '#10B981', bg: '#ECFDF5', bdr: '#A7F3D0', icon: 'build' },
  VERIFIED:    { label: 'Verified',    color: '#06B6D4', bg: '#ECFEFF', bdr: '#A5F3FC', icon: 'verified' },
  CLOSED:      { label: 'Closed',      color: '#64748B', bg: '#F1F5F9', bdr: '#CBD5E1', icon: 'task_alt' },
  REOPENED:    { label: 'Reopened',    color: '#EF4444', bg: '#FEF2F2', bdr: '#FECACA', icon: 'replay' },
}
const SEVERITY_MAP = {
  CRITICAL: { label: 'Critical', color: '#DC2626', bg: '#FEF2F2', icon: 'error' },
  HIGH:     { label: 'High',     color: '#F97316', bg: '#FFF7ED', icon: 'warning' },
  MEDIUM:   { label: 'Medium',   color: '#EAB308', bg: '#FEFCE8', icon: 'info' },
  LOW:      { label: 'Low',      color: '#22C55E', bg: '#F0FDF4', icon: 'check_circle' },
}
const ENV_MAP = {
  DEV:     { label: 'Dev',     color: '#8B5CF6', bg: '#F5F3FF' },
  STAGING: { label: 'Staging', color: '#0EA5E9', bg: '#F0F9FF' },
}

/* ── Badge components ──────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP.DRAFT
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: T.radius.full,
      fontSize: 11, fontWeight: 600, color: cfg.color,
      background: cfg.bg, border: `1px solid ${cfg.bdr}`,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_MAP[severity] || SEVERITY_MAP.MEDIUM
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: T.radius.full,
      fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  )
}

function EnvBadge({ env }) {
  const cfg = ENV_MAP[env] || ENV_MAP.DEV
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: T.radius.full,
      fontSize: 10, fontWeight: 600, color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  )
}

/* ── Filter Select ─────────────────────────────────────────────── */
function FilterSelect({ label, value, onChange, options }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value || '')}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          background: hov ? C.primaryLt : C.surface,
          border: `1px solid ${hov ? C.primary : C.border}`,
          borderRadius: 10, padding: '7px 32px 7px 12px',
          fontSize: 13, fontWeight: 500, color: C.textSec,
          cursor: 'pointer', outline: 'none',
          transition: 'all 150ms ease', fontFamily: T.font,
        }}
      >
        <option value="">{label}: All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="material-symbols-outlined" style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, color: C.textMuted, pointerEvents: 'none',
      }}>expand_more</span>
    </div>
  )
}

/* ── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ icon, label, value, color, bg }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px', borderRadius: T.radius.md,
      background: bg, border: `1px solid ${C.borderLt}`,
      boxShadow: T.shadow.sm, minWidth: 140,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 22, color }}>{icon}</span>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.textPri, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════
   ██  BugsPage — Main Component
   ══════════════════════════════════════════════════════════════════ */
export default function BugsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)
  const currentUserId = useAuthStore((state) => state.userId)

  const currentMember = activeProject?.members?.find(m => String(m.id) === String(currentUserId))
  const userRole = (typeof currentMember?.role === 'string' ? currentMember.role : currentMember?.role?.name || '').toUpperCase()
  const isLeaderOrMentor = userRole.includes('LEADER') || userRole.includes('MENTOR')

  const [bugs, setBugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [page, setPage] = useState(0)
  const pageSize = 10

  /* ── Load bugs ───────────────────────────────────────────────── */
  const loadBugs = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const data = await bugService.getProjectBugs(projectId)
      setBugs(data || [])
    } catch (err) {
      toast.error('Failed to load bugs')
      console.error(err)
    } finally { setLoading(false) }
  }, [projectId])

  useEffect(() => { loadBugs() }, [loadBugs])

  // Listen for WebSocket refresh
  useEffect(() => {
    const handler = () => loadBugs()
    window.addEventListener('refresh-bugs', handler)
    return () => window.removeEventListener('refresh-bugs', handler)
  }, [loadBugs])

  /* ── Filtered & paginated bugs ───────────────────────────────── */
  const filteredBugs = useMemo(() => {
    let result = [...bugs]
    if (filterStatus) result = result.filter(b => b.status === filterStatus)
    if (filterSeverity) result = result.filter(b => b.severity === filterSeverity)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.createdBy?.username?.toLowerCase().includes(q)
      )
    }
    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [bugs, filterStatus, filterSeverity, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredBugs.length / pageSize))
  const pagedBugs = filteredBugs.slice(page * pageSize, (page + 1) * pageSize)

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [filterStatus, filterSeverity, searchQuery])

  /* ── Stats ───────────────────────────────────────────────────── */
  const stats = useMemo(() => ({
    total: bugs.length,
    draft: bugs.filter(b => b.status === 'DRAFT').length,
    open: bugs.filter(b => ['OPEN', 'IN_PROGRESS', 'REOPENED'].includes(b.status)).length,
    fixed: bugs.filter(b => ['FIXED', 'VERIFIED', 'CLOSED'].includes(b.status)).length,
  }), [bugs])

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleCreateBug = async (payload) => {
    try {
      await bugService.createBug(projectId, payload)
      toast.success('Bug report created!')
      setShowCreateModal(false)
      loadBugs()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create bug')
    }
  }

  const handleApprove = async (bugId) => {
    setApprovingId(bugId)
    try {
      await bugService.approveBug(bugId)
      toast.success('Bug approved and task created!')
      loadBugs()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve')
    } finally { setApprovingId(null) }
  }

  /* ── Project members (for assign dropdown) ───────────────────── */
  const projectMembers = activeProject?.members || []

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: T.font, background: C.bg, minHeight: '100vh', padding: '24px 32px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textPri, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: C.danger }}>bug_report</span>
            Bug Tracker
          </h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: '4px 0 0' }}>
            Track, report, and manage bugs across the project lifecycle.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: T.radius.sm, border: 'none',
            background: C.primary, color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', boxShadow: T.shadow.sm,
            transition: 'all 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.primaryHov; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.background = C.primary; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Report Bug
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard icon="bug_report" label="Total Bugs" value={stats.total} color={C.textSec} bg={C.surface} />
        <StatCard icon="edit_note" label="Draft" value={stats.draft} color="#64748B" bg="#F8FAFC" />
        <StatCard icon="error_outline" label="Active" value={stats.open} color={C.warning} bg={C.warningBg} />
        <StatCard icon="task_alt" label="Resolved" value={stats.fixed} color={C.success} bg={C.successBg} />
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        padding: '12px 16px', background: C.surface, borderRadius: T.radius.md,
        border: `1px solid ${C.borderLt}`, boxShadow: T.shadow.sm, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, color: C.textMuted,
          }}>search</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search bugs..."
            style={{
              width: '100%', padding: '8px 12px 8px 36px', borderRadius: 10,
              border: `1px solid ${C.border}`, fontSize: 13, fontFamily: T.font,
              outline: 'none', color: C.textPri, background: C.bg,
              transition: 'border 150ms', boxSizing: 'border-box',
            }}
          />
        </div>
        <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus}
          options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
        <FilterSelect label="Severity" value={filterSeverity} onChange={setFilterSeverity}
          options={Object.entries(SEVERITY_MAP).map(([k, v]) => ({ value: k, label: v.label }))} />
        <div style={{ fontSize: 12, color: C.textMuted, marginLeft: 'auto' }}>
          {filteredBugs.length} bug{filteredBugs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        background: C.surface, borderRadius: T.radius.md,
        border: `1px solid ${C.borderLt}`, boxShadow: T.shadow.sm, overflow: 'hidden',
      }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: C.textMuted }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>progress_activity</span>
            <p style={{ fontSize: 13, marginTop: 8 }}>Loading bugs...</p>
          </div>
        ) : pagedBugs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: C.textMuted, opacity: 0.5 }}>pest_control</span>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.textSec, marginTop: 12 }}>No bugs found</p>
            <p style={{ fontSize: 12, color: C.textMuted }}>
              {bugs.length === 0 ? 'Great! No bugs have been reported yet.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                {['Title', 'Status', 'Severity', 'Env', 'Reporter', 'Assignee', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 11, fontWeight: 600, color: C.textMuted,
                    textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedBugs.map(bug => (
                <tr key={bug.id}
                  onClick={() => navigate(`/projects/${projectId}/bugs/${bug.id}`)}
                  style={{ borderBottom: `1px solid ${C.borderLt}`, cursor: 'pointer', transition: 'background 100ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.primaryLt + '44' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: C.textPri, maxWidth: 280 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.title}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}><StatusBadge status={bug.status} /></td>
                  <td style={{ padding: '12px 14px' }}><SeverityBadge severity={bug.severity} /></td>
                  <td style={{ padding: '12px 14px' }}>{bug.environment && <EnvBadge env={bug.environment} />}</td>
                  <td style={{ padding: '12px 14px', color: C.textSec }}>{bug.createdBy?.username || '—'}</td>
                  <td style={{ padding: '12px 14px', color: C.textSec }}>{bug.assignedTo?.username || '—'}</td>
                  <td style={{ padding: '12px 14px', color: C.textMuted, fontSize: 12 }}>
                    {bug.createdAt ? new Date(bug.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                    {bug.status === 'DRAFT' && isLeaderOrMentor && (
                      <button
                        onClick={() => handleApprove(bug.id)}
                        disabled={approvingId === bug.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 12px', borderRadius: T.radius.sm,
                          border: `1px solid ${C.successBdr}`, background: C.successBg,
                          color: C.success, fontSize: 11, fontWeight: 600,
                          cursor: approvingId === bug.id ? 'not-allowed' : 'pointer',
                          opacity: approvingId === bug.id ? 0.6 : 1,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
                        {approvingId === bug.id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderTop: `1px solid ${C.borderLt}`,
          }}>
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              style={{
                padding: '6px 12px', borderRadius: T.radius.sm,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 12, fontWeight: 600, color: page === 0 ? C.textMuted : C.textSec,
                cursor: page === 0 ? 'not-allowed' : 'pointer',
              }}>← Prev</button>
            <span style={{ fontSize: 12, color: C.textMuted }}>
              Page {page + 1} of {totalPages}
            </span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              style={{
                padding: '6px 12px', borderRadius: T.radius.sm,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 12, fontWeight: 600, color: page >= totalPages - 1 ? C.textMuted : C.textSec,
                cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}>Next →</button>
          </div>
        )}
      </div>

      {/* ── Create Bug Modal ── */}
      {showCreateModal && (
        <CreateBugModal
          open={true}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBug}
          projectMembers={projectMembers}
        />
      )}

      {/* Spinner animation */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
