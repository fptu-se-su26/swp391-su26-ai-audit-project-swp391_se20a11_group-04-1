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

export default function TestCaseDetailPage() {
  const { projectId = '1', id: testCaseId } = useParams()
  const {
    selectedTestCase: testCase,
    isLoading,
    error,
    fetchTestCaseDetail,
    isFormOpen,
    editingTestCase,
    openEditForm,
    closeForm,
    updateTestCase
  } = useTestCaseStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedHistoricalRunId, setSelectedHistoricalRunId] = useState(null)
  
  const [apiTestResult, setApiTestResult] = useState(null)
  const [isApiRunning, setIsApiRunning] = useState(false)

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      await updateTestCase(projectId, testCaseId, payload, true)
      await fetchTestCaseDetail(projectId, testCaseId)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const pollingRef = useRef(null)

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const handleRunApi = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setIsApiRunning(true)
    setApiTestResult(null)
    try {
      const initialRes = await useTestCaseStore.getState().runApiTest(projectId, testCaseId)
      
      // If it returned a completed result immediately (e.g. PASSED, FAILED, ERROR)
      if (initialRes && ['PASSED', 'FAILED', 'ERROR'].includes(initialRes.status)) {
        setApiTestResult(initialRes)
        setIsApiRunning(false)
        return
      }

      if (!initialRes || !initialRes.id) {
        setApiTestResult({ error: 'Failed to start API test' })
        setIsApiRunning(false)
        return
      }

      const resultId = initialRes.id
      let maxAttempts = 15;
      let attempt = 0;
      pollingRef.current = setInterval(async () => {
        attempt++;
        try {
          const latest = await testCaseService.getApiTestResult(projectId, testCaseId, resultId);
          
          if (latest && ['PASSED', 'FAILED', 'ERROR'].includes(latest.status)) {
            setApiTestResult(latest);
            setIsApiRunning(false);
            clearInterval(pollingRef.current);
          } else if (attempt >= maxAttempts) {
            setApiTestResult({ error: 'Timeout waiting for result' });
            setIsApiRunning(false);
            clearInterval(pollingRef.current);
          }
        } catch (e) {
          // ignore network errors while polling
        }
      }, 2000);

    } catch (err) {
      setApiTestResult({ error: err.message })
      setIsApiRunning(false)
    }
  }

  const handleSaveResult = async () => {
    if (!apiTestResult || !apiTestResult.id) return
    try {
      const savedResult = await testCaseService.saveApiTestResult(projectId, testCaseId, apiTestResult.id)
      setApiTestResult(savedResult)
      // Refresh history panel
      testCaseService.getApiTestResults(projectId, testCaseId).then(setHistory)
    } catch (err) {
      console.error('Failed to save API result:', err)
    }
  }

  useEffect(() => {
    if (testCaseId) {
      fetchTestCaseDetail(projectId, testCaseId)
    }
  }, [projectId, testCaseId, fetchTestCaseDetail])

  useEffect(() => {
    if (testCase) {
      setHistoryLoading(true)
      if (testCase.type === 'API') {
        testCaseService.getApiTestResults(projectId, testCase.id)
          .then(res => setHistory(res || []))
          .catch(() => setHistory([]))
          .finally(() => setHistoryLoading(false))
      } else {
        getTestRunHistory(testCase.id)
          .then(res => setHistory(res || []))
          .catch(() => setHistory([]))
          .finally(() => setHistoryLoading(false))
      }
    }
  }, [testCase, projectId])

  if (isLoading) {
    return (
      <div className="flex-1 p-margin_desktop flex justify-center items-center h-full">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
      </div>
    )
  }

  if (error || !testCase) {
    return (
      <div className="flex-1 p-margin_desktop">
        <div className="bg-error-container text-on-error-container p-4 rounded text-center">
          {error || 'Test case not found.'}
        </div>
      </div>
    )
  }

  const stepsToRender = testCase.type === 'UI' ? (testCase.stepsStructured || testCase.steps_structured || []) : (testCase.steps || []);

  return (
    <div className="flex-1 p-margin_desktop overflow-y-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-secondary mb-4">
        <Link to={`/projects/${projectId}/test-cases`} className="hover:text-primary hover:underline font-body-md transition-colors">Test Cases</Link>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="font-body-md font-medium text-on-surface">{testCase.code}</span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack_lg gap-stack_md">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display-lg text-display-lg text-on-surface">{testCase.title}</h1>
            <StatusBadge status={testCase.status} />
            <TypeBadge type={testCase.type} />
          </div>
          <div className="flex items-center gap-4 text-sm text-secondary">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              Created by {testCase.createdBy?.username || '--'}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">calendar_today</span>
              {testCase.createdAt ? new Date(testCase.createdAt).toLocaleDateString() : '--'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setFormError(null); openEditForm(testCase); }}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-on-surface border border-outline-variant rounded hover:bg-surface-container transition-colors font-medium text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Test Case
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-on-surface border border-outline-variant rounded hover:bg-surface-container transition-colors font-medium text-sm">
            <span className="material-symbols-outlined text-[18px]">bug_report</span>
            Create Bug
          </button>
          {testCase.type === 'API' ? (
            <button 
              onClick={handleRunApi}
              disabled={isApiRunning}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded hover:bg-primary-fixed-variant transition-colors shadow font-medium text-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              {isApiRunning ? 'Running...' : 'Run API Test'}
            </button>
          ) : (
            <button className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded hover:bg-primary-fixed-variant transition-colors shadow font-medium text-sm">
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              Run Test Case
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Main Left Column (8 cols) */}
        <div className="md:col-span-8 flex flex-col gap-gutter">
          
          {/* Setup & Traceability */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">account_tree</span>
              Setup & Traceability
            </h3>
            <div className="grid grid-cols-2 gap-6 mb-4 p-4 bg-surface-container-low rounded border border-outline-variant">
              <div>
                <span className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Linked Requirement</span>
                <a href="#" className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                  {testCase.requirement?.code || 'REQ-01'}
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                </a>
              </div>
              <div>
                <span className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Module</span>
                <span className="text-on-surface font-medium">Authentication (Placeholder)</span>
              </div>
              {testCase.type === 'UI' && (testCase.baseUrl || testCase.base_url) && (
                <div className="col-span-2 mt-2">
                  <span className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Base URL (Automated Test)</span>
                  <a href={testCase.baseUrl || testCase.base_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                    {testCase.baseUrl || testCase.base_url}
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-label-md text-label-md text-on-surface mb-2">Preconditions</h4>
              <div className="p-4 bg-surface-container-low rounded border border-outline-variant text-body-md whitespace-pre-wrap">
                {testCase.precondition || 'No preconditions specified.'}
              </div>
            </div>
          </section>

          {testCase.type === 'API' ? (
            <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex-1 flex flex-col">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">api</span>
                API Test Configuration
              </h3>
              <ApiTestCaseBuilder 
                testCase={testCase}
                onSave={handleFormSubmit}
                isSaving={isSubmitting}
              />
            </section>
          ) : (
            <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 flex-1">
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">format_list_numbered</span>
                Test Execution Steps
              </h3>
            <div className="overflow-x-auto border border-outline-variant rounded">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="py-2 px-4 font-semibold text-sm text-secondary w-16">Step</th>
                    <th className="py-2 px-4 font-semibold text-sm text-secondary">Action / Description</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {stepsToRender && stepsToRender.length > 0 ? (
                    stepsToRender.map((step, idx) => (
                      <tr key={step.id || step.order || step.stepNumber || idx} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-4 font-medium text-secondary">{step.order || step.stepNumber || (idx + 1)}</td>
                        <td className="py-3 px-4 text-on-surface">
                          {testCase.type === 'UI' ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-primary uppercase text-xs">{step.action}</span>
                              {step.path && <span className="text-sm">Path: <code className="bg-surface-container px-1 py-0.5 rounded">{step.path}</code></span>}
                              {step.selector && <span className="text-sm">Selector: <code className="bg-surface-container px-1 py-0.5 rounded">{step.selector}</code></span>}
                              {step.value && <span className="text-sm">Value: <code className="bg-surface-container px-1 py-0.5 rounded">{step.value}</code></span>}
                              {step.expected && <span className="text-sm">Expected: <code className="bg-surface-container px-1 py-0.5 rounded">{step.expected}</code></span>}
                              {step.description && <span className="text-xs text-secondary italic">{step.description}</span>}
                            </div>
                          ) : (
                            step.description
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="py-4 text-center text-secondary">No steps defined.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          )}

        </div>

        {/* Side Right Column (4 cols) */}
        <div className="md:col-span-4 flex flex-col gap-gutter">
          
          {/* Execution Result */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">fact_check</span>
              Execution Result
            </h3>
            <div className="mb-4">
              <h4 className="font-label-md text-label-md text-on-surface mb-2">Expected Result</h4>
              <div className="p-3 bg-primary-fixed/20 border border-primary-fixed rounded text-sm text-on-surface">
                {testCase.expectedResult}
              </div>
            </div>
            <div>
              <h4 className="font-label-md text-label-md text-on-surface mb-2">Actual Result (Placeholder)</h4>
              <textarea
                className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[80px]"
                placeholder="Log actual result during execution..."
                readOnly
              ></textarea>
            </div>
          </section>

          {/* Execution History */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                History
              </h3>
              <a href="#" className="text-xs text-primary hover:underline">View All</a>
            </div>
            
            <TestRunHistoryTimeline 
              history={history} 
              loading={historyLoading} 
              testCase={testCase} 
              onHistoryClick={(runId) => setSelectedHistoricalRunId(runId)}
            />
          </section>
        </div>
      </div>

      {/* Test Run Panel - Full Width */}
      <section className="mt-8 mb-8">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">live_tv</span>
          Execution Tracker
        </h3>
        {testCase.type === 'API' ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4">
            {apiTestResult ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 text-sm font-semibold rounded ${apiTestResult.status === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {apiTestResult.status}
                    </span>
                    <span className="text-sm font-medium text-secondary">Status Code: {apiTestResult.statusCode || 'N/A'}</span>
                    <span className="text-sm font-medium text-secondary">Time: {apiTestResult.responseTimeMs || 0}ms</span>
                  </div>
                  {!apiTestResult.isSaved && ['PASSED', 'FAILED', 'ERROR'].includes(apiTestResult.status) && (
                    <button
                      onClick={handleSaveResult}
                      className="px-3 py-1.5 bg-primary text-on-primary text-xs font-medium rounded shadow hover:bg-primary-hover transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">save</span>
                      Save to History
                    </button>
                  )}
                  {apiTestResult.isSaved && (
                     <span className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded flex items-center gap-1 border border-green-200">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Saved to History
                     </span>
                  )}
                </div>
                
                {apiTestResult.error && (
                  <div className="p-3 bg-error-container text-on-error-container rounded text-sm">
                    {apiTestResult.error}
                  </div>
                )}
                
                {apiTestResult.errorMessage && (
                  <div className="p-3 bg-error-container text-on-error-container rounded text-sm">
                    {apiTestResult.errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column: Response Data */}
                  <div className="flex flex-col gap-4">
                    {/* Headers */}
                    <div>
                      <h4 className="text-xs font-bold text-secondary mb-2 uppercase tracking-wider">Response Headers</h4>
                      <div className="bg-surface-container-lowest border border-outline-variant rounded text-sm overflow-hidden">
                        {apiTestResult.responseHeaders && Object.keys(apiTestResult.responseHeaders).length > 0 ? (
                          <table className="w-full text-left">
                            <tbody className="divide-y divide-outline-variant">
                              {Object.entries(apiTestResult.responseHeaders).map(([k, v]) => (
                                <tr key={k} className="hover:bg-surface-container-low transition-colors">
                                  <td className="py-2 px-3 font-semibold w-1/3 break-all bg-surface-container-low/30 border-r border-outline-variant/30">{k}</td>
                                  <td className="py-2 px-3 break-all text-secondary font-mono text-xs">{v}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-3 text-secondary italic text-xs">No headers returned.</div>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 flex flex-col">
                      <h4 className="text-xs font-bold text-secondary mb-2 uppercase tracking-wider">Response Body</h4>
                      <pre className="flex-1 bg-surface-container-lowest border border-outline-variant p-3 rounded text-xs font-mono overflow-auto max-h-[400px] text-on-surface">
                        {apiTestResult.responseBody ? (
                          apiTestResult.responseBody.startsWith('{') || apiTestResult.responseBody.startsWith('[') ? 
                            (() => {
                              try { return JSON.stringify(JSON.parse(apiTestResult.responseBody), null, 2) }
                              catch { return apiTestResult.responseBody }
                            })() : 
                            apiTestResult.responseBody
                        ) : <span className="text-secondary italic">No body content</span>}
                      </pre>
                    </div>
                  </div>

                  {/* Right Column: Assertions */}
                  <div>
                    <h4 className="text-xs font-bold text-secondary mb-2 uppercase tracking-wider">Assertion Results</h4>
                    <ul className="flex flex-col gap-2">
                      {apiTestResult.assertionResults && apiTestResult.assertionResults.length > 0 ? (
                        apiTestResult.assertionResults.map((assert, idx) => (
                          <li key={idx} className={`flex flex-col gap-1 p-3 rounded-md border ${assert.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} text-sm`}>
                            <div className="flex items-start gap-2">
                              <span className={`material-symbols-outlined mt-0.5 text-[18px] ${assert.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {assert.passed ? 'check_circle' : 'cancel'}
                              </span>
                              <div className="flex-1">
                                <div className="font-semibold text-on-surface">
                                  {assert.assertion?.type} {assert.assertion?.property ? `(${assert.assertion.property})` : ''} {assert.assertion?.operator} {assert.assertion?.expectedValue}
                                </div>
                                {!assert.passed && (
                                  <div className="text-red-600 mt-1 font-mono text-xs">
                                    <span className="font-bold">Actual:</span> {assert.actualValue} <br />
                                    <span className="opacity-80 block mt-0.5">{assert.errorMessage}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="p-4 bg-surface-container-low border border-outline-variant rounded-md text-sm text-secondary italic text-center">
                          No assertions run.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-secondary text-sm">
                Click "Run API Test" to execute this API and see the results here.
              </div>
            )}
          </div>
        ) : (
          <LiveTestRunner testCase={testCase} />
        )}
      </section>

      {/* Edit Modal */}
      <TestCaseFormModal
        isOpen={isFormOpen && editingTestCase?.id === testCase.id}
        testCase={editingTestCase}
        onClose={() => { closeForm(); setFormError(null) }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={formError}
      />

      {/* Historical Viewer Modal */}
      {selectedHistoricalRunId && (
        <HistoricalTestRunModal
          runId={selectedHistoricalRunId}
          testCase={testCase}
          onClose={() => setSelectedHistoricalRunId(null)}
        />
      )}
    </div>
  )
}
