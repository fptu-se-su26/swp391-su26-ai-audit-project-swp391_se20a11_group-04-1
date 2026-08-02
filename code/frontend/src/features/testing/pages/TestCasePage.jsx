import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import useTestCaseStore from '../stores/useTestCaseStore'

// Layout components
import RequirementExplorer      from '../components/RequirementExplorer'
import TestCaseSummaryCards     from '../components/TestCaseSummaryCards'
import SelectedRequirementHeader from '../components/SelectedRequirementHeader'
import TestCaseAiInsight        from '../components/TestCaseAiInsight'
import TestCaseTypeTabs         from '../components/TestCaseTypeTabs'
import CoverageInsightsCard     from '../components/CoverageInsightsCard'
import TestCaseTable            from '../components/TestCaseTable'
import TestCaseDetailDrawer     from '../components/TestCaseDetailDrawer'

// Modals
import TestCaseFormModal        from '../components/TestCaseFormModal'
import DeleteConfirmDialog      from '../components/DeleteConfirmDialog'
import AiGenTestCaseModal       from '../components/AiGenTestCaseModal'
import AiTestCaseProgressModal  from '../components/AiTestCaseProgressModal'
import AiTestCaseReviewModal    from '../components/AiTestCaseReviewModal'
import AiCoverageAnalysisModal  from '../components/AiCoverageAnalysisModal'

import Button from '../../../components/ui/Button'
import { C, T } from '../utils/theme'

/* ── Filter pill ─────────────────────────────── */
function FilterPill({ label, value, onChange, options }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value || null)}
        style={{
          appearance: 'none', WebkitAppearance: 'none',
          background: C.bg, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '7px 28px 7px 10px',
          fontSize: 12, fontWeight: 500, color: C.textSec,
          cursor: 'pointer', outline: 'none',
          transition: T.transition.default,
          fontFamily: T.font,
        }}
      >
        <option value="">{label}: All</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="material-symbols-outlined" style={{
        position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)',
        fontSize: 14, color: C.textMuted, pointerEvents: 'none',
      }}>expand_more</span>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
export default function TestCasePage() {
  const { projectId = '1' } = useParams()
  const {
    testCases, isLoading, pagination, filters,
    isFormOpen, isDeleteDialogOpen, isAiGenModalOpen, aiGenDefaults,
    editingTestCase, deletingTestCase,
    fetchTestCases, setFilters,
    openCreateForm, openEditForm, closeForm,
    openDeleteDialog, closeDeleteDialog,
    openAiGenModal, closeAiGenModal, openAiReview,
    createTestCase, updateTestCase, deleteTestCase,
    fetchRequirementsTree, requirementsTree,
    selectedRequirementId, selectRequirement,
  } = useTestCaseStore()

  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [isDeleting,   setIsDeleting]     = useState(false)
  const [formError,    setFormError]      = useState(null)
  const [searchTerm,   setSearchTerm]     = useState('')
  const [isAiMenuOpen, setIsAiMenuOpen]   = useState(false)
  const [activeTab,    setActiveTab]      = useState('ALL')
  const aiMenuRef                         = useRef(null)

  // Progress / Coverage modal state
  const [isProgressOpen,   setIsProgressOpen]   = useState(false)
  const [progressPayload,  setProgressPayload]  = useState(null)
  const [isCoverageOpen,   setIsCoverageOpen]   = useState(false)

  /* ── Load ── */
  useEffect(() => {
    if (projectId) {
      fetchTestCases(projectId, 0)
      fetchRequirementsTree(projectId)
    }
  }, [projectId, fetchTestCases, fetchRequirementsTree, filters])

  /* ── Reset active tab when requirement selection changes ── */
  useEffect(() => {
    setActiveTab('ALL')
  }, [selectedRequirementId])

  /* ── AI menu close on outside click ── */
  useEffect(() => {
    const handler = (e) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(e.target)) setIsAiMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* ── Handlers ── */
  const handleSearch = (e) => {
    if (e.key === 'Enter') setFilters({ search: searchTerm })
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

  /* ── Render helpers ── */
  const renderTableForTab = (cases, tabKey) => {
    // When filtering by type tab (not ALL), pagination numbers must reflect
    // the client-side filtered slice, not the backend total.
    const derivedPagination = tabKey === 'ALL'
      ? pagination
      : {
          page: 0,
          size: cases.length,
          totalElements: cases.length,
          totalPages: cases.length > 0 ? 1 : 0,
        }
    return (
      <TestCaseTable
        testCases={cases}
        pagination={derivedPagination}
        isLoading={isLoading}
        onPageChange={tabKey === 'ALL' ? handlePageChange : () => {}}
        onEdit={openEditForm}
        onDelete={openDeleteDialog}
      />
    )
  }

  const renderEmptyForTab = (activeTab) => (
    <div style={{
      padding: '28px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      color: C.textSec, fontSize: 13,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 28, color: C.textMuted }}>checklist_rtl</span>
      <span>
        {activeTab === 'ALL'
          ? 'No test cases yet.'
          : `No ${activeTab} test cases yet.`}
      </span>
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {activeTab !== 'ALL' && (
          <button
            onClick={() => openAiGenModal({
              testType: activeTab,
              additionalContext: `Generate ${activeTab} test cases for this requirement.`,
            })}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, border: 'none',
              background: '#8B5CF6', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 13 }}>✨</span> Generate {activeTab} Tests
          </button>
        )}
        <button
          onClick={() => openCreateForm()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${C.border}`, background: C.surface,
            color: C.textPri, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          Create Manually
        </button>
      </div>
    </div>
  )

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  return (
    /*
     * HEIGHT STRATEGY
     * MainLayout <main> has padding: 28px top + 32px bottom = 60px total vertical padding.
     * That <main> only has minHeight:100vh, NOT a fixed height, so height:'100%' on this
     * component resolves to 'auto' and the page grows with content.
     *
     * Fix: give this root a definite height equal to the available viewport after
     * subtracting MainLayout's vertical padding.  Use 100dvh so it tracks the visible
     * viewport on mobile browsers too.  overflow:hidden stops the document from growing.
     */
    <div style={{
      display: 'flex',
      height: 'calc(100dvh - 60px)',
      maxHeight: 'calc(100dvh - 60px)',
      minHeight: 0,
      overflow: 'hidden',
      background: '#F8FAFC',
      fontFamily: T.font,
    }}>

      {/* ── Left Explorer ── */}
      {/*
       * minHeight:0 is required so this flex child can shrink below its content size.
       * Without it the child refuses to shrink and forces the parent to grow.
       */}
      <div style={{
        width: 320,
        flexShrink: 0,
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
        borderRight: `1px solid ${C.border}`,
      }}>
        <RequirementExplorer />
      </div>

      {/* ── Main content ── */}
      {/*
       * minHeight:0 + height:100% gives this flex child a definite height so it can
       * scroll internally.  overflowX:hidden prevents horizontal blowout.
       */}
      <div style={{
        flex: 1,
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        padding: '24px 28px',
        gap: 16,
      }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.textPri, margin: 0, letterSpacing: '-0.02em' }}>
              Test Cases
            </h1>
            <p style={{ fontSize: 13, color: C.textSec, margin: '4px 0 0' }}>
              Manage, analyze, and improve requirement coverage.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Generate with AI dropdown */}
            <div style={{ position: 'relative' }} ref={aiMenuRef}>
              <button
                onClick={() => setIsAiMenuOpen(!isAiMenuOpen)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.25)',
                  transition: T.transition.default, fontFamily: T.font,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(139,92,246,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(139,92,246,0.25)' }}
              >
                <span>✨</span> Generate with AI
                <span className="material-symbols-outlined" style={{ fontSize: 16, transition: 'transform 200ms', transform: isAiMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>expand_more</span>
              </button>

              {isAiMenuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: C.surface, borderRadius: 12, border: `1px solid ${C.border}`,
                  boxShadow: T.shadow.lg, width: 210, zIndex: 100,
                  overflow: 'hidden', display: 'flex', flexDirection: 'column',
                }}>
                  <button
                    onClick={() => { setIsAiMenuOpen(false); openAiGenModal() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.borderLt}`, color: C.textPri, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: '#8B5CF6' }}>✨</span> Generate Test Cases
                  </button>
                  <button
                    onClick={() => { setIsAiMenuOpen(false); setIsCoverageOpen(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', background: 'transparent', border: 'none', color: C.textPri, fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span style={{ color: '#8B5CF6' }}>✨</span> Analyze Coverage
                  </button>
                </div>
              )}
            </div>

            {/* Create Test Case */}
            <Button onClick={() => openCreateForm()}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Create Test Case
            </Button>
          </div>
        </div>

        {/* ── KPI row ── */}
        <TestCaseSummaryCards />

        {/* ── Selected requirement header ── */}
        {selectedRequirementId && (
          <SelectedRequirementHeader onClear={() => selectRequirement(null)} />
        )}

        {/* ── AI Insight banner ── */}
        <TestCaseAiInsight />

        {/* ── Table area (tabs + optional coverage card) ── */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>

          {/* Table column */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* Global filters bar (shown when no requirement is selected) */}
            {!selectedRequirementId && (
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                boxShadow: T.shadow.sm, marginBottom: 10,
              }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
                  <span className="material-symbols-outlined" style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 16, color: C.textMuted, pointerEvents: 'none',
                  }}>search</span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                    placeholder="Search test cases..."
                    style={{
                      width: '100%', padding: '7px 10px 7px 32px',
                      background: C.bg, border: `1px solid ${C.border}`,
                      borderRadius: 8, fontSize: 12, color: C.textPri,
                      outline: 'none', fontFamily: T.font,
                      transition: T.transition.default, boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = C.primary; e.target.style.boxShadow = `0 0 0 2px ${C.primaryLt}` }}
                    onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                <FilterPill
                  label="Status" value={filters.status || ''}
                  onChange={v => setFilters({ status: v })}
                  options={[
                    { value: 'PASS',    label: 'Pass'    },
                    { value: 'FAIL',    label: 'Fail'    },
                    { value: 'NOT_RUN', label: 'Not Run' },
                    { value: 'BLOCKED', label: 'Blocked' },
                  ]}
                />

                <FilterPill
                  label="Type" value={filters.type || ''}
                  onChange={v => setFilters({ type: v })}
                  options={[
                    { value: 'UI',          label: 'UI'          },
                    { value: 'API',         label: 'API'         },
                    { value: 'UNIT',        label: 'Unit'        },
                    { value: 'INTEGRATION', label: 'Integration' },
                    { value: 'MANUAL',      label: 'Manual'      },
                  ]}
                />
              </div>
            )}

            {/* Tabs + table */}
            <TestCaseTypeTabs
              testCases={testCases}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              renderTable={renderTableForTab}
              renderEmpty={renderEmptyForTab}
            />
          </div>

          {/* Coverage insights side card (only when requirement selected) */}
          {selectedRequirementId && (
            <div style={{ flexShrink: 0, width: 210 }}>
              <CoverageInsightsCard />
            </div>
          )}
        </div>
      </div>

      {/* ── Drawer ── */}
      <TestCaseDetailDrawer />

      {/* ── Modals ── */}
      <TestCaseFormModal
        isOpen={isFormOpen}
        testCase={editingTestCase}
        onClose={() => { closeForm(); setFormError(null) }}
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
        onClose={() => { setIsProgressOpen(false); setProgressPayload(null) }}
      />

      <AiTestCaseReviewModal />
    </div>
  )
}
