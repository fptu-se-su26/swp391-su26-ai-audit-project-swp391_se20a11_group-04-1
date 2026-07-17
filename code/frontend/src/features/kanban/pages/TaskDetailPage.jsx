import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TaskFormModal from '../components/TaskFormModal'
import useProjectStore from '@store/useProjectStore'
import useKanbanStore, { TASK_STATUSES } from '../store/useKanbanStore'
import { normalizeTaskType } from '../utils/taskMapper'
import toast from 'react-hot-toast'

const isLeaderRole = (role = '') => {
  // Normalize project role labels so leader-only review actions show correctly.
  const normalized = role.toUpperCase().replace(/\s+/g, '_')
  return normalized === 'PROJECT_LEADER' || normalized === 'LEADER' || normalized === 'MENTOR'
}

const TaskDetailPage = () => {
  const { projectId, id } = useParams()
  const navigate = useNavigate()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [newChecklistItemText, setNewChecklistItemText] = useState('')
  const [showGitHelper, setShowGitHelper] = useState(true)
  const [branchSuffix, setBranchSuffix] = useState('')
  const [commitMessage, setCommitMessage] = useState('')
  const activeProject = useProjectStore((state) => state.activeProject)
  const {
    tasks,
    columns,
    loading,
    error,
    fetchTaskById,
    updateTask,
    deleteTask,
    updateTaskStatus,
    requestTaskReview,
    approveTaskReview,
    rejectTaskReview,
    toggleChecklistItem,
  } = useKanbanStore()
  const task = tasks.find((item) => item.id === id)
  const taskBoardPath = projectId ? `/projects/${projectId}/task-board` : '/dashboard'
  const codeInsightPath = projectId ? `/projects/${projectId}/code-insight` : '/dashboard'
  const canDecideReview = isLeaderRole(activeProject?.role)
  const isLeader = isLeaderRole(activeProject?.role)

  useEffect(() => {
    if (!task) {
      fetchTaskById(id)
    } else if (task.parentId && !tasks.some(t => String(t.id) === String(task.parentId))) {
      fetchTaskById(task.parentId)
    }
  }, [fetchTaskById, id, task, tasks])

  if (!task) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-bright p-6">
        <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-error text-[48px] mb-3">error</span>
          <h1 className="text-2xl font-bold text-on-surface mb-2">{loading ? 'Loading task...' : 'Task not found'}</h1>
          <p className="text-sm text-on-surface-variant mb-5">
            {loading ? 'Please wait while the task detail is loaded.' : <>The task id <strong>{id}</strong> does not exist in the current board data.</>}
          </p>
          <Link to={taskBoardPath} className="inline-flex items-center gap-2 bg-[#1E707D] text-white px-4 py-2 rounded-lg font-semibold">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Task Board
          </Link>
        </div>
      </div>
    )
  }

  const completedChecklist = task.checklist.filter((item) => item.done).length
  const taskType = normalizeTaskType(task.type)

  const subtasks = tasks.filter(t => t.parentId === String(task.id))
  const hasSubtasks = subtasks.length > 0
  const isChildTask = !!task.parentId

  // Checklist completion
  const isChecklistPassed = !task.checklist || task.checklist.length === 0 || task.checklist.every((item) => item.done)

  // Subtasks completion
  const areAllSubtasksDone = hasSubtasks && subtasks.every(t => t.status === 'DONE' || t.status === 'FIXED' || t.status === 'CLOSED')

  // Determine if the action is enabled
  const isReviewActionEnabled = isChildTask ? isChecklistPassed : (hasSubtasks ? (areAllSubtasksDone && isChecklistPassed) : isChecklistPassed)

  const handleDeleteTask = () => {
    // Delete through store, then return user to board because this detail page no longer has a task.
    const confirmed = window.confirm(`Delete ${task.id}? This cannot be undone in the current board state.`)
    if (confirmed) {
      deleteTask(task.id)
      navigate(taskBoardPath)
    }
  }

  const handleUpdateTask = (payload) => {
    // Save edited task fields and close the modal once store/API update starts.
    updateTask(task.id, payload)
    setIsEditOpen(false)
  }

  const handleAddChecklistItem = async (e) => {
    e.preventDefault()
    if (!newChecklistItemText.trim()) return

    const newItem = {
      id: `temp-${Date.now()}`,
      text: newChecklistItemText.trim(),
      done: false
    }

    const updatedChecklist = [...(task.checklist || []), newItem]

    await updateTask(task.id, {
      ...task,
      assigneeId: task.assignee?.id || null,
      checklist: updatedChecklist
    })

    setNewChecklistItemText('')
    await fetchTaskById(task.id)
  }

  const handleDeleteChecklistItem = async (checklistId) => {
    const updatedChecklist = (task.checklist || []).filter(item => item.id !== String(checklistId))

    await updateTask(task.id, {
      ...task,
      assigneeId: task.assignee?.id || null,
      checklist: updatedChecklist
    })
    await fetchTaskById(task.id)
  }

  const handleCollapseToPanel = () => {
    // Return to board while asking the board page to open this task in its side panel.
    navigate(taskBoardPath, { state: { openTaskId: task.id } })
  }

  const handleRequestReview = async () => {
    // Member moves task into IN_REVIEW for leader approval.
    await requestTaskReview(task.id, 'Ready for leader review')
  }

  const handleApproveReview = async () => {
    // Leader approves this task and backend marks it DONE.
    await approveTaskReview(task.id, 'Approved from task detail')
  }

  const handleRejectReview = async () => {
    // Leader must provide feedback before backend returns the task to work.
    const reason = window.prompt('Why should this task be returned for changes?')
    if (!reason || !reason.trim()) return
    await rejectTaskReview(task.id, reason.trim(), 'IN_PROGRESS')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-surface-bright">
      <div className="max-w-[1200px] w-full mx-auto px-6 py-6 md:py-8">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center text-label-md font-label-md text-on-surface-variant">
            <Link className="hover:text-[#1E707D] transition-colors" to={taskBoardPath}>Task Board</Link>
            <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
            <span className="text-on-surface">{task.id}</span>
          </div>
          {isChildTask && (() => {
            const parentTask = tasks.find(t => String(t.id) === String(task.parentId))
            return parentTask ? (
              <Link
                to={`/projects/${projectId}/tasks/${parentTask.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-[#1E707D] font-bold hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Quay lại task cha: #{parentTask.id} - {parentTask.title}</span>
              </Link>
            ) : null
          })()}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={handleCollapseToPanel}
                className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:text-[#1E707D] hover:bg-[#D7EEF1] transition-colors"
                aria-label="Collapse to task panel"
                title="Collapse to panel"
              >
                <span className="material-symbols-outlined text-[22px]">keyboard_return</span>
              </button>
              <span className="bg-[#D7EEF1] text-[#1E707D] px-2 py-1 rounded text-label-md font-label-md uppercase">
                {task.id}
              </span>
              <h1 className="font-headline-md text-headline-md text-on-surface truncate">{task.title}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              {taskType !== 'BUG_FIX' && (
                <button
                  type="button"
                  onClick={() => navigate(`/projects/${projectId}/features/${task.id}/discuss`)}
                  title="Discussion"
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] hover:bg-[#0ea5e9]/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">forum</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                title="Edit task"
                className="h-9 w-9 inline-flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                title="Delete task"
                className="h-9 w-9 inline-flex items-center justify-center rounded-full text-error hover:bg-error/10 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-error">
              {error}
            </div>
          )}

          <div className="mb-4 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-on-surface">Review Gate</h2>
              <p className="text-sm text-on-surface-variant">
                {task.status === 'IN_REVIEW'
                  ? 'This task is waiting for leader approval before it can be Done.'
                  : task.status === 'DONE'
                    ? 'This task has been approved as Done.'
                    : 'Request review when the implementation is ready for leader approval.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.status !== 'DONE' && task.status !== 'IN_REVIEW' && (
                <div className="flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={handleRequestReview}
                    disabled={!isReviewActionEnabled}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E707D] text-white px-3 py-2 text-sm font-semibold hover:bg-[#D7EEF1] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    {isLeader ? 'Request Peer Review' : 'Request Review'}
                  </button>
                  {!isReviewActionEnabled && (
                    <span className="text-xs text-on-surface-variant">
                      Complete checklist and child tasks before requesting review.
                    </span>
                  )}
                </div>
              )}
              {task.status === 'IN_REVIEW' && canDecideReview && (
                <>
                  <button
                    type="button"
                    onClick={handleRejectReview}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 bg-error-container text-error px-3 py-2 text-sm font-semibold hover:bg-error-container/70"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveReview}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E707D] text-white px-3 py-2 text-sm font-semibold hover:bg-[#D7EEF1]"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Approve Done
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Developer guidance panels based on task type */}
          {task.status !== 'DONE' && (taskType === 'DEVELOPMENT' || taskType === 'BUG_FIX') && (() => {
            const formattedSuffix = branchSuffix
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9_-]/g, '');

            const branchName = `${taskType === 'BUG_FIX' ? 'bugfix' : 'feature'}/${task.taskCode || 'TSK-' + task.id}${formattedSuffix ? '-' + formattedSuffix : '-branch-name'}`;
            const checkoutCmd = `git checkout -b ${branchName}`;
            const commitCmd = `git commit -m "feat(${task.taskCode || 'TSK-' + task.id}): ${commitMessage.trim() || 'your commit message'}"`;
            const pushCmd = `git push origin ${branchName}`;

            return (
              <div className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm text-left">
                <button
                  type="button"
                  onClick={() => setShowGitHelper(!showGitHelper)}
                  className="w-full flex justify-between items-center font-bold text-sm text-on-surface-variant select-none"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
                    Git Workflow & Developer Guide
                  </span>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform duration-200" style={{ transform: showGitHelper ? 'rotate(180deg)' : 'none' }}>
                    expand_more
                  </span>
                </button>

                {showGitHelper && (
                  <div className="mt-3 pt-3 border-t border-outline-variant/60 space-y-4 animate-fade-in">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Fill in the optional fields below to customize your commands, then follow the workflow to ensure the system can automatically link your evidence.
                    </p>

                    {/* Interactive Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-surface-container-low p-3 rounded-lg border border-outline-variant/40">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">branch-name <span className="normal-case font-normal text-on-surface-variant/60">(optional suffix)</span></label>
                        <input
                          type="text"
                          placeholder="e.g. jwt-auth"
                          value={branchSuffix}
                          onChange={(e) => setBranchSuffix(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:border-[#1E707D]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">your commit message <span className="normal-case font-normal text-on-surface-variant/60">(optional)</span></label>
                        <input
                          type="text"
                          placeholder="e.g. implement jwt authentication"
                          value={commitMessage}
                          onChange={(e) => setCommitMessage(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-outline-variant rounded bg-surface-container-lowest text-on-surface focus:outline-none focus:border-[#1E707D]"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Step 1: Checkout branch */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">1. Create a new branch (must contain Task ID)</span>
                        <div className="flex items-center bg-surface border border-outline-variant rounded-lg overflow-hidden font-mono text-xs text-on-surface select-all">
                          <span className="flex-1 px-3 py-2 truncate">
                            {checkoutCmd}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(checkoutCmd);
                              toast.success("Copied checkout command!");
                            }}
                            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border-l border-outline-variant text-primary flex items-center justify-center shrink-0"
                            title="Copy to clipboard"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>
                      </div>

                      {/* Step 2: Commit */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">2. Commit your changes (must include Task tag)</span>
                        <div className="flex items-center bg-surface border border-outline-variant rounded-lg overflow-hidden font-mono text-xs text-on-surface select-all">
                          <span className="flex-1 px-3 py-2 truncate">
                            {commitCmd}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(commitCmd);
                              toast.success("Copied commit command!");
                            }}
                            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border-l border-outline-variant text-primary flex items-center justify-center shrink-0"
                            title="Copy to clipboard"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>
                      </div>

                      {/* Step 3: Push */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">3. Push your branch to GitHub</span>
                        <div className="flex items-center bg-surface border border-outline-variant rounded-lg overflow-hidden font-mono text-xs text-on-surface select-all">
                          <span className="flex-1 px-3 py-2 truncate">
                            {pushCmd}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(pushCmd);
                              toast.success("Copied push command!");
                            }}
                            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high border-l border-outline-variant text-primary flex items-center justify-center shrink-0"
                            title="Copy to clipboard"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex gap-2">
                      <span className="material-symbols-outlined text-primary text-[16px] mt-0.5 shrink-0">info</span>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        <b>Review requirement:</b> After pushing, open a <b>Pull Request (PR)</b> to the main branch and wait for the <b>CI/CD checks (if any)</b> to pass before clicking <b>Request Review</b>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {task.status !== 'DONE' && (taskType === 'DESIGN' || taskType === 'DOCUMENTATION' || taskType === 'RESEARCH') && (
            <div className="mb-4 rounded-xl border border-dashed border-[#1E707D]/40 bg-[#D7EEF1]/10 p-4 text-left">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#1E707D] text-[20px] shrink-0 mt-0.5">folder_open</span>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-on-surface">Hướng dẫn nộp Bằng chứng (General Evidence)</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Task này thuộc loại phi kỹ thuật (Non-code task). Bạn <b>không cần commit code</b> trên Git. 
                    Thay vào đó, hãy kéo xuống mục <b>General Evidence</b> bên dưới để tải lên tệp tin ảnh, tài liệu hoặc đính kèm liên kết ngoài (Figma/Drive) trước khi bấm <b>Request Review</b>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-outline-variant pt-4 mt-2">
            <label className="flex items-center gap-2">
              <span className="text-on-surface-variant text-body-md font-body-md">Status:</span>
              <select
                value={task.status}
                onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-label-md font-label-md border border-transparent focus:outline-none focus:ring-1 focus:ring-[#1E707D]"
              >
                {TASK_STATUSES.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-on-surface-variant text-body-md font-body-md">Priority:</span>
              <span className="bg-error-container text-on-error-container px-2 py-0.5 rounded text-label-md font-label-md">
                {task.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person</span>
              <span className="text-on-surface text-body-md font-body-md">{task.assignee.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">link</span>
              {task.requirementId ? (
                <Link
                  to={`/projects/${projectId}/requirements/${task.requirementId}`}
                  className="text-[#1E707D] text-body-md font-body-md hover:underline hover:text-surface-tint"
                >
                  {task.requirement}
                </Link>
              ) : (
                <span className="text-on-surface-variant text-body-md font-body-md">{task.requirement}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">speed</span>
              <span className="text-on-surface text-body-md font-body-md">{task.sprint}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">event_available</span>
              <span className="text-on-surface text-body-md font-body-md">Start: {task.startDate || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">event</span>
              <span className={`${task.overduePenaltyApplied ? 'text-error font-semibold' : 'text-on-surface'} text-body-md font-body-md`}>
                Deadline: {task.deadline || 'Not set'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">fitness_center</span>
              <span className="text-on-surface text-body-md font-body-md">Weight: {task.weight || 1}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">timer</span>
              <span className="text-on-surface text-body-md font-body-md">
                Estimate: {task.estimatedHours ? `${task.estimatedHours}h` : 'Not set'}
              </span>
            </div>
            {task.overduePenaltyApplied && (
              <div className="flex items-center gap-2 rounded bg-error/10 px-2 py-1 text-error">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span className="text-body-md font-body-md">
                  Penalty applied{task.overduePenaltyAppliedAt ? ` at ${task.overduePenaltyAppliedAt}` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant">Description</h3>
              <p className="text-body-md font-body-md text-on-surface-variant whitespace-pre-line leading-relaxed">
                {task.description || 'No description has been added yet.'}
              </p>
            </div>

            {/* Review Checklist Summary — shown to members so they know what's needed before requesting review */}
            {task.status !== 'DONE' && (() => {
              const isCodeTask = taskType === 'DEVELOPMENT' || taskType === 'BUG_FIX';
              const codeItems = [
                { key: 'branch', label: 'Created a branch with Task ID in the name', done: false },
                { key: 'commit', label: 'Committed with the required tag in the message', done: false },
                { key: 'push', label: 'Pushed branch to GitHub', done: false },
                { key: 'pr', label: 'Opened a Pull Request to main branch', done: false },
                { key: 'ci', label: 'CI/CD checks passed (if applicable)', done: false },
                { key: 'checklist', label: `All checklist items completed (${completedChecklist}/${task.checklist.length})`, done: task.checklist.length === 0 || task.checklist.every(i => i.done) },
              ];
              const nonCodeItems = [
                { key: 'deliverable', label: 'Deliverable file/link is ready (Figma, Drive, PDF, etc.)', done: false },
                { key: 'evidence', label: 'Evidence uploaded in the General Evidence section', done: false },
                { key: 'checklist', label: `All checklist items completed (${completedChecklist}/${task.checklist.length})`, done: task.checklist.length === 0 || task.checklist.every(i => i.done) },
              ];
              const items = isCodeTask ? codeItems : nonCodeItems;
              return (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant">
                    <h3 className="font-headline-sm text-body-lg text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#1E707D]">checklist</span>
                      Review Checklist
                    </h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isCodeTask ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>
                      {isCodeTask ? 'Code task' : 'Non-code task'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mb-3">Make sure all of the following are done before clicking <b>Request Review</b>:</p>
                  <div className="space-y-2">
                    {items.map(item => (
                      <div key={item.key} className={`flex items-start gap-2.5 p-2 rounded-lg text-sm ${
                        item.done ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-container-low text-on-surface-variant'
                      }`}>
                        <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                          item.done ? 'text-emerald-500' : 'text-on-surface-variant/50'
                        }`}>
                          {item.done ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant flex justify-between">
                <span>Checklist</span>
                <span className="text-sm text-on-surface-variant">{completedChecklist}/{task.checklist.length}</span>
              </h3>
              <div className="space-y-2">
                {task.checklist.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">No checklist items.</p>
                ) : (
                  task.checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-1.5 hover:bg-surface-container-low rounded transition-colors group">
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          checked={item.done}
                          onChange={() => toggleChecklistItem(task.id, item.id)}
                          className="w-4 h-4 text-[#1E707D] border-outline-variant rounded focus:ring-[#1E707D] shrink-0"
                          type="checkbox"
                        />
                        <span className={`text-body-md font-body-md truncate ${item.done ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-error hover:bg-error/10 p-1 rounded transition-all shrink-0 flex items-center justify-center cursor-pointer"
                        title="Delete item"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist item form */}
              <form onSubmit={handleAddChecklistItem} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a checklist item..."
                  value={newChecklistItemText}
                  onChange={(e) => setNewChecklistItemText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1E707D] text-white hover:bg-[#165964] text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span className="material-symbols-outlined text-[14px] font-bold">add</span>
                  <span>Add</span>
                </button>
              </form>
            </div>

            {hasSubtasks && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
                <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant flex justify-between">
                  <span>Sub-tasks</span>
                  <span className="text-sm text-on-surface-variant">
                    {subtasks.filter(t => t.status === 'DONE' || t.status === 'FIXED' || t.status === 'CLOSED').length}/{subtasks.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {subtasks.map((sub) => {
                    const isSubDone = sub.status === 'DONE' || sub.status === 'FIXED' || sub.status === 'CLOSED'
                    return (
                      <Link
                        key={sub.id}
                        to={`/projects/${projectId}/tasks/${sub.id}`}
                        className="flex items-center justify-between p-2.5 rounded border border-outline-variant hover:border-[#1E707D] hover:bg-surface-container-low transition-all group"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <span className="material-symbols-outlined text-[16px] text-[#1E707D]">subdirectory_arrow_right</span>
                          <span className={`text-sm font-semibold truncate ${isSubDone ? 'text-on-surface-variant line-through' : 'text-on-background'}`}>
                            {sub.title}
                          </span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 uppercase border ${
                          sub.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          sub.status === 'IN_REVIEW' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          sub.status === 'IN_PROGRESS' ? 'bg-[#1E707D]/10 text-[#1E707D] border-blue-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {sub.status.replaceAll('_', ' ')}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-4 pb-2 border-b border-outline-variant">Comments</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D7EEF1] flex-shrink-0 flex items-center justify-center">
                  <span className="text-[#1E707D] font-label-md">ME</span>
                </div>
                <div className="flex-1">
                  <textarea className="w-full border border-outline-variant rounded p-2 text-body-md focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] bg-transparent resize-none h-[80px]" placeholder="Add a comment..." />
                  <div className="flex justify-end mt-2">
                    <button className="h-[32px] px-4 bg-[#1E707D] text-white hover:bg-[#165964] rounded text-body-md font-body-md transition-colors">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant">Git Workflow</h3>
              <span className="text-label-md text-on-surface-variant uppercase mb-1 block">Commit Prefix</span>
              <div className="flex items-center bg-surface-container-low rounded border border-outline-variant p-2">
                <code className="font-label-md text-on-surface flex-1">feat({task.taskCode || 'TSK-' + task.id}): </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`feat(${task.taskCode || 'TSK-' + task.id}): `);
                    toast.success("Đã copy prefix commit!");
                  }}
                  className="text-on-surface-variant hover:text-[#1E707D] transition-colors"
                  title="Copy to clipboard"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-6">
              <h3 className="font-headline-sm text-body-lg text-on-surface mb-3 pb-2 border-b border-outline-variant">Related Items</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 border border-outline-variant rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">inventory_2</span>
                    <span className="text-body-md font-body-md text-on-surface">Evidence</span>
                  </div>
                  <span className="text-label-md font-label-md text-on-surface-variant">{task.evidenceStatus}</span>
                </div>
                <div className="flex items-center justify-between p-2 border border-outline-variant rounded bg-surface-container-low">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">checklist_rtl</span>
                    <span className="text-body-md font-body-md text-on-surface">Tests</span>
                  </div>
                  <span className="text-label-md font-label-md text-on-surface-variant">{task.testStatus}</span>
                </div>
                {task.status === 'BLOCKED' && task.blockedReason && (
                  <div className="p-3 rounded bg-error/10 border border-error/20 text-error text-sm">
                    {task.blockedReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <TaskFormModal
        isLeaderRole={isLeader}
        isOpen={isEditOpen}
        task={task}
        assigneeOptions={activeProject?.members || []}
        columnOptions={columns}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdateTask}
      />
    </div>
  )
}

export default TaskDetailPage
