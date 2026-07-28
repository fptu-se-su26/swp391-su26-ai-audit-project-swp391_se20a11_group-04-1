import React from 'react'
import { useParams } from 'react-router-dom'
import GroupedTestCaseList from './GroupedTestCaseList'
import useTestCaseStore from '../stores/useTestCaseStore'
import { C } from '../utils/theme'

export default function RequirementWorkspace({ requirementId, testCases, onEdit, onDelete, onClearFilter }) {
  const { projectId } = useParams()
  const { openAiGenModal } = useTestCaseStore()

  const insights = React.useMemo(() => {
    const types = { UI: 0, API: 0, UNIT: 0, MANUAL: 0 }
    let passed = 0
    let notRun = 0
    testCases.forEach(tc => {
      if (types[tc.type] !== undefined) types[tc.type]++
      if (tc.status === 'PASS') passed++
      if (tc.status === 'NOT_RUN') notRun++
    })
    const total = testCases.length
    const passRate = total > 0 ? (passed / total) * 100 : 0
    const notRunRate = total > 0 ? (notRun / total) * 100 : 0
    
    const messages = []
    if (types.API === 0) messages.push("⚠ No API Tests detected. Add API tests for backend validation.")
    if (types.UI === 0) messages.push("⚠ No UI Tests detected. Add UI tests for frontend validation.")
    if (total > 0 && passRate < 30) messages.push(`⚠ Low Pass Rate (${Math.round(passRate)}%). Many tests are failing.`)
    if (total > 0 && notRunRate > 50) messages.push(`⚠ High Not-Run Rate (${Math.round(notRunRate)}%). Execute pending tests.`)
    if (total === 0) messages.push("⚠ No tests exist for this requirement.")
    
    return messages
  }, [testCases])

  const missingExecutableTypes = React.useMemo(() => {
    const types = { UI: 0, API: 0 }
    testCases.forEach(tc => {
      if (types[tc.type] !== undefined) types[tc.type]++
    })
    return Object.entries(types)
      .filter(([, count]) => count === 0)
      .map(([type]) => type)
  }, [testCases])

  return (
    <div style={{
      background: C.surface,
      borderRadius: '16px',
      border: `1px solid ${C.border}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      overflow: 'hidden'
    }}>
      {/* Workspace Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: `1px solid ${C.borderLight}`,
        background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.primaryHov} 0%, ${C.primary} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(30,112,125,0.2)'
              }}>
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>
                  fact_check
                </span>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: C.textPri, margin: 0 }}>
                Requirement Quality Workspace
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: C.textSec, margin: '0 0 0 48px' }}>
              Viewing test coverage for Requirement: <strong style={{ color: C.primary }}>{requirementId}</strong>
            </p>
          </div>

          <button
            onClick={onClearFilter}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`,
              background: C.surface, color: C.textSec, fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = C.textPri; e.currentTarget.style.borderColor = C.textMuted }}
            onMouseLeave={e => { e.currentTarget.style.color = C.textSec; e.currentTarget.style.borderColor = C.border }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
            Clear Filter
          </button>
        </div>
      </div>

      {/* Workspace Content */}
      <div style={{ padding: '32px', background: C.bg }}>
        
        {/* AI Insights Card */}
        {insights.length > 0 && (
          <div style={{
            marginBottom: '24px',
            background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
            padding: '20px', borderRadius: '12px', border: '1px solid #DDD6FE',
            boxShadow: '0 2px 8px rgba(139,92,246,0.1)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#6D28D9', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: 16 }}>✨</span> AI Insights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {insights.map((msg, i) => (
                <div key={i} style={{ fontSize: '13px', color: '#4C1D95', fontWeight: 500 }}>
                  {msg}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {missingExecutableTypes.map(type => (
                <button
                  key={type}
                  onClick={() => openAiGenModal({
                    testType: type,
                    additionalContext: `Generate ${type} test cases for this requirement using only source-scanned ${type === 'API' ? 'backend endpoints and request fields' : 'frontend selectors'}.`
                  })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: '#8B5CF6', color: '#fff', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', boxShadow: '0 2px 6px rgba(139,92,246,0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#7C3AED'}
                  onMouseLeave={e => e.currentTarget.style.background = '#8B5CF6'}
                >
                  <span style={{ fontSize: 14 }}>AI</span> Generate {type} Cases
                </button>
              ))}
              <button
                onClick={() => openAiGenModal()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #C4B5FD',
                  background: '#FFFFFF', color: '#6D28D9', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
              >
                <span style={{ fontSize: 14 }}>AI</span> Smart Generate
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: C.textPri, margin: 0 }}>
            Test Coverage Plan
          </h3>
          <div style={{ display: 'flex', gap: '16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.textSec }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: C.typeUIBg || '#EEF2FF', border: `1px solid ${C.typeUI || '#4F46E5'}` }}></div>
                UI
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.textSec }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: C.typeAPIBg || '#ECFDF5', border: `1px solid ${C.typeAPI || '#059669'}` }}></div>
                API
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.textSec }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: C.typeUNITBg || '#FFFBEB', border: `1px solid ${C.typeUNIT || '#D97706'}` }}></div>
                UNIT
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: C.textSec }}>
                <div style={{ width: 10, height: 10, borderRadius: '2px', background: C.typeMANUALBg || '#FDF2F8', border: `1px solid ${C.typeMANUAL || '#DB2777'}` }}></div>
                MANUAL
             </div>
          </div>
        </div>

        <GroupedTestCaseList 
          testCases={testCases} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          projectId={projectId} 
        />
      </div>
    </div>
  )
}
