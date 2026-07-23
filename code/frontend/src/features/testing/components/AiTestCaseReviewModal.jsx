import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useTestCaseStore from '../stores/useTestCaseStore';
import { testCaseService } from '../services/testCaseService';
import TestStepEditor from './TestStepEditor';
import { normalizeUiSteps, uiStepToDescription } from '../utils/uiStepUtils';

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
  const [configTextDrafts, setConfigTextDrafts] = useState({});

  useEffect(() => {
    if (isAiReviewOpen) {
      const nextTestCases = Array.isArray(aiGenerationResult?.testCases)
        ? aiGenerationResult.testCases.filter(Boolean)
        : [];
      setTestCases(nextTestCases);
      // Automatically select all
      setSelectedIndices(nextTestCases.map((_, i) => i));
      setExpandedIndex(nextTestCases.length > 0 ? 0 : null);
      setError(null);
      setConfigTextDrafts({});
      
      const reqId = nextTestCases[0]?.requirementId || null;
      if (projectId && reqId) {
        testCaseService.getTestCases(projectId, { requirementId: reqId, size: 500 })
          .then(res => {
            const items = res.content || res || [];
            const titles = items.map(tc => tc.title?.toLowerCase().trim()).filter(Boolean);
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
    updated[idx] = markEdited({ ...updated[idx], [field]: value });
    setTestCases(updated);
  };

  const markEdited = (tc) => {
    if ((tc.validationStatus || '').toUpperCase() === 'INVALID') {
      const manualReviewMessage = 'WARNING: Edited after automatic validation; please review manually before approval.';
      const messages = Array.isArray(tc.validationMessages)
        ? tc.validationMessages.filter(msg => !String(msg).trim().toUpperCase().startsWith('ERROR:'))
        : [];
      if (!messages.includes(manualReviewMessage)) {
        messages.push(manualReviewMessage);
      }
      return { ...tc, validationStatus: 'WARNING', validationMessages: messages };
    }
    return tc;
  };

  const handleConfigFieldChange = (idx, field, value) => {
    const updated = [...testCases];
    const currentConfig = getConfig(idx);
    updated[idx] = markEdited({
      ...updated[idx],
      configuration: { ...currentConfig, [field]: value }
    });
    setTestCases(updated);
  };

  const handleArrayFieldChange = (idx, field, rawValue) => {
    const values = rawValue.split(',').map(v => v.trim()).filter(Boolean);
    handleFieldChange(idx, field, values);
  };

  const handleStepDescriptionChange = (idx, stepIdx, description) => {
    const currentSteps = getSteps(idx);
    const updatedSteps = currentSteps.map((step, i) => (
      i === stepIdx ? { ...step, description } : step
    ));
    handleFieldChange(idx, 'steps', updatedSteps);
  };

  const handleAddStep = (idx) => {
    const currentSteps = getSteps(idx);
    handleFieldChange(idx, 'steps', [
      ...currentSteps,
      { stepNumber: currentSteps.length + 1, description: '' }
    ]);
  };

  const handleRemoveStep = (idx, stepIdx) => {
    const currentSteps = getSteps(idx);
    const updatedSteps = currentSteps
      .filter((_, i) => i !== stepIdx)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }));
    handleFieldChange(idx, 'steps', updatedSteps);
  };

  const getSteps = (idx) => (
    Array.isArray(testCases[idx]?.steps) ? testCases[idx].steps : []
  );

  const getConfig = (idx) => {
    const config = testCases[idx]?.configuration;
    return config && typeof config === 'object' && !Array.isArray(config) ? config : {};
  };

  const handleUiExecutableStepsChange = (idx, nextSteps) => {
    const normalizedSteps = normalizeUiSteps(nextSteps);
    const updated = [...testCases];
    updated[idx] = markEdited({
      ...updated[idx],
      configuration: {
        ...getConfig(idx),
        type: 'UI',
        steps: normalizedSteps
      },
      steps: normalizedSteps.map((step, i) => ({
        stepNumber: i + 1,
        description: uiStepToDescription(step, i)
      }))
    });
    setTestCases(updated);
    setConfigTextDrafts(prev => {
      const next = { ...prev };
      delete next[`${idx}.steps`];
      return next;
    });
  };

  const getJsonDraftValue = (idx, field, fallback) => {
    const key = `${idx}.${field}`;
    if (configTextDrafts[key] !== undefined) return configTextDrafts[key];
    const value = getConfig(idx)?.[field] ?? fallback;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value ?? '');
    }
  };

  const handleJsonDraftChange = (idx, field, value) => {
    setConfigTextDrafts(prev => ({ ...prev, [`${idx}.${field}`]: value }));
  };

  const commitJsonDraft = (idx, field) => {
    const key = `${idx}.${field}`;
    const raw = configTextDrafts[key];
    if (raw === undefined) return;
    try {
      const parsed = raw.trim() ? JSON.parse(raw) : (field === 'apiAssertions' || field === 'steps' ? [] : {});
      if (field === 'steps' && testCases[idx]?.type === 'UI') {
        handleUiExecutableStepsChange(idx, parsed);
      } else {
        handleConfigFieldChange(idx, field, parsed);
      }
      setConfigTextDrafts(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setError(null);
    } catch {
      setError(`Invalid JSON in ${field}. Fix it before approving.`);
    }
  };

  const handleApprove = async () => {
    if (selectedIndices.length === 0) {
      setError("Please select at least one Test Case to approve.");
      return;
    }
    const invalidSelected = selectedIndices.some(i => (testCases[i]?.validationStatus || '').toUpperCase() === 'INVALID');
    if (invalidSelected) {
      setError("One or more selected Test Cases are still INVALID. Edit them first, then approve.");
      return;
    }
    if (Object.keys(configTextDrafts).length > 0) {
      setError("Apply or fix the executable configuration JSON before approving.");
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
    if (Object.keys(configTextDrafts).length > 0) {
      setError("Apply or fix the executable configuration JSON before refining.");
      return;
    }
    setIsRefining(true);
    setError(null);
    try {
      const refined = await testCaseService.refineTestCasesWithAi(projectId, {
        existingTestCases: testCases,
        instruction: refineInstruction
      });
      const refinedCases = Array.isArray(refined) ? refined.filter(Boolean) : [];
      setTestCases(refinedCases);
      setSelectedIndices(refinedCases.map((_, i) => i)); // re-select all after refine
      setExpandedIndex(refinedCases.length > 0 ? 0 : null);
      setRefineInstruction('');
      setConfigTextDrafts({});
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to refine test cases.");
    } finally {
      setIsRefining(false);
    }
  };

  const statusStyle = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'VALID': return { bg: C.successBg, color: C.success, border: C.success };
      case 'INVALID': return { bg: C.dangerBg, color: C.danger, border: C.danger };
      case 'WARNING': return { bg: C.warningBg, color: C.warning, border: C.warning };
      default: return { bg: C.bg, color: C.textSec, border: C.border };
    }
  };

  const renderPill = (label, style) => (
    <span style={{ padding: '2px 6px', background: style.bg, color: style.color, borderRadius: 4, fontSize: 10, fontWeight: 700, border: `1px solid ${style.border}` }}>
      {label}
    </span>
  );

  const renderJsonEditor = (idx, field, label, fallback) => {
    const draftKey = `${idx}.${field}`;
    const hasDraft = configTextDrafts[draftKey] !== undefined;

    return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec }}>{label}</label>
        {hasDraft && (
          <button
            type="button"
            onClick={() => commitJsonDraft(idx, field)}
            style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
          >
            Apply
          </button>
        )}
      </div>
      <textarea
        value={getJsonDraftValue(idx, field, fallback)}
        onChange={(e) => handleJsonDraftChange(idx, field, e.target.value)}
        onBlur={() => commitJsonDraft(idx, field)}
        spellCheck={false}
        style={{ width: '100%', minHeight: 90, padding: 10, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12, resize: 'vertical' }}
      />
    </div>
    );
  };

  const renderTypeConfigEditor = (idx) => {
    const tc = testCases[idx];
    if (!tc) return null;
    const config = getConfig(idx);

    if (tc.type === 'API') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 6 }}>Method</label>
              <select
                value={config.apiMethod || 'GET'}
                onChange={(e) => handleConfigFieldChange(idx, 'apiMethod', e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg }}
              >
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 6 }}>URL</label>
              <input
                value={config.apiUrl ?? config.apiEndpoint ?? ''}
                onChange={(e) => handleConfigFieldChange(idx, 'apiUrl', e.target.value)}
                style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13 }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {renderJsonEditor(idx, 'apiHeaders', 'Headers JSON', { 'Content-Type': 'application/json' })}
            {renderJsonEditor(idx, 'apiQueryParams', 'Query Params JSON', {})}
          </div>
          {renderJsonEditor(idx, 'apiBody', 'Body JSON', {})}
          {renderJsonEditor(idx, 'apiAssertions', 'Assertions JSON', [])}
        </div>
      );
    }

    if (tc.type === 'UI') {
      const uiSteps = normalizeUiSteps(config.steps, getSteps(idx));
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 6 }}>Base URL</label>
            <input
              value={config.baseUrl || ''}
              onChange={(e) => handleConfigFieldChange(idx, 'baseUrl', e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, fontSize: 13 }}
            />
          </div>
          <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg }}>
            <TestStepEditor
              steps={uiSteps}
              isUiTest
              onChange={(nextSteps) => handleUiExecutableStepsChange(idx, nextSteps)}
            />
          </div>
          {renderJsonEditor(idx, 'steps', 'Executable Steps JSON', [])}
        </div>
      );
    }

    return (
      <div style={{ padding: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.textSec }}>
        This type has no executable configuration.
      </div>
    );
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
        fontFamily: 'Inter,-apple-system,sans-serif', minWidth: 0
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

            {aiGenerationResult?.sourceContextStatus && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Source Grounding</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  <span style={{ color: aiGenerationResult.sourceContextStatus.selectorAvailable ? C.success : C.textSec }}>
                    UI selectors: {aiGenerationResult.sourceContextStatus.selectorAvailable ? 'available' : (aiGenerationResult.sourceContextStatus.selectorRequested ? 'unavailable' : 'not requested')}
                  </span>
                  <span style={{ color: aiGenerationResult.sourceContextStatus.apiKnowledgeAvailable ? C.success : C.textSec }}>
                    API knowledge: {aiGenerationResult.sourceContextStatus.apiKnowledgeAvailable ? 'available' : (aiGenerationResult.sourceContextStatus.apiKnowledgeRequested ? 'unavailable' : 'not requested')}
                  </span>
                </div>
              </div>
            )}

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
                        {tc.title && existingTitles.includes(tc.title.toLowerCase().trim()) && (
                          <span style={{ 
                            marginLeft: 8, padding: '2px 6px', fontSize: 10, 
                            background: C.warningBg, color: C.warning, 
                            borderRadius: 4, fontWeight: 600, border: `1px solid ${C.warning}` 
                          }}>
                            Duplicate
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: C.textSec, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ padding: '2px 6px', background: C.primaryLt, color: C.primaryDark, borderRadius: 4, fontWeight: 500 }}>
                          {tc.type || 'MANUAL'}
                        </span>
                        {renderPill(tc.validationStatus || 'UNVALIDATED', statusStyle(tc.validationStatus))}
                        {tc.scenarioType && (
                          <span style={{ padding: '2px 6px', background: C.bg, color: C.textSec, borderRadius: 4, fontWeight: 500, border: `1px solid ${C.border}` }}>
                            {tc.scenarioType}
                          </span>
                        )}
                        <span>{Array.isArray(tc.steps) ? tc.steps.length : 0} steps</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Detail Editor */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', padding: 24, background: C.surface, opacity: isRefining ? 0.5 : 1, pointerEvents: isRefining ? 'none' : 'auto' }}>
            {error && (
              <div style={{ padding: 12, background: C.dangerBg, border: `1px solid ${C.danger}`, borderRadius: 8, color: C.danger, fontSize: 13, display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
                <span style={{ marginTop: 1 }}>{error}</span>
              </div>
            )}

            {expandedIndex !== null && testCases[expandedIndex] && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Validation */}
                <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${statusStyle(testCases[expandedIndex].validationStatus).border}`, background: statusStyle(testCases[expandedIndex].validationStatus).bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <strong style={{ fontSize: 13, color: statusStyle(testCases[expandedIndex].validationStatus).color }}>
                      Validation: {testCases[expandedIndex].validationStatus || 'UNVALIDATED'}
                    </strong>
                    <span style={{ fontSize: 12, color: C.textSec }}>
                      {(testCases[expandedIndex].sourceGrounding || []).join(' / ') || 'No grounding'}
                    </span>
                  </div>
                  {(testCases[expandedIndex].validationMessages || []).length > 0 && (
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18, color: C.textPri, fontSize: 12, lineHeight: 1.5 }}>
                      {testCases[expandedIndex].validationMessages.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </div>

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

                {/* Traceability */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 6 }}>Covered AC</label>
                    <input
                      type="text"
                      value={(testCases[expandedIndex].coveredAcceptanceCriteria || []).join(', ')}
                      placeholder="AC-1, AC-2"
                      onChange={(e) => handleArrayFieldChange(expandedIndex, 'coveredAcceptanceCriteria', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 6 }}>Scenario</label>
                    <select
                      value={testCases[expandedIndex].scenarioType || 'positive'}
                      onChange={(e) => handleFieldChange(expandedIndex, 'scenarioType', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, background: C.surface }}
                    >
                      {['positive', 'negative', 'validation', 'boundary', 'security'].map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 6 }}>Covered Use Cases</label>
                    <input
                      type="text"
                      value={(testCases[expandedIndex].coveredUseCases || []).join(', ')}
                      onChange={(e) => handleArrayFieldChange(expandedIndex, 'coveredUseCases', e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13 }}
                    />
                  </div>
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

                {/* Executable Config */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri, marginBottom: 8 }}>Executable Configuration</label>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, background: C.surface }}>
                    {renderTypeConfigEditor(expandedIndex)}
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.textPri }}>Test Steps</label>
                    <button
                      type="button"
                      onClick={() => handleAddStep(expandedIndex)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                      Add Step
                    </button>
                  </div>
                  <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    {getSteps(expandedIndex).length === 0 && (
                      <div style={{ padding: 14, color: C.textSec, fontSize: 13, background: C.bg }}>
                        No steps yet.
                      </div>
                    )}
                    {getSteps(expandedIndex).map((step, sIdx) => (
                      <div key={sIdx} style={{ display: 'flex', borderBottom: sIdx < getSteps(expandedIndex).length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ width: 40, padding: 12, background: C.bg, borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: C.textSec }}>
                          {sIdx + 1}
                        </div>
                        <div style={{ flex: 1, padding: 12 }}>
                          <textarea
                            value={step.description || ''}
                            onChange={(e) => handleStepDescriptionChange(expandedIndex, sIdx, e.target.value)}
                            style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 13, resize: 'none', padding: 0 }}
                            rows={2}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(expandedIndex, sIdx)}
                          style={{ width: 42, border: 'none', borderLeft: `1px solid ${C.border}`, background: C.surface, color: C.textMuted, cursor: 'pointer' }}
                          title="Remove step"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        </button>
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
