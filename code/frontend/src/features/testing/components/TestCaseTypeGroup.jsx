import React, { useState } from 'react'
import TestCaseTableRow from './TestCaseTableRow'
import { C, T } from '../utils/theme'

export default function TestCaseTypeGroup({ type, testCases, onEdit, onDelete, projectId }) {
  const [isExpanded, setIsExpanded] = useState(true)

  const typeColors = {
    UI: { color: C.typeUI || '#4F46E5', bg: C.typeUIBg || '#EEF2FF' },
    API: { color: C.typeAPI || '#059669', bg: C.typeAPIBg || '#ECFDF5' },
    UNIT: { color: C.typeUNIT || '#D97706', bg: C.typeUNITBg || '#FFFBEB' },
    MANUAL: { color: C.typeMANUAL || '#DB2777', bg: C.typeMANUALBg || '#FDF2F8' }
  }
  
  const tcColor = typeColors[type] || { color: C.textSec, bg: C.bg }
  
  // Calculate metrics
  const totalCount = testCases.length
  const passedCount = testCases.filter(tc => tc.status === 'PASS').length
  const passRate = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0
  
  const notRunCount = testCases.filter(tc => tc.status === 'NOT_RUN' || !tc.status).length
  const failedCount = testCases.filter(tc => tc.status === 'FAIL').length
  const blockedCount = testCases.filter(tc => tc.status === 'BLOCKED').length

  return (
    <div style={{
      marginBottom: '16px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      {/* Group Header */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: tcColor.bg,
          cursor: 'pointer',
          borderBottom: isExpanded ? `1px solid ${C.borderLt}` : 'none',
          transition: 'background 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: 4, color: tcColor.color,
            transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>expand_more</span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: tcColor.color }}>
              {type} Tests
            </span>
            <span style={{ 
              fontSize: '12px', fontWeight: 600, padding: '2px 8px', 
              borderRadius: '20px', background: 'rgba(0,0,0,0.05)', color: tcColor.color 
            }}>
              {totalCount}
            </span>
          </div>
        </div>
        
        {/* Header Metrics */}
        {totalCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: C.textSec, fontWeight: 500 }}>Pass Rate:</span>
              <span style={{ 
                fontSize: '13px', fontWeight: 700, 
                color: passRate === 100 ? C.success : (passRate > 50 ? C.warning : C.danger) 
              }}>
                {passRate}%
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
              <div title="Passed" style={{ width: 8, height: 8, borderRadius: '50%', background: C.success, opacity: passedCount > 0 ? 1 : 0.2 }}></div>
              <div title="Failed" style={{ width: 8, height: 8, borderRadius: '50%', background: C.danger, opacity: failedCount > 0 ? 1 : 0.2 }}></div>
              <div title="Blocked" style={{ width: 8, height: 8, borderRadius: '50%', background: C.warning, opacity: blockedCount > 0 ? 1 : 0.2 }}></div>
              <div title="Not Run" style={{ width: 8, height: 8, borderRadius: '50%', background: C.border, opacity: notRunCount > 0 ? 1 : 0.2 }}></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Group Content */}
      {isExpanded && (
        <div>
          {totalCount > 0 ? (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <tbody>
                {testCases.map(tc => (
                  <TestCaseTableRow 
                    key={tc.id} 
                    testCase={tc} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                  />
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ 
              padding: '40px 20px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px' 
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: C.textMuted }}>
                assignment_turned_in
              </span>
              <p style={{ color: C.textSec, fontSize: '14px', margin: 0 }}>
                No {type} test cases found.
              </p>
              
              <div style={{ 
                marginTop: '12px', padding: '16px', background: C.bg, 
                border: `1px dashed ${C.border}`, borderRadius: '12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.primary }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>auto_awesome</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>AI Recommendation</span>
                </div>
                <p style={{ fontSize: '13px', color: C.textPri, margin: 0, textAlign: 'center', maxWidth: '300px' }}>
                  Generate {type.toLowerCase()} test coverage to ensure requirement quality and validation.
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: `linear-gradient(135deg, ${C.primaryHov || C.primary} 0%, ${C.primary} 100%)`,
                    color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(30,112,125,0.25)'
                  }}>
                    Generate {type} Cases
                  </button>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 16px', borderRadius: '8px', border: `1px solid ${C.border}`,
                    background: C.surface, color: C.textPri, fontSize: '13px', fontWeight: 500, cursor: 'pointer'
                  }}>
                    Create Manually
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
