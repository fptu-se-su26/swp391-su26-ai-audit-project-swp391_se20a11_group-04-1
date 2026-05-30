import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useTestCaseStore from '../stores/useTestCaseStore'
import StatusBadge from '../components/StatusBadge'
import TypeBadge from '../components/TypeBadge'
import LiveTestRunner from '../components/LiveTestRunner'
import TestCaseFormModal from '../components/TestCaseFormModal'

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

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      await updateTestCase(projectId, testCaseId, payload)
      await fetchTestCaseDetail(projectId, testCaseId)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (testCaseId) {
      fetchTestCaseDetail(projectId, testCaseId)
    }
  }, [projectId, testCaseId, fetchTestCaseDetail])

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
          <button className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary rounded hover:bg-primary-fixed-variant transition-colors shadow font-medium text-sm">
            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
            Run Test Case
          </button>
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

          {/* Test Execution Steps */}
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
            
            {/* Timeline Placeholder */}
            <div className="relative border-l-2 border-surface-variant ml-3 space-y-6">
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-surface-container-lowest bg-error"></div>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-on-surface">Execution Failed</span>
                  <span className="text-xs text-secondary">Oct 24, 09:12 AM</span>
                </div>
                <p className="text-xs text-secondary">Run by Auto_Runner</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-surface-container-lowest bg-primary-container"></div>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-on-surface">Test Case Created</span>
                  <span className="text-xs text-secondary">Oct 22, 11:00 AM</span>
                </div>
                <p className="text-xs text-secondary">By {testCase.createdBy?.username || '--'}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Test Run Panel - Full Width */}
      <section className="mt-8 mb-8">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">live_tv</span>
          Live Execution Tracker
        </h3>
        <LiveTestRunner testCase={testCase} />
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
    </div>
  )
}
