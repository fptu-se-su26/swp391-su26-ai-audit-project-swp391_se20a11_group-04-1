import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useProjectStore from '@store/useProjectStore'
import taskService from '@features/kanban/services/taskService'
import codeInsightService from '../services/codeInsightService'

const isLeaderRole = (role = '') => {
  const normalized = role.toUpperCase().replace(/\s+/g, '_')
  return normalized === 'PROJECT_LEADER' || normalized === 'LEADER'
}

const CodeInsightPage = () => {
  const { projectId } = useParams()
  const activeProject = useProjectStore((state) => state.activeProject)
  const [reviewQueue, setReviewQueue] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canDecide = isLeaderRole(activeProject?.role)

  const loadReviewQueue = async () => {
    if (!projectId) return
    setLoading(true)
    setError('')
    try {
      setReviewQueue(await codeInsightService.getReviewQueue(projectId))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Code Insight review queue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviewQueue()
  }, [projectId])

  const approveTask = async (taskId) => {
    setError('')
    setSuccess('')
    try {
      await taskService.approveTaskReview(taskId, 'Approved from Code Insight review queue')
      setSuccess('Task approved and moved to Done.')
      await loadReviewQueue()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve task')
    }
  }

  const rejectTask = async (taskId) => {
    const reason = window.prompt('Why should this task be returned for changes?')
    if (!reason || !reason.trim()) return
    setError('')
    setSuccess('')
    try {
      await taskService.rejectTaskReview(taskId, reason.trim(), 'IN_PROGRESS')
      setSuccess('Task rejected and returned to In Progress.')
      await loadReviewQueue()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject task')
    }
  }

  return (
    <div className="min-h-screen bg-surface-bright px-6 py-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="font-label-md text-label-md uppercase text-primary bg-primary-fixed inline-flex px-3 py-1 rounded mb-3">
              {activeProject?.title || 'Current Project'}
            </p>
            <h1 className="font-headline-md text-headline-md text-on-surface">Code Insight</h1>
            <p className="text-on-surface-variant mt-1">
              Review tasks before Done. GitHub evidence, scoring, and AI analysis will plug into this queue next.
            </p>
          </div>
          <button
            type="button"
            onClick={loadReviewQueue}
            className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <span className="font-label-md text-label-md uppercase text-on-surface-variant">In Review</span>
            <div className="text-3xl font-bold text-on-surface mt-2">{reviewQueue.length}</div>
          </div>
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <span className="font-label-md text-label-md uppercase text-on-surface-variant">Evidence Mode</span>
            <div className="text-lg font-bold text-on-surface mt-2">Manual Gate</div>
          </div>
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <span className="font-label-md text-label-md uppercase text-on-surface-variant">AI Review</span>
            <div className="text-lg font-bold text-on-surface mt-2">Coming Next</div>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-error">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-[#16a34a]/30 bg-[#dcfce7] px-4 py-3 text-[#166534]">
            {success}
          </div>
        )}

        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden">
          <div className="border-b border-outline-variant px-5 py-4">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Review Queue</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Tasks enter this queue when a member requests review.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-on-surface-variant">Loading review queue...</div>
          ) : reviewQueue.length === 0 ? (
            <div className="p-10 text-center">
              <span className="material-symbols-outlined text-[44px] text-outline">fact_check</span>
              <h3 className="mt-3 text-lg font-bold text-on-surface">No tasks waiting for review</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Ask a member to request review from a task detail page.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {reviewQueue.map((item) => (
                <article key={`${item.task?.id}-${item.id || 'pending'}`} className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-label-md text-label-md text-primary bg-primary-fixed px-2 py-1 rounded">
                        {item.task?.requirementCode || 'No Requirement'}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">
                        {item.task?.priority || 'MEDIUM'}
                      </span>
                      <span className="font-label-md text-label-md text-[#7e22ce] bg-[#f3e8ff] px-2 py-1 rounded">
                        IN REVIEW
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface truncate">{item.task?.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Assignee: {item.task?.assigneeName || 'Unassigned'}
                      {item.reviewer?.name ? ` | Requested by: ${item.reviewer.name}` : ''}
                    </p>
                    {item.reason && (
                      <p className="text-sm text-on-surface mt-2 rounded bg-surface-container-low px-3 py-2">
                        {item.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/projects/${projectId}/tasks/${item.task?.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                      Task Detail
                    </Link>
                    {canDecide && (
                      <>
                        <button
                          type="button"
                          onClick={() => rejectTask(item.task?.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 bg-error-container px-3 py-2 text-sm font-semibold text-error hover:bg-error-container/70"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => approveTask(item.task?.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          Approve
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default CodeInsightPage
