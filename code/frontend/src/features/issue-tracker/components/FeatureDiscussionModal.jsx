  import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import { requirementApi } from '../../requirement/services/requirementApi'
import CreateRequirementModal from '../../requirement/components/CreateRequirementModal'
import { formatTaskType, normalizeTaskType } from '../../kanban/utils/taskMapper'

const cleanDescription = (desc) => {
  if (!desc) return '';
  return desc
    .replace(/<!--\s*sync-source:\s*github-blank(?:-draft|-approved)?\s*-->/g, '')
    .replace(/<!--\s*discussion-unlocked\s*-->/g, '')
    .trim();
}

export default function FeatureDiscussionModal({ taskId, onClose, projectId, onRefreshDashboard, discussBug }) {
  const activeProject = useProjectStore((state) => state.activeProject)
  const { tasks, fetchTaskById, updateTask } = useKanbanStore()
  const task = tasks.find((item) => String(item.id) === String(taskId))
  const taskType = normalizeTaskType(task?.type)

  const isBlankGit = useMemo(() => {
    const desc = task?.description || discussBug?.description;
    return desc && desc.includes('<!-- sync-source: github-blank');
  }, [task?.description, discussBug?.description]);

  const isBlankDraft = useMemo(() => {
    const desc = task?.description || discussBug?.description;
    return desc && desc.includes('github-blank-draft');
  }, [task?.description, discussBug?.description]);

  // Lấy trạng thái duyệt của Task. Nếu status không phải DRAFT thì coi như idea đã được thông qua.
  const ideaApproved = useMemo(() => {
    if (!task) return false
    if (isBlankGit) {
      return !isBlankDraft;
    }
    const s = task.status ? task.status.toUpperCase() : ''
    return s !== 'DRAFT'
  }, [task, isBlankGit, isBlankDraft])

  // Trạng thái đã đồng bộ lên GitHub - githubIssueNumber ưu tiên cao nhất
  const isSynced = useMemo(() => {
    if (task?.githubIssueNumber != null) return true;
    if (isBlankGit) return !isBlankDraft;
    return false;
  }, [task, isBlankGit, isBlankDraft])

  // UI state
  const [activeTab, setActiveTab] = useState('comments')
  const [descExpanded, setDescExpanded] = useState(false)
  const [isDescCollapsed, setIsDescCollapsed] = useState(false)
  const [isVoteCollapsed, setIsVoteCollapsed] = useState(false)

  // Thảo luận được mở dựa trên việc có tag comment ẩn trong description của Task hay không
  const isDiscussionUnlocked = useMemo(() => {
    return task?.description?.includes('<!-- discussion-unlocked -->') || false;
  }, [task?.description])

  const isBugType = useMemo(() => {
    return taskType === 'BUG_FIX' || discussBug?.isBug || discussBug?.displayType === 'Bug Fix Task'
  }, [taskType, discussBug])

  const stepsContent = useMemo(() => {
    const rawSteps = discussBug?.stepsToReproduce || task?.stepsToReproduce
    if (!rawSteps) return ''
    try {
      const meta = JSON.parse(rawSteps)
      return meta.steps || rawSteps
    } catch {
      return rawSteps
    }
  }, [discussBug?.stepsToReproduce, task?.stepsToReproduce])

  const expectedResult = discussBug?.expectedResult || task?.expectedResult
  const actualResult = discussBug?.actualResult || task?.actualResult
  const bugDescription = discussBug?.description || task?.description
  const lastScrollTop = useRef(0)

  const handleContentScroll = useCallback((e) => {
    const targetId = e.target?.id || e.currentTarget?.id || ''
    if (targetId !== 'proposal-list-container' && targetId !== 'comment-list-container' && targetId !== 'approved-task-list-container') {
      return
    }
    const scrollTop = e.target?.scrollTop ?? e.currentTarget?.scrollTop ?? 0

    // Stage 1: hide description at 10px
    setIsDescCollapsed(scrollTop > 10)
    // Stage 2: hide vote summary + proposal label at 60px
    setIsVoteCollapsed(scrollTop > 60)

    lastScrollTop.current = scrollTop
  }, [])

  // Requirement states & functions
  const [requirements, setRequirements] = useState([])
  const [loadingReqs, setLoadingReqs] = useState(false)
  const [selectedReqId, setSelectedReqId] = useState('')
  const [savingReq, setSavingReq] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreateReqModalOpen, setIsCreateReqModalOpen] = useState(false)
  const lastTaskIdRef = useRef(null)

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
      toast.success('Đã liên kết Requirement thành công!')
      if (onRefreshDashboard) {
        onRefreshDashboard()
      }
    } catch (err) {
      toast.error('Lưu liên kết Requirement thất bại!')
    } finally {
      setSavingReq(false)
    }
  }

  const handleModalSuccess = (newReq) => {
    loadRequirements()
    if (newReq?.id) {
      setSelectedReqId(newReq.id)
    }
    toast.success('Đã tạo Requirement mới!')
  }

  // Comments (Tab 1) state - loaded from API
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(false)

  // Checklist proposals (Tab 2) state - loaded from API
  const [proposals, setProposals] = useState([])

  // Số lượng đề xuất được duyệt
  const approvedCount = useMemo(() => {
    if (!Array.isArray(proposals)) return 0
    return proposals.filter(p => p.status === 'APPROVED').length
  }, [proposals])
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
  const loadComments = useCallback(async (silent = false) => {
    if (!taskId) return
    if (!silent) setCommentsLoading(true)
    try {
      const data = await proposalService.getTaskComments(taskId)
      setComments(data || [])
    } catch (err) {
      console.error('Failed to load comments:', err)
    } finally {
      if (!silent) setCommentsLoading(false)
    }
  }, [taskId])

  const loadProposals = useCallback(async (silent = false) => {
    if (!taskId) return
    if (!silent) setProposalsLoading(true)
    try {
      const data = await proposalService.getProposals(taskId)
      setProposals(data || [])
    } catch (err) {
      console.error('Failed to load proposals:', err)
    } finally {
      if (!silent) setProposalsLoading(false)
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

  useEffect(() => {
    const handleProposalEvent = (event) => {
      const { taskId: eventTaskId } = event.detail
      if (String(eventTaskId) !== String(taskId)) return
      loadProposals(true)
      loadTaskVotes()
      fetchTaskById(taskId)
    }

    window.addEventListener('task-proposal-event', handleProposalEvent)
    return () => {
      window.removeEventListener('task-proposal-event', handleProposalEvent)
    }
  }, [taskId, loadProposals, loadTaskVotes, fetchTaskById])

  // Handle Overall Task Voting (Big Proposal)
  const handleVoteTask = async (isUpvote) => {
    if (!taskId) return
    if (isSynced && !isDiscussionUnlocked) return
    try {
      const data = await proposalService.voteTask(taskId, isUpvote)
      setTaskVoteStats(data)
      toast.success('Đã ghi nhận biểu quyết ý tưởng!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ghi nhận biểu quyết thất bại!')
    }
  }

  // Handle Comments Like/Dislike (Tab 1)
  const handleToggleCommentLike = async (commentId) => {
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.voteTaskComment(commentId, true)
      loadComments(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote bình luận thất bại!')
    }
  }

  const handleToggleCommentDislike = async (commentId) => {
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.voteTaskComment(commentId, false)
      loadComments(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote bình luận thất bại!')
    }
  }

  // Handle Checklist Proposals (Tab 2)
  const handleVoteProposal = async (propId) => {
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.vote(propId, true)
      loadProposals(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote đề xuất thất bại!')
    }
  }

  const handleDownvoteProposal = async (propId) => {
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.vote(propId, false)
      loadProposals(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Vote đề xuất thất bại!')
    }
  }

  const handleAddProposalComment = async (e, propId) => {
    e.preventDefault()
    if (isSynced && !isDiscussionUnlocked) return
    const text = proposalCommentsInputs[propId] || ''
    if (!text.trim()) return
    try {
      await proposalService.addComment(propId, text.trim())
      setProposalCommentsInputs((prev) => ({ ...prev, [propId]: '' }))
      toast.success('Đã đăng phản biện về đề xuất này!')
      loadProposals(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi phản biện thất bại!')
    }
  }

  const handleApproveProposal = async (prop) => {
    if (isSynced && !isDiscussionUnlocked) return
    const hasChecklist = prop.content && prop.content.split('\n').some(line => /^-\s+\[([ xX])\]\s+(.*)$/.test(line.trim()));
    if (!hasChecklist) {
      toast.error('Đề xuất bắt buộc phải có ít nhất một mục checklist (bắt đầu bằng "- [ ]" hoặc "- [x]")!');
      return;
    }
    try {
      await proposalService.approve(prop.id)
      toast.success('Đã duyệt đề xuất và thêm vào checklist của Task chính!')
      loadProposals(true)
      if (taskId) {
        fetchTaskById(taskId)
      }
      if (onRefreshDashboard) {
        onRefreshDashboard()
      }
      setActiveTab('tasks')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Duyệt đề xuất thất bại!')
    }
  }

  const handleRejectProposal = async (propId) => {
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.reject(propId)
      toast.success('Đã từ chối đề xuất này.')
      loadProposals(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Từ chối đề xuất thất bại!')
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
      toast.error(err.response?.data?.message || 'Cập nhật trạng thái checklist thất bại!')
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
      toast.error(err.response?.data?.message || 'Xóa checklist item thất bại!')
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
      toast.error(err.response?.data?.message || 'Thêm checklist item thất bại!')
    }
  }

  const handleApproveAndSync = async () => {
    if (!taskId) return
    const loadToast = toast.loading('Đang duyệt và đồng bộ các sub-tasks lên GitHub...')
    try {
      // Trước khi sync, nếu có tag discussion-unlocked trong description, ta nên gỡ ra để khóa lại thảo luận
      if (task?.description?.includes('<!-- discussion-unlocked -->')) {
        const cleanDesc = task.description.replace('<!-- discussion-unlocked -->', '').trim()
        await updateTask(task.id, {
          ...task,
          assigneeId: task.assignee?.id || task.primaryAssignee?.id || null,
          description: cleanDesc
        })
      }
      await proposalService.approveAndSyncTask(taskId)
      toast.success('Đã chuyển đề xuất thành các sub-tasks và đồng bộ thành công lên GitHub!', { id: loadToast })
      await loadProposals(true)
      fetchTaskById(taskId)
      if (onRefreshDashboard) {
        onRefreshDashboard()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đồng bộ thất bại!', { id: loadToast })
    }
  }

  const handleAddComment = async (text) => {
    if (!taskId || !text.trim()) return
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.addTaskComment(taskId, text.trim())
      loadComments(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi bình luận thất bại!')
    }
  }

  const handleAddCommentReply = async (commentId, text) => {
    if (!commentId || !text.trim()) return
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.addCommentReply(commentId, text.trim())
      toast.success('Đã gửi phản hồi!')
      loadComments(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi phản hồi thất bại!')
    }
  }

  const handleAddProposalDirectly = async (content) => {
    if (!taskId || !content.trim()) return
    if (isSynced && !isDiscussionUnlocked) return
    try {
      await proposalService.createProposal(taskId, content.trim())
      toast.success('Đã gửi đề xuất checklist mới!')
      loadProposals(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gửi đề xuất thất bại!')
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
        className="relative z-10 w-full max-w-5xl h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden font-sans antialiased"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Container for Modal Contents */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Card Header */}
          <div className="px-5 border-b border-slate-100 relative pr-14 sticky top-0 z-30 bg-white shadow-sm py-4">
            <div className="flex items-center gap-3">
              {/* Task Avatar */}
              <div className="rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] flex items-center justify-center text-white shrink-0 font-bold shadow-sm w-10 h-10 text-lg">
                {task.title ? task.title.charAt(0).toUpperCase() : 'F'}
              </div>

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-extrabold text-slate-900 tracking-tight text-base">{task.title}</span>
                  {isBlankGit ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-slate-50 text-slate-600 border-slate-200">
                      BLANK ISSUE
                    </span>
                  ) : (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      taskType === 'BUG_FIX'
                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                        : taskType === 'UI_UX'
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-sky-50 text-sky-600 border-sky-100'
                    }`}>
                      {formatTaskType(taskType)}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-slate-500 bg-slate-100 hover:bg-slate-200/80 transition-colors rounded-full px-2.5 py-0.5 font-semibold cursor-pointer text-[11px]">
                    <User size={10} className="text-slate-400" />
                    {`${task.createdByName || 'Hệ thống'}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 flex-wrap font-medium mt-0.5 text-[11px]">
                  <span>ID: #{task.id}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
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
                    <CheckCircle2 size={10} />
                    {isSynced
                      ? 'Đã phê duyệt & Đồng bộ'
                      : (task.status === 'APPROVED' || task.status === 'done' || task.status === 'DONE' || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW')
                        ? 'Đã phê duyệt'
                        : 'Chờ phê duyệt'}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button X */}
            <button 
              onClick={onClose} 
              className="absolute rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center shrink-0 cursor-pointer border border-slate-100 shadow-sm top-3.5 right-4 w-7 h-7"
            >
              <X size={14} />
            </button>
          </div>

          {/* Description Container */}
          <div className={`px-5 bg-white transition-all duration-300 ease-in-out ${isDescCollapsed ? 'max-h-0 opacity-0 pt-0 overflow-hidden' : descExpanded ? 'max-h-[400px] overflow-y-auto opacity-100 pt-3' : 'max-h-24 opacity-100 pt-3'}`}>
            <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-slate-200/60 shadow-sm space-y-3">
              {isBugType ? (
                // Bug Report Details
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="font-extrabold text-slate-700 block mb-0.5">📝 Mô tả lỗi:</span>
                    <p className={`text-slate-600 leading-relaxed ${!descExpanded ? "line-clamp-1" : ""}`}>
                      {bugDescription || 'Chưa có mô tả chi tiết.'}
                    </p>
                  </div>
                  
                  {descExpanded && (
                    <div className="pt-2 border-t border-slate-200/50 space-y-2.5 animate-fade-in">
                      {stepsContent && (
                        <div>
                          <span className="font-extrabold text-slate-700 block mb-0.5">🚶 Các bước tái dựng / Cách chạy:</span>
                          <p className="text-slate-600 bg-white border border-slate-100 rounded-lg p-2 font-mono whitespace-pre-wrap text-[11px] leading-relaxed shadow-sm">
                            {stepsContent}
                          </p>
                        </div>
                      )}
                      {expectedResult && (
                        <div>
                          <span className="font-extrabold text-emerald-700 block mb-0.5">🎯 Kết quả mong muốn:</span>
                          <p className="text-emerald-600 bg-emerald-50/50 border border-emerald-100/50 rounded-lg p-2 leading-relaxed font-medium">
                            {expectedResult}
                          </p>
                        </div>
                      )}
                      {actualResult && (
                        <div>
                          <span className="font-extrabold text-rose-700 block mb-0.5">❌ Kết quả thực tế / Giá trị thật:</span>
                          <p className="text-rose-600 bg-rose-50/50 border border-rose-100/50 rounded-lg p-2 leading-relaxed font-medium">
                            {actualResult}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-4 pt-1">
                        {discussBug?.environment && (
                          <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/30">
                            Môi trường: <span className="font-black text-slate-700">{discussBug.environment}</span>
                          </div>
                        )}
                        {discussBug?.severity && (
                          <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/30">
                            Mức độ: <span className="font-black text-slate-700">{discussBug.severity}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Regular Feature/Task Description
                <div
                  className={`text-xs text-slate-600 leading-relaxed ${
                    !descExpanded ? "line-clamp-1" : ""
                  }`}
                >
                  {cleanDescription(task.description) || 'Chưa có mô tả chi tiết cho tính năng này.'}
                </div>
              )}
              
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 flex items-center gap-1 text-[10px] text-[#0ea5e9] hover:text-[#0284c7] transition-colors font-bold cursor-pointer"
              >
                {descExpanded ? 'Thu gọn chi tiết' : isBugType ? 'Xem thêm chi tiết lỗi' : 'Xem thêm'}
                <ChevronDown size={11} className={`transition-transform ${descExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Sticky Container for Vote Summary and Tabs */}
          <div className="sticky z-20 bg-white pb-3 top-[80px]">
            {/* Vote Summary Bar */}
            <div className={`px-5 transition-all duration-300 ease-in-out ${isVoteCollapsed ? 'max-h-0 opacity-0 overflow-hidden pt-0 pb-0' : 'max-h-16 opacity-100 pt-2 pb-0.5'}`}>
              <div className="flex items-center gap-4 px-3 py-1.5 bg-[#f8fafc] rounded-xl border border-slate-200/60 select-none">
                <button
                  onClick={() => handleVoteTask(true)}
                  className={`flex items-center gap-1.5 font-bold text-xs transition-all py-0.5 px-2 rounded-md ${
                    isSynced ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                  } ${
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
                  className={`flex items-center gap-1.5 font-bold text-xs transition-all py-0.5 px-2 rounded-md ${
                    isSynced ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                  } ${
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
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-xl transition-all relative cursor-pointer font-semibold ${
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
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-xl transition-all relative cursor-pointer font-semibold ${
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
                className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-xl transition-all relative cursor-pointer font-semibold ${
                  activeTab === 'tasks'
                    ? "text-[#0284c7] bg-white border-t border-x border-slate-200 shadow-[0_-2px_6px_rgba(0,0,0,0.01)]"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ListChecks size={13} />
                <span>Đề xuất được thông qua</span>
                {approvedCount > 0 && (
                  <span className="text-[10px] min-w-4.5 h-4.5 flex items-center justify-center rounded-full bg-[#0ea5e9] text-white leading-none font-bold px-1.5">
                    {approvedCount}
                  </span>
                )}
                {activeTab === 'tasks' && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#0ea5e9] rounded-t-full" />
                )}
              </button>

              {/* Nút mở thảo luận cho leader đối với blank issue đã đồng bộ */}
              {isLeader && isBlankGit && isSynced && (
                <button
                  onClick={async () => {
                    if (!task) return
                    const loadToast = toast.loading('Đang cập nhật trạng thái thảo luận...')
                    try {
                      let newDesc = task.description || ''
                      if (isDiscussionUnlocked) {
                        newDesc = newDesc.replace('<!-- discussion-unlocked -->', '').trim()
                      } else {
                        newDesc = newDesc + '\n<!-- discussion-unlocked -->'
                      }
                      await updateTask(task.id, {
                        ...task,
                        assigneeId: task.assignee?.id || task.primaryAssignee?.id || null,
                        description: newDesc
                      })
                      toast.success(!isDiscussionUnlocked ? 'Đã mở chế độ thảo luận và thêm đề xuất!' : 'Đã đóng chế độ thảo luận.', { id: loadToast })
                      fetchTaskById(taskId)
                    } catch (err) {
                      toast.error('Cập nhật trạng thái thất bại!', { id: loadToast })
                    }
                  }}
                  className={`ml-auto flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    isDiscussionUnlocked 
                      ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0284c7] shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Lightbulb size={13} />
                  <span>{isDiscussionUnlocked ? 'Đóng thảo luận' : 'Mở thảo luận'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Panels */}
          <div className="px-5 py-3.5 bg-white flex-1 overflow-hidden">
            {/* TAB 1: COMMENT CHUNG */}
            {activeTab === 'comments' && (
              <CommentTab
                comments={comments}
                loading={commentsLoading}
                approved={ideaApproved}
                readOnly={isSynced && !isDiscussionUnlocked}
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
                onContentScroll={handleContentScroll}
              />
            )}

            {/* TAB 2: ĐỀ XUẤT CHECKLIST */}
            {activeTab === 'proposals' && (
              <ProposalTab
                proposals={proposals}
                loading={proposalsLoading}
                ideaApproved={ideaApproved}
                readOnly={isSynced && !isDiscussionUnlocked}
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
                onUpdateProposal={async (proposalId, text) => {
                  try {
                    await proposalService.updateProposal(proposalId, text)
                    toast.success('Đã cập nhật đề xuất!')
                    loadProposals(true)
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

            {/* TAB 3: CHECKLIST ĐÃ ĐƯỢC DUYỆT */}
            {activeTab === 'tasks' && (
              <ApprovedTaskTab
                task={task}
                proposals={proposals}
                checklist={task.checklist || []}
                onToggleCheck={handleToggleCheck}
                onApproveAndSync={handleApproveAndSync}
                isLeader={isLeader}
                onContentScroll={handleContentScroll}
              />
            )}
          </div>
        </div>

        {/* Sticky Bottom Input for Comments Tab - MOVED INSIDE CommentTab.jsx for better state integration (mentions dropdown) */}
      </div>

      <CreateRequirementModal
        isOpen={isCreateReqModalOpen}
        onClose={() => setIsCreateReqModalOpen(false)}
        onSuccess={handleModalSuccess}
        projectId={projectId}
      />
    </div>
  )
}
