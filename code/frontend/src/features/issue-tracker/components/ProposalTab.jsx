import { useState, useRef, useEffect, useMemo } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle2, Clock, ChevronDown, ChevronUp, Crown, Plus, Trash2, ListChecks } from 'lucide-react'

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

export function ProposalTab({
  proposals = [],
  loading = false,
  ideaApproved = false,
  readOnly = false,
  onApprove,
  onVote,
  onDownvote,
  onAddProposal,
  onAddComment,
  proposalCommentsInputs = {},
  expandedProposalComments = {},
  onToggleCommentsVisibility,
  onSetFeedbackText,
  isLeader = false,
  onUpdateProposal,
  onContentScroll
}) {
  const safeProposals = Array.isArray(proposals) ? proposals : []
  const safeCommentsInputs = proposalCommentsInputs || {}
  const safeExpandedComments = expandedProposalComments || {}

  const sortedProposals = useMemo(() => {
    return [...safeProposals].sort((a, b) => {
      const aChot = a.status === 'APPROVED' || a.status === 'REJECTED';
      const bChot = b.status === 'APPROVED' || b.status === 'REJECTED';
      if (aChot !== bChot) {
        return aChot ? 1 : -1;
      }
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [safeProposals])

  const [proposalDesc, setProposalDesc] = useState('')
  const [inputTexts, setInputTexts] = useState({})
  const [savingIds, setSavingIds] = useState({})
  const [expandedChecklists, setExpandedChecklists] = useState({})
  const [isLabelCollapsed, setIsLabelCollapsed] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const handleScroll = () => {
      setIsLabelCollapsed(el.scrollTop > 40)
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleChecklistVisibility = (propId) => {
    setExpandedChecklists(prev => ({
      ...prev,
      [propId]: prev[propId] === false ? true : false
    }))
  }

  const handleAddProposal = () => {
    if (!proposalDesc.trim()) return
    onAddProposal(proposalDesc.trim())
    setProposalDesc('')
  }

  const handleAddChecklistItem = async (proposalId, checklist, plainText) => {
    const textToAdd = (inputTexts[proposalId] || '').trim()
    if (!textToAdd || savingIds[proposalId]) return

    setSavingIds(prev => ({ ...prev, [proposalId]: true }))
    try {
      const updatedChecklist = [...checklist, { text: textToAdd, done: false }]
      const markdown = [
        plainText,
        ...updatedChecklist.map(item => `- [${item.done ? 'x' : ' '}] ${item.text}`)
      ].filter(Boolean).join('\n')
      await onUpdateProposal(proposalId, markdown)
      setInputTexts(prev => ({ ...prev, [proposalId]: '' }))
    } finally {
      setSavingIds(prev => ({ ...prev, [proposalId]: false }))
    }
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

  const getAvatarBgColor = (name) => {
    if (!name) return 'bg-[#0ea5e9]'
    const charCode = name.charCodeAt(0)
    const colors = [
      'bg-[#0ea5e9]', // Ocean Blue
      'bg-[#38bdf8]', // Sky Blue
      'bg-[#ec4899]', // Pink
      'bg-[#f43f5e]', // Rose
      'bg-[#10b981]', // Emerald
      'bg-[#f59e0b]', // Amber
      'bg-[#8b5cf6]', // Violet
    ]
    return colors[charCode % colors.length]
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      {!ideaApproved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold shrink-0">
          <Clock size={15} />
          <span>Idea chưa được thông qua. Vẫn có thể bổ sung đề xuất để làm rõ yêu cầu.</span>
        </div>
      )}

      <div className={`transition-all duration-300 ease-in-out overflow-hidden shrink-0 ${isLabelCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-8 opacity-100 mb-2'}`}>
        <div className="text-xs text-slate-500 font-bold px-1 uppercase tracking-wider">
          Đề xuất ({safeProposals.length})
        </div>
      </div>


      <div 
        ref={listRef}
        id="proposal-list-container"
        onScroll={(e) => {
          setIsLabelCollapsed(e.currentTarget.scrollTop > 40)
          if (onContentScroll) onContentScroll(e)
        }}
        style={{ overflowAnchor: 'none' }}
        className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1.5 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        {loading && (
          <div className="text-center text-sm text-slate-400 py-8">Đang tải đề xuất...</div>
        )}
        {!loading && safeProposals.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 font-medium">
            Chưa có đề xuất checklist nào. Hãy để lại đề xuất đầu tiên của bạn bên dưới!
          </div>
        )}

        {sortedProposals.map((p) => {
          const hasVoted = p.myVote === 'UP'
          const hasDownvoted = p.myVote === 'DOWN'
          const isPending = p.status === 'PENDING'
          const isApproved = p.status === 'APPROVED'
          const isRejected = p.status === 'REJECTED'
          const isExpanded = safeExpandedComments[p.id]
          const isChecklistExpanded = expandedChecklists[p.id] !== false
          const { plainText, checklist } = parseChecklist(p.content)
          const total = checklist.length
          const done = checklist.filter(item => item.done).length
          const percent = total > 0 ? (done / total) * 100 : 0
          const avatarChar = p.createdByName ? p.createdByName.charAt(0).toUpperCase() : 'U'

          return (
            <div
              key={p.id}
              className={`rounded-xl border transition-all relative ${
                isApproved
                  ? "border-emerald-200 bg-emerald-50/40"
                  : isRejected
                  ? "border-slate-200 bg-slate-50/30 opacity-60"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              {/* 1. HEADER PART */}
              <div className={`p-4 rounded-t-xl border-b border-slate-100/50 shadow-sm ${
                isApproved ? "bg-[#f0fdf4]" : isRejected ? "bg-[#f8fafc]" : "bg-white"
              }`}>
                <div className="flex items-start gap-3">
                  {/* Squircle Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-[#0ea5e9] flex items-center justify-center text-white shrink-0 text-lg font-bold shadow-sm">
                    {avatarChar}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title and Badges Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-800 leading-snug">
                        {plainText || "Đề xuất checklist"}
                      </h3>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-sky-100 bg-sky-50 text-[#0ea5e9] font-bold">
                        ĐỀ XUẤT
                      </span>
                      <span className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 font-bold">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {p.createdByName}
                      </span>
                    </div>

                    {/* ID, Date, Status Badge Row */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-semibold flex-wrap">
                      <span>ID: #{p.id ? p.id.slice(-6).toUpperCase() : 'N/A'}</span>
                      <span>•</span>
                      <span>{formatSafeDate(p.createdAt)}</span>
                      <span>•</span>
                      {isApproved && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 size={12} /> Đã chốt
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-500 font-bold text-[11px]">
                          <CheckCircle2 size={12} /> Đã từ chối
                        </span>
                      )}
                      {isPending && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-600 font-bold text-[11px]">
                          <CheckCircle2 size={12} /> Chờ phê duyệt
                        </span>
                      )}
                    </div>

                    {/* Buttons Row */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => !readOnly && onVote(p.id)}
                        disabled={!isPending || readOnly}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                          readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        } ${
                          hasVoted ? "bg-emerald-100 text-emerald-700 font-bold" : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsUp size={12} className={hasVoted ? "fill-emerald-600" : ""} /> Tán thành ({p.upvotes || 0})
                      </button>
                      <button
                        onClick={() => !readOnly && onDownvote(p.id)}
                        disabled={!isPending || readOnly}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                          readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                        } ${
                          hasDownvoted ? "bg-red-100 text-red-600 font-bold" : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsDown size={12} className={hasDownvoted ? "fill-red-600" : ""} /> Không tán thành ({p.downvotes || 0})
                      </button>
                      <button
                        onClick={() => toggleChecklistVisibility(p.id)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ListChecks size={12} />
                        Checklist ({total})
                        {isChecklistExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>
                      <button
                        onClick={() => onToggleCommentsVisibility(p.id)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={12} />
                        Góp ý ({p.comments?.length || 0})
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>

                      {isPending && isLeader && onApprove && !readOnly && (
                        <button
                          onClick={() => onApprove(p)}
                          className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer transition-colors shadow-sm"
                        >
                          <Crown size={11} /> Thông qua
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. NON-STICKY BODY PART */}
              {isChecklistExpanded && (
                <div className="p-4 pt-3 flex flex-col gap-3">
                  {total > 0 && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                      {/* Checklist items */}
                      <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            {/* Custom Checkbox */}
                            <div
                              onClick={async () => {
                                if (!isPending || readOnly) return
                                const updatedChecklist = checklist.map((c, i) => i === idx ? { ...c, done: !c.done } : c)
                                const markdown = [
                                  plainText,
                                  ...updatedChecklist.map(item => `- [${item.done ? 'x' : ' '}] ${item.text}`)
                                ].filter(Boolean).join('\n')
                                await onUpdateProposal(p.id, markdown)
                              }}
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                isPending && !readOnly ? "cursor-pointer" : "cursor-default"
                              } ${
                                item.done
                                  ? "bg-[#0ea5e9] border-[#0ea5e9] text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {item.done && (
                                <svg className="w-2.5 h-2.5 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="4">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>

                            {/* Text & Icon & Delete Button */}
                            <div className="flex items-center justify-between flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`text-sm font-semibold select-none truncate ${
                                    item.done
                                      ? "line-through text-slate-400 font-medium"
                                      : "text-slate-700"
                                  }`}
                                >
                                  {item.text}
                                </span>
                                {item.done && (
                                  <span className="flex items-center text-emerald-500 shrink-0">
                                    <svg className="w-4.5 h-4.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                                      <circle cx="12" cy="12" r="10" />
                                      <path d="m9 12 2 2 4-4" />
                                    </svg>
                                  </span>
                                )}
                              </div>

                              {isPending && !readOnly && (
                                <button
                                  onClick={async () => {
                                    const updatedChecklist = checklist.filter((_, i) => i !== idx)
                                    const markdown = [
                                      plainText,
                                      ...updatedChecklist.map(item => `- [${item.done ? 'x' : ' '}] ${item.text}`)
                                    ].filter(Boolean).join('\n')
                                    await onUpdateProposal(p.id, markdown)
                                  }}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Checklist Builder (No Save/Cancel) */}
                  {isPending && !readOnly && (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 transition-all">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Plus size={12} className="text-[#0ea5e9]" />
                        <span>Thêm checklist mô tả</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          disabled={savingIds[p.id]}
                          value={inputTexts[p.id] || ''}
                          onChange={(e) => setInputTexts({ ...inputTexts, [p.id]: e.target.value })}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              await handleAddChecklistItem(p.id, checklist, plainText)
                            }
                          }}
                          placeholder="Nhập tên checklist..."
                          className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#0ea5e9] focus:ring-2 focus:ring-[#0ea5e9]/10 bg-white text-slate-800 font-semibold transition-all disabled:opacity-60"
                        />
                        <button
                          onClick={async () => {
                            await handleAddChecklistItem(p.id, checklist, plainText)
                          }}
                          disabled={!(inputTexts[p.id] || '').trim() || savingIds[p.id]}
                          className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#0284c7] disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1 min-w-[70px] justify-center"
                        >
                          {savingIds[p.id] ? (
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            "Thêm"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback section */}
              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/60 rounded-b-xl">
                  {p.comments && p.comments.length > 0 && (
                    <div className="flex flex-col gap-2 mb-3 max-h-[200px] overflow-y-auto pr-1">
                      {p.comments.map((f) => (
                        <div key={f.id} className="flex items-start gap-2 bg-white border border-slate-100 p-2.5 rounded-lg shadow-sm">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 text-[10px] font-bold ${getAvatarBgColor(f.createdByName)}`}
                          >
                            {f.createdByName ? f.createdByName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-2 items-center">
                              <span className="text-xs font-bold text-slate-700">{f.createdByName}</span>
                              <span className="text-[10px] text-slate-400 font-medium ml-auto">{formatSafeDate(f.createdAt)}</span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 leading-normal">{f.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!readOnly ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const val = safeCommentsInputs[p.id] || ''
                        if (!val.trim()) return
                        onAddComment(e, p.id)
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={safeCommentsInputs[p.id] || ''}
                        onChange={(e) => onSetFeedbackText(p.id, e.target.value)}
                        placeholder="Góp ý phản biện..."
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                      />
                      <button
                        type="submit"
                        disabled={!(safeCommentsInputs[p.id] || '').trim()}
                        className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <Send size={12} />
                      </button>
                    </form>
                  ) : (
                    <div className="text-[11px] text-slate-400 font-bold text-center py-1 bg-white/50 border border-slate-200/50 rounded-lg">
                      Mục góp ý thảo luận đề xuất ở chế độ chỉ đọc.
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add proposal */}
      {!readOnly ? (
        <div className="mt-4">
          <div className="text-xs text-slate-500 font-bold px-1 mb-2 uppercase tracking-wider">THÊM ĐỀ XUẤT MỚI</div>
          <div className="flex gap-2 border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:border-[#0ea5e9] focus-within:ring-2 focus-within:ring-[#0ea5e9]/10 transition-all shadow-sm">
            <input
              type="text"
              value={proposalDesc}
              onChange={(e) => setProposalDesc(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddProposal()
              }}
              placeholder="Viết nội dung đề xuất cho checklist..."
              className="flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-400 text-slate-800 font-semibold"
            />
            <button
              onClick={handleAddProposal}
              disabled={!proposalDesc.trim()}
              className="m-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
            >
              <Send size={13} /> Đề xuất
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 text-center py-3.5 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400">
          Ý tưởng đã được chuyển thành Task chính thức và đồng bộ lên GitHub.
        </div>
      )}
    </div>
  )
}

export default ProposalTab
