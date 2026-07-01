import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import useTestCaseStore from '../stores/useTestCaseStore'
import { C, T } from '../utils/theme'

export default function TestCaseTableRow({ testCase, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const menuRef = useRef(null)
  const { openDrawer } = useTestCaseStore()
  const navigate = useNavigate()
  const { projectId = '1' } = useParams()

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
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }).replace(',', '')
  }

  const priorityColor = testCase.priority === 'HIGH' ? '#EA580C' : 
                        testCase.priority === 'LOW' ? C.success : C.warning

  return (
    <tr 
      style={{
        background: isHovered ? C.bg : C.surface,
        borderBottom: `1px solid ${C.borderLt}`,
        cursor: 'pointer', transition: T.transition.default
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/projects/${projectId}/test-cases/${testCase.id}`)}
    >
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: C.primaryDark }}>{testCase.code}</td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: C.textPri }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{testCase.title}</span>
        </div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <StatusBadge status={testCase.status} />
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600 }}>
        {testCase.priority ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: priorityColor }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: priorityColor }}></span>
            {testCase.priority === 'MEDIUM' ? 'Medium' : testCase.priority === 'HIGH' ? 'High' : 'Low'}
          </span>
        ) : (
          <span style={{ color: C.textMuted }}>—</span>
        )}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textSec }}>
        {testCase.status === 'NOT_RUN' ? '—' : formatDate(testCase.lastExecutedAt)}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: C.textSec }}>
        {formatDate(testCase.updatedAt)}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, color: C.textPri }}>
        {testCase.status === 'NOT_RUN' ? '—' : (testCase.lastExecutedBy || 'System')}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center', position: 'relative' }} ref={menuRef}>
        <button
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: isHovered ? C.textSec : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4
          }}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
        </button>
        
        {menuOpen && (
          <div style={{
            position: 'absolute', right: 32, top: 12, zIndex: 30,
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: T.radius.sm,
            boxShadow: T.shadow.lg, padding: 4, minWidth: 120,
            display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <button
              style={{ padding: '6px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: C.textPri, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate(`/projects/${projectId}/test-cases/${testCase.id}`) }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textSec }}>visibility</span> View
            </button>
            <button
              style={{ padding: '6px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: C.textPri, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(testCase) }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.textSec }}>edit</span> Edit
            </button>
            <button
              style={{ padding: '6px 12px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: C.danger, borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = C.dangerBg}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(testCase) }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: C.danger }}>delete</span> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
