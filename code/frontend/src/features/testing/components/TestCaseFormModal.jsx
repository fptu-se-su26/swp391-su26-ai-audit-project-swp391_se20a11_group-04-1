import { useState, useEffect } from 'react'
import TestStepEditor from './TestStepEditor'
import useProjectStore from '../../../store/useProjectStore'
import { requirementApi } from '../../requirement/services/requirementApi'
import toast from 'react-hot-toast'
import { getUiStepValidationError, normalizeUiSteps, uiStepToDescription } from '../utils/uiStepUtils'

/**
 * TestCaseFormModal — Modal tạo hoặc sửa Test Case
 */
export default function TestCaseFormModal({ isOpen, testCase, onClose, onSubmit, isSubmitting, error }) {
  const [formData, setFormData] = useState({
    title: '',
    requirementId: '',
    type: 'UI',
    precondition: '',
    expectedResult: '',
    baseUrl: '',
    apiMethod: 'GET',
    apiUrl: '',
    steps: []
  })

  const activeProject = useProjectStore(state => state.activeProject)
  const [requirements, setRequirements] = useState([])
  const [loadingReqs, setLoadingReqs] = useState(false)

  useEffect(() => {
    if (isOpen && activeProject?.id) {
      setLoadingReqs(true)
      requirementApi.getAllRequirements({ projectId: activeProject.id })
        .then(res => {
          const reqs = res.items || res.data?.content || res.data || res || []
          setRequirements(Array.isArray(reqs) ? reqs : [])
        })
        .catch(err => {
          console.error(err)
          toast.error("Failed to load requirements")
        })
        .finally(() => setLoadingReqs(false))
    }
  }, [isOpen, activeProject?.id])

  useEffect(() => {
    if (isOpen) {
      if (testCase) {
        const cfg = testCase.configuration || {}
        setFormData({
          title: testCase.title || '',
          requirementId: testCase.requirement?.id || '',
          type: testCase.type || 'UI',
          precondition: testCase.precondition || '',
          expectedResult: testCase.expectedResult || '',
          baseUrl: cfg.baseUrl || '',
          apiMethod: cfg.apiMethod || 'GET',
          apiUrl: cfg.apiUrl || '',
          steps: testCase.type === 'UI'
            ? normalizeUiSteps(cfg.steps, testCase.steps)
            : Array.isArray(testCase.steps)
            ? [...testCase.steps]
            : (testCase.type === 'UI' ? [{ action: 'goto', path: '', selector: '', value: '', expected: '', description: '' }] : [{ description: '' }])
        })
      } else {
        setFormData({
          title: '',
          requirementId: '',
          type: 'UI',
          precondition: '',
          expectedResult: '',
          baseUrl: '',
          apiMethod: 'GET',
          apiUrl: '',
          steps: [{ action: 'goto', path: '', selector: '', value: '', expected: '', description: '' }]
        })
      }
    }
  }, [isOpen, testCase])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (formData.type === 'UI' && !formData.baseUrl) {
      toast.error('Base URL is required for UI tests.')
      return
    }
    const uiSteps = formData.type === 'UI' ? normalizeUiSteps(formData.steps) : []
    if (formData.type === 'UI') {
      const stepError = uiSteps.map(getUiStepValidationError).find(Boolean)
      if (stepError) {
        toast.error(stepError)
        return
      }
    }

    if (formData.type === 'API' && (!formData.apiUrl || !formData.apiUrl.trim())) {
      toast.error('API URL is required')
      return
    }

    const payload = {
      title: formData.title,
      requirementId: formData.requirementId ? Number(formData.requirementId) : null,
      type: formData.type,
      precondition: formData.precondition,
      expectedResult: formData.expectedResult
    }

    if (formData.type === 'UI') {
      payload.configuration = {
        type: 'UI',
        baseUrl: formData.baseUrl,
        steps: uiSteps.map((s, i) => ({
          order: i + 1,
          action: s.action || 'goto',
          path: s.action === 'goto' ? s.path : undefined,
          selector: ['fill', 'click', 'wait_for', 'select', 'expect_text', 'expect_visible', 'expect_hidden'].includes(s.action) ? s.selector : undefined,
          value: ['fill', 'select'].includes(s.action) ? s.value : undefined,
          expected: ['expect_url', 'expect_text'].includes(s.action) ? s.expected : undefined,
          description: s.description || undefined
        }))
      }
      payload.steps = uiSteps.map((s, i) => ({
        stepNumber: i + 1,
        description: uiStepToDescription(s, i)
      }))
    } else if (formData.type !== 'API') {
      payload.steps = formData.steps.map((s, i) => ({
        stepNumber: i + 1,
        description: s.description
      }))
      payload.configuration = { type: formData.type }
    }
    
    if (formData.type === 'API') {
       const existingCfg = testCase?.configuration || {}
       payload.configuration = {
         type: 'API',
         apiMethod: formData.apiMethod,
         apiUrl: formData.apiUrl,
         // Keep original test case configurations if they exist, to avoid overwriting them to null during simple edit
         apiHeaders: existingCfg.apiHeaders || null,
         apiQueryParams: existingCfg.apiQueryParams || null,
         apiBody: existingCfg.apiBody || null,
         apiAssertions: existingCfg.apiAssertions || null,
       }
    }

    onSubmit(payload)
  }

  const handleTypeChange = (e) => {
    const newType = e.target.value
    setFormData(prev => ({
      ...prev,
      type: newType,
      steps: newType === 'UI' 
        ? [{ action: 'goto', path: '', selector: '', value: '', expected: '', description: '' }]
        : [{ description: '' }]
    }))
  }

  // Handle overlay click to close
  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') onClose()
  }

  return (
    <div id="modal-overlay" onClick={handleOverlayClick} className="fixed inset-0 bg-[#00000080] z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">
            {testCase ? 'Edit Test Case' : 'Create New Test Case'}
          </h2>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-error-container text-on-error-container rounded text-sm font-medium">
              {error}
            </div>
          )}
          <form id="testCaseForm" onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface">Title <span className="text-error">*</span></label>
              <input
                type="text"
                required
                maxLength={200}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all"
                placeholder="E.g., Verify successful login with valid credentials"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface">Requirement ID <span className="text-error">*</span></label>
                <select
                  required
                  value={formData.requirementId}
                  onChange={e => setFormData({ ...formData, requirementId: e.target.value })}
                  disabled={loadingReqs}
                  className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all cursor-pointer"
                >
                  <option value="" disabled>{loadingReqs ? 'Loading requirements...' : 'Select a Requirement'}</option>
                  {requirements.map(req => (
                    <option key={req.id} value={req.id}>
                      [{req.reqCode || 'REQ-?'}] {req.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface">Test Type <span className="text-error">*</span></label>
                <select
                  required
                  value={formData.type}
                  onChange={handleTypeChange}
                  className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all"
                >
                  <option value="UI">UI</option>
                  <option value="API">API</option>
                  <option value="UNIT">Unit</option>
                  <option value="INTEGRATION">Integration</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
            </div>

            {formData.type === 'UI' && (
              <div className="flex flex-col gap-1.5 p-4 bg-[#D7EEF1]/10 border border-[#1E707D]/20 rounded-lg">
                <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1E707D] text-[18px]">public</span>
                  Base URL (for UI Automation) <span className="text-error">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formData.baseUrl || ''}
                  onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                  className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all"
                  placeholder="E.g., http://localhost:5173"
                />
                <span className="text-xs text-on-surface-variant mt-1">This URL is required to run Playwright test scripts.</span>
              </div>
            )}

            {formData.type === 'API' && (
              <div className="flex flex-col gap-1.5 p-4 bg-[#D7EEF1]/10 border border-[#1E707D]/20 rounded-lg">
                <label className="font-label-md text-label-md text-on-surface flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#1E707D] text-[18px]">api</span>
                  API Endpoint <span className="text-error">*</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.apiMethod}
                    onChange={e => setFormData({ ...formData, apiMethod: e.target.value })}
                    className="w-24 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all font-medium"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                  <input
                    type="url"
                    required
                    value={formData.apiUrl || ''}
                    onChange={e => setFormData({ ...formData, apiUrl: e.target.value })}
                    className="flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all"
                    placeholder="E.g., https://api.example.com/v1/users"
                  />
                </div>
                <span className="text-xs text-on-surface-variant mt-1">You can configure Headers, Body, and Assertions in the Test Case Detail page after saving.</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface">Precondition</label>
              <textarea
                rows={2}
                value={formData.precondition}
                onChange={e => setFormData({ ...formData, precondition: e.target.value })}
                className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all resize-y"
                placeholder="Optional preconditions..."
              />
            </div>

            {formData.type !== 'API' && (
              <TestStepEditorWrapper formData={formData} setFormData={setFormData} />
            )}

            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface">Expected Result <span className="text-error">*</span></label>
              <textarea
                required
                rows={3}
                value={formData.expectedResult}
                onChange={e => setFormData({ ...formData, expectedResult: e.target.value })}
                className="px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded focus:border-[#1E707D] focus:ring-2 focus:ring-primary-container outline-none transition-all resize-y"
                placeholder="What is the expected outcome?"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end gap-3 bg-surface-container-low rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-outline-variant text-secondary hover:bg-surface-container-highest rounded font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="testCaseForm"
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#1E707D] text-white hover:bg-primary-fixed-variant rounded font-medium transition-colors shadow flex items-center gap-2"
          >
            {isSubmitting && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
            {testCase ? 'Save Changes' : 'Create Test Case'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TestStepEditorWrapper({ formData, setFormData }) {
  return (
    <TestStepEditor
      steps={formData.steps}
      isUiTest={formData.type === 'UI'}
      onChange={(newSteps) => setFormData({ ...formData, steps: newSteps })}
    />
  )
}
