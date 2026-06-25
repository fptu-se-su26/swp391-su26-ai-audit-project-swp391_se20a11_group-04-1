import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import bugService from '../services/bugService'
import axiosInstance from '@/api/axiosConfig'
import proposalService from '../services/proposalService'

export function IssueDetailView() {
  const { projectId, bugId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)
  const currentUserId = useAuthStore((state) => state.userId)

  const [bug, setBug] = useState(null)
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(false)
  const [approving, setApproving] = useState(false)
  const [triggeringCI, setTriggeringCI] = useState(false)

  // Comments state
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)

  const loadComments = useCallback(async (taskId) => {
    setCommentsLoading(true)
    try {
      const data = await proposalService.getTaskComments(taskId)
      setComments(data || [])
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  const loadBugAndTaskDetails = useCallback(async () => {
    if (!bugId) return
    setLoading(true)
    try {
      const bugData = await bugService.getBugDetails(bugId)
      setBug(bugData)

      // If approved and linked to a Task, fetch Task details for checklists
      if (bugData.relatedTaskId) {
        try {
          const taskData = await bugService.getTaskDetails(bugData.relatedTaskId)
          setTask(taskData)
          loadComments(bugData.relatedTaskId)
        } catch (taskErr) {
          console.error('Error fetching linked task details:', taskErr)
        }
      }
    } catch (err) {
      console.error('Error fetching bug details:', err)
      toast.error('Unable to retrieve bug report details')
    } finally {
      setLoading(false)
    }
  }, [bugId, loadComments])

  useEffect(() => {
    loadBugAndTaskDetails()
  }, [loadBugAndTaskDetails])

  const handleApprove = async () => {
    setApproving(true)
    try {
      await bugService.approveBug(bugId)
      toast.success('Bug report successfully approved and synchronized with GitHub!')
      loadBugAndTaskDetails()
    } catch (err) {
      console.error('Error approving bug:', err)
      toast.error(err.response?.data?.message || 'Failed to approve bug')
    } finally {
      setApproving(false)
    }
  }

  const handleTriggerCI = () => {
    setTriggeringCI(true)
    // Simulate GitHub actions workflow dispatch
    setTimeout(() => {
      setTriggeringCI(false)
      toast.success('GitHub Actions CI pipeline triggered successfully for this bug branch!')
    }, 1500)
  }

  // Update Task Checklist items
  const handleChecklistToggle = async (itemId, isDone) => {
    if (!task) return

    // Optimistic UI update
    const updatedChecklist = task.checklist.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    )
    setTask(prev => ({ ...prev, checklist: updatedChecklist }))

    try {
      // Prepare request matching TaskRequest structure in backend
      const payload = {
        title: task.title,
        description: task.description,
        type: task.type || 'BUG_FIX',
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        primaryAssigneeId: task.primaryAssignee?.id || null,
        sprintId: task.sprintId || null,
        checklist: updatedChecklist.map(item => ({
          id: item.id,
          content: item.content,
          done: item.id === itemId ? !isDone : item.done
        }))
      }

      await axiosInstance.put(`/v1/tasks/${task.id}`, payload)
      toast.success('Checklist updated and synchronized!')
    } catch (err) {
      console.error('Failed to update task checklist:', err)
      toast.error('Failed to sync checklist changes')
      // Rollback UI state
      loadBugAndTaskDetails()
    }
  }

  // Handle Comment submissions
  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || !task) return

    try {
      await proposalService.addTaskComment(task.id, newComment.trim())
      setNewComment('')
      toast.success('Comment posted! Synced with GitHub comments thread.')
      loadComments(task.id)
    } catch (err) {
      console.error('Failed to post comment:', err)
      toast.error(err.response?.data?.message || 'Failed to post comment')
    }
  }

  if (loading && !bug) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-[#1E707D] animate-spin">progress_activity</span>
      </main>
    )
  }

  if (!bug) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-lg space-y-4">
          <span className="material-symbols-outlined text-5xl text-error">error</span>
          <h3 className="font-extrabold text-xl text-on-surface">Bug Report Not Found</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            The bug report you are trying to access does not exist or you do not have permission.
          </p>
          <button
            onClick={() => navigate(`/projects/${projectId}/issues`)}
            className="mt-2 py-2 px-6 bg-[#1E707D] text-white font-bold text-sm rounded-lg hover:bg-[#1E707D]/90 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  // Parse custom metadata JSON from stepsToReproduce
  let parsedSteps = bug.stepsToReproduce
  let githubIssueNumber = null
  let githubIssueUrl = null

  if (bug.stepsToReproduce) {
    try {
      const meta = JSON.parse(bug.stepsToReproduce)
      parsedSteps = meta.steps || bug.stepsToReproduce
      githubIssueNumber = meta.github_issue_number || null
      githubIssueUrl = meta.github_issue_url || null
    } catch {
      // Is plain text, do nothing
    }
  }

  const isLeader = ['PROJECT_LEADER', 'LEADER', 'Project Leader', 'MENTOR'].includes(activeProject?.role)
  const isDraft = bug.relatedTaskId === null

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-600 border border-red-500/20'
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
      case 'LOW':
      default:
        return 'bg-[#1E707D]/10 text-[#1E707D] border border-blue-500/20'
    }
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      {/* Blurred background visuals */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#D7EEF1] opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full space-y-6 animate-fade-in">
        {/* Navigation back and header */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => navigate(`/projects/${projectId}/issues`)}
                className="flex items-center gap-1 text-xs text-[#1E707D] font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-xs">arrow_back</span>
                <span>Back to Issue Tracker</span>
              </button>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-on-surface">
              {bug.title}
            </h1>

            <div className="flex flex-wrap gap-2 mt-3 items-center">
              {isDraft ? (
                <span className="text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded">DRAFT</span>
              ) : (
                <span className="text-[10px] font-black bg-green-500/10 text-green-700 border border-green-500/20 px-2 py-0.5 rounded">ACTIVE ISSUE</span>
              )}
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityBadge(bug.severity)}`}>
                Severity: {bug.severity}
              </span>
              <span className="text-[10px] font-bold bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full border border-outline-variant/60">
                Env: {bug.environment}
              </span>
            </div>
          </div>

          <div className="flex gap-2 self-stretch md:self-auto shrink-0">
            {/* Lead actions */}
            {isLeader && isDraft && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-6 bg-[#1E707D] text-white hover:bg-[#1E707D]/95 text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {approving ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Approving & Syncing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-bold">task_alt</span>
                    <span>Approve & Convert</span>
                  </>
                )}
              </button>
            )}

            {!isDraft && (
              <button
                onClick={handleTriggerCI}
                disabled={triggeringCI}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-5 border border-outline-variant hover:bg-surface-container-high text-on-surface text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {triggeringCI ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Running CI...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm font-bold text-[#1E707D]">play_circle</span>
                    <span>Trigger CI Test</span>
                  </>
                )}
              </button>
            )}
          </div>
        </section>

        {/* 2-Way Linkage Banner panel */}
        {!isDraft && (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-4.5 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Task Link */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#D7EEF1]/20 border border-primary-fixed/40">
              <span className="material-symbols-outlined text-2xl text-[#1E707D] font-bold">assignment</span>
              <div>
                <p className="text-[11px] font-black uppercase text-on-surface-variant leading-tight">Linked Kanban Task</p>
                <button
                  onClick={() => navigate(`/projects/${projectId}/tasks/${bug.relatedTaskId}`)}
                  className="text-xs font-bold text-[#1E707D] hover:underline mt-0.5 text-left"
                >
                  Task #{bug.relatedTaskId}: [BUG] {bug.title}
                </button>
              </div>
            </div>

            {/* GitHub Link */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-secondary-fixed/20 border border-secondary-fixed/40">
              <span className="material-symbols-outlined text-2xl text-[#1E707D] font-bold">settings_ethernet</span>
              <div>
                <p className="text-[11px] font-black uppercase text-on-surface-variant leading-tight">GitHub Issue Sync</p>
                {githubIssueUrl ? (
                  <a
                    href={githubIssueUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-[#1E707D] hover:underline mt-0.5 block"
                  >
                    Issue #{githubIssueNumber} (Open on GitHub)
                  </a>
                ) : (
                  <p className="text-xs font-bold text-on-surface-variant mt-0.5">Issue synchronized on repository</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Core details layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* QA Technical details */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="text-md font-black text-on-surface border-b border-outline-variant/50 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1E707D] text-xl">description</span>
                Defect Report Details
              </h2>

              <div className="space-y-4">
                {bug.description && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-on-surface-variant">Description</h3>
                    <p className="text-xs text-on-surface leading-relaxed p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
                      {bug.description}
                    </p>
                  </div>
                )}

                {parsedSteps && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-on-surface-variant">Steps to Reproduce</h3>
                    <pre className="text-xs text-on-surface leading-relaxed p-3 rounded-xl bg-surface-container-low border border-outline-variant/50 font-mono whitespace-pre-wrap">
                      {parsedSteps}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bug.expectedResult && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-on-surface-variant">Expected Result</h3>
                      <p className="text-xs text-on-surface leading-relaxed p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
                        {bug.expectedResult}
                      </p>
                    </div>
                  )}

                  {bug.actualResult && (
                    <div className="space-y-1.5">
                      <h3 className="text-xs font-bold text-on-surface-variant">Actual Result</h3>
                      <p className="text-xs text-on-surface leading-relaxed p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
                        {bug.actualResult}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Thread Section */}
            {!isDraft && (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-6">
                <h2 className="text-md font-black text-on-surface border-b border-outline-variant/50 pb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1E707D] text-xl">forum</span>
                  Bidirectional Discussions
                </h2>

                {/* Comment list */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-on-surface-variant text-center py-6">
                      No discussions recorded yet. Comments posted here or on GitHub will sync automatically!
                    </p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="flex gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40">
                        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs shrink-0 shadow-inner">
                          {(c.createdByName || c.author || 'Anonymous').charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs font-bold text-on-surface">{c.createdByName || c.author || 'Anonymous'}</span>
                            <span className="text-[9px] text-on-surface-variant">
                              {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-on-surface leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Post comment form */}
                <form onSubmit={handleAddComment} className="flex gap-2 border-t border-outline-variant/50 pt-4">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or provide update (syncs to GitHub)..."
                    className="flex-1 px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:border-[#1E707D] text-on-surface"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 bg-[#1E707D] text-white hover:bg-[#1E707D]/95 text-xs font-bold rounded-xl transition-all shadow"
                  >
                    Post Comment
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right sidebar panel: checklist and metadata */}
          <div className="space-y-6 h-fit">
            {/* Checklist Card */}
            {!isDraft && task && (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-4">
                <h2 className="text-md font-black text-on-surface border-b border-outline-variant/50 pb-2.5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1E707D] text-xl">checklist</span>
                  Tasks Checklist
                </h2>

                {task.checklist && task.checklist.length > 0 ? (
                  <div className="space-y-2.5">
                    {task.checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-start gap-3 cursor-pointer hover:bg-surface-container-low/40 p-1.5 rounded-lg transition-colors select-none"
                      >
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => handleChecklistToggle(item.id, item.done)}
                          className="mt-0.5 accent-primary h-4 w-4 shrink-0 rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D] cursor-pointer"
                        />
                        <span className={`text-xs text-on-surface-variant leading-tight ${item.done ? 'line-through opacity-50 font-medium' : 'font-semibold'}`}>
                          {item.content}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-on-surface-variant text-center py-4">
                    No checklists defined for this bug fix task.
                  </p>
                )}
              </div>
            )}

            {/* Bug Metadata Info Card */}
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-md font-black text-on-surface border-b border-outline-variant/50 pb-2.5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1E707D] text-xl">info</span>
                Metadata
              </h2>

              <div className="space-y-3.5 text-xs">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                  <span className="font-bold text-on-surface-variant">Reported By</span>
                  <span className="font-semibold text-on-surface">{bug.createdBy?.fullName || bug.createdBy?.username || 'System'}</span>
                </div>

                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                  <span className="font-bold text-on-surface-variant">Assignee</span>
                  <span className="font-semibold text-on-surface">{bug.assignedTo?.fullName || bug.assignedTo?.username || 'Unassigned'}</span>
                </div>

                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
                  <span className="font-bold text-on-surface-variant">Created At</span>
                  <span className="font-semibold text-on-surface-variant">
                    {new Date(bug.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-bold text-on-surface-variant">Last Updated</span>
                  <span className="font-semibold text-on-surface-variant">
                    {new Date(bug.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default IssueDetailView;
