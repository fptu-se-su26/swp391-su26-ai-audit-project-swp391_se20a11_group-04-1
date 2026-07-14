import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

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
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
  },
}

export default function CreateBugModal({ open, onClose, onSubmit, projectMembers = [], initialData = {} }) {
  const [form, setForm] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    severity: initialData.severity || 'MEDIUM',
    environment: initialData.environment || 'DEV',
    assignedToId: initialData.assignedToId || '',
    stepsToReproduce: initialData.stepsToReproduce || '',
    expectedResult: initialData.expectedResult || '',
    actualResult: initialData.actualResult || '',
    testExecutionId: initialData.testExecutionId || null,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        severity: initialData.severity || 'MEDIUM',
        environment: initialData.environment || 'DEV',
        assignedToId: initialData.assignedToId || '',
        stepsToReproduce: initialData.stepsToReproduce || '',
        expectedResult: initialData.expectedResult || '',
        actualResult: initialData.actualResult || '',
        testExecutionId: initialData.testExecutionId || null,
      })
    }
  }, [open, initialData.title, initialData.description, initialData.stepsToReproduce, initialData.testExecutionId])
  
  if (!open) return null
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Bug title is required'); return }
    setSubmitting(true)
    try {
      const payload = { ...form, assignedToId: form.assignedToId ? Number(form.assignedToId) : null }
      await onSubmit(payload)
      setForm({ title: '', description: '', severity: 'MEDIUM', environment: 'DEV', assignedToId: '', stepsToReproduce: '', expectedResult: '', actualResult: '', testExecutionId: null })
    } finally { setSubmitting(false) }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: T.radius.sm,
    border: `1px solid ${C.border}`, fontSize: 13, fontFamily: T.font,
    outline: 'none', transition: 'border 150ms', background: C.surface,
    color: C.textPri, boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 6, display: 'block' }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: C.surface, borderRadius: T.radius.lg,
        boxShadow: T.shadow.lg, width: 560, maxHeight: '90vh', overflow: 'auto',
        padding: 28,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.textPri, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: C.danger }}>bug_report</span>
            Report New Bug
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief description of the bug" />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed description..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Severity</label>
              <select style={inputStyle} value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Environment</label>
              <select style={inputStyle} value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}>
                <option value="DEV">Dev</option>
                <option value="STAGING">Staging</option>
              </select>
            </div>
          </div>

          {projectMembers.length > 0 && (
            <div>
              <label style={labelStyle}>Assign To</label>
              <select style={inputStyle} value={form.assignedToId} onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}>
                <option value="">Unassigned</option>
                {projectMembers.map(m => (
                  <option key={m.id} value={m.id}>{m.fullName || m.username}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>Steps to Reproduce</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.stepsToReproduce} onChange={e => setForm(f => ({ ...f, stepsToReproduce: e.target.value }))} placeholder="1. Go to...\n2. Click on...\n3. Observe..." />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Expected Result</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.expectedResult} onChange={e => setForm(f => ({ ...f, expectedResult: e.target.value }))} placeholder="What should happen" />
            </div>
            <div>
              <label style={labelStyle}>Actual Result</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.actualResult} onChange={e => setForm(f => ({ ...f, actualResult: e.target.value }))} placeholder="What actually happened" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: T.radius.sm, border: `1px solid ${C.border}`,
              background: C.surface, color: C.textSec, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{
              padding: '9px 20px', borderRadius: T.radius.sm, border: 'none',
              background: submitting ? C.textMuted : C.primary, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bug_report</span>
              {submitting ? 'Creating...' : 'Create Bug Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
