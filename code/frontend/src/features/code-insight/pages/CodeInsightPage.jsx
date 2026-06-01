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
  const [config, setConfig] = useState(null)
  const [configForm, setConfigForm] = useState({
    repoUrl: '',
    defaultBranch: 'main',
    webhookSecret: '',
    active: true,
    reviewGateEnabled: true,
    requirePrForDone: false,
    requireCiPass: false,
    aiReviewEnabled: false,
    minScoreWarningThreshold: 70,
  })
  const [loading, setLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [error, setError] = useState('')
  const [configError, setConfigError] = useState('')
  const [success, setSuccess] = useState('')

  const canDecide = isLeaderRole(activeProject?.role)
  const repositoryConfigured = Boolean(config?.repository?.repoUrl)

  const hydrateConfigForm = (nextConfig) => {
    const repository = nextConfig?.repository
    const settings = nextConfig?.settings
    setConfig(nextConfig)
    setConfigForm({
      repoUrl: repository?.repoUrl || '',
      defaultBranch: repository?.defaultBranch || 'main',
      webhookSecret: '',
      active: repository?.active ?? true,
      reviewGateEnabled: settings?.reviewGateEnabled ?? true,
      requirePrForDone: settings?.requirePrForDone ?? false,
      requireCiPass: settings?.requireCiPass ?? false,
      aiReviewEnabled: settings?.aiReviewEnabled ?? false,
      minScoreWarningThreshold: settings?.minScoreWarningThreshold ?? 70,
    })
  }

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

  const loadConfig = async () => {
    if (!projectId) return
    setConfigLoading(true)
    setConfigError('')
    try {
      hydrateConfigForm(await codeInsightService.getConfig(projectId))
    } catch (err) {
      setConfigError(err.response?.data?.message || err.message || 'Failed to load Code Insight configuration')
    } finally {
      setConfigLoading(false)
    }
  }

  useEffect(() => {
    loadReviewQueue()
    loadConfig()
  }, [projectId])

  const updateConfigForm = (field, value) => {
    setConfigForm((current) => ({ ...current, [field]: value }))
  }

  const saveConfig = async (event) => {
    event.preventDefault()
    if (!canDecide) return
    setConfigSaving(true)
    setConfigError('')
    setSuccess('')
    try {
      const payload = {
        ...configForm,
        minScoreWarningThreshold: Number(configForm.minScoreWarningThreshold),
      }
      if (!payload.webhookSecret?.trim()) {
        delete payload.webhookSecret
      }
      const nextConfig = await codeInsightService.updateConfig(projectId, payload)
      hydrateConfigForm(nextConfig)
      setSuccess('Code Insight configuration saved.')
    } catch (err) {
      setConfigError(err.response?.data?.message || err.message || 'Failed to save Code Insight configuration')
    } finally {
      setConfigSaving(false)
    }
  }

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

        <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">GitHub Repository</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Configure the project repository that future webhook evidence will come from.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 font-label-md text-label-md uppercase ${
                repositoryConfigured
                  ? 'bg-[#dcfce7] text-[#166534]'
                  : 'bg-surface-container-high text-on-surface-variant'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {repositoryConfigured ? 'check_circle' : 'link_off'}
                </span>
                {repositoryConfigured ? 'Configured' : 'Not Configured'}
              </span>
              {config?.repository?.hasWebhookSecret && (
                <span className="inline-flex items-center gap-1.5 rounded bg-primary-fixed px-2.5 py-1 font-label-md text-label-md uppercase text-primary">
                  <span className="material-symbols-outlined text-[14px]">key</span>
                  Secret Saved
                </span>
              )}
            </div>
          </div>

          {configError && (
            <div className="mb-4 rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-error">
              {configError}
            </div>
          )}

          <form onSubmit={saveConfig} className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="md:col-span-2">
                <span className="font-label-md text-label-md uppercase text-on-surface-variant">Repository URL</span>
                <input
                  type="text"
                  value={configForm.repoUrl}
                  onChange={(event) => updateConfigForm('repoUrl', event.target.value)}
                  disabled={!canDecide || configLoading}
                  placeholder="https://github.com/owner/repository"
                  className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed disabled:opacity-60"
                />
              </label>
              <label>
                <span className="font-label-md text-label-md uppercase text-on-surface-variant">Default Branch</span>
                <input
                  type="text"
                  value={configForm.defaultBranch}
                  onChange={(event) => updateConfigForm('defaultBranch', event.target.value)}
                  disabled={!canDecide || configLoading}
                  placeholder="main"
                  className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed disabled:opacity-60"
                />
              </label>
              <label>
                <span className="font-label-md text-label-md uppercase text-on-surface-variant">Webhook Secret</span>
                <input
                  type="password"
                  value={configForm.webhookSecret}
                  onChange={(event) => updateConfigForm('webhookSecret', event.target.value)}
                  disabled={!canDecide || configLoading}
                  placeholder={config?.repository?.hasWebhookSecret ? 'Leave blank to keep current secret' : 'Set later for webhook'}
                  className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed disabled:opacity-60"
                />
              </label>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <h3 className="font-label-md text-label-md uppercase text-on-surface-variant mb-3">Review Rules</h3>
              <div className="space-y-3">
                {[
                  ['active', 'Repository Active'],
                  ['reviewGateEnabled', 'Require Leader Review Gate'],
                  ['requirePrForDone', 'Require PR Before Done'],
                  ['requireCiPass', 'Require CI Pass'],
                  ['aiReviewEnabled', 'Enable AI Review Later'],
                ].map(([field, label]) => (
                  <label key={field} className="flex items-center justify-between gap-3 text-sm font-semibold text-on-surface">
                    <span>{label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(configForm[field])}
                      onChange={(event) => updateConfigForm(field, event.target.checked)}
                      disabled={!canDecide || configLoading}
                      className="h-4 w-4 rounded border-outline text-primary focus:ring-primary disabled:opacity-60"
                    />
                  </label>
                ))}
                <label className="block pt-2">
                  <span className="font-label-md text-label-md uppercase text-on-surface-variant">Score Warning Threshold</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={configForm.minScoreWarningThreshold}
                    onChange={(event) => updateConfigForm('minScoreWarningThreshold', event.target.value)}
                    disabled={!canDecide || configLoading}
                    className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed disabled:opacity-60"
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={!canDecide || configSaving || configLoading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {configSaving ? 'Saving...' : canDecide ? 'Save Configuration' : 'Leader Only'}
              </button>
            </div>
          </form>
        </section>

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
