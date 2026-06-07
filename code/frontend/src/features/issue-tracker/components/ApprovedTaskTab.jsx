import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Clock, ListChecks } from 'lucide-react'

const parseChecklist = (content) => {
  if (!content) return { plainText: '', checklist: [] }
  
  const lines = content.split('\n')
  const checklist = []
  const plainTextLines = []
  
  const checklistRegex = /^-\s+\[([ xX])\]\s+(.*)$/
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    const match = trimmedLine.match(checklistRegex)
    if (match) {
      checklist.push({
        done: match[1].toLowerCase() === 'x',
        text: match[2].trim()
      })
    } else {
      plainTextLines.push(line)
    }
  }
  
  return {
    plainText: plainTextLines.join('\n').trim(),
    checklist
  }
}
export function ApprovedTaskTab({
  task = null,
  proposals = [],
  checklist = [], // task.checklist from Postgres
  onToggleCheck,
  onApproveAndSync,
  isLeader = false,
  onContentScroll
}) {
  const [expandedChecklists, setExpandedChecklists] = useState({})

  const toggleChecklistVisibility = (propId) => {
    setExpandedChecklists(prev => ({
      ...prev,
      [propId]: prev[propId] === false ? true : false
    }))
  }

  const formatSafeDate = (dateString) => {
    if (!dateString) return 'Vừa xong'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Vừa xong'
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const approvedProposals = Array.isArray(proposals) ? proposals.filter((p) => p.status === 'APPROVED') : []

  if (!approvedProposals.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <CheckCircle2 size={40} className="mb-3 opacity-40 text-[#0ea5e9]" />
        <p className="text-sm font-semibold">Chưa có đề xuất nào được thông qua.</p>
        <p className="text-xs mt-1 text-slate-400 font-medium">
          Leader duyệt đề xuất để tạo checklist thực thi chính thức.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col h-full overflow-hidden gap-4">
      {/* Ghi chú và Nút đồng bộ lên hệ thống & GitHub */}
      {task?.githubIssueNumber != null ? (
        <div className="rounded-xl border border-emerald-200 bg-[#f0fdf4]/50 p-4 shadow-sm shrink-0">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>
              Hệ thống đã ghi nhận chuyển đổi và đồng bộ vào lúc {formatSafeDate(task.updatedAt)}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 shadow-sm shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-extrabold tracking-wide uppercase">
                Xác nhận & Đồng bộ
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Nếu bạn xác nhận các đề xuất này đã giải quyết được issue của bạn, hãy bấm vào nút bên cạnh để chuyển chúng thành các task chính thức, đồng bộ lên hệ thống và đẩy lên GitHub.
              </p>
            </div>
            {onApproveAndSync && (
              <button
                onClick={onApproveAndSync}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-indigo-100"
              >
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Chuyển đề xuất thành task & Đồng bộ
              </button>
            )}
          </div>
        </div>
      )}

      {/* Render Approved Proposals as Cards */}
      <div 
        id="approved-task-list-container"
        onScroll={onContentScroll}
        style={{ overflowAnchor: 'none' }}
        className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {approvedProposals.map((p) => {
          const isChecklistExpanded = expandedChecklists[p.id] !== false
          const { plainText, checklist: propChecklist } = parseChecklist(p.content)
          const avatarChar = p.createdByName ? p.createdByName.charAt(0).toUpperCase() : 'U'

          return (
            <div
              key={p.id}
              className="rounded-xl border border-emerald-200 bg-emerald-50/10 transition-all relative"
            >
              {/* Header section */}
              <div className="p-4 rounded-t-xl border-b border-emerald-100/30 bg-[#f0fdf4]/50">
                <div className="flex items-start gap-3">
                  {/* Squircle Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 text-lg font-bold shadow-sm">
                    {avatarChar}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title and Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800 leading-snug">
                        {plainText || "Đề xuất checklist"}
                      </h3>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        ĐÃ PHÊ DUYỆT
                      </span>
                      <span className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-bold">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Đề xuất bởi: {p.createdByName}
                      </span>
                    </div>

                    {/* ID & Date Row */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-semibold flex-wrap">
                      <span>ID: #{p.id ? p.id.slice(-6).toUpperCase() : 'N/A'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {formatSafeDate(p.createdAt)}
                      </span>
                      <button
                        onClick={() => toggleChecklistVisibility(p.id)}
                        className="ml-auto flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer text-xs font-bold"
                      >
                        <ListChecks size={12} />
                        Checklist ({propChecklist.length})
                        {isChecklistExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist Items (Only Toggle checkbox allowed, no add/delete/feedback) */}
              {isChecklistExpanded && propChecklist.length > 0 && (
                <div className="p-4 pt-3 flex flex-col gap-3">
                  <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                    <div className="flex flex-col gap-2.5">
                      {propChecklist.map((item, idx) => {
                        // Find matching item in Postgres task.checklist to get the live "done" status & id
                        const matchedItem = checklist.find(
                          (c) => String(c.content || c.text || '').trim() === String(item.text).trim()
                        )
                        const isDone = matchedItem ? matchedItem.done : item.done
                        const itemId = matchedItem ? matchedItem.id : null

                        return (
                          <div key={idx} className="flex items-center gap-3">
                            {/* Custom Checkbox */}
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all shrink-0 ${
                                isDone
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isDone && (
                                <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>

                            {/* Text & Icon */}
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`text-sm font-semibold select-none truncate ${
                                    isDone
                                      ? "line-through text-slate-400 font-medium"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {item.text}
                                </span>
                                {isDone && (
                                  <span className="flex items-center text-emerald-500 shrink-0">
                                    <svg className="w-4.5 h-4.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="m9 12 2 2 4-4" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ApprovedTaskTab
