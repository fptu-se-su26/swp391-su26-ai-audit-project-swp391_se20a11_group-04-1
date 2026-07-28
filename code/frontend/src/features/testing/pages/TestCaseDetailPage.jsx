import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import useTestCaseStore from '../stores/useTestCaseStore'
import StatusBadge from '../components/StatusBadge'
import TypeBadge from '../components/TypeBadge'
import LiveTestRunner from '../components/LiveTestRunner'
import TestCaseFormModal from '../components/TestCaseFormModal'
import { getTestRunHistory } from '../services/testRunService'
import TestRunHistoryTimeline from '../components/TestRunHistoryTimeline'
import HistoricalTestRunModal from '../components/HistoricalTestRunModal'
import ApiTestCaseBuilder from '../components/ApiTestCaseBuilder'
import { testCaseService } from '../services/testCaseService'
import { CreateBugModal, bugService } from '../../issue-tracker'
import useProjectStore from '@store/useProjectStore'
import toast from 'react-hot-toast'

import Card from '../../../components/ui/Card'
import SectionTitle from '../../../components/ui/SectionTitle'
import FieldLabel from '../../../components/ui/FieldLabel'
import Button from '../../../components/ui/Button'
import { SELECTOR_ACTIONS, normalizeUiSteps } from '../utils/uiStepUtils'

// ── Design tokens ──────────────────────────────────────────────
const C = {
  primary:      '#1E707D',
  primaryHov:   '#278A99',
  primaryDark:  '#165964',
  primaryLight: '#D7EEF1',
  accentGlow:   '#4EC6D8',
  success:      '#22C55E',  successBg:  '#F0FDF4',  successBdr: '#BBF7D0',
  danger:       '#EF4444',  dangerBg:   '#FEF2F2',  dangerBdr:  '#FECACA',
  warning:      '#F59E0B',  warningBg:  '#FFFBEB',  warningBdr: '#FDE68A',
  info:         '#3B82F6',  infoBg:     '#EFF6FF',  infoBdr:    '#BFDBFE',
  bg:           '#F8FAFC',
  surface:      '#FFFFFF',
  border:       '#D9E7E4',
  borderLight:  '#EBF5F7',
  textPri:      '#1F2937',
  textSec:      '#6B7280',
  textMuted:    '#9CA3AF',
}

const ICON_BG = 'linear-gradient(135deg, #2b99a8, #1e707d)'
const SectionCard = Card;

const BtnPrimary = ({ children, onClick, disabled, icon }) => (
  <Button variant="primary" onClick={onClick} disabled={disabled} style={{ padding: '0 22px', borderRadius: '16px' }}>
    {icon && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>}
    {children}
  </Button>
);

const BtnSecondary = ({ children, onClick, icon, danger = false }) => (
  <Button variant={danger ? "danger" : "outline"} onClick={onClick} style={{ height: 40, padding: '0 18px' }}>
    {icon && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>}
    {children}
  </Button>
);

// ── API Execution Tracker ──────────────────────────────────────
const ApiExecutionTracker = ({ apiTestResult, onSaveResult }) => {
  const isPassed = apiTestResult?.status === 'PASSED'
  const isFailed = ['FAILED','ERROR'].includes(apiTestResult?.status)
  const statusColor = isPassed ? C.success : C.danger
  const statusBg    = isPassed ? C.successBg : C.dangerBg
  const statusBdr   = isPassed ? C.successBdr : C.dangerBdr

  if (!apiTestResult) return (
    <Card style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'48px 16px', gap:12,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize:44, color: C.border }}>play_circle</span>
      <span style={{ fontSize:13, color: C.textMuted, textAlign:'center' }}>
        Click "Run API Test" to execute and see results here.
      </span>
    </Card>
  )

  return (
    <Card style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* Status bar */}
      <div style={{
        padding:'14px 20px', borderRadius:14,
        background: statusBg, border:`1px solid ${statusBdr}`,
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          {/* Status pill */}
          <span style={{
            padding:'4px 14px', borderRadius:99, fontSize:12, fontWeight:700,
            background: statusColor, color:'#fff',
            boxShadow:`0 2px 8px ${isPassed ? 'rgba(34,197,94,.30)' : 'rgba(239,68,68,.30)'}`,
          }}>{apiTestResult.status}</span>

          {/* Status code */}
          <span style={{ fontSize:13, color: C.textSec, display:'flex', alignItems:'center', gap:6 }}>
            Status Code:
            <code style={{ background:'rgba(0,0,0,.06)', padding:'2px 8px', borderRadius:6, fontFamily:'monospace', fontSize:12 }}>
              {apiTestResult.statusCode || 'N/A'}
            </code>
          </span>

          {/* Response time */}
          <span style={{ fontSize:13, color: C.textSec }}>
            {apiTestResult.responseTimeMs || 0}ms
          </span>
        </div>

        {/* Save / saved */}
        {!apiTestResult.isSaved && ['PASSED','FAILED','ERROR'].includes(apiTestResult.status) ? (
          <BtnPrimary icon="save" onClick={onSaveResult}>Save to History</BtnPrimary>
        ) : apiTestResult.isSaved ? (
          <span style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'5px 14px', borderRadius:10,
            background: C.successBg, border:`1px solid ${C.successBdr}`,
            fontSize:12, fontWeight:600, color: C.success,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize:14, fontVariationSettings:"'FILL' 1" }}>check_circle</span>
            Saved to History
          </span>
        ) : null}
      </div>

      {/* Error box */}
      {(apiTestResult.error || apiTestResult.errorMessage) && (
        <div style={{
          display:'flex', alignItems:'flex-start', gap:10,
          padding:'12px 16px', borderRadius:12,
          background: C.dangerBg, border:`1px solid ${C.dangerBdr}`,
          color: C.danger, fontSize:13,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize:18, fontVariationSettings:"'FILL' 1", flexShrink:0 }}>cancel</span>
          <span>{apiTestResult.error || apiTestResult.errorMessage}</span>
        </div>
      )}

      {/* Response grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* LEFT */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Headers */}
          <div>
            <FieldLabel>Response Headers</FieldLabel>
            <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden' }}>
              {apiTestResult.responseHeaders && Object.keys(apiTestResult.responseHeaders).length > 0 ? (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                  <tbody>
                    {Object.entries(apiTestResult.responseHeaders).map(([k,v], idx) => (
                      <tr key={k} style={{ borderBottom:`1px solid ${C.borderLight}`, background: idx % 2 === 0 ? C.surface : C.bg }}>
                        <td style={{ padding:'8px 12px', fontWeight:600, color: C.textSec, width:'35%', wordBreak:'break-all' }}>{k}</td>
                        <td style={{ padding:'8px 12px', fontFamily:'JetBrains Mono,monospace', fontSize:11, color: C.textPri, wordBreak:'break-all' }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding:'12px', color: C.textMuted, fontSize:12, fontStyle:'italic' }}>No headers returned.</div>
              )}
            </div>
          </div>

          {/* Body */}
          <div>
            <FieldLabel>Response Body</FieldLabel>
            <pre style={{
              background:'#0F1117', color:'#E2E8F0',
              border:'1px solid #1E2A3A', borderRadius:12,
              padding:'14px 16px', fontSize:11,
              fontFamily:'JetBrains Mono,ui-monospace,monospace',
              maxHeight:320, overflow:'auto', lineHeight:1.7,
            }}>
              {apiTestResult.responseBody
                ? (() => { try { return JSON.stringify(JSON.parse(apiTestResult.responseBody), null, 2) } catch { return apiTestResult.responseBody } })()
                : <span style={{ color:'#475569', fontStyle:'italic' }}>No body content</span>}
            </pre>
          </div>
        </div>

        {/* RIGHT — Assertions */}
        <div>
          <FieldLabel>Assertion Results</FieldLabel>
          <ul style={{ display:'flex', flexDirection:'column', gap:8, listStyle:'none', padding:0, margin:0 }}>
            {apiTestResult.assertionResults?.length > 0
              ? apiTestResult.assertionResults.map((a, idx) => (
                <li key={idx} style={{
                  padding:'10px 14px', borderRadius:12,
                  background: a.passed ? C.successBg : C.dangerBg,
                  border:`1px solid ${a.passed ? C.successBdr : C.dangerBdr}`,
                }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <span className="material-symbols-outlined" style={{
                      fontSize:18, marginTop:1, flexShrink:0,
                      color: a.passed ? C.success : C.danger,
                      fontVariationSettings:"'FILL' 1",
                    }}>{a.passed ? 'check_circle' : 'cancel'}</span>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color: C.textPri }}>
                        {a.assertion?.type}{a.assertion?.property ? ` (${a.assertion.property})` : ''} {a.assertion?.operator} {a.assertion?.expectedValue}
                      </div>
                      {!a.passed && (
                        <div style={{ marginTop:4, fontFamily:'JetBrains Mono,monospace', fontSize:11, color: C.danger }}>
                          Actual: {a.actualValue}
                          {a.errorMessage && <div style={{ opacity:.8, marginTop:2 }}>{a.errorMessage}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))
              : (
                <li style={{
                  padding:24, textAlign:'center',
                  background: C.bg, border:`1px solid ${C.borderLight}`,
                  borderRadius:12, color: C.textMuted, fontSize:13, fontStyle:'italic',
                }}>No assertions run.</li>
              )
            }
          </ul>
        </div>
      </div>
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function TestCaseDetailPage() {
  const { projectId = '1', id: testCaseId } = useParams()
  const {
    selectedTestCase: testCase,
    isLoading, error,
    fetchTestCaseDetail,
    isFormOpen, editingTestCase,
    openEditForm, closeForm, updateTestCase,
  } = useTestCaseStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError]       = useState(null)
  const [history, setHistory]           = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistoricalRunId, setSelectedHistoricalRunId] = useState(null)
  const [apiTestResult, setApiTestResult]   = useState(null)
  const [isApiRunning, setIsApiRunning]     = useState(false)
  const pollingRef = useRef(null)

  // Bug Modal State
  const [showBugModal, setShowBugModal] = useState(false)
  const activeProject = useProjectStore((state) => state.activeProject)
  
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current) }, [])

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true); setFormError(null)
    try {
      await updateTestCase(projectId, testCaseId, payload, true)
      await fetchTestCaseDetail(projectId, testCaseId)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred.')
    } finally { setIsSubmitting(false) }
  }

  const handleRunApi = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setIsApiRunning(true); setApiTestResult(null)
    try {
      const initialRes = await useTestCaseStore.getState().runApiTest(projectId, testCaseId)
      if (initialRes && ['PASSED','FAILED','ERROR'].includes(initialRes.status)) {
        setApiTestResult(initialRes); setIsApiRunning(false); return
      }
      if (!initialRes?.id) {
        setApiTestResult({ error: 'Failed to start API test' }); setIsApiRunning(false); return
      }
      let attempt = 0
      pollingRef.current = setInterval(async () => {
        attempt++
        try {
          const latest = await testCaseService.getApiTestResult(projectId, testCaseId, initialRes.id)
          if (latest && ['PASSED','FAILED','ERROR'].includes(latest.status)) {
            setApiTestResult(latest); setIsApiRunning(false); clearInterval(pollingRef.current)
          } else if (attempt >= 15) {
            setApiTestResult({ error: 'Timeout waiting for result' })
            setIsApiRunning(false); clearInterval(pollingRef.current)
          }
        } catch {}
      }, 2000)
    } catch (err) { setApiTestResult({ error: err.message }); setIsApiRunning(false) }
  }

  const handleSaveResult = async () => {
    if (!apiTestResult?.id) return
    try {
      const saved = await testCaseService.saveApiTestResult(projectId, testCaseId, apiTestResult.id)
      setApiTestResult(saved)
      testCaseService.getApiTestResults(projectId, testCaseId).then(setHistory)
    } catch {}
  }

  useEffect(() => {
    if (testCaseId) fetchTestCaseDetail(projectId, testCaseId)
  }, [projectId, testCaseId, fetchTestCaseDetail])

  const handleCreateBug = async (payload) => {
    try {
      await bugService.createBug(projectId, payload)
      toast.success('Bug report created successfully!')
      setShowBugModal(false)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create bug')
    }
  }

  useEffect(() => {
    if (!testCase) return
    setHistoryLoading(true)
    const loader = testCase.type === 'API'
      ? testCaseService.getApiTestResults(projectId, testCase.id)
      : getTestRunHistory(testCase.id)
    loader.then(r => setHistory(r || [])).catch(() => setHistory([])).finally(() => setHistoryLoading(false))
  }, [testCase, projectId])

  // ── Loading / Error states ────────────────────────────────────
  if (isLoading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100%', flex:1 }}>
      <span className="material-symbols-outlined animate-spin" style={{ fontSize:'40px', color: C.primary }}>
        progress_activity
      </span>
    </div>
  )

  if (error || !testCase) return (
    <div style={{ padding:'32px' }}>
      <div style={{
        background: C.dangerBg, border: `1px solid ${C.dangerBdr}`,
        borderRadius:'12px', padding:'16px', color: C.danger, textAlign:'center',
      }}>
        {error || 'Test case not found.'}
      </div>
    </div>
  )

  const stepsToRender = testCase.type === 'UI'
    ? normalizeUiSteps(testCase.configuration?.steps, testCase.steps)
    : (testCase.steps || [])

  return (
    <div style={{ background: C.bg, minHeight: '100%' }}>

      {/* Breadcrumbs */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'20px' }}>
        <Link to={`/projects/${projectId}/test-cases`} style={{
          fontSize:'13px', fontWeight:500, color: C.textSec,
          textDecoration:'none', transition:'color 150ms',
        }}
          onMouseEnter={e => e.target.style.color = C.primary}
          onMouseLeave={e => e.target.style.color = C.textSec}
        >
          Test Cases
        </Link>
        <span className="material-symbols-outlined" style={{ fontSize:'16px', color: C.textMuted }}>chevron_right</span>
        <span style={{ fontSize:'13px', fontWeight:600, color: C.textPri }}>{testCase.code}</span>
      </div>

      {/* Page header */}
      <div style={{
        display:       'flex',
        justifyContent:'space-between',
        alignItems:    'flex-start',
        marginBottom:  '24px',
        gap:           '16px',
        flexWrap:      'wrap',
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px', flexWrap:'wrap' }}>
            <h1 style={{ fontSize:'22px', fontWeight:800, color: C.textPri, lineHeight:1.3 }}>
              {testCase.title}
            </h1>
            <StatusBadge status={testCase.status} />
            <TypeBadge type={testCase.type} />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', fontSize:'12px', color: C.textSec }}>
            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'15px' }}>account_circle</span>
              Created by {testCase.createdBy?.username || '--'}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'15px' }}>calendar_today</span>
              {testCase.createdAt ? new Date(testCase.createdAt).toLocaleDateString() : '--'}
            </span>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
          <BtnSecondary icon="edit" onClick={() => { setFormError(null); openEditForm(testCase) }}>
            Edit Test Case
          </BtnSecondary>
          <BtnSecondary icon="bug_report" danger onClick={() => setShowBugModal(true)}>
            Report Bug
          </BtnSecondary>
          {testCase.type === 'API' ? (
            <BtnPrimary icon={isApiRunning ? 'hourglass_top' : 'play_arrow'} onClick={handleRunApi} disabled={isApiRunning}>
              {isApiRunning ? 'Running…' : 'Run API Test'}
            </BtnPrimary>
          ) : (
            <BtnPrimary icon="play_arrow">Run Test Case</BtnPrimary>
          )}
        </div>
      </div>

      {/* Main grid — 1fr 380px */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'20px', alignItems:'start' }}>

        {/* ── Left column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Setup & Traceability */}
          <SectionCard>
            <SectionTitle icon="account_tree">Setup &amp; Traceability</SectionTitle>

            <div style={{
              display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px',
              marginBottom:'16px', padding:'16px',
              background: C.bg, border:`1px solid ${C.borderLight}`, borderRadius:'12px',
            }}>
              <div>
                <FieldLabel>Linked Requirement</FieldLabel>
                <a href="#" style={{
                  display:'inline-flex', alignItems:'center', gap:'4px',
                  fontSize:'13px', fontWeight:600, color: C.primary, textDecoration:'none',
                }}>
                  {testCase.requirement?.code || 'REQ-01'}
                  <span className="material-symbols-outlined" style={{ fontSize:'14px' }}>open_in_new</span>
                </a>
              </div>
              <div>
                <FieldLabel>Module</FieldLabel>
                <span style={{ fontSize:'13px', fontWeight:600, color: C.textPri }}>
                  {testCase.module || 'Authentication'}
                </span>
              </div>
              {testCase.type === 'UI' && testCase.configuration?.baseUrl && testCase.configuration.baseUrl !== 'null' && (
                <div style={{ gridColumn:'1/-1' }}>
                  <FieldLabel>Base URL (Automated Test)</FieldLabel>
                  <a href={testCase.configuration.baseUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display:'inline-flex', alignItems:'center', gap:'4px',
                      fontSize:'13px', fontWeight:500, color: C.primary, textDecoration:'none',
                    }}>
                    {testCase.configuration.baseUrl}
                    <span className="material-symbols-outlined" style={{ fontSize:'14px' }}>open_in_new</span>
                  </a>
                </div>
              )}
            </div>

            <div>
              <FieldLabel>Preconditions</FieldLabel>
              <div style={{
                padding:'14px', background: C.bg,
                border:`1px solid ${C.borderLight}`, borderRadius:'12px',
                fontSize:'13px', color: C.textPri, whiteSpace:'pre-wrap', lineHeight:1.6,
              }}>
                {testCase.precondition || 'No preconditions specified.'}
              </div>
            </div>
          </SectionCard>

          {/* Steps / API Builder */}
          {testCase.type === 'API' ? (
            <SectionCard>
              <SectionTitle icon="api">API Test Configuration</SectionTitle>
              <ApiTestCaseBuilder testCase={testCase} onSave={handleFormSubmit} isSaving={isSubmitting} />
            </SectionCard>
          ) : (
            <SectionCard>
              <SectionTitle icon="format_list_numbered">Test Execution Steps</SectionTitle>
              <div style={{ overflowX:'auto', borderRadius:'12px', border:`1px solid ${C.border}` }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
                  <thead>
                    <tr style={{ background: C.bg, borderBottom:`1px solid ${C.border}` }}>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontSize:'10px', fontWeight:700, color: C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em', width:'60px' }}>Step</th>
                      <th style={{ padding:'10px 16px', textAlign:'left', fontSize:'10px', fontWeight:700, color: C.textMuted, textTransform:'uppercase', letterSpacing:'0.08em' }}>Action / Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stepsToRender.length > 0 ? stepsToRender.map((step, idx) => (
                      <tr key={step.id || idx} style={{ borderBottom:`1px solid ${C.borderLight}` }}
                        onMouseEnter={e => e.currentTarget.style.background = C.primaryLight}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                            width:'26px', height:'26px', borderRadius:'8px',
                            background: C.primaryLight, color: C.primary,
                            fontSize:'12px', fontWeight:700,
                          }}>
                            {step.order || step.stepNumber || idx + 1}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px', color: C.textPri }}>
                          {testCase.type === 'UI' ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                              <span style={{
                                fontSize:'10px', fontWeight:700, color: C.primary,
                                textTransform:'uppercase', letterSpacing:'0.06em',
                                background: C.primaryLight, padding:'2px 8px', borderRadius:'6px',
                                alignSelf:'flex-start',
                              }}>{step.action}</span>
                              {step.path && <span>Path: <code style={{ background: C.bg, padding:'1px 6px', borderRadius:'4px', fontSize:'11px' }}>{step.path}</code></span>}
                              {step.action === 'goto' && !step.path && <span style={{ color: C.danger, fontSize:'12px', fontWeight:600 }}>Path: missing</span>}
                              {step.selector && <span>Selector: <code style={{ background: C.bg, padding:'1px 6px', borderRadius:'4px', fontSize:'11px' }}>{step.selector}</code></span>}
                              {SELECTOR_ACTIONS.has(step.action) && !step.selector && <span style={{ color: C.danger, fontSize:'12px', fontWeight:600 }}>Selector: missing</span>}
                              {step.value && <span>Value: <code style={{ background: C.bg, padding:'1px 6px', borderRadius:'4px', fontSize:'11px' }}>{step.value}</code></span>}
                              {['fill', 'select'].includes(step.action) && !step.value && <span style={{ color: C.danger, fontSize:'12px', fontWeight:600 }}>Value: missing</span>}
                              {step.expected && <span>Expected: <code style={{ background: C.bg, padding:'1px 6px', borderRadius:'4px', fontSize:'11px' }}>{step.expected}</code></span>}
                              {['expect_url', 'expect_text'].includes(step.action) && !step.expected && <span style={{ color: C.danger, fontSize:'12px', fontWeight:600 }}>Expected: missing</span>}
                              {step.description && <span style={{ fontSize:'12px', color: C.textSec, fontStyle:'italic' }}>{step.description}</span>}
                            </div>
                          ) : step.description}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={2} style={{ padding:'24px', textAlign:'center', color: C.textMuted, fontSize:'13px' }}>
                        {testCase.type === 'UI' ? 'This test case has no automation steps configured.' : 'No steps defined.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>

        {/* ── Right column ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* Execution Result */}
          <SectionCard>
            <SectionTitle icon="fact_check">Execution Result</SectionTitle>

            <div style={{ marginBottom:'16px' }}>
              <FieldLabel>Expected Result</FieldLabel>
              <div style={{
                padding:'12px 14px',
                background: C.primaryLight,
                border:`1px solid ${C.border}`,
                borderRadius:'12px',
                fontSize:'13px', color: C.textPri, lineHeight:1.6,
              }}>
                {testCase.expectedResult}
              </div>
            </div>

            <div>
              <FieldLabel>Actual Result</FieldLabel>
              <textarea
                readOnly
                placeholder="Log actual result during execution..."
                style={{
                  width:'100%', padding:'12px 14px',
                  background: C.bg,
                  border:`1px solid ${C.border}`,
                  borderRadius:'12px',
                  fontSize:'13px', color: C.textPri,
                  resize:'vertical', minHeight:'80px',
                  outline:'none', fontFamily:'inherit', lineHeight:1.6,
                }}
                onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryLight}` }}
                onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </SectionCard>

          {/* History */}
          <SectionCard>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{
                  width:'32px', height:'32px', borderRadius:'10px',
                  background: ICON_BG, display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:`0 4px 10px rgba(30,112,125,0.25)`,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#fff', fontVariationSettings:"'FILL' 1" }}>history</span>
                </div>
                <span style={{ fontSize:'15px', fontWeight:700, color: C.textPri }}>History</span>
              </div>
              <a href="#" style={{ fontSize:'12px', color: C.primary, textDecoration:'none', fontWeight:500 }}>View All</a>
            </div>
            <style>{`
              .history-scroll-container::-webkit-scrollbar { display: none; }
              .history-scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <div className="history-scroll-container" style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '8px', paddingLeft: '12px', marginLeft: '-12px' }}>
              <TestRunHistoryTimeline
                history={history}
                loading={historyLoading}
                testCase={testCase}
                onHistoryClick={(id) => setSelectedHistoricalRunId(id)}
              />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Full-width Execution Tracker ── */}
      <div style={{ marginTop:'28px', marginBottom:'32px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px' }}>
          <div style={{
            width:'32px', height:'32px', borderRadius:'10px', background: ICON_BG,
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:`0 4px 10px rgba(30,112,125,0.25)`,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#fff', fontVariationSettings:"'FILL' 1" }}>live_tv</span>
          </div>
          <span style={{ fontSize:'15px', fontWeight:700, color: C.textPri }}>Execution Tracker</span>
        </div>

        {testCase.type === 'API' ? (
          <ApiExecutionTracker
            apiTestResult={apiTestResult}
            onSaveResult={handleSaveResult}
          />
        ) : (
          <LiveTestRunner testCase={testCase} />
        )}
      </div>

      {/* Modals */}
      <TestCaseFormModal
        isOpen={isFormOpen && editingTestCase?.id === testCase.id}
        testCase={editingTestCase}
        onClose={() => { closeForm(); setFormError(null) }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={formError}
      />

      {selectedHistoricalRunId && (
        <HistoricalTestRunModal
          runId={selectedHistoricalRunId}
          testCase={testCase}
          projectId={projectId}
          onClose={() => setSelectedHistoricalRunId(null)}
        />
      )}

      {showBugModal && (
        <CreateBugModal
          open={true}
          onClose={() => setShowBugModal(false)}
          onSubmit={handleCreateBug}
          projectMembers={activeProject?.members || []}
          initialData={{
            title: `Bug in ${testCase.code || testCase.requirement?.code}: ${testCase.title}`,
            stepsToReproduce: testCase.type === 'UI' 
              ? (testCase.configuration?.steps || []).map(s => `[${s.action}] ${s.selector || s.path || ''} ${s.value || s.expected || ''}`).join('\n') 
              : (testCase.steps || []).map((s, i) => `${i + 1}. ${s.description || s.action || ''}`).join('\n'),
          }}
        />
      )}
    </div>
  )
}
