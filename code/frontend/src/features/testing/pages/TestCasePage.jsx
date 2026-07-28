import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import useTestCaseStore from '../stores/useTestCaseStore'
import TestCaseTable from '../components/TestCaseTable'
import TestCaseFormModal from '../components/TestCaseFormModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'
import AiGenTestCaseModal from '../components/AiGenTestCaseModal'
import AiTestCaseProgressModal from '../components/AiTestCaseProgressModal'
import AiTestCaseReviewModal from '../components/AiTestCaseReviewModal'
import AiCoverageAnalysisModal from '../components/AiCoverageAnalysisModal'
import RequirementExplorer from '../components/RequirementExplorer'
import CoverageDashboard from '../components/CoverageDashboard'
import TestCaseDetailDrawer from '../components/TestCaseDetailDrawer'
import RequirementWorkspace from '../components/RequirementWorkspace'
import { C, T } from '../utils/theme'

/* ── Filter pill ────────────────────────────────────────────── */
function FilterSelect({ label, value, onChange, options }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value || null)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          background: hov ? C.primaryLt : C.surface,
          border: `1px solid ${hov ? C.primary : C.border}`,
          borderRadius: 10, padding: '7px 32px 7px 12px',
          fontSize: 13, fontWeight: 500, color: C.textSec,
          cursor: 'pointer', outline: 'none',
          transition: 'all 150ms ease',
          fontFamily: 'Inter,-apple-system,sans-serif',
        }}
      >
        <option value="">{label}: All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="material-symbols-outlined" style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, color: C.textMuted, pointerEvents: 'none',
      }}>expand_more</span>
    </div>
  )
}

/* ── Sort select ────────────────────────────────────────────── */
function SortSelect({ value, onChange }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          background: hov ? C.primaryLt : C.surface,
          border: `1px solid ${hov ? C.primary : C.border}`,
          borderRadius: 10, padding: '7px 32px 7px 12px',
          fontSize: 13, fontWeight: 500, color: C.textSec,
          cursor: 'pointer', outline: 'none',
          transition: 'all 150ms ease',
          fontFamily: 'Inter,-apple-system,sans-serif',
        }}
      >
        <option value="updated">Last Updated</option>
        <option value="created">Date Created</option>
        <option value="code">ID</option>
        <option value="status">Status</option>
      </select>
      <span className="material-symbols-outlined" style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        fontSize: 16, color: C.textMuted, pointerEvents: 'none',
      }}>swap_vert</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function TestCasePage() {
  const { projectId = '1' } = useParams()
  const {
    testCases = [], isLoading, error, pagination, filters,
    isFormOpen, isDeleteDialogOpen, isAiGenModalOpen,
    aiGenDefaults,
    editingTestCase, deletingTestCase,
    fetchTestCases, setFilters, openCreateForm, openEditForm,
    closeForm, openDeleteDialog, closeDeleteDialog,
    openAiGenModal, closeAiGenModal, openAiReview,
    createTestCase, updateTestCase, deleteTestCase,
    fetchRequirementsTree, requirementsTree, selectedRequirementId,
    selectRequirement
  } = useTestCaseStore()

  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [formError, setFormError]         = useState(null)
  const [generatedData, setGeneratedData] = useState(null)
  const [searchTerm, setSearchTerm]       = useState('')
  const [sortBy, setSortBy]               = useState('updated')
  const [priorityFilter, setPriorityFilter] = useState(null)
  
  // AI Menu state
  const [isAiMenuOpen, setIsAiMenuOpen]   = useState(false)
  const aiMenuRef                         = useRef(null)

  // Progress Modal state
  const [isProgressOpen, setIsProgressOpen] = useState(false)
  const [progressPayload, setProgressPayload] = useState(null)

  // Coverage Modal state
  const [isCoverageOpen, setIsCoverageOpen] = useState(false)

  useEffect(() => {
    if (projectId) {
      fetchTestCases(projectId, 0)
      fetchRequirementsTree(projectId)
    }
  }, [projectId, fetchTestCases, fetchRequirementsTree, filters])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target)) {
        setIsAiMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'submit') {
      setFilters({ search: searchTerm })
    }
  }

  const handlePageChange = (newPage) => fetchTestCases(projectId, newPage)

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true); setFormError(null)
    try {
      if (editingTestCase) await updateTestCase(projectId, editingTestCase.id, payload)
      else await createTestCase(projectId, payload)
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred.')
    } finally { setIsSubmitting(false) }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTestCase) return
    setIsDeleting(true)
    try { await deleteTestCase(projectId, deletingTestCase.id) }
    finally { setIsDeleting(false) }
  }

  const handleGenSubmit = (payload) => {
    closeAiGenModal()
    setProgressPayload(payload)
    setIsProgressOpen(true)
  }

  const handleProgressComplete = (generationId, data) => {
    setIsProgressOpen(false)
    openAiReview(generationId, data)
  }

  const handleProgressClose = () => {
    setIsProgressOpen(false)
    setProgressPayload(null)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: C.bg }}>
      
      {/* Left Panel: Requirement Explorer */}
      <div style={{ width: '20%', minWidth: 280, maxWidth: 350, flexShrink: 0, height: '100%', overflow: 'hidden' }}>
        <RequirementExplorer />
      </div>

      {/* Center Panel: Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 32px', overflowY: 'auto', minWidth: 0, background: C.bg }}>
        
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textPri, lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0 }}>
                {selectedRequirementId 
                  ? (() => {
                      const req = requirementsTree.find(r => r.id === selectedRequirementId);
                      return req ? `${req.reqCode || 'REQ-' + req.id} ${req.title}` : 'Test Cases';
                    })()
                  : 'Test Cases'}
              </h1>
              {selectedRequirementId && requirementsTree.find(r => r.id === selectedRequirementId) && (
                <>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: C.warningBg, color: '#EA580C', border: `1px solid ${C.warningBdr}` }}>
                    {requirementsTree.find(r => r.id === selectedRequirementId).priority || 'High Priority'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: C.successBg, color: C.success, border: `1px solid ${C.successBdr}` }}>
                    Approved
                  </span>
                </>
              )}
            </div>

            {selectedRequirementId && requirementsTree.find(r => r.id === selectedRequirementId) ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, fontSize: 13, color: C.textSec }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textMuted }}>person</span>
                  Owner: <span style={{ fontWeight: 600, color: C.textPri }}>John Doe</span>
                </span>
                <span style={{ color: C.border }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textMuted }}>schedule</span>
                  Updated: <span style={{ fontWeight: 600, color: C.textPri }}>2 hours ago</span>
                </span>
                <span style={{ color: C.border }}>|</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textMuted }}>commit</span>
                  Version: <span style={{ fontWeight: 600, color: C.textPri }}>v1.2</span>
                </span>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: C.textSec, marginTop: 4 }}>
                Select a requirement to view insights, or view all test cases below.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {/* Header Metrics */}
            {selectedRequirementId && requirementsTree.find(r => r.id === selectedRequirementId) && (() => {
              const req = requirementsTree.find(r => r.id === selectedRequirementId);
              return (
                <div style={{ display: 'flex', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase' }}>AC Count</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: C.textPri }}>{req.acTotal || 5}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', width: 120 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform: 'uppercase' }}>Est. Coverage</span>
                      <span style={{ fontSize: 16, fontWeight: 800, color: C.textPri }}>{req.coveragePercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: C.borderLt, borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${req.coveragePercent}%`, height: '100%', background: C.success, borderRadius: 3 }}></div>
                    </div>
                  </div>
                </div>
              );
            })()}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* AI Assistant Dropdown */}
          <div style={{ position: 'relative' }} ref={aiMenuRef}>
            <button
              onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(139,92,246,0.25)',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                fontFamily: 'Inter,-apple-system,sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,92,246,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.25)' }}
            >
              <span>✨</span> AI Assistant
              <span className="material-symbols-outlined" style={{ fontSize: 16, transition: 'transform 200ms', transform: isAiMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
            </button>
            
            {isAiMenuOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 8,
                background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: 220, zIndex: 100,
                overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}>
                <button
                  onClick={() => { setIsAiMenuOpen(false); openAiGenModal() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.borderLt}`, color: C.textPri, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#8B5CF6' }}>✨</span> AI Generate
                </button>
                <button
                  onClick={() => { setIsAiMenuOpen(false); setIsCoverageOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'transparent', border: 'none', color: C.textPri, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: '#8B5CF6' }}>✨</span> Analyze Coverage
                </button>
              </div>
            )}
          </div>

          {/* Add Test Case — Secondary styling now since AI is primary */}
          <button
            onClick={() => { setGeneratedData(null); openCreateForm() }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: 12, border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.textPri, fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'all 150ms ease',
              fontFamily: 'Inter,-apple-system,sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.textMuted }}
            onMouseLeave={e => { e.currentTarget.style.background = C.surface; e.currentTarget.style.borderColor = C.border }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Add Manual Case
          </button>
        </div>
          </div>
        </div>
        
        {/* ── Coverage Dashboard ── */}
        <CoverageDashboard />

        {selectedRequirementId ? (
          <RequirementWorkspace 
            requirementId={selectedRequirementId}
            testCases={testCases}
            onEdit={openEditForm}
            onDelete={openDeleteDialog}
            onClearFilter={() => selectRequirement(null)}
          />
        ) : (
          <>
            {/* ── Filter bar ── */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 17, color: C.textMuted, pointerEvents: 'none',
                }}>search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearch}
                  placeholder="Search test cases by ID or title..."
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px',
                    background: C.bg, border: `1px solid ${C.border}`,
                    borderRadius: 10, fontSize: 13, color: C.textPri,
                    outline: 'none', fontFamily: 'Inter,-apple-system,sans-serif',
                    transition: 'border-color 150ms ease',
                  }}
                  onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 3px ${C.primaryLt}` }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
                />
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: C.textMuted, fontFamily: 'monospace', background: C.bg, padding: '1px 5px', borderRadius: 4, border: `1px solid ${C.borderLt}` }}>⌘K</span>
              </div>

              {/* Filter button */}
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                fontSize: 13, fontWeight: 500, color: C.textSec, cursor: 'pointer',
                fontFamily: 'Inter,-apple-system,sans-serif',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>
                Filter
              </button>

              {/* Status filter */}
              <FilterSelect
                label="Status" value={filters.status || ''}
                onChange={v => setFilters({ status: v })}
                options={[
                  { value: 'PASS',    label: 'Pass' },
                  { value: 'FAIL',    label: 'Fail' },
                  { value: 'NOT_RUN', label: 'Not Run' },
                  { value: 'BLOCKED', label: 'Blocked' },
                ]}
              />

              {/* Type filter */}
              <FilterSelect
                label="Type" value={filters.type || ''}
                onChange={v => setFilters({ type: v })}
                options={[
                  { value: 'UI',          label: 'UI' },
                  { value: 'API',         label: 'API' },
                  { value: 'UNIT',        label: 'Unit' },
                  { value: 'INTEGRATION', label: 'Integration' },
                  { value: 'MANUAL',      label: 'Manual' },
                ]}
              />

              {/* Priority filter */}
              <FilterSelect
                label="Priority" value={priorityFilter || ''}
                onChange={v => setPriorityFilter(v)}
                options={[
                  { value: 'HIGH',   label: 'High' },
                  { value: 'MEDIUM', label: 'Medium' },
                  { value: 'LOW',    label: 'Low' },
                ]}
              />

              {/* Sort */}
              <SortSelect value={sortBy} onChange={setSortBy} />
            </div>

            {/* ── Table ── */}
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              flex: 1,
            }}>
              <TestCaseTable
                testCases={testCases}
                pagination={pagination}
                isLoading={isLoading}
                onPageChange={handlePageChange}
                onEdit={openEditForm}
                onDelete={openDeleteDialog}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Detail Drawer ── */}
      <TestCaseDetailDrawer />

      {/* ── Modals ── */}
      <TestCaseFormModal
        isOpen={isFormOpen}
        testCase={editingTestCase || generatedData}
        onClose={() => { closeForm(); setFormError(null); setGeneratedData(null) }}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={formError}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        isDeleting={isDeleting}
        title="Delete Test Case"
        message={`Are you sure you want to delete test case ${deletingTestCase?.code}? This will remove all its steps.`}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteDialog}
      />

      <AiGenTestCaseModal
        isOpen={isAiGenModalOpen}
        onClose={closeAiGenModal}
        onSubmit={handleGenSubmit}
        defaultRequirementId={selectedRequirementId}
        defaults={aiGenDefaults}
      />

      <AiCoverageAnalysisModal
        isOpen={isCoverageOpen}
        onClose={() => setIsCoverageOpen(false)}
        requirementId={selectedRequirementId}
      />

      <AiTestCaseProgressModal
        isOpen={isProgressOpen}
        projectId={projectId}
        payload={progressPayload}
        onComplete={handleProgressComplete}
        onClose={handleProgressClose}
      />

      <AiTestCaseReviewModal />
    </div>
  )
}
