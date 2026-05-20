import TestCaseTableRow from './TestCaseTableRow'

/**
 * TestCaseTable — Bảng danh sách Test Case với pagination
 * Matches table structure from testcase.html
 */
export default function TestCaseTable({ testCases, pagination, onPageChange, onEdit, onDelete, isLoading }) {
  const { page, totalElements, totalPages, size } = pagination

  const renderPagination = () => {
    if (totalPages <= 1) return null

    const pages = []
    for (let i = 0; i < Math.min(totalPages, 5); i++) {
      pages.push(i)
    }

    return (
      <div className="px-4 py-3 border-t border-outline-variant bg-surface-container-lowest flex items-center justify-between">
        <span className="text-sm text-secondary">
          Showing {page * size + 1} to {Math.min((page + 1) * size, totalElements)} of {totalElements} entries
        </span>
        <div className="flex items-center gap-1">
          <button
            className={`w-8 h-8 flex items-center justify-center rounded border border-outline-variant ${page === 0 ? 'text-outline opacity-50 cursor-not-allowed' : 'text-secondary hover:bg-surface-container-low'}`}
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          {pages.map((p) => (
            <button
              key={p}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm ${p === page ? 'bg-primary-container text-on-primary-container font-medium' : 'border border-outline-variant text-secondary hover:bg-surface-container-low'}`}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          ))}
          {totalPages > 5 && <span className="px-2 text-outline">...</span>}
          <button
            className={`w-8 h-8 flex items-center justify-center rounded border border-outline-variant ${page >= totalPages - 1 ? 'text-outline opacity-50 cursor-not-allowed' : 'text-secondary hover:bg-surface-container-low'}`}
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold w-24">ID</th>
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold">Title</th>
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold w-32">Linked REQ</th>
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold w-24">Type</th>
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold w-32">Status</th>
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold w-40">Last Executed By</th>
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold w-40">Last Execution Time</th>
              <th className="py-3 px-4 font-label-md text-label-md text-secondary font-semibold w-16 text-center">Act</th>
            </tr>
          </thead>
          <tbody className="font-body-md text-body-md text-on-surface">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-secondary">
                  <span className="material-symbols-outlined animate-spin text-primary mr-2">progress_activity</span>
                  Loading test cases...
                </td>
              </tr>
            ) : testCases.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-secondary">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2 block">checklist_rtl</span>
                  No test cases found. Click "Add Test Case" to create one.
                </td>
              </tr>
            ) : (
              testCases.map((tc) => (
                <TestCaseTableRow
                  key={tc.id}
                  testCase={tc}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  )
}
