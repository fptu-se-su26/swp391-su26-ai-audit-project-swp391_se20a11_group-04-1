import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useTestCaseStore from '../stores/useTestCaseStore';
import { testCaseService } from '../services/testCaseService';

const C = {
  primary: 'var(--project-theme, #1E707D)',
  primaryHov: 'var(--project-theme-hover, #278A99)',
  primaryLt: 'var(--project-theme-light, #D7EEF1)',
  accent: '#4EC6D8',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#D9E7E4',
  textPri: '#1F2937',
  textSec: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
};

export default function AiTestCaseReviewModal() {
  const { projectId } = useParams();
  const {
    isAiReviewOpen,
    currentGenerationId,
    aiGenerationResult,
    closeAiReview,
    fetchTestCases
  } = useTestCaseStore();

  const [testCases, setTestCases] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [error, setError] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [existingTitles, setExistingTitles] = useState([]);

  useEffect(() => {
    if (isAiReviewOpen && aiGenerationResult?.testCases?.length > 0) {
      setTestCases(aiGenerationResult.testCases);
      // Automatically select all
      setSelectedIndices(aiGenerationResult.testCases.map((_, i) => i));
      setExpandedIndex(0);
      setError(null);
      
      const reqId = aiGenerationResult.testCases[0]?.requirementId || null;
      if (projectId && reqId) {
        testCaseService.getTestCases(projectId, { requirementId: reqId, size: 500 })
          .then(res => {
            const items = res.content || res || [];
            const titles = items.map(tc => tc.title?.toLowerCase().trim());
            setExistingTitles(titles);
          })
          .catch(err => console.error("Failed to fetch existing test cases", err));
      } else {
        setExistingTitles([]);
      }
    }
  }, [isAiReviewOpen, aiGenerationResult, projectId]);

  if (!isAiReviewOpen) return null;

  const toggleSelect = (idx) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter(i => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === testCases.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(testCases.map((_, i) => i));
    }
  };

  const handleFieldChange = (idx, field, value) => {
    const updated = [...testCases];
    updated[idx] = { ...updated[idx], [field]: value };
    setTestCases(updated);
  };

  const handleApprove = async () => {
    if (selectedIndices.length === 0) {
      setError("Please select at least one Test Case to approve.");
      return;
    }
    setIsApproving(true);
    setError(null);
    try {
      await testCaseService.approveTestCaseGeneration(projectId, currentGenerationId, {
        selectedIndices,
        modifiedPayload: testCases
      });
      closeAiReview();
      await fetchTestCases(projectId);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to approve generation.");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRefine = async () => {
    if (!refineInstruction.trim()) return;
    setIsRefining(true);
    setError(null);
    try {
      const refined = await testCaseService.refineTestCasesWithAi(projectId, {
        existingTestCases: testCases,
        instruction: refineInstruction
      });
      setTestCases(refined);
      setSelectedIndices(refined.map((_, i) => i)); // re-select all after refine
      setRefineInstruction('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to refine test cases.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div style={{
        background: C.surface, borderRadius: 16, width: '100%', maxWidth: 1200, height: '90vh',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: 'Inter,-apple-system,sans-serif'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.textPri }}>Review Generated Test Cases</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textSec }}>
              AI has generated {testCases.length} test cases. Review, edit, and select the ones you want to approve.
            </p>
          </div>
          <button onClick={closeAiReview} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: C.textMuted }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Panel: Analysis */}
          <div style={{ width: 320, background: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: C.textPri, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: C.primary }}>analytics</span>
              AI Analysis
            </h3>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reasoning</label>
              <div style={{ fontSize: 13, color: C.textPri, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {aiGenerationResult?.reasoning || 'No reasoning provided.'}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage Summary</label>
              <div style={{ fontSize: 13, color: C.textPri, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {aiGenerationResult?.coverageSummary || 'No coverage summary provided.'}
              </div>
            </div>
          </div>

          {/* Middle Panel: List */}
          <div style={{ width: 350, background: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input 
                  type="checkbox" 
                  checked={selectedIndices.length === testCases.length && testCases.length > 0}
                  onChange={toggleSelectAll}
                  disabled={isRefining}
                  style={{ cursor: isRefining ? 'not-allowed' : 'pointer', width: 16, height: 16, accentColor: C.primary }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.textPri }}>Select All</span>
              </div>
              <span style={{ fontSize: 12, color: C.textSec, background: C.surface, padding: '4px 8px', borderRadius: 12 }}>
                {selectedIndices.length} / {testCases.length} selected
              </span>
            </div>

            {/* Refine Box */}
            <div style={{ padding: 16, borderBottom: `1px solid ${C.border}`, background: C.surface }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 6 }}>
                Refine with AI
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. Translate to Vietnamese"
                  value={refineInstruction}
                  onChange={e => setRefineInstruction(e.target.value)}
                  disabled={isRefining}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bg, color: C.textPri, fontSize: 13 }}
                  onKeyDown={e => e.key === 'Enter' && handleRefine()}
                />
                <button
                  onClick={handleRefine}
                  disabled={isRefining || !refineInstruction.trim()}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none', background: C.primary, color: '#fff',
                    cursor: (isRefining || !refineInstruction.trim()) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500,
                    opacity: (isRefining || !refineInstruction.trim()) ? 0.7 : 1
                  }}
                >
                  {isRefining ? '...' : 'Refine'}
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, opacity: isRefining ? 0.5 : 1, pointerEvents: isRefining ? 'none' : 'auto' }}>
              {testCases.map((tc, idx) => (
                <div key={idx} style={{
                  background: expandedIndex === idx ? C.surface : 'transparent',
                  border: `1px solid ${expandedIndex === idx ? C.primary : C.border}`,
                  borderRadius: 8, padding: 12, cursor: 'pointer',
                  boxShadow: expandedIndex === idx ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                }} onClick={() => setExpandedIndex(idx)}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <input type="checkbox" checked={selectedIndices.includes(idx)} onChange={() => toggleSelect(idx)} onClick={(e) => e.stopPropagation()} style={{ marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 4 }}>
                        {tc.title || 'Untitled'}
                        {existingTitles.includes(tc.title?.toLowerCase().trim()) && (
                          <span style={{ 
                            marginLeft: 8, padding: '2px 6px', fontSize: 10, 
                            background: C.warningBg, color: C.warning, 
                            borderRadius: 4, fontWeight: 600, border: `1px solid ${C.warning}` 
                          }}>
                            Duplicate
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: C.textSec, display: 'flex', gap: 6 }}>
                        <span style={{ padding: '2px 6px', background: C.primaryLt, color: C.primaryDark, borderRadius: 4, fontWeight: 500 }}>
                          {tc.type || 'MANUAL'}
                        </span>
                        <span>{tc.steps?.length || 0} steps</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Detail Editor */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: C.surface, opacity: isRefining ? 0.5 : 1, pointerEvents: isRefining ? 'none' : 'auto' }}>
            {error && (
              <div style={{ padding: 12, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, color: C.danger, fontSize: 13, display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                <span style={{ marginTop: 1 }}>{error}</span>
              </div>
            )}

            {expandedIndex !== null && testCases[expandedIndex] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Title */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 6 }}>Title</label>
                  <input
                    type="text"
                    value={testCases[expandedIndex].title || ''}
                    onChange={(e) => handleFieldChange(expandedIndex, 'title', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14 }}
                  />
                </div>

                {/* Precondition & Expected Result */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 6 }}>Precondition</label>
                    <textarea
                      value={testCases[expandedIndex].precondition || ''}
                      onChange={(e) => handleFieldChange(expandedIndex, 'precondition', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, minHeight: 80, resize: 'vertical' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 6 }}>Expected Result</label>
                    <textarea
                      value={testCases[expandedIndex].expectedResult || ''}
                      onChange={(e) => handleFieldChange(expandedIndex, 'expectedResult', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, minHeight: 80, resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8 }}>Test Steps</label>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    {(testCases[expandedIndex].steps || []).map((step, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', borderBottom: sIdx < testCases[expandedIndex].steps.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ width: 40, padding: 12, background: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: C.textSec }}>
                          {sIdx + 1}
                        </div>
                        <div style={{ flex: 1, padding: 12 }}>
                          <textarea
                            value={step.description || ''}
                            onChange={(e) => {
                              const newSteps = [...testCases[expandedIndex].steps];
                              newSteps[sIdx].description = e.target.value;
                              handleFieldChange(expandedIndex, 'steps', newSteps);
                            }}
                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 13, resize: 'none', padding: 0 }}
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={closeAiReview} disabled={isApproving} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.surface, color: C.textPri, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleApprove} disabled={isApproving || selectedIndices.length === 0} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: C.primary, color: '#fff', cursor: isApproving || selectedIndices.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>
            {isApproving ? 'Approving...' : `Approve ${selectedIndices.length} Test Cases`}
          </button>
        </div>
      </div>
    </div>
  );
}
