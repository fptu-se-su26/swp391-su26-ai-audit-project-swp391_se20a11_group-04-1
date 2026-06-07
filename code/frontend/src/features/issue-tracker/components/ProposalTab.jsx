import { useState } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle2, Clock, ChevronDown, ChevronUp, Crown } from 'lucide-react'

export function ProposalTab({
  proposals = [],
  loading = false,
  ideaApproved = false,
  onApprove,
  onVote,
  onDownvote,
  onAddProposal,
  onAddComment,
  proposalCommentsInputs = {},
  expandedProposalComments = {},
  onToggleCommentsVisibility,
  onSetFeedbackText,
  isLeader = false
}) {
  const [newProposal, setNewProposal] = useState('')

  const handleAddProposal = () => {
    if (!newProposal.trim()) return
    onAddProposal(newProposal.trim())
    setNewProposal('')
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
    <div className="flex flex-col gap-4">
      {!ideaApproved && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
          <Clock size={15} />
          <span>Idea chưa được thông qua. Vẫn có thể bổ sung đề xuất để làm rõ yêu cầu.</span>
        </div>
      )}

      <div className="text-xs text-slate-500 font-bold px-1 uppercase tracking-wider">
        Đề xuất ({proposals.length})
      </div>

      <div className="flex flex-col gap-3">
        {loading && (
          <div className="text-center text-sm text-slate-400 py-8">Đang tải đề xuất...</div>
        )}
        {!loading && proposals.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 font-medium">
            Chưa có đề xuất checklist nào. Hãy để lại đề xuất đầu tiên của bạn bên dưới!
          </div>
        )}

        {proposals.map((p) => {
          const hasVoted = p.myVote === 'UP'
          const hasDownvoted = p.myVote === 'DOWN'
          const isPending = p.status === 'PENDING'
          const isApproved = p.status === 'APPROVED'
          const isRejected = p.status === 'REJECTED'
          const isExpanded = expandedProposalComments[p.id]
          const initials = p.createdByName ? p.createdByName.split(' ').filter(Boolean).map(x => x[0]).join('').slice(0, 2).toUpperCase() : 'U'

          return (
            <div
              key={p.id}
              className={`rounded-xl border transition-all ${
                isApproved
                  ? "border-emerald-200 bg-emerald-50/40"
                  : isRejected
                  ? "border-slate-200 bg-slate-50/30 opacity-60"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 text-xs font-bold ${getAvatarBgColor(p.createdByName)}`}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-700">{p.createdByName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-bold">ĐỀ XUẤT</span>
                      <span className="text-xs text-slate-400 font-medium ml-auto">{formatSafeDate(p.createdAt)}</span>
                      {isApproved && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold ml-auto">
                          <CheckCircle2 size={12} /> Đã chốt
                        </span>
                      )}
                      {isRejected && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 font-bold ml-auto">
                          <CheckCircle2 size={12} /> Đã từ chối
                        </span>
                      )}
                      {isPending && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-bold ml-auto">
                          <Clock size={12} /> Chờ duyệt
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-slate-800 font-medium leading-relaxed">{p.content}</p>

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onVote(p.id)}
                        disabled={!isPending}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          hasVoted ? "bg-emerald-100 text-emerald-700 font-bold" : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsUp size={12} className={hasVoted ? "fill-emerald-600" : ""} /> Tán thành ({p.upvotes || 0})
                      </button>
                      <button
                        onClick={() => onDownvote(p.id)}
                        disabled={!isPending}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          hasDownvoted ? "bg-red-100 text-red-600 font-bold" : "text-slate-500 hover:bg-slate-100"
                        }`}
                      >
                        <ThumbsDown size={12} className={hasDownvoted ? "fill-red-600" : ""} /> Không tán thành ({p.downvotes || 0})
                      </button>
                      <button
                        onClick={() => onToggleCommentsVisibility(p.id)}
                        className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={12} />
                        Góp ý ({p.comments?.length || 0})
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>

                      {isPending && isLeader && onApprove && (
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const val = proposalCommentsInputs[p.id] || ''
                      if (!val.trim()) return
                      onAddComment(e, p.id)
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={proposalCommentsInputs[p.id] || ''}
                      onChange={(e) => onSetFeedbackText(p.id, e.target.value)}
                      placeholder="Góp ý phản biện..."
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!(proposalCommentsInputs[p.id] || '').trim()}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Send size={12} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add proposal */}
      <div className="mt-1">
        <div className="text-xs text-slate-500 font-bold px-1 mb-2 uppercase tracking-wider">THÊM ĐỀ XUẤT MỚI</div>
        <div className="flex gap-2 border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
          <input
            type="text"
            value={newProposal}
            onChange={(e) => setNewProposal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddProposal()
            }}
            placeholder="Viết nội dung đề xuất cho checklist..."
            className="flex-1 px-4 py-3 text-sm outline-none placeholder:text-slate-400 text-slate-800 font-semibold"
          />
          <button
            onClick={handleAddProposal}
            disabled={!newProposal.trim()}
            className="m-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Send size={13} /> Đề xuất
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProposalTab
