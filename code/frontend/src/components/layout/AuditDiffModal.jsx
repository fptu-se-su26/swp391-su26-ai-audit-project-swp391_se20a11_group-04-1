import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { diffWords } from 'diff'
import toast from 'react-hot-toast'
import api from '@/api/axiosConfig'
import useAuthStore from '@store/useAuthStore'
import useProjectStore from '@store/useProjectStore'

export default function AuditDiffModal({ auditId, onClose }) {
  const [loading, setLoading] = useState(true)
  const [auditData, setAuditData] = useState(null)
  const [reverting, setReverting] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showConfirmRevert, setShowConfirmRevert] = useState(false)
  const { user } = useAuthStore()
  const { activeProject } = useProjectStore()

  useEffect(() => {
    if (auditId) {
      fetchAuditLog()
    }
  }, [auditId])

  const fetchAuditLog = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/audit-diff/${auditId}`)
      setAuditData(res.data)
    } catch (error) {
      toast.error('Failed to load audit diff')
    } finally {
      setLoading(false)
    }
  }

  const handleRevert = async () => {
    try {
      setReverting(true)
      await api.post(`/audit-diff/${auditId}/revert`)
      toast.success('Successfully reverted the changes')
      window.dispatchEvent(new Event('entityReverted'))
      onClose()
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || 'Failed to revert changes'
      toast.error('Lỗi: ' + errMsg)
      console.error("Revert error details:", error.response?.data)
    } finally {
      setReverting(false)
      setShowConfirmRevert(false)
    }
  }

  const handleApprove = async () => {
    try {
      setApproving(true)
      await api.post(`/audit-diff/${auditId}/approve`)
      toast.success('Successfully approved the changes')
      onClose()
    } catch (error) {
      const errMsg = error.response?.data?.error || error.message || 'Failed to approve changes'
      toast.error('Lỗi: ' + errMsg)
      console.error("Approve error details:", error.response?.data)
    } finally {
      setApproving(false)
    }
  }

  if (!auditId) return null

  // We rely on the server to tell us if the user can revert this specific change
  const canRevert = auditData?.canRevert === true
  const canApprove = auditData?.canApprove === true

  const renderDiff = () => {
    if (!auditData) return null
    let oldObj = {}
    let newObj = {}
    try {
      oldObj = JSON.parse(auditData.oldValue || '{}')
      newObj = JSON.parse(auditData.newValue || '{}')
    } catch (e) {}

    const allKeys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)]))
    // Determine which keys to display (show all relevant fields, not just changes)
    const displayKeys = allKeys.filter(k => !['id', 'project', 'requirement', 'useCase', 'children', 'owner', 'primaryAssignee', 'assignedMembers'].includes(k))

    if (displayKeys.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-3">info</span>
          <div className="text-sm text-on-surface-variant font-medium">No details available to display.</div>
        </div>
      )
    }

    const formatValue = (val) => {
      if (val === null || val === undefined) return 'N/A';
      
      let parsedVal = val;
      // If the value is a stringified JSON array or object (like acceptanceCriteria), parse it first
      if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
        try {
          parsedVal = JSON.parse(val);
        } catch (e) {}
      }

      if (typeof parsedVal === 'object') {
        // Special formatting for Use Case Flows
        if (parsedVal.steps && Array.isArray(parsedVal.steps)) {
          return parsedVal.steps.join('\n');
        }
        if (parsedVal.flows && Array.isArray(parsedVal.flows)) {
          return parsedVal.flows.map(f => {
            const stepsText = (f.steps || []).join('\n');
            // If the name is generic or redundant, just return the steps
            if (!f.name || f.name.includes('Generated Alternative Flow') || stepsText.includes(f.name)) {
              return stepsText;
            }
            return `[${f.name}]\n${stepsText}`;
          }).join('\n\n');
        }
        if (Array.isArray(parsedVal)) {
           if (parsedVal.length > 0 && typeof parsedVal[0] === 'object' && parsedVal[0].content) {
              // Checklist items array
              return parsedVal.map(item => `[${item.done ? 'x' : ' '}] ${item.content}`).join('\n');
           }
           return parsedVal.length > 0 ? '• ' + parsedVal.join('\n• ') : 'None';
        }
        return JSON.stringify(parsedVal, null, 2);
      }
      const str = String(parsedVal);
      // Strip HTML tags for clean diff view
      return str.replace(/<[^>]+>/g, '').trim() || '(Empty)';
    }

    const renderInlineDiff = (oldText, newText, isOldColumn) => {
      const o = formatValue(oldText);
      const n = formatValue(newText);
      const diffParts = diffWords(o, n);

      return (
        <div className="leading-relaxed">
          {diffParts.map((part, i) => {
            if (isOldColumn) {
              // Old column: ignore added words, highlight removed words in red
              if (part.added) return null;
              if (part.removed) {
                return (
                  <span key={i} className="bg-error/20 text-error font-bold px-1 rounded mx-0.5 line-through decoration-error/50">
                    {part.value}
                  </span>
                );
              }
              return <span key={i}>{part.value}</span>;
            } else {
              // New column: ignore removed words, highlight added words in green
              if (part.removed) return null;
              if (part.added) {
                return (
                  <span key={i} className="bg-emerald-200 text-emerald-900 font-bold px-1 rounded mx-0.5">
                    {part.value}
                  </span>
                );
              }
              return <span key={i}>{part.value}</span>;
            }
          })}
        </div>
      );
    }

    const getLayoutConfig = (entityType) => {
      const type = (entityType || '').toUpperCase();
      if (type === 'REQUIREMENT') {
        return [
          { title: 'Requirement Details', fields: ['title', 'description'] },
          { title: 'Properties', fields: ['type', 'priority', 'status', 'tags', 'startDate', 'deadline'] },
          { title: 'Acceptance Criteria', fields: ['acceptanceCriteria'] }
        ]
      }
      if (type === 'TASK') {
        return [
          { title: 'Task Details', fields: ['title', 'description'] },
          { title: 'Task Checklist', fields: ['checklist', 'checklists'] },
          { title: 'Properties', fields: ['type', 'priority', 'status', 'storyPoint', 'startDate', 'dueDate'] }
        ]
      }
      if (type === 'USE_CASE') {
        return [
          { title: 'Use Case Details', fields: ['name', 'useCaseCode', 'precondition', 'postcondition'] },
          { title: 'Flows', fields: ['mainFlow', 'alternativeFlow'] },
          { title: 'Properties', fields: ['actors', 'status'] }
        ]
      }
      return [{ title: 'Details', fields: displayKeys }]
    }

    const layoutConfig = getLayoutConfig(auditData.entityType);
    const assignedKeys = layoutConfig.flatMap(g => g.fields);

    const renderFormPanel = (isOld) => {
      return (
        <div className="flex-1 flex flex-col border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm bg-surface-container-lowest">
          <div className={`p-3 border-b text-center ${isOld ? 'bg-error/10 border-error/20 text-error/80' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700/80'}`}>
            <span className="text-[12px] font-black uppercase tracking-widest">{isOld ? 'Previous Version' : 'Current Version'}</span>
          </div>
          <div className="flex-1 p-5 space-y-6">
            {layoutConfig.map((group, idx) => {
              const validFields = group.fields.filter(f => displayKeys.includes(f));
              if (validFields.length === 0) return null;

              return (
                <div key={idx} className="bg-surface-container-low/30 p-4 rounded-xl border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <h3 className="font-bold text-[13px] text-on-surface mb-3 border-b border-outline-variant/20 pb-2">{group.title}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {validFields.map(key => {
                      const isLong = ['description', 'acceptanceCriteria', 'mainFlow', 'alternativeFlow', 'precondition', 'postcondition', 'title', 'name', 'checklist', 'checklists'].includes(key);
                      return (
                        <div key={key} className={isLong ? "col-span-2" : "col-span-1"}>
                          <div className="text-[10px] font-bold uppercase text-on-surface-variant mb-1 ml-1 flex items-center gap-1 tracking-wider">
                             {key}
                          </div>
                          <div className="px-3.5 py-2.5 rounded-lg border text-[13px] min-h-[42px] whitespace-pre-wrap leading-relaxed bg-white border-outline-variant/30 text-on-surface">
                            {renderInlineDiff(oldObj[key], newObj[key], isOld)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center bg-gradient-to-r from-surface-container-low to-transparent p-4 rounded-xl border border-outline-variant/40 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E707D]/10 flex items-center justify-center text-[#1E707D] font-black text-lg border border-[#1E707D]/20 shadow-inner">
               {auditData.username?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex flex-col">
               <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wide">Modified by</span>
               <span className="text-[15px] font-black text-[#1E707D]">{auditData.username}</span>
            </div>
            {auditData.status === 'REVERTED' && (
              <span className="ml-2 px-2 py-0.5 bg-error/10 text-error text-[10px] font-bold uppercase tracking-wider rounded border border-error/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">undo</span> Reverted
              </span>
            )}
            {auditData.status === 'APPROVED' && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">check_circle</span> Approved
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container border border-outline-variant/30 px-2.5 py-0.5 rounded-md mb-1.5 uppercase tracking-widest">
               {auditData.entityType}
             </span>
             <span className="text-[15px] font-bold text-on-surface">
               {newObj.title || newObj.name || newObj.reqCode || newObj.useCaseCode || `ID: ${auditData.entityId}`}
             </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {renderFormPanel(true)}
          {renderFormPanel(false)}
        </div>
      </div>
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-surface-container-lowest rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container-low/30">
          <h2 className="text-xl font-black text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1E707D]">history</span>
            Change History
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="w-8 h-8 border-4 border-[#1E707D] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            renderDiff()
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/30 bg-surface-container-low/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface hover:bg-surface-container transition-colors"
          >
            Close
          </button>
          
          {canApprove && auditData && (
            <button
              onClick={handleApprove}
              disabled={approving || reverting}
              className="px-5 py-2.5 rounded-full font-bold text-sm bg-primary text-on-primary hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {approving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[18px]">check</span>
              )}
              Approve Change
            </button>
          )}

          {canRevert && auditData && (
            <button
              onClick={() => setShowConfirmRevert(true)}
              disabled={approving || reverting}
              className="px-5 py-2.5 rounded-full font-bold text-sm bg-error text-white hover:bg-error/90 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {reverting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[18px]">restore</span>
              )}
              Revert Change
            </button>
          )}
        </div>
      </div>
      
      {/* Custom Confirm Modal */}
      {showConfirmRevert && (
        <div className="absolute inset-0 bg-black/40 z-[60] flex items-center justify-center backdrop-blur-sm animate-fade-in rounded-2xl">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 animate-scale-up border border-outline-variant/30">
            <h3 className="text-lg font-bold text-on-surface mb-2">Revert Changes</h3>
            <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to restore the previous version of this entity?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConfirmRevert(false)}
                className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                disabled={reverting}
              >
                Cancel
              </button>
              <button 
                onClick={handleRevert}
                className="px-4 py-2 text-sm font-bold bg-error text-white rounded-full hover:bg-error/90 transition-colors flex items-center gap-2"
                disabled={reverting}
              >
                {reverting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : null}
                Confirm Revert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}
