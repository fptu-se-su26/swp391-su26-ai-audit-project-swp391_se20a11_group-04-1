import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { requirementService } from '../../requirement/services/requirementService'
import useTestCaseStore from '../stores/useTestCaseStore'

const C = {
  primary:     '#1E707D',
  primaryDark: '#165964',
  primaryLt:   '#D7EEF1',
  bg:          '#F8FAFC',
  surface:     '#FFFFFF',
  border:      '#D9E7E4',
  textPri:     '#1F2937',
  textSec:     '#6B7280',
  textMuted:   '#9CA3AF',
}

export default function AiGenTestCaseModal({ isOpen, onClose, onSubmit }) {
  const { projectId } = useParams()

  const [testType, setTestType] = useState('UI')
  const [requirementId, setRequirementId] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [requirements, setRequirements] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && projectId) {
      setTestType('UI')
      setRequirementId('')
      setAdditionalContext('')
      setError(null)
      // Fetch requirements
      requirementService.getRequirements(projectId)
        .then(res => setRequirements(res))
        .catch(err => console.error("Failed to fetch requirements", err))
    }
  }, [isOpen, projectId])

  if (!isOpen) return null

  const handleGenerate = () => {
    if (!requirementId) {
      setError("Please select a Linked Requirement. This is required for AI generation.")
      return
    }

    const payload = {
      testType: testType === 'AI Decides' ? null : testType,
      smartMode: testType === 'AI Decides',
      requirementId: parseInt(requirementId),
      additionalContext
    }
    onSubmit(payload)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20
    }}>
      <div style={{
        background: C.surface, borderRadius: 16, width: '100%', maxWidth: 540,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'Inter,-apple-system,sans-serif'
      }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #4EC6D8 0%, #1E707D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(30,112,125,0.2)' }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>smart_toy</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.textPri }}>AI Gen TestCase</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: C.textSec }}>Auto-generate multiple test cases</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', padding: 4, borderRadius: '50%' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#EF4444', fontSize: 13, display: 'flex', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
              <span style={{ marginTop: 1 }}>{error}</span>
            </div>
          )}

          {/* Requirement */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8 }}>Linked Requirement <span style={{ color: '#EF4444' }}>*</span></label>
            <select
              value={requirementId}
              onChange={(e) => setRequirementId(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.bg,
                fontSize: 13, color: C.textPri, outline: 'none'
              }}
            >
              <option value="">-- Select a Requirement (Required) --</option>
              {requirements.map(req => (
                <option key={req.id} value={req.id}>{req.reqCode} - {req.title}</option>
              ))}
            </select>
          </div>

          {/* Test Type */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8 }}>Test Type <span style={{ color: '#EF4444' }}>*</span></label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['UI', 'API', 'MANUAL', 'AI Decides'].map(type => (
                <button
                  key={type}
                  onClick={() => setTestType(type)}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 10,
                    border: `1.5px solid ${testType === type ? C.primary : C.border}`,
                    background: testType === type ? '#F0F9FA' : C.surface,
                    color: testType === type ? C.primary : C.textSec,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {type === 'UI' ? 'web' : type === 'API' ? 'api' : type === 'MANUAL' ? 'assignment' : 'auto_awesome'}
                  </span>
                  {type === 'AI Decides' ? 'Smart' : type}
                </button>
              ))}
            </div>
            {testType === 'AI Decides' && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: C.primary, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
                AI will choose the best type (UI, API, or MANUAL) for each test case.
              </p>
            )}
          </div>

          {/* Additional Context */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8 }}>
              Additional Context
              <span style={{ fontSize: 11, fontWeight: 400, color: C.textMuted }}>Optional</span>
            </label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="e.g., Generate negative tests for login, focus on empty fields, or paste curl here..."
              style={{
                width: '100%', padding: '12px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.bg,
                fontSize: 13, color: C.textPri, outline: 'none',
                minHeight: 100, resize: 'vertical'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12, background: C.bg }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.surface, color: C.textPri, fontSize: 13, fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 24px', borderRadius: 10, border: 'none',
              background: `linear-gradient(180deg, #278A99 0%, ${C.primary} 55%, ${C.primaryDark} 100%)`,
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30,112,125,0.25)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
            Generate
          </button>
        </div>
      </div>
    </div>
  )
}
