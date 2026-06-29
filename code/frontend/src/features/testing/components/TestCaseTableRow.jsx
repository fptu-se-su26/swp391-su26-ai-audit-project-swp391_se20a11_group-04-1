import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import TypeBadge from './TypeBadge'

/**
 * TestCaseTableRow — Một dòng trong bảng Test Case
 * Hover reveal action button (more_vert) — 3 actions: View / Edit / Delete
 */
export default function TestCaseTableRow({ testCase, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const { projectId } = useParams()

  // Close menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '--'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <tr 
      className="border-b border-outline-variant hover:bg-surface-container-low transition-colors group cursor-pointer"
      onClick={() => navigate(`/projects/${projectId}/test-cases/${testCase.id}`)}
    >
      <td className="py-3 px-4 font-label-md text-label-md text-primary">{testCase.code}</td>
      <td className="py-3 px-4 font-medium">{testCase.title}</td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs border border-outline-variant text-secondary">
          {testCase.requirementCode || '--'}
        </span>
      </td>
      <td className="py-3 px-4">
        <TypeBadge type={testCase.type} />
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={testCase.status} />
      </td>
      <td className="py-3 px-4 text-secondary">{testCase.lastExecutedBy || '--'}</td>
      <td className="py-3 px-4 text-secondary text-sm">{formatDate(testCase.lastExecutedAt)}</td>
      <td className="py-3 px-4 text-center relative" ref={menuRef}>
        <button
          className="text-outline hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
        >
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute right-4 top-full z-30 mt-1 w-36 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg py-1">
            <button
              className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate(`/projects/${projectId}/test-cases/${testCase.id}`) }}
            >
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              View
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(testCase) }}
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm text-error hover:bg-error-container flex items-center gap-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(testCase) }}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
