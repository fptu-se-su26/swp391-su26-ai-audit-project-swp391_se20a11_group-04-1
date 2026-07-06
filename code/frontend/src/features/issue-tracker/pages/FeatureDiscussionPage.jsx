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

  // Lấy trạng thái duyệt của Task. Ý tưởng được thông qua khi đã đồng bộ lên GitHub (githubIssueNumber != null).
  const ideaApproved = useMemo(() => {
    if (!task) return false
    return task.githubIssueNumber != null
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

  // Requirement linkage state
  const [requirements, setRequirements] = useState([])
  const [loadingReqs, setLoadingReqs] = useState(false)
  const [selectedReqId, setSelectedReqId] = useState('')
  const [savingReq, setSavingReq] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreateReqModalOpen, setIsCreateReqModalOpen] = useState(false)
  const lastTaskIdRef = useRef(null)

  // Helper date formatting
  const formatSafeDate = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Just now'
    return date.toLocaleString('en-US', {
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

  // Load requirement list
  const loadRequirements = useCallback(async () => {
    if (!projectId) return
    setLoadingReqs(true)
    try {
      const res = await requirementApi.getAllRequirements({ projectId })
      const list = Array.isArray(res) 
        ? res 
        : (res && Array.isArray(res.items) ? res.items : [])
      setRequirements(list)
    } catch (err) {
      console.error('Failed to load requirements:', err)
      setRequirements([])
    } finally {
      setLoadingReqs(false)
    }
  }, [projectId])

  useEffect(() => {
    loadRequirements()
  }, [loadRequirements])

  useEffect(() => {
    if (task && task.id !== lastTaskIdRef.current) {
      lastTaskIdRef.current = task.id
      setSelectedReqId(task.requirementId || '')
      setIsEditing(!task.requirementId)
    }
  }, [task])

  const handleSaveRequirement = async () => {
    if (!task) return
    setSavingReq(true)
    try {
      const updated = {
        ...task,
        requirementId: selectedReqId ? Number(selectedReqId) : null,
        assigneeId: task.assignee?.id || task.primaryAssignee?.id || null
      }
      await updateTask(task.id, updated)
      setIsEditing(false)
      toast.success('Requirement linked successfully!')
    } catch (err) {
      toast.error('Failed to save requirement link!')
    } finally {
      setSavingReq(false)
    }
  }

  const handleModalSuccess = (newReq) => {
    loadRequirements()
    if (newReq?.id) {
      setSelectedReqId(newReq.id)
    }
    toast.success('New requirement created successfully!')
  }

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
      toast.error('Failed to vote on comment!')
    }
  }

  const handleToggleCommentDislike = async (commentId) => {
    try {
      await proposalService.voteTaskComment(commentId, false)
      loadComments()
    } catch (err) {
      toast.error('Failed to vote on comment!')
    }
  }

  const handleAddCommentReply = async (commentId, text) => {
    if (!commentId || !text.trim()) return
    if (isSynced) return
    try {
      await proposalService.addCommentReply(commentId, text.trim())
      toast.success('Reply submitted!')
      loadComments()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit reply!')
    }
  }

  // Handle Checklist Proposals (Tab 2)

  const handleVoteProposal = async (propId) => {
    try {
      await proposalService.vote(propId, true)
      loadProposals()
    } catch (err) {
      toast.error('Failed to vote on proposal!')
    }
  }

  const handleDownvoteProposal = async (propId) => {
    try {
      await proposalService.vote(propId, false)
      loadProposals()
    } catch (err) {
      toast.error('Failed to vote on proposal!')
    }
  }

  const handleAddProposalComment = async (e, propId) => {
    e.preventDefault()
    const text = proposalCommentsInputs[propId] || ''
    if (!text.trim()) return
    try {
      await proposalService.addComment(propId, text.trim())
      setProposalCommentsInputs((prev) => ({ ...prev, [propId]: '' }))
      toast.success('Feedback/critique posted for this proposal!')
      loadProposals()
    } catch (err) {
      toast.error('Failed to post feedback/critique!')
    }
  }

  const handleApproveProposal = async (prop) => {
    const hasChecklist = prop.content && prop.content.split('\n').some(line => /^-\s+\[([ xX])\]\s+(.*)$/.test(line.trim()));
    if (!hasChecklist) {
      toast.error('Proposal must contain at least one checklist item (starting with "- [ ]" or "- [x]")!');
      return;
    }
    try {
      await proposalService.approve(prop.id)
      toast.success('Proposal approved and converted to Task!')
      loadProposals()
      if (id) {
        fetchTaskById(id)
      }
      setActiveTab('tasks')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve proposal!')
    }
  }

  const handleRejectProposal = async (propId) => {
    try {
      await proposalService.reject(propId)
      toast.success('Proposal rejected.')
      loadProposals()
    } catch (err) {
      toast.error('Failed to reject proposal!')
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
      toast.success('Checklist status updated!')
    } catch (err) {
      toast.error('Failed to update checklist status!')
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
      toast.success('Checklist item deleted!')
    } catch (err) {
      toast.error('Failed to delete checklist item!')
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
      toast.success('New checklist item added!')
      if (id) {
        fetchTaskById(id)
      }
    } catch (err) {
      toast.error('Failed to add checklist item!')
    }
  }

  const handleApproveAndSync = async () => {
    if (!id) return
    const loadToast = toast.loading('Approving and syncing sub-tasks to GitHub...')
    try {
      await proposalService.approveAndSyncTask(id)
      toast.success('Proposals converted to sub-tasks and synced to GitHub!', { id: loadToast })
      loadProposals()
      if (id) {
        fetchTaskById(id)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed!', { id: loadToast })
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
          <h3 className="font-extrabold text-xl text-slate-900">Feature Proposal Not Found</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Task/Feature ID {id} does not exist or has been deleted from the system.
          </p>
          <button
            onClick={() => navigate(`/projects/${projectId}/issues`)}
            className="mt-2 py-2 px-6 bg-[#0ea5e9] text-white font-bold text-sm rounded-lg hover:bg-[#0284c7] transition-colors shadow-sm cursor-pointer"
          >
            Back to Issue Tracker
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
                        ? `Assigned to: ${task.assignee?.fullName || task.primaryAssignee?.fullName}`
                        : 'Assigned to: Unassigned'}
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
                        ? 'text-[#1E707D] bg-[#1E707D]/10 border-indigo-100'
                        : task.status === 'APPROVED' || task.status === 'done' || task.status === 'DONE' || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW'
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                          : 'text-amber-600 bg-amber-50 border-amber-100'
                    }`}>
                      <CheckCircle2 size={11} />
                      {isSynced
                        ? 'Approved & Synced'
                        : (task.status === 'APPROVED' || task.status === 'done' || task.status === 'DONE' || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW')
                          ? 'Approved'
                          : 'Awaiting Approval'}
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
                  {task.description || 'No detailed description available for this feature.'}
                </div>
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="mt-2.5 flex items-center gap-1 text-xs text-[#0ea5e9] hover:text-[#0284c7] transition-colors font-bold cursor-pointer"
                >
                  {descExpanded ? 'Collapse' : 'See More'}
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
                <span>General Discussion</span>
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
                <span>Proposals</span>
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
                <span>Approved Tasks</span>
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
                    toast.success('Idea approved!')
                    if (id) fetchTaskById(id)
                  } catch (err) {
                    toast.error('Failed to approve idea!')
                  }
                }}
                onToggleLike={handleToggleCommentLike}
                onToggleDislike={handleToggleCommentDislike}
                onAddComment={async (content) => {
                  try {
                    await proposalService.addTaskComment(id, content)
                    toast.success('Comment submitted!')
                    loadComments()
                  } catch (err) {
                    toast.error('Failed to submit comment!')
                  }
                }}
                onAddReply={handleAddCommentReply}
                isLeader={isLeader}
                projectMembers={activeProject?.members || []}
                onContentScroll={handleContentScroll}
              />
            )}

            {/* TAB 2: PROPOSALS */}
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
                    toast.success('Proposal submitted!')
                    loadProposals()
                  } catch (err) {
                    toast.error('Failed to submit proposal!')
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
                requirements={requirements}
                loadingReqs={loadingReqs}
                selectedReqId={selectedReqId}
                setSelectedReqId={setSelectedReqId}
                savingReq={savingReq}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                setIsCreateReqModalOpen={setIsCreateReqModalOpen}
                handleSaveRequirement={handleSaveRequirement}
                task={task}
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
                isLeader={isLeader}
                onContentScroll={handleContentScroll}
              />
            )}
          </div>

          {/* Workflow progress flow hint */}
          <div className="bg-[#f8fafc] py-3.5 border-t border-slate-100 px-6 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-bold">
            <span className="flex items-center gap-1 text-[#0284c7]">
              <MessageSquare size={11} /> General Discussion
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-[#0284c7]">
              <Lightbulb size={11} /> Proposals
            </span>
            <span>→</span>
            <span className="flex items-center gap-1 text-[#0284c7]">
              <ListChecks size={11} /> Approved Tasks
            </span>
          </div>

        </div>

        {/* AI Audit rule constraints alert box */}
        <div className="bg-[#0ea5e9]/5 border border-[#0ea5e9]/15 rounded-2xl p-5 mt-6 text-[11px] text-slate-500 space-y-1.5 shadow-sm">
          <h4 className="font-bold text-[#0ea5e9] uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={12} />
            Evidence & Consensus Workflow System (DevTrack)
          </h4>
          <p className="leading-relaxed">
            Checklist items approved by the Leader from the Proposals Tab will become the official execution checklist.
            Developers & Designers follow this checklist to complete the task and upload evidence for automatic AI Audit verification later.
          </p>
        </div>
      </div>

      <CreateRequirementModal
        isOpen={isCreateReqModalOpen}
        onClose={() => setIsCreateReqModalOpen(false)}
        onSuccess={handleModalSuccess}
        projectId={projectId}
      />
    </main>
  )
}
