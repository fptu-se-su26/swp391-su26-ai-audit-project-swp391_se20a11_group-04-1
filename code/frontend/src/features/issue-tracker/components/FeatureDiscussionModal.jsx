import { useEffect, useState, useMemo, useCallback } from 'react'
import { 
  X, 
  User, 
  Clock, 
  CheckCircle2,
  MessageSquare, 
  ListChecks, 
  Lightbulb, 
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Send
} from 'lucide-react'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useKanbanStore from '../../kanban/store/useKanbanStore'
import proposalService from '../services/proposalService'
import ApprovedTaskTab from '../components/ApprovedTaskTab'
import CommentTab from '../components/CommentTab'
import ProposalTab from '../components/ProposalTab'

export default function FeatureDiscussionModal({ taskId, onClose, projectId, onRefreshDashboard }) {
  const activeProject = useProjectStore((state) => state.activeProject)
  const { tasks, fetchTaskById, updateTask } = useKanbanStore()
  const task = tasks.find((item) => String(item.id) === String(taskId))

  // Lấy trạng thái duyệt của Task. Nếu status không phải DRAFT thì coi như idea đã được thông qua.
  const ideaApproved = useMemo(() => {
    if (!task) return false
    const s = task.status ? task.status.toUpperCase() : ''
    return s !== 'DRAFT'
  }, [task])

  // UI state
  const [activeTab, setActiveTab] = useState('comments')
  const [descExpanded, setDescExpanded] = useState(false)

  // Comments (Tab 1) state - loaded from API
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Checklist proposals (Tab 2) state - loaded from API
  const [proposals, setProposals] = useState([])
  const [proposalsLoading, setProposalsLoading] = useState(false)
  const [proposalCommentsInputs, setProposalCommentsInputs] = useState({}) // propId -> text
  const [expandedProposalComments, setExpandedProposalComments] = useState({}) // propId -> boolean

  // Helper date formatting
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

  // Check if current user is Project Leader
  const isLeader = useMemo(() => {
    if (!activeProject?.role) return false
    const r = activeProject.role.toUpperCase().replace(/\s+/g, '_')
    return r === 'PROJECT_LEADER' || r === 'LEADER'
  }, [activeProject?.role])

  // Overall Task Vote state
  const [taskVoteStats, setTaskVoteStats] = useState({ upvotes: 0, downvotes: 0, myVote: null })

  const loadTaskVotes = useCallback(async () => {
    if (!taskId) return
    try {
      const data = await proposalService.getTaskVotes(taskId)
      setTaskVoteStats(data || { upvotes: 0, downvotes: 0, myVote: null })
    } catch (err) {
      console.error('Failed to load task votes:', err)
    }
  }, [taskId])

  // Load task
  useEffect(() => {
    if (taskId) {
      fetchTaskById(taskId)
    }
  }, [fetchTaskById, taskId])

  // Fetch comments and proposals from APIs
  const loadComments = useCallback(async () => {
    if (!taskId) return
    setCommentsLoading(true)
    try {
      const data = await proposalService.getTaskComments(taskId)
      setComments(data || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setCommentsLoading(false)
    }
  }, [taskId])

  const loadProposals = useCallback(async () => {
    if (!taskId) return
    setProposalsLoading(true)
    try {
      const data = await proposalService.getProposals(taskId)
      setProposals(data || [])
    } catch (err) {
      console.error('Failed to load proposals:', err)
    } finally {
      setProposalsLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadComments()
    loadProposals()
    loadTaskVotes()
  }, [loadComments, loadProposals, loadTaskVotes])

  useEffect(() => {
    const handleCommentEvent = (event) => {
      const { type, taskId: eventTaskId, comment } = event.detail
      if (String(eventTaskId) !== String(taskId)) return

      if (type === 'NEW_COMMENT') {
        setComments((prev) => {
          if (prev.some((c) => c.id === comment.id)) return prev
          return [...prev, comment]
        })
      } else if (type === 'UPDATE_COMMENT') {
        setComments((prev) => {
          return prev.map((c) => (c.id === comment.id ? comment : c))
        })
      }
    }

    window.addEventListener('task-comment-event', handleCommentEvent)
    return () => {
      window.removeEventListener('task-comment-event', handleCommentEvent)
    }
  }, [taskId])

  // Handle Overall Task Voting (Big Proposal)
  const handleVoteTask = async (isUpvote) => {
    if (!taskId) return
    try {
      const data = await proposalService.voteTask(taskId, isUpvote)
      setTaskVoteStats(data)
      toast.success('Đã ghi nhận biểu quyết ý tưởng!')
    } catch (err) {
      toast.error('Ghi nhận biểu quyết thất bại!')
    }
  }

  // Handle Comments Like/Dislike (Tab 1)
  const handleToggleCommentLike = async (commentId) => {
    try {
      await proposalService.voteTaskComment(commentId, true)
      loadComments()
    } catch (err) {
      toast.error('Vote bình luận thất bại!')
    }
  }

  const handleToggleCommentDislike = async (commentId) => {
    try {
      await proposalService.voteTaskComment(commentId, false)
      loadComments()
    } catch (err) {
      toast.error('Vote bình luận thất bại!')
    }
  }

  // Handle Checklist Proposals (Tab 2)
  const handleVoteProposal = async (propId) => {
    try {
      await proposalService.vote(propId, true)
      loadProposals()
    } catch (err) {
      toast.error('Vote đề xuất thất bại!')
    }
  }

  const handleDownvoteProposal = async (propId) => {
    try {
      await proposalService.vote(propId, false)
      loadProposals()
    } catch (err) {
      toast.error('Vote đề xuất thất bại!')
    }
  }

  const handleAddProposalComment = async (e, propId) => {
    e.preventDefault()
    const text = proposalCommentsInputs[propId] || ''
    if (!text.trim()) return
    try {
      await proposalService.addComment(propId, text.trim())
      setProposalCommentsInputs((prev) => ({ ...prev, [propId]: '' }))
      toast.success('Đã đăng phản biện về đề xuất này!')
      loadProposals()
    } catch (err) {
      toast.error('Gửi phản biện thất bại!')
    }
  }

  const handleApproveProposal = async (prop) => {
    try {
      await proposalService.approve(prop.id)
      toast.success('Đã duyệt và chính thức ban hành đề xuất này thành Task!')
      loadProposals()
      if (taskId) {
        fetchTaskById(taskId)
      }
      if (onRefreshDashboard) {
        onRefreshDashboard()
      }
      setActiveTab('tasks')
    } catch (err) {
      toast.error('Duyệt đề xuất thất bại!')
    }
  }

  const handleRejectProposal = async (propId) => {
    try {
      await proposalService.reject(propId)
      toast.success('Đã từ chối đề xuất này.')
      loadProposals()
    } catch (err) {
      toast.error('Từ chối đề xuất thất bại!')
    }
  }

  const toggleProposalCommentVisibility = (propId) => {
    setExpandedProposalComments((prev) => ({
      ...prev,
      [propId]: !prev[propId]
    }))
  }

  const handleSetFeedbackText = (propId, text) => {
    setProposalCommentsInputs((prev) => ({
      ...prev,
      [propId]: text
    }))
  }

  // Handle Approved Tasks checklist toggle, add, remove (Tab 3)
  const handleToggleCheck = async (itemId) => {
    if (!task) return
    const updated = task.checklist.map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c
    )
    try {
      await updateTask(task.id, {
        ...task,
        assigneeId: task.assignee?.id || task.primaryAssignee?.id || null,
        checklist: updated.map(item => ({
          id: item.id,
          content: item.content,
          done: item.done
        }))
      })
      toast.success('Đã cập nhật trạng thái checklist!')
    } catch (err) {
      toast.error('Cập nhật trạng thái checklist thất bại!')
    }
  }

  const handleRemoveApprovedTaskItem = async (itemId) => {
    if (!task) return
    const updated = task.checklist.filter((c) => c.id !== itemId)
    try {
      await updateTask(task.id, {
        ...task,
        assigneeId: task.assignee?.id || task.primaryAssignee?.id || null,
        checklist: updated.map(item => ({
          id: item.id,
          content: item.content,
          done: item.done
        }))
      })
      toast.success('Đã xóa checklist item!')
    } catch (err) {
      toast.error('Xóa checklist item thất bại!')
    }
  }

  const handleAddApprovedTaskItem = async (content) => {
    const itemContent = String(content || '').trim()
    if (!task || !itemContent) return
    const updated = [
      ...(task.checklist || []),
      {
        id: 'temp-' + Date.now(),
        content: itemContent,
        done: false
      }
    ]
    try {
      await updateTask(task.id, {
        ...task,
        assigneeId: task.assignee?.id || task.primaryAssignee?.id || null,
        checklist: updated.map(item => ({
          id: item.id.toString().startsWith('temp-') ? null : item.id,
          content: item.content,
          done: item.done
        }))
      })
      toast.success('Đã thêm checklist item mới!')
      if (taskId) {
        fetchTaskById(taskId)
      }
    } catch (err) {
      toast.error('Thêm checklist item thất bại!')
    }
  }

  const handleAddComment = async (text) => {
    if (!taskId || !text.trim()) return
    try {
      await proposalService.addTaskComment(taskId, text.trim())
      loadComments()
    } catch (err) {
      toast.error('Gửi bình luận thất bại!')
    }
  }

  const handleAddCommentReply = async (commentId, text) => {
    if (!commentId || !text.trim()) return
    try {
      await proposalService.addCommentReply(commentId, text.trim())
      toast.success('Đã gửi phản hồi!')
      loadComments()
    } catch (err) {
      toast.error('Gửi phản hồi thất bại!')
    }
  }

  const handleAddProposalDirectly = async (content) => {
    if (!taskId || !content.trim()) return
    try {
      await proposalService.createProposal(taskId, content.trim())
      toast.success('Đã gửi đề xuất checklist mới!')
      loadProposals()
    } catch (err) {
      toast.error('Gửi đề xuất thất bại!')
    }
  }

  if (!task) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <div className="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-[#0ea5e9] rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p className="text-sm text-slate-500 font-bold">Đang tải dữ liệu thảo luận...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] p-6 pt-16 md:pt-20 overflow-y-auto pl-6 md:pl-80"
      onClick={onClose}
    >
      <div 
        className="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Container for Modal Contents */}
        <div className="flex-1 overflow-y-auto flex flex-col [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Main Card Header */}
          <div className="py-4 px-5 border-b border-slate-100 relative pr-14 sticky top-0 z-30 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              {/* Task Avatar */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] flex items-center justify-center text-white shrink-0 font-bold text-lg shadow-sm">
                {task.title ? task.title.charAt(0).toUpperCase() : 'F'}
              </div>

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-base font-extrabold text-slate-900 tracking-tight">{task.title}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    task.type === 'BUG' 
                      ? 'bg-rose-50 text-rose-600 border-rose-100'
                      : task.type === 'UI/UX'
                        ? 'bg-amber-50 text-amber-600 border-amber-100'
                        : 'bg-sky-50 text-sky-600 border-sky-100'
                  }`}>
                    {task.type === 'BUG' ? 'Bugfix' : task.type === 'DEV' ? 'Feature' : task.type || 'Feature'}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 hover:bg-slate-200/80 transition-colors rounded-full px-2.5 py-0.5 font-semibold cursor-pointer">
                    <User size={10} className="text-slate-400" />
                    {`${task.createdByName || 'Hệ thống'}`}
                  </div>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400 flex-wrap font-medium">
                  <span>ID: #{task.id}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {formatSafeDate(task.createdAt || task.startDate)}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.2 rounded-full">
                    <CheckCircle2 size={10} />
                    {task.status === 'APPROVED' || task.status === 'done' || task.status === 'DONE' || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW' ? 'Đã phê duyệt' : 'Chờ phê duyệt'}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button X */}
            <button 
              onClick={onClose} 
              className="absolute top-3.5 right-4 w-7 h-7 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center shrink-0 cursor-pointer border border-slate-100 shadow-sm"
            >
              <X size={14} />
            </button>
          </div>

          {/* Description Container */}
          <div className="px-5 pt-3 bg-white">
            <div className="bg-[#f8fafc] rounded-xl p-3 border border-slate-100/80">
              <div
                className={`text-xs text-slate-600 leading-relaxed ${
                  !descExpanded ? "line-clamp-1" : ""
                }`}
              >
                {task.description || 'Chưa có mô tả chi tiết cho tính năng này.'}
              </div>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 flex items-center gap-1 text-[10px] text-[#0ea5e9] hover:text-[#0284c7] transition-colors font-bold cursor-pointer"
              >
                {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                <ChevronDown size={11} className={`transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sticky Container for Vote Summary and Tabs */}
          <div className="sticky top-[73px] z-20 bg-white pb-3">
            {/* Vote Summary Bar */}
            <div className="px-5 pt-2 pb-0.5">
              <div className="flex items-center gap-4 px-3 py-1.5 bg-[#f8fafc] rounded-xl border border-slate-200/60 select-none">
                <button
                  onClick={() => handleVoteTask(true)}
                  className={`flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer py-0.5 px-2 rounded-md ${
                    taskVoteStats.myVote === 'UP'
                      ? 'text-emerald-700 bg-emerald-100/80 font-extrabold shadow-sm'
                      : 'text-emerald-600 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp size={14} className={taskVoteStats.myVote === 'UP' ? 'fill-emerald-600' : ''} />
                  <span>{taskVoteStats.upvotes || 0} Tán thành</span>
                </button>
                <div className="w-px h-3 bg-slate-200" />
                <button
                  onClick={() => handleVoteTask(false)}
                  className={`flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer py-0.5 px-2 rounded-md ${
                    taskVoteStats.myVote === 'DOWN'
                      ? 'text-rose-700 bg-rose-100/80 font-extrabold shadow-sm'
                      : 'text-rose-500 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsDown size={14} className={taskVoteStats.myVote === 'DOWN' ? 'fill-rose-500' : ''} />
                  <span>{taskVoteStats.downvotes || 0} Không tán thành</span>
                </button>
                <div className="w-px h-3 bg-slate-200" />
                <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs py-0.5 px-2">
                  <MessageSquare size={14} />
                  <span>{comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)} Góp ý</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200/80 px-5 pt-1 gap-1.5 bg-white">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-xl transition-all relative cursor-pointer font-bold ${
                  activeTab === 'comments'
                    ? "text-[#0284c7] bg-white border-t border-x border-slate-200 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <MessageSquare size={13} />
                <span>Comment chung</span>
                {activeTab === 'comments' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0ea5e9] rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('proposals')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-xl transition-all relative cursor-pointer font-bold ${
                  activeTab === 'proposals'
                    ? "text-[#0284c7] bg-white border-t border-x border-slate-200 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Lightbulb size={13} />
                <span>Đề xuất</span>
                {activeTab === 'proposals' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0ea5e9] rounded-t-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t-xl transition-all relative cursor-pointer font-bold ${
                  activeTab === 'tasks'
                    ? "text-[#0284c7] bg-white border-t border-x border-slate-200 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ListChecks size={13} />
                <span>Task được thông qua</span>
                {task?.checklist?.length > 0 && (
                  <span className="text-[10px] min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-[#0ea5e9] text-white leading-none font-bold px-1.5">
                    {task.checklist.length}
                  </span>
                )}
                {activeTab === 'tasks' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0ea5e9] rounded-t-full" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="px-5 py-3.5 bg-white flex-1">
            {/* TAB 1: COMMENT CHUNG */}
            {activeTab === 'comments' && (
              <CommentTab
                comments={comments}
                loading={commentsLoading}
                approved={ideaApproved}
                onApprove={async () => {
                  try {
                    await updateTask(task.id, {
                      ...task,
                      status: 'APPROVED',
                      assigneeId: task.assignee?.id || task.primaryAssignee?.id || null
                    })
                    toast.success('Đã phê duyệt ý tưởng feature!')
                    if (taskId) {
                      fetchTaskById(taskId)
                    }
                    if (onRefreshDashboard) {
                      onRefreshDashboard()
                    }
                  } catch (err) {
                    toast.error('Duyệt ý tưởng thất bại!')
                  }
                }}
                onToggleLike={handleToggleCommentLike}
                onToggleDislike={handleToggleCommentDislike}
                onAddComment={handleAddComment}
                onAddReply={handleAddCommentReply}
                isLeader={isLeader}
                projectMembers={activeProject?.members || []}
              />
            )}

            {/* TAB 2: ĐỀ XUẤT CHECKLIST */}
            {activeTab === 'proposals' && (
              <ProposalTab
                proposals={proposals}
                loading={proposalsLoading}
                ideaApproved={ideaApproved}
                onApprove={handleApproveProposal}
                onVote={handleVoteProposal}
                onDownvote={handleDownvoteProposal}
                onAddProposal={handleAddProposalDirectly}
                onAddComment={handleAddProposalComment}
                proposalCommentsInputs={proposalCommentsInputs}
                expandedProposalComments={expandedProposalComments}
                onToggleCommentsVisibility={toggleProposalCommentVisibility}
                onSetFeedbackText={handleSetFeedbackText}
                isLeader={isLeader}
              />
            )}

            {/* TAB 3: CHECKLIST ĐÃ ĐƯỢC DUYỆT */}
            {activeTab === 'tasks' && (
              <ApprovedTaskTab
                checklist={task.checklist || []}
                onToggleCheck={handleToggleCheck}
                onRemoveItem={handleRemoveApprovedTaskItem}
                onAddItem={handleAddApprovedTaskItem}
              />
            )}
          </div>
        </div>

        {/* Sticky Bottom Input for Comments Tab - MOVED INSIDE CommentTab.jsx for better state integration (mentions dropdown) */}
      </div>
    </div>
  )
}
