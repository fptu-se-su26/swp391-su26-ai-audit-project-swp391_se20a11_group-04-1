import TestCaseTableRow from './TestCaseTableRow'
import { C, T } from '../utils/theme'

export default function TestCaseTable({ testCases, pagination, onPageChange, onEdit, onDelete, isLoading }) {
  const { page, totalElements, totalPages, size } = pagination

  const renderPagination = () => {
    // Hide pagination when there's nothing, or everything fits on one page.
    if (!totalElements || totalPages <= 1) return null

    const safeSize = size > 0 ? size : 1  // guard against size=0 in derived pagination

    const maxPagesToShow = 5
    let startPage = Math.max(0, page - Math.floor(maxPagesToShow / 2))
    let endPage   = startPage + maxPagesToShow - 1

    if (endPage >= totalPages) {
      endPage   = totalPages - 1
      startPage = Math.max(0, endPage - maxPagesToShow + 1)
    }

    const pages = []
    for (let i = startPage; i <= endPage; i++) pages.push(i)

    return (
      <div style={{
        padding: '12px 16px', borderTop: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: C.surface,
      }}>
        <span style={{ fontSize: 13, color: C.textSec }}>
          Showing {page * safeSize + 1}–{Math.min((page + 1) * safeSize, totalElements)} of {totalElements}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface,
              color: page === 0 ? C.textMuted : C.textSec,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
            }}
            disabled={page === 0}
            onClick={() => onPageChange(page - 1)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
          </button>

          {startPage > 0 && <span style={{ padding: '0 8px', color: C.textMuted }}>…</span>}

          {pages.map(p => (
            <button
              key={p}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 6,
                border: p === page ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
                background: p === page ? C.primaryLt : C.surface,
                color: p === page ? C.primaryDark : C.textSec,
                fontSize: 13, fontWeight: p === page ? 600 : 400, cursor: 'pointer',
              }}
              onClick={() => onPageChange(p)}
            >
              {p + 1}
            </button>
          ))}

          {endPage < totalPages - 1 && <span style={{ padding: '0 8px', color: C.textMuted }}>…</span>}

          <button
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface,
              color: page >= totalPages - 1 ? C.textMuted : C.textSec,
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(page + 1)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', fontFamily: T.font }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: C.surface, boxShadow: `0 1px 0 ${C.borderLt}` }}>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', width: 80 }}>ID</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase' }}>Title</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', width: 120 }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', width: 100 }}>Priority</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', width: 155 }}>Last Executed</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', width: 155 }}>Last Updated</th>
              <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: C.textSec, textTransform: 'uppercase', width: 140 }}>Executed By</th>
              <th style={{ padding: '12px 16px', width: 48 }}></th>
            </tr>
          </thead>

          {isLoading ? (
            <tbody>
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: C.textSec }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite', color: C.primary }}>
                      progress_activity
                    </span>
                    Loading test cases…
                  </div>
                </td>
              </tr>
            </tbody>
          ) : testCases.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: C.textSec }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: C.textMuted }}>checklist_rtl</span>
                    <span>No test cases found. Adjust filters or add a new test case.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {testCases.map(tc => (
                <TestCaseTableRow key={tc.id} testCase={tc} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </tbody>
          )}
        </table>

        <style>{`
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>

      {renderPagination()}
    </div>
  )
}
