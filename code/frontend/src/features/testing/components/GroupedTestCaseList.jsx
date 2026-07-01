import React, { useMemo } from 'react'
import TestCaseTypeGroup from './TestCaseTypeGroup'

export default function GroupedTestCaseList({ testCases, onEdit, onDelete, projectId }) {
  const groupedCases = useMemo(() => {
    const groups = {
      UI: [],
      API: [],
      UNIT: [],
      MANUAL: []
    }
    
    testCases.forEach(tc => {
      if (groups[tc.type]) {
        groups[tc.type].push(tc)
      } else {
        // Fallback for unknown types
        groups.MANUAL.push(tc)
      }
    })
    
    return groups
  }, [testCases])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <TestCaseTypeGroup type="UI" testCases={groupedCases.UI} onEdit={onEdit} onDelete={onDelete} projectId={projectId} />
      <TestCaseTypeGroup type="API" testCases={groupedCases.API} onEdit={onEdit} onDelete={onDelete} projectId={projectId} />
      <TestCaseTypeGroup type="UNIT" testCases={groupedCases.UNIT} onEdit={onEdit} onDelete={onDelete} projectId={projectId} />
      <TestCaseTypeGroup type="MANUAL" testCases={groupedCases.MANUAL} onEdit={onEdit} onDelete={onDelete} projectId={projectId} />
    </div>
  )
}
