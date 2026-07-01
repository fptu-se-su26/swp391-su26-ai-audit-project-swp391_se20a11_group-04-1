import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import useTestCaseStore from '../stores/useTestCaseStore'
import StatusBadge from './StatusBadge'
import TypeBadge from './TypeBadge'

const C = {
  primary:     '#1E707D',
  primaryHov:  '#278A99',
  surface:     '#FFFFFF',
  border:      '#D9E7E4',
  textPri:     '#1F2937',
  textSec:     '#6B7280',
  textMuted:   '#9CA3AF',
  bg:          '#F8FAFC',
}

export default function TestCaseDetailDrawer() {
  const { projectId } = useParams()
  const { isDrawerOpen, drawerTestCaseId, closeDrawer, selectedTestCase, fetchTestCaseDetail, isLoading, openEditForm, openDeleteDialog } = useTestCaseStore()

  useEffect(() => {
    if (isDrawerOpen && drawerTestCaseId) {
      fetchTestCaseDetail(projectId, drawerTestCaseId)
    }
  }, [isDrawerOpen, drawerTestCaseId, projectId, fetchTestCaseDetail])

  return (
    <>
      {/* Backdrop */}
      {isDrawerOpen && (
        <div 
          onClick={closeDrawer}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.2)', zIndex: 40,
            backdropFilter: 'blur(2px)'
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 450, background: C.surface, zIndex: 50,
        boxShadow: '-4px 0 16px rgba(0,0,0,0.05)',
        transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter,-apple-system,sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.textPri, letterSpacing: '-0.02em' }}>
            Test Case Details
          </h2>
          <button 
            onClick={closeDrawer}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.textMuted, display: 'flex', padding: 4
            }}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {isLoading && !selectedTestCase ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <span className="material-symbols-outlined animate-spin" style={{ color: C.primary, fontSize: 32 }}>progress_activity</span>
            </div>
          ) : !selectedTestCase ? (
            <div style={{ color: C.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 }}>Test case not found</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Title & Badges */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 6 }}>
                  {selectedTestCase.code}
                </div>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 20, fontWeight: 700, color: C.textPri, lineHeight: 1.3 }}>
                  {selectedTestCase.title}
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <TypeBadge type={selectedTestCase.type} />
                  <StatusBadge status={selectedTestCase.status} />
                  {selectedTestCase.requirement && (
                    <span style={{
                      padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                      background: C.bg, border: `1px solid ${C.border}`, color: C.textSec
                    }}>
                      {selectedTestCase.requirement.reqCode || `REQ-${selectedTestCase.requirement.id}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <button
                  onClick={() => openEditForm(selectedTestCase)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    background: C.bg, border: `1px solid ${C.border}`, color: C.textPri,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.primary }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.border }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  Edit
                </button>
                <button
                  onClick={() => { closeDrawer(); openDeleteDialog(selectedTestCase) }}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                  Delete
                </button>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Precondition</h4>
                  <div style={{ fontSize: 13, color: C.textPri, background: C.bg, padding: 14, borderRadius: 10, border: `1px solid ${C.border}`, lineHeight: 1.5 }}>
                    {selectedTestCase.precondition || 'None'}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Expected Result</h4>
                  <div style={{ fontSize: 13, color: C.textPri, background: '#F0FDF4', padding: 14, borderRadius: 10, border: '1px solid #BBF7D0', lineHeight: 1.5 }}>
                    {selectedTestCase.expectedResult || 'None'}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Steps</h4>
                  {selectedTestCase.steps?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedTestCase.steps.map((step, idx) => (
                        <div key={step.id || idx} style={{
                          display: 'flex', gap: 12, background: C.bg, padding: '12px 14px',
                          borderRadius: 10, border: `1px solid ${C.border}`
                        }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%', background: C.primary, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {step.stepNumber}
                          </div>
                          <div style={{ fontSize: 13, color: C.textPri, lineHeight: 1.5 }}>{step.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: C.textSec, fontStyle: 'italic' }}>No steps defined.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
