import { useState, useEffect, useRef } from 'react'
import { ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle2, Crown, ChevronDown, ChevronUp, CornerDownRight } from 'lucide-react'

export function CommentTab({
  comments = [],
  loading = false,
  approved = false,
  onApprove,
  onToggleLike,
  onToggleDislike,
  onAddComment,
  onAddReply,
  currentUserInitials = 'U',
  isLeader = false,
  projectMembers = []
}) {
  const [newComment, setNewComment] = useState('')
  const [replyInputs, setReplyInputs] = useState({})
  const [expandedReplies, setExpandedReplies] = useState({}) // commentId -> boolean
  const [highlightedReplyId, setHighlightedReplyId] = useState(null)
  
  // Mentions autocomplete state
  const [mentionState, setMentionState] = useState({
    show: false,
    query: '',
    targetType: 'main', // 'main' or 'reply'
    commentId: null, // null for main comment, ID for reply inputs
    cursorIndex: 0,
    filteredMembers: []
  })
  
  const [activeSelectIndex, setActiveSelectIndex] = useState(0)
  const dropdownRef = useRef(null)
  const prevRepliesCount = useRef({})

  // Auto-scroll and highlight new replies
  useEffect(() => {
    comments.forEach(c => {
      const prevCount = prevRepliesCount.current[c.id] || 0
      const currentCount = c.replies?.length || 0
      if (currentCount > prevCount && prevCount > 0) {
        const lastReply = c.replies[c.replies.length - 1]
        if (lastReply) {
          setHighlightedReplyId(lastReply.id)
          setTimeout(() => {
            const el = document.getElementById(`reply-item-${lastReply.id}`)
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          }, 150)
          setTimeout(() => {
            setHighlightedReplyId(null)
          }, 3000)
        }
      }
      prevRepliesCount.current[c.id] = currentCount
    })
  }, [comments])

  // Handle click outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMentionState(prev => ({ ...prev, show: false }))
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAddComment = () => {
    if (!newComment.trim()) return
    onAddComment(newComment.trim())
    setNewComment('')
  }

  const handleSendReply = (commentId) => {
    const text = replyInputs[commentId] || ''
    if (!text.trim()) return
    if (onAddReply) {
      onAddReply(commentId, text.trim())
    }
    setReplyInputs(prev => ({ ...prev, [commentId]: '' }))
    setExpandedReplies(prev => ({ ...prev, [commentId]: true }))
  }

  const renderContentWithTags = (text) => {
    if (!text) return ''
    
    // Pattern to match @[FullName] or @[username]
    // Since names can have spaces, we look for @ followed by characters up to word boundaries/next tag
    const parts = text.split(/(@[^\s,.:;?!=+*&^%#$@()\[\]{}|\\/]+(?:\s+[^\s,.:;?!=+*&^%#$@()\[\]{}|\\/]+){0,3})/g)
    
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        // Find if this tag matches any project member
        const cleanedName = part.substring(1).trim().toLowerCase()
        const isMember = projectMembers.some(
          m => (m.fullName || '').toLowerCase() === cleanedName || (m.username || '').toLowerCase() === cleanedName
        )
        if (isMember || part.length > 1) {
          return (
            <span key={i} className="text-[#0ea5e9] font-bold select-text">
              {part}
            </span>
          )
        }
      }
      return <span key={i} className="text-slate-800 font-medium select-text">{part}</span>
    })
  }

  const formatSafeDate = (dateString) => {
    if (!dateString) return 'Vừa xong'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Vừa xong'
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${hours}:${minutes} ${day}/${month}/${year}`
  }

  const getAvatarBgColor = (name) => {
    if (!name) return 'bg-[#0ea5e9]'
    const charCode = name.charCodeAt(0)
    const colors = [
      'bg-[#0ea5e9]',
      'bg-[#38bdf8]',
      'bg-[#ec4899]',
      'bg-[#f43f5e]',
      'bg-[#10b981]',
      'bg-[#f59e0b]',
      'bg-[#8b5cf6]',
    ]
    return colors[charCode % colors.length]
  }

  const toggleReplies = (comment) => {
    const nextState = !expandedReplies[comment.id]
    setExpandedReplies(prev => ({
      ...prev,
      [comment.id]: nextState
    }))

    if (nextState) {
      const currentInput = replyInputs[comment.id] || ''
      const tag = `@${comment.createdByName} `
      if (!currentInput.trim()) {
        setReplyInputs(prev => ({ ...prev, [comment.id]: tag }))
      }
      setTimeout(() => {
        const textarea = document.querySelector(`textarea[placeholder="Trả lời ${comment.createdByName}..."]`)
        if (textarea) {
          textarea.focus()
          const len = textarea.value.length
          textarea.setSelectionRange(len, len)
        }
      }, 100)
    }
  }

  // Handle Autocomplete Input Change
  const handleInputChange = (value, selectionStart, type, commentId = null) => {
    if (type === 'main') {
      setNewComment(value)
    } else {
      setReplyInputs(prev => ({ ...prev, [commentId]: value }))
    }

    // Check if user is typing a mention
    const textBeforeCursor = value.slice(0, selectionStart)
    const atIndex = textBeforeCursor.lastIndexOf('@')

    if (atIndex !== -1 && (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1]))) {
      const query = textBeforeCursor.slice(atIndex + 1)
      // Only keep query matching name format (alphanumeric spaces, up to 25 chars)
      if (/^[a-zA-Z0-9\sÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơ\s]*$/.test(query) && query.length < 25) {
        const filtered = projectMembers.filter(m => {
          const name = (m.fullName || m.username || '').toLowerCase()
          return name.includes(query.toLowerCase())
        })

        setMentionState({
          show: true,
          query,
          targetType: type,
          commentId,
          cursorIndex: selectionStart,
          filteredMembers: filtered
        })
        setActiveSelectIndex(0)
        return
      }
    }

    setMentionState(prev => ({ ...prev, show: false }))
  }

  // Insert selected mention tag
  const insertMention = (member) => {
    const name = member.fullName || member.username
    const targetVal = mentionState.targetType === 'main' ? newComment : (replyInputs[mentionState.commentId] || '')
    const textBeforeCursor = targetVal.slice(0, mentionState.cursorIndex)
    const textAfterCursor = targetVal.slice(mentionState.cursorIndex)
    
    const atIndex = textBeforeCursor.lastIndexOf('@')
    if (atIndex === -1) return

    const newText = textBeforeCursor.slice(0, atIndex) + `@${name} ` + textAfterCursor

    if (mentionState.targetType === 'main') {
      setNewComment(newText)
      // Focus back and set cursor
      setTimeout(() => {
        const txt = document.querySelector('textarea[placeholder="Viết góp ý của bạn về idea này..."]')
        if (txt) {
          txt.focus()
          const index = atIndex + name.length + 2
          txt.setSelectionRange(index, index)
        }
      }, 50)
    } else {
      setReplyInputs(prev => ({ ...prev, [mentionState.commentId]: newText }))
      setTimeout(() => {
        const txt = document.querySelector(`textarea[placeholder*="Trả lời"]`)
        if (txt) {
          txt.focus()
          const index = atIndex + name.length + 2
          txt.setSelectionRange(index, index)
        }
      }, 50)
    }

    setMentionState(prev => ({ ...prev, show: false }))
  }

  // Keyboard navigation inside dropdown
  const handleKeyDown = (e) => {
    if (!mentionState.show || mentionState.filteredMembers.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSelectIndex(prev => (prev + 1) % mentionState.filteredMembers.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSelectIndex(prev => (prev - 1 + mentionState.filteredMembers.length) % mentionState.filteredMembers.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      insertMention(mentionState.filteredMembers[activeSelectIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setMentionState(prev => ({ ...prev, show: false }))
    }
  }

  return (
    <div className="flex flex-col gap-5 relative">
      {/* Mention Dropdown Autocomplete Menu */}
      {mentionState.show && mentionState.filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          style={{ bottom: mentionState.targetType === 'main' ? '50px' : 'auto' }}
          className="absolute z-50 bg-white border border-slate-200 shadow-xl rounded-xl py-1 max-h-48 overflow-y-auto w-64 text-xs font-semibold left-4"
        >
          {mentionState.filteredMembers.map((member, i) => (
            <div
              key={member.id}
              onClick={() => insertMention(member)}
              className={`px-3 py-2 cursor-pointer transition-colors flex items-center justify-between ${
                i === activeSelectIndex ? 'bg-sky-500/10 text-[#0ea5e9]' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span>{member.fullName || member.username}</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase">{member.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comments list */}
      <div className="flex flex-col gap-4">
        {loading && (
          <div className="text-center text-sm text-slate-400 py-8">Đang tải bình luận...</div>
        )}
        {!loading && comments.length === 0 && (
          <div className="text-center text-sm text-slate-400 py-8 border border-dashed border-slate-200 rounded-xl">
            Chưa có góp ý nào. Hãy là người đầu tiên!
          </div>
        )}
        {comments.map((c, index) => {
          const initials = c.createdByName ? c.createdByName.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() : 'U'
          const hasLiked = c.myVote === 'UP'
          const hasDisliked = c.myVote === 'DOWN'
          const isRepliesExpanded = !!expandedReplies[c.id]
          const replyCount = c.replies?.length || 0
          return (
            <div
              key={c.id}
              className={`rounded-2xl border bg-white transition-all shadow-sm relative ${
                c.isLeader
                  ? "border-[#38bdf8]/40"
                  : "border-slate-100"
              }`}
            >
              {/* Parent Comment Header & Body: Sticky at top of its container when replies are expanded */}
              <div 
                className={`p-4 transition-colors rounded-t-2xl ${
                  isRepliesExpanded ? 'sticky top-[150px] z-10 bg-white border-b border-slate-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]' : ''
                } ${c.isLeader ? 'bg-sky-50/10' : 'bg-white'}`}
              >
                {/* Header: Avatar, Name, Time */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0 text-sm font-bold ${getAvatarBgColor(c.createdByName)}`}
                  >
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-slate-800">{c.createdByName}</span>
                        {c.isLeader && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#0ea5e9]/10 text-[#0284c7] font-bold">
                            <Crown size={10} /> Leader
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">#{index + 1}</span>
                        <span>{formatSafeDate(c.createdAt)}</span>
                      </div>
                    </div>

                    {/* Comment Content */}
                    <div className="mt-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">{renderContentWithTags(c.content)}</div>
                    
                    {/* Action Bar: Vote, Reply, Toggle Replies */}
                    <div className="mt-4 flex items-center gap-4 flex-wrap select-none text-slate-500">
                      <button
                        onClick={() => onToggleLike(c.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg transition-all cursor-pointer ${
                          hasLiked
                            ? "text-emerald-600 font-bold bg-emerald-50"
                            : "hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <ThumbsUp size={14} className={hasLiked ? "fill-emerald-600" : ""} />
                        <span>Tán thành ({c.upvotes || 0})</span>
                      </button>

                      <button
                        onClick={() => onToggleDislike(c.id)}
                        className={`flex items-center gap-1.5 text-xs font-semibold py-1 px-2 rounded-lg transition-all cursor-pointer ${
                          hasDisliked
                            ? "text-rose-600 font-bold bg-rose-50"
                            : "hover:bg-slate-50 hover:text-slate-800"
                        }`}
                      >
                        <ThumbsDown size={14} className={hasDisliked ? "fill-rose-500" : ""} />
                        <span>Phản đối ({c.downvotes || 0})</span>
                      </button>

                      {/* Replies Toggle/Action */}
                      <button
                        onClick={() => {
                          toggleReplies(c)
                        }}
                        className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                          isRepliesExpanded
                            ? "text-[#0ea5e9] bg-[#0ea5e9]/5"
                            : "text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {isRepliesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span>
                          {replyCount > 0 ? `${replyCount} phản hồi` : 'Phản hồi'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Replies Container (Underneath parent - scrolls within the parent block context) */}
              {isRepliesExpanded && (
                <div className="p-4 pt-2 flex flex-col gap-3.5 bg-slate-50/30 rounded-b-2xl">
                  {/* Nested Replies & Reply Input Box */}
                  <div className="flex flex-col gap-3.5">
                    {/* Replies List (Show all loaded replies when expanded) */}
                    {c.replies && c.replies.length > 0 && (() => {
                      const visibleReplies = c.replies || []
                      
                      return (
                        <div className="flex flex-col gap-3">
                          {visibleReplies.map((reply, rIndex) => {
                            const rInitials = reply.createdByName 
                              ? reply.createdByName.split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase() 
                              : 'U'
                            return (
                              <div key={reply.id} id={`reply-item-${reply.id}`} className="flex items-start gap-2.5">
                                <CornerDownRight size={14} className="text-slate-300 mt-2 shrink-0" />
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 text-xs font-bold ${getAvatarBgColor(reply.createdByName)}`}>
                                  {rInitials}
                                </div>
                                <div
                                  className={`flex-1 min-w-0 border rounded-2xl p-3.5 transition-all duration-500 ${
                                    highlightedReplyId === reply.id
                                      ? "bg-[#0ea5e9]/10 border-[#0ea5e9]/40 shadow-sm"
                                      : "bg-slate-50 border-slate-100"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-slate-800 text-[13px]">{reply.createdByName}</span>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                                      <span className="bg-slate-200/60 text-slate-500 px-1 rounded font-bold text-[9px]">#{index + 1}.{rIndex + 1}</span>
                                      <span>{formatSafeDate(reply.createdAt)}</span>
                                    </div>
                                  </div>
                                  <div className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap">{renderContentWithTags(reply.content)}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Reply Input Box - Styled exactly like the main comment box */}
                    <div className="mt-2 flex items-end gap-2 border border-slate-200 rounded-xl bg-white px-3 py-1.5 focus-within:border-[#0ea5e9] focus-within:ring-2 focus-within:ring-[#0ea5e9]/10 transition-all shadow-sm">
                      <textarea
                        placeholder={`Trả lời ${c.createdByName}...`}
                        value={replyInputs[c.id] || ''}
                        onChange={(e) => handleInputChange(e.target.value, e.target.selectionStart, 'reply', c.id)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        style={{ minHeight: '24px', maxHeight: '100px' }}
                        className="flex-1 text-sm text-slate-800 resize-none outline-none placeholder:text-slate-400 font-medium bg-transparent overflow-y-auto py-0.5"
                      />
                      <button
                        onClick={() => handleSendReply(c.id)}
                        disabled={!(replyInputs[c.id] || '').trim()}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0ea5e9] hover:bg-[#0284c7] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm cursor-pointer mb-0.5"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Main Comment Input Box - Integrated with Autocomplete Mentions */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <div className="flex items-end gap-2 border border-slate-200 rounded-xl bg-white px-3 py-1.5 focus-within:border-[#0ea5e9] focus-within:ring-2 focus-within:ring-[#0ea5e9]/10 transition-all shadow-sm">
          <textarea
            value={newComment}
            onChange={(e) => handleInputChange(e.target.value, e.target.selectionStart, 'main')}
            onKeyDown={(e) => {
              handleKeyDown(e)
              if (e.key === 'Enter' && !e.shiftKey && !mentionState.show) {
                e.preventDefault()
                handleAddComment()
                e.target.style.height = 'auto'
              }
            }}
            placeholder="Viết góp ý của bạn về idea này..."
            rows={1}
            style={{ minHeight: '24px', maxHeight: '100px' }}
            className="flex-1 text-sm text-slate-800 resize-none outline-none placeholder:text-slate-400 font-medium bg-transparent overflow-y-auto py-0.5"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0ea5e9] hover:bg-[#0284c7] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 shadow-sm cursor-pointer mb-0.5"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CommentTab
