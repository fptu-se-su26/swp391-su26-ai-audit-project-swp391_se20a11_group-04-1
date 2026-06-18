import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import useTestCaseStore from '../stores/useTestCaseStore'
import TestCaseFilterBar from '../components/TestCaseFilterBar'
import TestCaseTable from '../components/TestCaseTable'
import TestCaseFormModal from '../components/TestCaseFormModal'
import DeleteConfirmDialog from '../components/DeleteConfirmDialog'

export default function TestCasePage() {
  const { projectId = '1' } = useParams() // Fallback to 1 if not in URL for this demo phase
  const {
    testCases = [],
    isLoading,
    error,
    pagination,
    filters,
    isFormOpen,
    isDeleteDialogOpen,
    editingTestCase,
    deletingTestCase,
    fetchTestCases,
    setFilters,
    openCreateForm,
    openEditForm,
    closeForm,
    openDeleteDialog,
    closeDeleteDialog,
    createTestCase,
    updateTestCase,
    deleteTestCase,
  } = useTestCaseStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formError, setFormError] = useState(null)
  
  // Custom states for pre-filling create modal via AI
  const [generatedData, setGeneratedData] = useState(null)

  // Initial fetch
  useEffect(() => {
    if (projectId) {
      fetchTestCases(projectId, 0)
    }
  }, [projectId, fetchTestCases, filters])

  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm })
  }

  const handlePageChange = (newPage) => {
    fetchTestCases(projectId, newPage)
  }

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      if (editingTestCase) {
        await updateTestCase(projectId, editingTestCase.id, payload)
      } else {
        await createTestCase(projectId, payload)
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'An error occurred while saving the test case.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTestCase) return
    setIsDeleting(true)
    try {
      await deleteTestCase(projectId, deletingTestCase.id)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleGenerateApiTest = async () => {
    const description = window.prompt("Enter API description or curl command:")
    if (!description) return

    setIsGenerating(true)
    try {
      const payload = await useTestCaseStore.getState().generateApiTest(projectId, description)
      setGeneratedData(payload)
      openCreateForm()
    } catch (err) {
      alert("Failed to generate API test: " + (err.response?.data?.message || err.message))
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex-1 p-margin_desktop">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack_lg gap-stack_md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Test Cases</h2>
          <p className="font-body-lg text-body-lg text-secondary mt-1">Manage and track manual and automated tests.</p>
        </div>
        <div className="flex items-center gap-stack_md">
          <button 
            onClick={handleGenerateApiTest}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest text-on-surface border border-outline-variant rounded hover:bg-surface-container transition-colors active:scale-95 duration-150 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="material-symbols-outlined text-[18px] text-primary animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[18px] text-primary">smart_toy</span>
            )}
            <span className="font-label-md text-label-md uppercase">Generate API Test</span>
          </button>
          <button
            onClick={() => { setGeneratedData(null); openCreateForm(); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded hover:bg-primary-fixed-variant transition-colors active:scale-95 duration-150 shadow-[0_4px_12px_rgba(0,60,144,0.1)]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-label-md text-label-md uppercase">Add Test Case</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <TestCaseFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onSearch={handleSearch}
      />

      {/* Data Table */}
      <TestCaseTable
        testCases={testCases}
        pagination={pagination}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onEdit={openEditForm}
        onDelete={openDeleteDialog}
      />

      {/* Modals */}
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
        message={`Are you sure you want to delete test case ${deletingTestCase?.code}? This will remove all its steps. Validation against active bug reports will be checked.`}
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteDialog}
      />
    </div>
  )
}
