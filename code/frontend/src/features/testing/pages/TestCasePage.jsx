import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import useTestCaseStore from '../stores/useTestCaseStore'
import TestCaseTable from '../components/TestCaseTable'
import TestCaseFormModal from '../components/TestCaseFormModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'

/* ── Design tokens ──────────────────────────────────────────── */
const C = {
  primary:     '#1E707D',
  primaryHov:  '#278A99',
  primaryDark: '#165964',
  primaryLt:   '#D7EEF1',
  accent:      '#4EC6D8',
  bg:          '#F8FAFC',
  surface:     '#FFFFFF',
  border:      '#D9E7E4',
  borderLt:    '#EBF5F7',
  textPri:     '#1F2937',
  textSec:     '#6B7280',
  textMuted:   '#9CA3AF',
  success:     '#22C55E', successBg: '#F0FDF4', successBdr: '#BBF7D0',
  danger:      '#EF4444', dangerBg:  '#FEF2F2', dangerBdr:  '#FECACA',
  warning:     '#F59E0B', warningBg: '#FFFBEB', warningBdr: '#FDE68A',
  info:        '#3B82F6', infoBg:    '#EFF6FF', infoBdr:    '#BFDBFE',
  notrun:      '#64748B', notrunBg:  'rgba(100,116,139,0.10)', notrunBdr: 'rgba(100,116,139,0.20)',
}

/* ── Stat Card ──────────────────────────────────────────────── */
function StatCard({ label, value, pct, color, bg, border, icon }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 16, padding: '16px 20px', flex: 1, minWidth: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: bg, border: `1.5px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: C.textPri, lineHeight: 1 }}>{value}</span>
        {pct !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{pct}%</span>
        )}
      </div>
    </div>
  )
}

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
    isFormOpen, isDeleteDialogOpen, editingTestCase, deletingTestCase,
    fetchTestCases, setFilters, openCreateForm, openEditForm,
    closeForm, openDeleteDialog, closeDeleteDialog,
    createTestCase, updateTestCase, deleteTestCase,
  } = useTestCaseStore()

  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [isDeleting, setIsDeleting]       = useState(false)
  const [isGenerating, setIsGenerating]   = useState(false)
  const [formError, setFormError]         = useState(null)
  const [generatedData, setGeneratedData] = useState(null)
  const [searchTerm, setSearchTerm]       = useState('')
  const [sortBy, setSortBy]               = useState('updated')
  const [priorityFilter, setPriorityFilter] = useState(null)

  useEffect(() => {
    if (projectId) fetchTestCases(projectId, 0)
  }, [projectId, fetchTestCases, filters])

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

  const handleGenerateApiTest = async () => {
    const description = window.prompt('Enter API description or curl command:')
    if (!description) return
    setIsGenerating(true)
    try {
      const payload = await useTestCaseStore.getState().generateApiTest(projectId, description)
      setGeneratedData(payload); openCreateForm()
    } catch (err) {
      alert('Failed to generate API test: ' + (err.response?.data?.message || err.message))
    } finally { setIsGenerating(false) }
  }

  /* ── Stats derived from pagination + testCases ── */
  const total   = pagination.totalElements || 0
  const passed  = testCases.filter(t => ['PASS','PASSED'].includes(t.status)).length
  const failed  = testCases.filter(t => ['FAIL','FAILED'].includes(t.status)).length
  const blocked = testCases.filter(t => t.status === 'BLOCKED').length
  const notRun  = testCases.filter(t => !t.status || t.status === 'NOT_RUN').length

  const pct = (n) => total > 0 ? ((n / (testCases.length || 1)) * 100).toFixed(1) : '0.0'

  /* ── Last execution ── */
  const lastExec = useMemo(() => {
    const withDates = testCases.filter(t => t.lastExecutedAt || t.updatedAt)
    if (!withDates.length) return null
    const sorted = [...withDates].sort((a,b) => new Date(b.lastExecutedAt || b.updatedAt) - new Date(a.lastExecutedAt || a.updatedAt))
    const d = new Date(sorted[0].lastExecutedAt || sorted[0].updatedAt)
    const diffH = Math.round((Date.now() - d) / 3600000)
    if (diffH < 1) return { label: 'Just now', sub: d.toLocaleString() }
    if (diffH < 24) return { label: `${diffH}h ago`, sub: d.toLocaleString() }
    return { label: `${Math.round(diffH/24)}d ago`, sub: d.toLocaleString() }
  }, [testCases])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: C.textPri, lineHeight: 1.2, letterSpacing: '-0.03em', margin: 0 }}>
            Test Cases
          </h1>
          <p style={{ fontSize: 13, color: C.textSec, marginTop: 4 }}>
            Manage and track manual and automated tests.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Generate API Test */}
          <button
            onClick={handleGenerateApiTest}
            disabled={isGenerating}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 12,
              border: `1.5px solid ${C.border}`, background: C.surface,
              color: C.textSec, fontSize: 13, fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'all 150ms ease',
              fontFamily: 'Inter,-apple-system,sans-serif',
            }}
            onMouseEnter={e => { if (!isGenerating) { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; e.currentTarget.style.background = C.primaryLt } }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; e.currentTarget.style.background = C.surface }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'inherit' }}>
              {isGenerating ? 'progress_activity' : 'smart_toy'}
            </span>
            GENERATE API TEST
          </button>

          {/* Add Test Case — 3D teal */}
          <button
            onClick={() => { setGeneratedData(null); openCreateForm() }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 20px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(180deg, #278A99 0%, #1E707D 55%, #165964 100%)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(30,112,125,0.28), inset 0 1px 0 rgba(255,255,255,0.25)',
              transition: 'transform 150ms ease, box-shadow 150ms ease',
              fontFamily: 'Inter,-apple-system,sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(30,112,125,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(30,112,125,0.28), inset 0 1px 0 rgba(255,255,255,0.25)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            ADD TEST CASE
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {/* Total */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '16px 20px', flex: '1 1 160px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total Test Cases</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: C.info, fontVariationSettings: "'FILL' 1" }}>assignment</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: C.textPri, lineHeight: 1 }}>{total || testCases.length}</div>
          {total > 0 && <p style={{ fontSize: 11, color: '#22C55E', marginTop: 4, fontWeight: 600 }}>↑ 12% so với tuần trước</p>}
        </div>

        <StatCard label="Passed"   value={passed}  pct={pct(passed)}  color={C.success} bg={C.successBg} border={C.successBdr} icon="check_circle" />
        <StatCard label="Failed"   value={failed}  pct={pct(failed)}  color={C.danger}  bg={C.dangerBg}  border={C.dangerBdr}  icon="cancel" />
        <StatCard label="Blocked"  value={blocked} pct={pct(blocked)} color={C.warning} bg={C.warningBg} border={C.warningBdr} icon="block" />
        <StatCard label="Not Run"  value={notRun}  pct={pct(notRun)}  color={C.notrun}  bg={C.notrunBg}  border={C.notrunBdr}  icon="radio_button_unchecked" />

        {/* Last Execution */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: '16px 20px', flex: '1 1 160px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Last Execution</span>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.warningBg, border: `1.5px solid ${C.warningBdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: C.warning, fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.textPri, lineHeight: 1 }}>
            {lastExec?.label || '--'}
          </div>
          {lastExec?.sub && <p style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>{lastExec.sub}</p>}
        </div>
      </div>

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
    </div>
  )
}
