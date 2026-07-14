import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import bugService from '../services/bugService'

/* ── Design tokens ─────────────────────────────────────────────── */
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
  },
}

/* ── Enums ─────────────────────────────────────────────────────── */
const STATUS_SEQ = ['DRAFT', 'OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED']

const STATUS_MAP = {
  DRAFT:       { label: 'Draft',       color: '#64748B', bg: '#F8FAFC' },
  OPEN:        { label: 'Open',        color: '#3B82F6', bg: '#EFF6FF' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B', bg: '#FFFBEB' },
  FIXED:       { label: 'Fixed',       color: '#10B981', bg: '#ECFDF5' },
  VERIFIED:    { label: 'Verified',    color: '#06B6D4', bg: '#ECFEFF' },
  CLOSED:      { label: 'Closed',      color: '#64748B', bg: '#F1F5F9' },
  REOPENED:    { label: 'Reopened',    color: '#EF4444', bg: '#FEF2F2' },
}

const SEVERITY_MAP = {
  CRITICAL: { label: 'Critical', color: '#DC2626', bg: '#FEF2F2', icon: 'error' },
  HIGH:     { label: 'High',     color: '#F97316', bg: '#FFF7ED', icon: 'warning' },
  MEDIUM:   { label: 'Medium',   color: '#EAB308', bg: '#FEFCE8', icon: 'info' },
  LOW:      { label: 'Low',      color: '#22C55E', bg: '#F0FDF4', icon: 'check_circle' },
}

/* ── Detail Page Component ─────────────────────────────────────── */
export default function BugDetailPage() {
  const { projectId, bugId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)
  const currentUserId = useAuthStore((state) => state.userId)

  const [bug, setBug] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  
  // For editing description/commit
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})

  const loadBug = useCallback(async () => {
    try {
      setLoading(true)
      const data = await bugService.getBugDetails(bugId)
      setBug(data)
      setEditForm({ description: data.description || '', fixCommitHash: data.fixCommitHash || '' })
    } catch (err) {
      toast.error('Failed to load bug details')
      navigate(`/projects/${projectId}/bugs`)
    } finally {
      setLoading(false)
    }
  }, [bugId, projectId, navigate])

  useEffect(() => { loadBug() }, [loadBug])

  /* ── Permissions check ── */
  const currentMember = activeProject?.members?.find(m => String(m.id) === String(currentUserId))
  const userRole = (typeof currentMember?.role === 'string' ? currentMember.role : currentMember?.role?.name || '').toUpperCase()
  const isLeaderOrMentor = userRole.includes('LEADER') || userRole.includes('MENTOR')
  const isAssignee = String(bug?.assignedTo?.id) === String(currentUserId)

  const canApprove = bug?.status === 'DRAFT' && isLeaderOrMentor
  
  // Available status transitions based on permission matrix
  let availableStatuses = []
  if (isLeaderOrMentor) {
    availableStatuses = ['OPEN', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED', 'REOPENED'].filter(s => s !== bug?.status && bug?.status !== 'DRAFT')
  } else if (isAssignee) {
    if (bug?.status === 'OPEN' || bug?.status === 'REOPENED') availableStatuses = ['IN_PROGRESS']
    if (bug?.status === 'IN_PROGRESS') availableStatuses = ['FIXED']
  } else {
    // QA/Tester (non-leader, non-assignee)
    if (bug?.status === 'FIXED') availableStatuses = ['VERIFIED', 'REOPENED']
    if (bug?.status === 'VERIFIED') availableStatuses = ['CLOSED', 'REOPENED']
    if (['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(bug?.status)) availableStatuses = ['REOPENED']
  }

  /* ── Handlers ── */
  const handleStatusChange = async (newStatus) => {
    if (updating) return
    try {
      setUpdating(true)
      await bugService.updateBug(bugId, { status: newStatus })
      toast.success(`Status updated to ${STATUS_MAP[newStatus].label}`)
      loadBug()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status')
    } finally { setUpdating(false) }
  }

  const handleApprove = async () => {
    if (updating) return
    try {
      setUpdating(true)
      await bugService.approveBug(bugId)
      toast.success('Bug approved and converted to Task!')
      loadBug()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve')
    } finally { setUpdating(false) }
  }

  const handleSaveEdit = async () => {
    try {
      setUpdating(true)
      await bugService.updateBug(bugId, editForm)
      toast.success('Details updated')
      setEditMode(false)
      loadBug()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save')
    } finally { setUpdating(false) }
  }

  const handleReassign = async (newAssigneeId) => {
    try {
      await bugService.updateBug(bugId, { assignedToId: newAssigneeId ? Number(newAssigneeId) : null })
      toast.success('Assignee updated')
      loadBug()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reassign')
    }
  }

  /* ── Render Helpers ── */
  let parsedSteps = bug?.stepsToReproduce || ''
  let githubIssueNumber = null
  let githubIssueUrl = null
  if (bug?.stepsToReproduce) {
    try {
      const meta = JSON.parse(bug.stepsToReproduce)
      if (meta.steps) parsedSteps = meta.steps
      if (meta.github_issue_number) githubIssueNumber = meta.github_issue_number
      if (meta.github_issue_url) githubIssueUrl = meta.github_issue_url
    } catch (e) {}
  }

  const renderSteps = (stepsContent) => {
    if (!stepsContent) return null
    try {
      const parsed = JSON.parse(stepsContent)
      if (Array.isArray(parsed)) return parsed.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s.action || s}</li>)
      return <pre style={{ background: C.bg, padding: 12, borderRadius: T.radius.sm, fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>{JSON.stringify(parsed, null, 2)}</pre>
    } catch (e) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{stepsContent}</div>
    }
  }

  if (loading || !bug) return (
    <div style={{ padding: 60, textAlign: 'center', color: C.textMuted, fontFamily: T.font }}>
      Loading bug details...
    </div>
  )

  const currentIdx = STATUS_SEQ.indexOf(bug.status === 'REOPENED' ? 'OPEN' : bug.status)

  return (
    <div style={{ fontFamily: T.font, background: C.bg, minHeight: '100vh', padding: '24px 32px' }}>
      
      {/* ── Breadcrumb & Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
        <span onClick={() => navigate(`/projects/${projectId}/bugs`)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          Bugs
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
        <span style={{ color: C.textPri, fontWeight: 500 }}>BUG-{bug.id}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textPri, margin: '0 0 8px 0' }}>{bug.title}</h1>
          <div style={{ display: 'flex', gap: 12, fontSize: 13, color: C.textSec, alignItems: 'center' }}>
            <span>Created by <b>{bug.createdBy?.username}</b> on {new Date(bug.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: STATUS_MAP[bug.status]?.bg, color: STATUS_MAP[bug.status]?.color, padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, border: `1px solid ${STATUS_MAP[bug.status]?.color}40` }}>
              {STATUS_MAP[bug.status]?.label}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {canApprove && (
            <button onClick={handleApprove} disabled={updating} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: T.radius.sm, border: 'none', background: C.primary, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: updating ? 'not-allowed' : 'pointer',
              boxShadow: T.shadow.sm,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
              Approve Bug
            </button>
          )}

          {availableStatuses.length > 0 && (
            <div style={{ position: 'relative' }}>
              <select
                disabled={updating}
                onChange={(e) => { if(e.target.value) handleStatusChange(e.target.value); e.target.value='' }}
                value=""
                style={{
                  appearance: 'none', padding: '8px 32px 8px 16px',
                  borderRadius: T.radius.sm, border: `1px solid ${C.border}`,
                  background: C.surface, color: C.textPri, fontSize: 13, fontWeight: 600,
                  cursor: updating ? 'not-allowed' : 'pointer',
                }}
              >
                <option value="" disabled>Change Status...</option>
                {availableStatuses.map(s => (
                  <option key={s} value={s}>{STATUS_MAP[s].label}</option>
                ))}
              </select>
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 18, color: C.textMuted }}>arrow_drop_down</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Visual Timeline ── */}
      <div style={{ background: C.surface, borderRadius: T.radius.md, padding: '16px 24px', border: `1px solid ${C.borderLt}`, boxShadow: T.shadow.sm, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto' }}>
        {STATUS_SEQ.map((s, idx) => {
          const isPassed = bug.status === 'REOPENED' 
            ? (idx <= STATUS_SEQ.indexOf('FIXED')) // assume it reached at least FIXED
            : currentIdx >= idx
          const isCurrent = bug.status === s || (bug.status === 'REOPENED' && s === 'OPEN')
          const isReopenedNode = bug.status === 'REOPENED' && s === 'OPEN'
          const color = isReopenedNode ? C.danger : isCurrent ? C.primary : isPassed ? C.success : C.border
          
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: isCurrent ? color : isPassed ? color : C.bg, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isPassed && !isCurrent && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff' }}>{bug.status === 'REOPENED' && idx > STATUS_SEQ.indexOf('OPEN') ? 'history' : 'check'}</span>}
                  {isCurrent && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: isCurrent ? C.textPri : isPassed ? C.textSec : C.textMuted }}>
                  {isReopenedNode ? 'Reopened' : STATUS_MAP[s].label}
                </span>
              </div>
              {idx < STATUS_SEQ.length - 1 && (
                <div style={{ flex: 1, height: 2, background: isPassed && !isCurrent ? (bug.status === 'REOPENED' && idx >= STATUS_SEQ.indexOf('OPEN') ? C.danger : C.success) : C.border, margin: '0 12px', opacity: 0.5, transform: 'translateY(-10px)' }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* GitHub / Task Link Banner */}
          {bug.status !== 'DRAFT' && (githubIssueUrl || bug.relatedTaskId) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              {bug.relatedTaskId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: `${C.primary}10`, border: `1px solid ${C.primary}20`, borderRadius: T.radius.md }}>
                  <span className="material-symbols-outlined" style={{ color: C.primary, fontSize: 24 }}>assignment</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase' }}>Linked Task</div>
                    <span onClick={() => navigate(`/projects/${projectId}/tasks/${bug.relatedTaskId}`)} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: C.primary, marginTop: 4 }}>
                      Task #{bug.relatedTaskId}
                    </span>
                  </div>
                </div>
              )}
              {githubIssueUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: `${C.info}10`, border: `1px solid ${C.info}20`, borderRadius: T.radius.md }}>
                  <span className="material-symbols-outlined" style={{ color: C.info, fontSize: 24 }}>settings_ethernet</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textSec, textTransform: 'uppercase' }}>GitHub Issue Sync</div>
                    <a href={githubIssueUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: C.info, marginTop: 4, textDecoration: 'none' }}>
                      Issue #{githubIssueNumber} (Open on GitHub)
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description & Commit */}
          <div style={{ background: C.surface, borderRadius: T.radius.md, padding: 24, border: `1px solid ${C.borderLt}`, boxShadow: T.shadow.sm }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPri, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.textMuted }}>description</span>
                Description & Fix Details
              </h3>
              {!editMode ? (
                <button onClick={() => setEditMode(true)} style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setEditMode(false)} style={{ background: 'none', border: 'none', color: C.textSec, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveEdit} disabled={updating} style={{ background: C.primary, border: 'none', color: '#fff', fontSize: 13, padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                </div>
              )}
            </div>

            {editMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <textarea
                  style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: T.radius.sm, border: `1px solid ${C.border}`, fontFamily: T.font, fontSize: 13, boxSizing: 'border-box' }}
                  value={editForm.description}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Bug description..."
                />
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.textSec, display: 'block', marginBottom: 4 }}>Fix Commit Hash (if applicable)</label>
                  <input
                    style={{ width: '100%', padding: '8px 12px', borderRadius: T.radius.sm, border: `1px solid ${C.border}`, fontFamily: 'monospace', fontSize: 13, boxSizing: 'border-box' }}
                    value={editForm.fixCommitHash}
                    onChange={e => setEditForm(f => ({ ...f, fixCommitHash: e.target.value }))}
                    placeholder="e.g. a1b2c3d"
                  />
                </div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: bug.fixCommitHash ? 16 : 0 }}>
                  {bug.description || <span style={{ fontStyle: 'italic', color: C.textMuted }}>No description provided.</span>}
                </div>
                {bug.fixCommitHash && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: C.bg, borderRadius: T.radius.sm, border: `1px solid ${C.border}` }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textSec }}>commit</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', color: C.textPri, fontWeight: 500 }}>{bug.fixCommitHash}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Steps & Results */}
          <div style={{ background: C.surface, borderRadius: T.radius.md, padding: 24, border: `1px solid ${C.borderLt}`, boxShadow: T.shadow.sm }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.textPri, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.textMuted }}>list_alt</span>
              Reproduction & Results
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8 }}>Steps to Reproduce:</h4>
                <div style={{ background: C.bg, padding: 16, borderRadius: T.radius.sm, fontSize: 13, color: C.textSec }}>
                  {bug.stepsToReproduce ? (
                    <ul style={{ margin: 0, paddingLeft: 20 }}>{renderSteps(parsedSteps)}</ul>
                  ) : <span style={{ fontStyle: 'italic', color: C.textMuted }}>Not specified</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.success }}>check_circle</span> Expected Result
                  </h4>
                  <div style={{ background: C.bg, padding: 12, borderRadius: T.radius.sm, fontSize: 13, color: C.textSec, minHeight: 60, whiteSpace: 'pre-wrap' }}>
                    {bug.expectedResult || '—'}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.danger }}>cancel</span> Actual Result
                  </h4>
                  <div style={{ background: C.bg, padding: 12, borderRadius: T.radius.sm, fontSize: 13, color: C.textSec, minHeight: 60, whiteSpace: 'pre-wrap' }}>
                    {bug.actualResult || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Meta Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.surface, borderRadius: T.radius.md, padding: 20, border: `1px solid ${C.borderLt}`, boxShadow: T.shadow.sm }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: C.textPri, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.textMuted }}>info</span>
              Details
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <span style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Assignee</span>
                {isLeaderOrMentor ? (
                  <select
                    value={bug.assignedTo?.id || ''}
                    onChange={(e) => handleReassign(e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: T.radius.sm, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: T.font, outline: 'none' }}
                  >
                    <option value="">Unassigned</option>
                    {activeProject?.members?.map(m => (
                      <option key={m.id} value={m.id}>{m.fullName || m.username}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.primaryLt, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {bug.assignedTo?.username?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.textPri }}>{bug.assignedTo?.username || 'Unassigned'}</span>
                  </div>
                )}
              </div>

              <div>
                <span style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Severity</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: T.radius.full, fontSize: 11, fontWeight: 600, background: SEVERITY_MAP[bug.severity]?.bg || '#f1f5f9', color: SEVERITY_MAP[bug.severity]?.color || '#64748b' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{SEVERITY_MAP[bug.severity]?.icon}</span>
                  {SEVERITY_MAP[bug.severity]?.label || bug.severity}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Environment</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: C.textSec }}>{bug.environment || 'N/A'}</span>
              </div>

              {bug.testExecutionId && (
                <div>
                  <span style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 4 }}>Origin</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.info, fontWeight: 500, background: C.infoBg, padding: '4px 10px', borderRadius: 6 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>science</span>
                    Test Run #{bug.testExecutionId}
                  </span>
                </div>
              )}

              {bug.relatedTaskId && (
                <div style={{ paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: C.textMuted, display: 'block', marginBottom: 8 }}>Linked Task</span>
                  <div
                    onClick={() => navigate(`/projects/${projectId}/tasks/${bug.relatedTaskId}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, borderRadius: T.radius.sm, background: C.bg, border: `1px solid ${C.border}`, cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.primary }}>task</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.textPri, flex: 1 }}>Task #{bug.relatedTaskId}</span>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textMuted }}>open_in_new</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
