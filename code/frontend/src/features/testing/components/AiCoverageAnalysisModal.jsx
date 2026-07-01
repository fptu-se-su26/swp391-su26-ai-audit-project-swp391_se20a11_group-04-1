import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import testCaseService from '../services/testCaseService'

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
  danger:      '#EF4444',
}

export default function AiCoverageAnalysisModal({ isOpen, onClose, requirementId }) {
  const { projectId } = useParams()
  
  const [isLoading, setIsLoading] = useState(false)
  const [analysisText, setAnalysisText] = useState('')
  const [error, setError] = useState(null)

  const fetchAnalysis = useCallback(() => {
    if (!projectId || !requirementId) return
    setIsLoading(true)
    setAnalysisText('')
    setError(null)
    
    testCaseService.analyzeCoverageWithAi(projectId, requirementId)
      .then(res => setAnalysisText(res))
      .catch(err => {
        console.error("Failed to analyze coverage", err)
        setError(err.response?.data?.message || err.message || "An error occurred while analyzing coverage.")
      })
      .finally(() => setIsLoading(false))
  }, [projectId, requirementId])

  useEffect(() => {
    if (isOpen && projectId && requirementId) {
      fetchAnalysis()
    } else if (isOpen && !requirementId) {
      setError("Please select a Requirement first.")
    }
  }, [isOpen, projectId, requirementId, fetchAnalysis])

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: C.surface, borderRadius: 12, width: 800, maxWidth: '90%', maxHeight: '80vh',
        border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column',
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{ padding: 20, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: C.textPri, fontSize: 18, fontWeight: 600 }}>
              <span style={{ color: '#8B5CF6', marginRight: 8 }}>✨</span> 
              AI Coverage Analysis
            </h2>
            <p style={{ margin: '4px 0 0', color: C.textSec, fontSize: 13 }}>
              Evaluating existing test cases against Requirement #{requirementId}
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            style={{ 
              background: 'transparent', border: 'none', color: isLoading ? C.textMuted : C.textSec, 
              fontSize: 20, cursor: isLoading ? 'not-allowed' : 'pointer' 
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {error && (
            <div style={{ padding: 12, background: '#FEF2F2', color: C.danger, borderRadius: 6, marginBottom: 16, fontSize: 13, border: '1px solid #FECACA' }}>
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', border: `3px solid ${C.border}`, 
                borderTopColor: C.primary, animation: 'spin 1s linear infinite'
              }} />
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ color: C.textSec, fontSize: 14, marginTop: 16 }}>
                AI is analyzing coverage. This may take 10-30 seconds...
              </p>
            </div>
          ) : (
            <div style={{ 
              color: C.textPri, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap',
              background: C.bg, padding: 16, borderRadius: 8, border: `1px solid ${C.border}`
            }}>
              {analysisText || "No data."}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: 16, borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={fetchAnalysis}
            disabled={isLoading || !requirementId}
            style={{
              padding: '8px 16px', background: C.primaryLt, color: C.primary, border: `1px solid ${C.border}`,
              borderRadius: 6, cursor: (isLoading || !requirementId) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
              opacity: (isLoading || !requirementId) ? 0.6 : 1
            }}
          >
            🔄 Re-analyze
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '8px 16px', background: 'transparent', color: C.textPri, border: `1px solid ${C.border}`,
              borderRadius: 6, cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
