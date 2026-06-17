import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  X, 
  User, 
  Clock, 
  CheckCircle2,
  MessageSquare, 
  ListChecks, 
  Lightbulb, 
  ChevronDown, 
  AlertCircle
} from 'lucide-react'
import useProjectStore from '@store/useProjectStore'
import useKanbanStore from '../../kanban/store/useKanbanStore'
import proposalService from '../services/proposalService'
import ApprovedTaskTab from '../components/ApprovedTaskTab'
import CommentTab from '../components/CommentTab'
import ProposalTab from '../components/ProposalTab'

export default function FeatureDiscussionPage() {
  const { projectId, id } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)

  const { tasks, fetchTaskById, updateTask, loading } = useKanbanStore()
  const task = tasks.find((item) => String(item.id) === String(id))

  // Lấy trạng thái duyệt của Task. Nếu status không phải DRAFT thì coi như idea đã được thông qua.
  const ideaApproved = useMemo(() => {
    if (!task) return false
    const s = task.status ? task.status.toUpperCase() : ''
    return s !== 'DRAFT'
  }, [task])

  const isSynced = useMemo(() => {
    return task?.githubIssueNumber != null
  }, [task])

  // UI state (activeTab and descExpanded still need React state)
  const [activeTab, setActiveTab] = useState('comments')
  const [descExpanded, setDescExpanded] = useState(false)
  const [isVoteCollapsed, setIsVoteCollapsed] = useState(false)

  // Use ref instead of state for scroll-driven collapse to avoid re-renders causing scroll snap-back
  const descRef = useRef(null)
  const lastScrollTop = useRef(0)
  const isDescCollapsedRef = useRef(false)

  const handleContentScroll = useCallback((e) => {
    const targetId = e.target?.id || e.currentTarget?.id || ''
    if (targetId !== 'proposal-list-container' && targetId !== 'comment-list-container' && targetId !== 'approved-task-list-container') {
      return
    }
    const scrollTop = e.target?.scrollTop ?? e.currentTarget?.scrollTop ?? 0
    const shouldCollapse = scrollTop > 10

    // Only toggle DOM class when state actually changes — NO React setState!
    if (shouldCollapse !== isDescCollapsedRef.current) {
      isDescCollapsedRef.current = shouldCollapse
      if (descRef.current) {
        if (shouldCollapse) {
          descRef.current.classList.add('desc-collapsed')
          descRef.current.classList.remove('desc-expanded')
        } else {
          descRef.current.classList.remove('desc-collapsed')
          descRef.current.classList.add('desc-expanded')
        }
      }
    }
    setIsVoteCollapsed(scrollTop > 60)
    lastScrollTop.current = scrollTop
  }, [setIsVoteCollapsed])


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
    const role = activeProject?.role
    return ['PROJECT_LEADER', 'LEADER', 'Project Leader', 'MENTOR'].includes(role)
  }, [activeProject?.role])

  // Load task
  useEffect(() => {
    if (!task && id) {
      fetchTaskById(id)
    }
  }, [fetchTaskById, id, task])



  // Fetch comments and proposals from APIs
  const loadComments = useCallback(async () => {
    if (!id) return
    setCommentsLoading(true)
    try {
      const data = await proposalService.getTaskComments(id)
      setComments(data || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      setCommentsLoading(false)
    }
  }, [id])

  const loadProposals = useCallback(async () => {
    if (!id) return
    setProposalsLoading(true)
    try {
      const data = await proposalService.getProposals(id)
      setProposals(data || [])
    } catch (err) {
      console.error('Failed to load proposals:', err)
    } finally {
      setProposalsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadComments()
    loadProposals()
  }, [loadComments, loadProposals])


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

  const handleAddCommentReply = async (commentId, text) => {
    if (!commentId || !text.trim()) return
    if (isSynced) return
    try {
      await proposalService.addCommentReply(commentId, text.trim())
      toast.success('Đã gửi phản hồi!')
      loadComments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi phản hồi thất bại!')
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
    const hasChecklist = prop.content && prop.content.split('\n').some(line => /^-\s+\[([ xX])\]\s+(.*)$/.test(line.trim()));
    if (!hasChecklist) {
      toast.error('Đề xuất bắt buộc phải có ít nhất một mục checklist (bắt đầu bằng "- [ ]" hoặc "- [x]")!');
      return;
    }
    try {
      await proposalService.approve(prop.id)
      toast.success('Đã duyệt và chính thức ban hành đề xuất này thành Task!')
      loadProposals()
      if (id) {
        fetchTaskById(id)
      }
      setActiveTab('tasks')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duyệt đề xuất thất bại!')
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

  // Handle Approved Tasks checklist toggle, add, remove (Tab 3 - flat checklist using task.checklist and updateTask)
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
          id: String(item.id || '').startsWith('temp-') ? null : item.id,
          content: item.content,
          done: item.done
        }))
      })
      toast.success('Đã thêm checklist item mới!')
      if (id) {
        fetchTaskById(id)
      }
    } catch (err) {
      toast.error('Thêm checklist item thất bại!')
    }
  }

  const handleApproveAndSync = async () => {
    if (!id) return
    const loadToast = toast.loading('Đang duyệt và đồng bộ các sub-tasks lên GitHub...')
    try {
      await proposalService.approveAndSyncTask(id)
      toast.success('Đã chuyển đề xuất thành các sub-tasks và đồng bộ thành công lên GitHub!', { id: loadToast })
      loadProposals()
      if (id) {
        fetchTaskById(id)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đồng bộ thất bại!', { id: loadToast })
    }
  }

  // Helper function to update feedback text in proposals state list
  const setFeedbackText = (propId, text) => {
    setProposalCommentsInputs((prev) => ({
      ...prev,
      [propId]: text,
    }))
  }

  // Calculate vote totals for Tab 1
  const totalLikes = useMemo(() => comments.reduce((s, c) => s + (c.upvotes || 0), 0), [comments])
  const totalDislikes = useMemo(() => comments.reduce((s, c) => s + (c.downvotes || 0), 0), [comments])

  if (loading && !task) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-[#F1F4F9] flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-[#0ea5e9] animate-spin">progress_activity</span>
      </main>
    )
  }

  if (!task) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-[#F1F4F9] flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-4">
          <span className="material-symbols-outlined text-5xl text-red-500">error</span>
          <h3 className="font-extrabold text-xl text-slate-900">Không Tìm Thấy Đề Xuất Feature</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Task/Feature ID {id} không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
          <button
            onClick={() => navigate(`/projects/${projectId}/issues`)}
            className="mt-2 py-2 px-6 bg-[#0ea5e9] text-white font-bold text-sm rounded-lg hover:bg-[#0284c7] transition-colors shadow-sm cursor-pointer"
          >
            Quay lại Issue Tracker
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-10 pb-6 overflow-hidden relative bg-[#F1F4F9] text-slate-700 select-none font-sans flex flex-col">
      {/* Visual background lights */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#0ea5e9]/5 opacity-40 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#38bdf8]/5 opacity-30 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto animate-in fade-in duration-300 w-full flex-1 flex flex-col">
        {/* Panel Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/80 overflow-hidden flex flex-col flex-1">
          
          {/* Sticky Header Wrapper */}
          <div className="top-0 z-30 bg-white border-b border-slate-100 shadow-sm shrink-0">
            {/* Main Card Header */}
            <div className="relative p-6 pb-3">
              <div className="flex items-start gap-4">
                {/* Task Avatar */}
                <div className="rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] flex items-center justify-center text-white shrink-0 font-bold shadow-sm w-12 h-12 text-xl">
                  {task.title ? task.title.charAt(0).toUpperCase() : 'F'}
                </div>
    
                {/* Task info */}
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-extrabold text-slate-900 tracking-tight text-xl">{task.title}</span>
                    <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200/80 transition-colors rounded-full px-3 py-1 font-semibold cursor-pointer text-xs">
                      <User size={12} className="text-slate-400" />
                      {task.assignee?.fullName || task.primaryAssignee?.fullName
                        ? `Giao cho: ${task.assignee?.fullName || task.primaryAssignee?.fullName}`
                        : 'Giao cho: Chưa phân công'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 flex-wrap font-medium mt-1 text-xs">
                    <span>ID: #{task.id}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatSafeDate(task.createdAt || task.startDate)}
                    </span>
                    <span>·</span>
                    <span className={`flex items-center gap-1 font-bold border px-2.5 py-0.5 rounded-full ${
                      isSynced
                        ? 'text-indigo-600 bg-indigo-50 border-indigo-100'
                        : task.status === 'APPROVED' || task.status === 'done' || task.status === 'DONE' || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW'
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                          : 'text-amber-600 bg-amber-50 border-amber-100'
                    }`}>
                      <CheckCircle2 size={11} />
                      {isSynced
                        ? 'Đã phê duyệt & Đồng bộ'
                        : (task.status === 'APPROVED' || task.status === 'done' || task.status === 'DONE' || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW')
                          ? 'Đã phê duyệt'
                          : 'Chờ phê duyệt'}
                    </span>
                  </div>
                </div>
    
                {/* Close Button X */}
                <button 
                  onClick={() => navigate(-1)} 
                  className="absolute rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center shrink-0 cursor-pointer top-5 right-5 w-8 h-8"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
    
            {/* Description Container */}
            <div
              ref={descRef}
              className="desc-expanded transition-all duration-300 ease-in-out px-6 max-h-40 opacity-100 pb-4"
            >
              <div className="bg-[#f8fafc] rounded-2xl p-5 border border-slate-100/80">
                <div
                  className={`text-sm text-slate-600 leading-relaxed ${
                    !descExpanded ? "line-clamp-2" : ""
                  }`}
                >
                  {task.description || 'Chưa có mô tả chi tiết cho tính năng này.'}
                </div>
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-2.5 flex items-center gap-1 text-xs text-[#0ea5e9] hover:text-[#0284c7] transition-colors font-bold cursor-pointer"
                >
                  {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                  <ChevronDown size={12} className={`transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex px-6 pt-2 gap-2 bg-white">
              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-2 px-4 py-3 text-sm rounded-t-xl transition-all relative cursor-pointer font-bold ${
                  activeTab === 'comments'
                    ? "text-[#0284c7] bg-white border-t border-x border-slate-200 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <MessageSquare size={15} />
                <span>Comment chung</span>
                {activeTab === 'comments' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0ea5e9] rounded-t-full" />
                )}
              </button>
  
              <button
                onClick={() => setActiveTab('proposals')}
                className={`flex items-center gap-2 px-4 py-3 text-sm rounded-t-xl transition-all relative cursor-pointer font-bold ${
                  activeTab === 'proposals'
                    ? "text-[#0284c7] bg-white border-t border-x border-slate-200 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Lightbulb size={15} />
                <span>Đề xuất</span>
                {activeTab === 'proposals' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0ea5e9] rounded-t-full" />
                )}
              </button>
  
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-4 py-3 text-sm rounded-t-xl transition-all relative cursor-pointer font-bold ${
                  activeTab === 'tasks'
                    ? "text-[#0284c7] bg-white border-t border-x border-slate-200 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ListChecks size={15} />
                <span>Task được thông qua</span>
                {task?.checklist?.length > 0 && (
                  <span className="text-xs min-w-5 h-5 flex items-center justify-center rounded-full bg-[#0ea5e9] text-white leading-none font-bold px-1.5">
                    {task.checklist.length}
                  </span>
                )}
                {activeTab === 'tasks' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#0ea5e9] rounded-t-full" />
                )}
              </button>
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="px-6 py-4 flex-1 flex flex-col bg-white overflow-hidden">
            
            {/* TAB 1: COMMENT CHUNG */}
            {activeTab === 'comments' && (
              <CommentTab
                comments={comments}
                loading={commentsLoading}
                approved={ideaApproved}
                readOnly={isSynced}
                onApprove={async () => {
                  try {
                    // Update task status to APPROVED
                    await updateTask(task.id, {
                      ...task,
                      status: 'APPROVED',
                      assigneeId: task.assignee?.id || task.primaryAssignee?.id || null
                    })
                    toast.success('Đã phê duyệt ý tưởng!')
                    if (id) fetchTaskById(id)
                  } catch (err) {
                    toast.error('Phê duyệt ý tưởng thất bại!')
                  }
                }}
                onToggleLike={handleToggleCommentLike}
                onToggleDislike={handleToggleCommentDislike}
                onAddComment={async (content) => {
                  try {
                    await proposalService.addTaskComment(id, content)
                    toast.success('Đã gửi bình luận!')
                    loadComments()
                  } catch (err) {
                    toast.error('Gửi bình luận thất bại!')
                  }
                }}
                onAddReply={handleAddCommentReply}
                isLeader={isLeader}
                projectMembers={activeProject?.members || []}
                onContentScroll={handleContentScroll}
              />
            )}

            {/* TAB 2: ĐỀ XUẤT */}
            {activeTab === 'proposals' && (
              <ProposalTab
                proposals={proposals}
                loading={proposalsLoading}
                ideaApproved={ideaApproved}
                readOnly={isSynced}
                onApprove={handleApproveProposal}
                onVote={handleVoteProposal}
                onDownvote={handleDownvoteProposal}
                onAddProposal={async (text) => {
                  try {
                    await proposalService.createProposal(id, text)
                    toast.success('Đã gửi đề xuất!')
                    loadProposals()
                  } catch (err) {
                    toast.error('Gửi đề xuất thất bại!')
                  }
                }}
                onAddComment={handleAddProposalComment}
                proposalCommentsInputs={proposalCommentsInputs}
                expandedProposalComments={expandedProposalComments}
                onToggleCommentsVisibility={toggleProposalCommentVisibility}
                onSetFeedbackText={setFeedbackText}
                isLeader={isLeader}
                onUpdateProposal={async (proposalId, text) => {
                  try {
                    await proposalService.updateProposal(proposalId, text)
                    toast.success('Đã cập nhật đề xuất!')
                    loadProposals()
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Cập nhật đề xuất thất bại!')
                  }
                }}
                onContentScroll={handleContentScroll}
                isCollapsed={isVoteCollapsed}
              />
            )}

            {/* TAB 3: TASK ĐƯỢC THÔNG QUA */}
            {activeTab === 'tasks' && (
              <ApprovedTaskTab
                task={task}
                proposals={proposals}
                checklist={task?.checklist || []}
                onToggleCheck={handleToggleCheck}
                onRemoveItem={handleRemoveApprovedTaskItem}
                onAddItem={handleAddApprovedTaskItem}
                onApproveAndSync={handleApproveAndSync}
                onContentScroll={handleContentScroll}
              />
            )}
          </div>

          {/* Workflow progress flow hint */}
          <div className="bg-[#f8fafc] py-3.5 border-t border-slate-100 px-6 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1 text-[#0284c7]">
              <MessageSquare size={11} /> Comment chung
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-[#0284c7]">
              <Lightbulb size={11} /> Đề xuất
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-[#0284c7]">
              <ListChecks size={11} /> Task được thông qua
            </span>
          </div>

        </div>

        {/* AI Audit rule constraints alert box */}
        <div className="bg-[#0ea5e9]/5 border border-[#0ea5e9]/15 rounded-2xl p-5 mt-6 text-[11px] text-slate-500 space-y-1.5 shadow-sm">
          <h4 className="font-bold text-[#0ea5e9] uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={12} />
            Hệ thống quy trình minh chứng & đồng thuận (DevTrack)
          </h4>
          <p className="leading-relaxed">
            Các mục checklist sau khi được Leader chốt từ Tab Đề xuất sẽ trở thành checklist thực thi chính thức.
            Các Dev & Designer dựa trên checklist này để hoàn thiện công việc và upload bằng chứng (Evidence) cho AI Audit tự động đối soát sau này.
          </p>
        </div>
      </div>
    </main>
  )
}
