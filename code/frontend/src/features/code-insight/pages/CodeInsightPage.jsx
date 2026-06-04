import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import useProjectStore from '@store/useProjectStore'
import taskService from '@features/kanban/services/taskService'
import codeInsightService from '../services/codeInsightService'

const isLeaderRole = (role = '') => {
  // Normalize backend/project role labels so both "LEADER" and "Project Leader" work.
  const normalized = role.toUpperCase().replace(/\s+/g, '_')
  return normalized === 'PROJECT_LEADER' || normalized === 'LEADER'
}

const scoreToneClass = (riskLevel = 'READY') => {
  if (riskLevel === 'BLOCKED') return 'bg-error-container text-error border-error/30'
  if (riskLevel === 'WARNING') return 'bg-[#fef3c7] text-[#92400e] border-[#f59e0b]/30'
  return 'bg-[#dcfce7] text-[#166534] border-[#16a34a]/30'
}

const evidenceModeLabel = (mode = 'MANUAL_GATE') => {
  if (mode === 'GITHUB_CODE_LINKED') return 'GitHub code linked'
  if (mode === 'GITHUB_ISSUE_LINKED') return 'GitHub issue linked'
  return 'Manual gate'
}

const shortSha = (sha = '') => (sha ? sha.slice(0, 7) : 'unknown')

const formatDateTime = (value) => {
  if (!value) return 'Not available'
  return new Date(value).toLocaleString()
}

const CodeInsightPage = () => {
  const { projectId } = useParams()
  const activeProject = useProjectStore((state) => state.activeProject)
  const [reviewQueue, setReviewQueue] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [config, setConfig] = useState(null)
  const [configForm, setConfigForm] = useState({
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
  const [configSuccess, setConfigSuccess] = useState('')
  const [isConfigEditing, setIsConfigEditing] = useState(false)
  const [success, setSuccess] = useState('')
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')
  const [changedFilesLoading, setChangedFilesLoading] = useState(false)
  const [aiReviewLoading, setAiReviewLoading] = useState(false)

  const canDecide = isLeaderRole(activeProject?.role)
  const repositoryConfigured = Boolean(config?.repository?.repoUrl)
  const ruleItems = [
    ['reviewGateEnabled', 'Require Leader Review Gate'],
    ['requirePrForDone', 'Require PR Before Done'],
    ['requireCiPass', 'Require CI Pass'],
    ['aiReviewEnabled', 'Enable AI Review Later'],
  ]

  const hydrateConfigForm = (nextConfig) => {
    // Copy API settings into editable form state; GitHub repo config is managed by the shared GitHub Config page.
    const settings = nextConfig?.settings
    setConfig(nextConfig)
    setConfigForm({
      reviewGateEnabled: settings?.reviewGateEnabled ?? true,
      requirePrForDone: settings?.requirePrForDone ?? false,
      requireCiPass: settings?.requireCiPass ?? false,
      aiReviewEnabled: settings?.aiReviewEnabled ?? false,
      minScoreWarningThreshold: settings?.minScoreWarningThreshold ?? 70,
    })
  }

  const loadReviewQueue = async () => {
    // Fetch live IN_REVIEW tasks for the current project Code Insight queue.
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

  const loadDashboard = async () => {
    if (!projectId) return
    try {
      setDashboard(await codeInsightService.getDashboard(projectId))
    } catch {
      setDashboard(null)
    }
  }

  const loadConfig = async () => {
    // Fetch shared GitHub repository status and Code Insight rule settings.
    if (!projectId) return
    setConfigLoading(true)
    setConfigError('')
    setConfigSuccess('')
    try {
      hydrateConfigForm(await codeInsightService.getConfig(projectId))
    } catch (err) {
      setConfigError(err.response?.data?.message || err.message || 'Failed to load Code Insight configuration')
    } finally {
      setConfigLoading(false)
    }
  }

  useEffect(() => {
    // Reload queue and config whenever the route project changes.
    loadReviewQueue()
    loadConfig()
    loadDashboard()
  }, [projectId])

  useEffect(() => {
    if (!selectedEvidence && !evidenceLoading) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeEvidenceDrawer()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEvidence, evidenceLoading])

  const updateConfigForm = (field, value) => {
    // Generic form updater keeps all settings controlled from one state object.
    setConfigSuccess('')
    setConfigForm((current) => ({ ...current, [field]: value }))
  }

  const saveConfig = async (event) => {
    // Persist Code Insight rule config only; GitHub repo setup is saved in the shared GitHub Config page.
    event.preventDefault()
    if (!canDecide) return
    setConfigSaving(true)
    setConfigError('')
    setConfigSuccess('')
    try {
      const payload = {
        reviewGateEnabled: configForm.reviewGateEnabled,
        requirePrForDone: configForm.requirePrForDone,
        requireCiPass: configForm.requireCiPass,
        aiReviewEnabled: configForm.aiReviewEnabled,
        minScoreWarningThreshold: Number(configForm.minScoreWarningThreshold),
      }
      const nextConfig = await codeInsightService.updateConfig(projectId, payload)
      hydrateConfigForm(nextConfig)
      setConfigSuccess('Configuration saved successfully.')
    } catch (err) {
      setConfigError(err.response?.data?.message || err.message || 'Failed to save Code Insight configuration')
    } finally {
      setConfigSaving(false)
    }
  }

  const cancelConfigEdit = () => {
    // Return form fields to last saved config when the user leaves edit mode.
    hydrateConfigForm(config)
    setIsConfigEditing(false)
    setConfigError('')
    setConfigSuccess('')
  }

  const approveTask = async (taskId) => {
    // Leader approves this review item and moves the task to DONE through the review endpoint.
    setError('')
    setSuccess('')
    try {
      await taskService.approveTaskReview(taskId, 'Approved from Code Insight review queue')
      setSuccess('Task approved and moved to Done.')
      await loadReviewQueue()
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve task')
    }
  }

  const rejectTask = async (taskId) => {
    // Leader sends task back to work with a required reason for the audit trail.
    const reason = window.prompt('Why should this task be returned for changes?')
    if (!reason || !reason.trim()) return
    setError('')
    setSuccess('')
    try {
      await taskService.rejectTaskReview(taskId, reason.trim(), 'IN_PROGRESS')
      setSuccess('Task rejected and returned to In Progress.')
      await loadReviewQueue()
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reject task')
    }
  }

  const openEvidenceDrawer = async (taskId) => {
    if (!taskId || !projectId) return
    setEvidenceLoading(true)
    setEvidenceError('')
    setSelectedEvidence(null)
    try {
      setSelectedEvidence(await codeInsightService.getTaskEvidence(projectId, taskId))
    } catch (err) {
      setEvidenceError(err.response?.data?.message || err.message || 'Failed to load task evidence')
    } finally {
      setEvidenceLoading(false)
    }
  }

  const closeEvidenceDrawer = () => {
    setSelectedEvidence(null)
    setEvidenceLoading(false)
    setEvidenceError('')
    setChangedFilesLoading(false)
    setAiReviewLoading(false)
  }

  const fetchChangedFiles = async () => {
    if (!selectedEvidence?.task?.id || !projectId) return
    setChangedFilesLoading(true)
    setEvidenceError('')
    try {
      setSelectedEvidence(await codeInsightService.fetchTaskChangedFiles(projectId, selectedEvidence.task.id))
    } catch (err) {
      setEvidenceError(err.response?.data?.message || err.message || 'Failed to fetch changed files')
    } finally {
      setChangedFilesLoading(false)
    }
  }

  const runAiReview = async () => {
    if (!selectedEvidence?.task?.id || !projectId) return
    setAiReviewLoading(true)
    setEvidenceError('')
    try {
      const aiReview = await codeInsightService.createAiReview(projectId, selectedEvidence.task.id)
      setSelectedEvidence((current) => ({ ...current, aiReview }))
    } catch (err) {
      setEvidenceError(err.response?.data?.message || err.message || 'Failed to create AI review')
    } finally {
      setAiReviewLoading(false)
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
              <h2 className="font-headline-sm text-headline-sm text-on-surface">GitHub Integration</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Code Insight uses the shared project GitHub connection as its future evidence source.
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

          {!isConfigEditing ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <span className="font-label-md text-label-md uppercase text-on-surface-variant">Repository URL</span>
                  <p className="mt-2 text-sm font-semibold text-on-surface break-all">
                    {config?.repository?.repoUrl || 'No repository configured yet'}
                  </p>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <span className="font-label-md text-label-md uppercase text-on-surface-variant">Repository</span>
                  <p className="mt-2 text-sm font-semibold text-on-surface">
                    {config?.repository?.owner && config?.repository?.repoName
                      ? `${config.repository.owner}/${config.repository.repoName}`
                      : 'Not connected'}
                  </p>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <span className="font-label-md text-label-md uppercase text-on-surface-variant">Webhook Secret</span>
                  <p className="mt-2 text-sm font-semibold text-on-surface">
                    {config?.repository?.hasWebhookSecret ? 'Saved' : 'Not set'}
                  </p>
                </div>
                <div className="md:col-span-2 rounded-lg border border-primary/20 bg-primary-fixed/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Configure GitHub from the shared GitHub Config page</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      Repository, OAuth token, webhook secret, and webhook setup are managed once for Issue Tracker and Code Insight.
                    </p>
                  </div>
                  <Link
                    to={`/projects/${projectId}/github-config`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    GitHub Config
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">Review Rules</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfigEditing(true)
                      setConfigSuccess('')
                    }}
                    disabled={!canDecide || configLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[17px]">settings</span>
                    Config
                  </button>
                </div>
                <div className="space-y-3">
                  {ruleItems.map(([field, label]) => (
                    <div key={field} className="flex items-center justify-between gap-3 text-sm font-semibold text-on-surface">
                      <span>{label}</span>
                      <span className={`font-label-md text-label-md uppercase rounded px-2 py-1 ${
                        configForm[field]
                          ? 'bg-[#dcfce7] text-[#166534]'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {configForm[field] ? 'On' : 'Off'}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 border-t border-outline-variant pt-3 text-sm font-semibold text-on-surface">
                    <span>Score Warning Threshold</span>
                    <span className="font-label-md text-label-md rounded bg-primary-fixed px-2 py-1 text-primary">
                      {configForm.minScoreWarningThreshold}
                    </span>
                  </div>
                </div>
                {configSuccess && (
                  <div className="mt-4 rounded-lg border border-[#16a34a]/30 bg-[#dcfce7] px-3 py-2 text-sm font-semibold text-[#166534]">
                    {configSuccess}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={saveConfig} className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-5">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <span className="font-label-md text-label-md uppercase text-on-surface-variant">Shared GitHub Source</span>
                <p className="mt-2 text-sm font-semibold text-on-surface break-all">
                  {config?.repository?.repoUrl || 'No repository configured yet'}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  Use the GitHub Config page to change repository, token, or webhook settings.
                </p>
                <Link
                  to={`/projects/${projectId}/github-config`}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
                >
                  <span className="material-symbols-outlined text-[18px]">settings</span>
                  Open GitHub Config
                </Link>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <h3 className="font-label-md text-label-md uppercase text-on-surface-variant mb-3">Review Rules</h3>
                <div className="space-y-3">
                  {ruleItems.map(([field, label]) => (
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
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={cancelConfigEdit}
                    disabled={configSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!canDecide || configSaving || configLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {configSaving ? 'Saving...' : canDecide ? 'Save Configuration' : 'Leader Only'}
                  </button>
                </div>
                {configSuccess && (
                  <div className="mt-3 rounded-lg border border-[#16a34a]/30 bg-[#dcfce7] px-3 py-2 text-sm font-semibold text-[#166534]">
                    {configSuccess}
                  </div>
                )}
              </div>
            </form>
          )}
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ['Pending Reviews', dashboard?.pendingReviews ?? reviewQueue.length],
            ['Done Without Evidence', dashboard?.doneWithoutEvidence ?? 0],
            ['CI Failed', dashboard?.tasksWithCiFailed ?? 0],
            ['Tasks Without PR', dashboard?.tasksWithoutPullRequest ?? 0],
            ['Evidence Coverage', `${dashboard?.evidenceCoveragePercent ?? 0}%`],
            ['Members Tracked', dashboard?.memberEvidenceQuality?.length ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
              <span className="font-label-md text-label-md uppercase text-on-surface-variant">{label}</span>
              <div className="text-3xl font-bold text-on-surface mt-2">{value}</div>
            </div>
          ))}
        </section>

        {dashboard?.evidenceCoveragePercent < 50 && (
          <div className="rounded-lg border border-[#f59e0b]/30 bg-[#fef3c7] px-4 py-3 text-[#92400e]">
            Evidence coverage is low. Some dashboard numbers may be incomplete until commits, PRs, and CI are linked.
          </div>
        )}

        {(dashboard?.memberEvidenceQuality || []).length > 0 && (
          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest overflow-hidden">
            <div className="border-b border-outline-variant px-5 py-4">
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Member Evidence Quality</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low text-on-surface-variant">
                  <tr>
                    <th className="px-5 py-3 font-label-md text-label-md uppercase">Member</th>
                    <th className="px-5 py-3 font-label-md text-label-md uppercase">Tasks</th>
                    <th className="px-5 py-3 font-label-md text-label-md uppercase">With Evidence</th>
                    <th className="px-5 py-3 font-label-md text-label-md uppercase">Risky</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {dashboard.memberEvidenceQuality.map((member) => (
                    <tr key={member.memberId}>
                      <td className="px-5 py-3 font-semibold text-on-surface">{member.memberName}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{member.taskCount}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{member.tasksWithCodeEvidence}</td>
                      <td className="px-5 py-3 text-on-surface-variant">{member.riskyTasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
              {reviewQueue.map((item) => {
                const evidence = item.task?.evidenceSummary || {}
                const warnings = evidence.warnings || []
                const positiveSignals = evidence.positiveSignals || []
                return (
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
                      <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 font-label-md text-label-md uppercase ${scoreToneClass(evidence.riskLevel)}`}>
                        <span className="material-symbols-outlined text-[14px]">analytics</span>
                        {evidence.score ?? 0}/100 {evidence.riskLevel || 'READY'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-on-surface truncate">{item.task?.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1">
                      Assignee: {item.task?.assigneeName || 'Unassigned'}
                      {item.reviewer?.name ? ` | Requested by: ${item.reviewer.name}` : ''}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-1 font-semibold text-on-surface-variant">
                        {evidenceModeLabel(evidence.evidenceMode)}
                      </span>
                      <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-1 font-semibold text-on-surface-variant">
                        Checklist {evidence.checklistDone ?? 0}/{evidence.checklistTotal ?? 0}
                      </span>
                      <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-1 font-semibold text-on-surface-variant">
                        Subtasks {evidence.subtaskDone ?? 0}/{evidence.subtaskTotal ?? 0}
                      </span>
                      <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-1 font-semibold text-on-surface-variant">
                        PR {evidence.pullRequestCount ?? 0}
                      </span>
                      <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-1 font-semibold text-on-surface-variant">
                        Commits {evidence.commitCount ?? 0}
                      </span>
                      <span className="rounded border border-outline-variant bg-surface-container-low px-2 py-1 font-semibold text-on-surface-variant">
                        CI {evidence.ciStatus || 'NO_CI'}
                      </span>
                    </div>
                    {(warnings.length > 0 || positiveSignals.length > 0) && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {warnings.length > 0 && (
                          <div className="rounded-lg border border-error/20 bg-error-container/30 px-3 py-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-error">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              Review Warnings
                            </div>
                            <ul className="mt-1 space-y-1 text-sm text-error">
                              {warnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {positiveSignals.length > 0 && (
                          <div className="rounded-lg border border-[#16a34a]/20 bg-[#dcfce7]/40 px-3 py-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-[#166534]">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              Positive Signals
                            </div>
                            <ul className="mt-1 space-y-1 text-sm text-[#166534]">
                              {positiveSignals.map((signal) => (
                                <li key={signal}>{signal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    {item.reason && (
                      <p className="text-sm text-on-surface mt-2 rounded bg-surface-container-low px-3 py-2">
                        {item.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEvidenceDrawer(item.task?.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[18px]">fact_check</span>
                      View Evidence
                    </button>
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
                )
              })}
            </div>
          )}
        </section>
      </div>
      {(selectedEvidence || evidenceLoading || evidenceError) && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/35"
          onClick={closeEvidenceDrawer}
          role="presentation"
        >
          <aside
            className="h-full w-full max-w-[640px] overflow-y-auto border-l border-outline-variant bg-surface-container-lowest shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-outline-variant bg-surface-container-lowest px-6 py-5">
              <div>
                <p className="font-label-md text-label-md uppercase text-primary">Review Evidence</p>
                <h2 className="mt-1 text-xl font-bold text-on-surface">
                  {selectedEvidence?.task?.title || 'Loading evidence...'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEvidenceDrawer}
                className="rounded-lg border border-outline-variant bg-surface p-2 text-on-surface hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {evidenceLoading && (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-5 text-on-surface-variant">
                  Loading linked GitHub evidence...
                </div>
              )}
              {evidenceError && (
                <div className="rounded-lg border border-error/30 bg-error-container/40 p-4 text-error">
                  {evidenceError}
                </div>
              )}
              {selectedEvidence && (
                <>
                  <section className="grid grid-cols-2 gap-3">
                    {[
                      ['Score', `${selectedEvidence.scoreSummary?.score ?? 0}/100`],
                      ['Risk', selectedEvidence.scoreSummary?.riskLevel || 'READY'],
                      ['PRs', selectedEvidence.pullRequests?.length ?? 0],
                      ['Commits', selectedEvidence.commits?.length ?? 0],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                        <span className="font-label-md text-label-md uppercase text-on-surface-variant">{label}</span>
                        <div className="mt-2 text-lg font-bold text-on-surface">{value}</div>
                      </div>
                    ))}
                  </section>

                  <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">GitHub Issue</h3>
                    {selectedEvidence.githubIssue ? (
                      <a
                        href={selectedEvidence.githubIssue.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                      >
                        <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        Issue #{selectedEvidence.githubIssue.number || 'linked'}
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-on-surface-variant">No linked GitHub issue.</p>
                    )}
                  </section>

                  <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">Pull Requests</h3>
                    {(selectedEvidence.pullRequests || []).length === 0 ? (
                      <p className="mt-2 text-sm text-on-surface-variant">No linked pull request evidence.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {selectedEvidence.pullRequests.map((pr) => (
                          <div key={pr.id} className="rounded-lg border border-outline-variant bg-surface p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-on-surface">#{pr.prNumber} {pr.title || 'Untitled PR'}</p>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                  {pr.state || 'unknown'} {pr.draft ? '| draft' : ''} {pr.mergedAt ? `| merged ${formatDateTime(pr.mergedAt)}` : ''}
                                </p>
                              </div>
                              {pr.url && (
                                <a href={pr.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                  Open
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">Commits</h3>
                    {(selectedEvidence.commits || []).length === 0 ? (
                      <p className="mt-2 text-sm text-on-surface-variant">No linked commit evidence.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {selectedEvidence.commits.map((commit) => (
                          <div key={commit.id} className="rounded-lg border border-outline-variant bg-surface p-3">
                            <p className="font-semibold text-on-surface">{shortSha(commit.sha)} - {commit.message || 'No message'}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {commit.authorName || commit.authorEmail || commit.authorLogin || 'Unknown author'} | {formatDateTime(commit.committedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">CI / Checks</h3>
                    {(selectedEvidence.checkRuns || []).length === 0 ? (
                      <p className="mt-2 text-sm text-on-surface-variant">No linked CI/check evidence.</p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {selectedEvidence.checkRuns.map((check) => (
                          <div key={check.id} className="rounded-lg border border-outline-variant bg-surface p-3">
                            <p className="font-semibold text-on-surface">{check.name || check.eventType || 'Check run'}</p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {check.status || 'unknown'} / {check.conclusion || 'pending'} | {shortSha(check.sha)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">Changed Files</h3>
                      <button
                        type="button"
                        onClick={fetchChangedFiles}
                        disabled={changedFilesLoading || (selectedEvidence.pullRequests || []).length === 0}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-3 py-1.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[17px]">download</span>
                        {changedFilesLoading ? 'Loading...' : 'Load Changed Files'}
                      </button>
                    </div>
                    {(selectedEvidence.changedFiles || []).length === 0 ? (
                      <p className="mt-2 text-sm text-on-surface-variant">
                        No changed-file metadata loaded yet.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {selectedEvidence.changedFiles.map((file) => (
                          <div key={file.id} className="rounded-lg border border-outline-variant bg-surface p-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="break-all font-semibold text-on-surface">{file.filePath}</p>
                                <p className="mt-1 text-xs text-on-surface-variant">
                                  {file.status || 'modified'} | +{file.additions} / -{file.deletions} | {file.changes} changes
                                </p>
                              </div>
                              <span className="font-label-md text-label-md rounded bg-surface-container-high px-2 py-1 text-on-surface-variant">
                                {file.patchHash ? 'Patch cached' : 'No patch'}
                              </span>
                            </div>
                            {file.patchSummary && (
                              <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">
                                {file.patchSummary}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">AI Review</h3>
                      <button
                        type="button"
                        onClick={runAiReview}
                        disabled={aiReviewLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[17px]">smart_toy</span>
                        {aiReviewLoading ? 'Reviewing...' : 'AI Review'}
                      </button>
                    </div>
                    {selectedEvidence.aiReview ? (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-lg border border-outline-variant bg-surface p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-label-md text-label-md rounded bg-primary-fixed px-2 py-1 text-primary">
                              {selectedEvidence.aiReview.recommendation}
                            </span>
                            <span className="font-label-md text-label-md rounded bg-surface-container-high px-2 py-1 text-on-surface-variant">
                              Confidence {selectedEvidence.aiReview.confidence}%
                            </span>
                            <span className="font-label-md text-label-md rounded bg-surface-container-high px-2 py-1 text-on-surface-variant">
                              Adjustment {selectedEvidence.aiReview.scoreAdjustment > 0 ? '+' : ''}{selectedEvidence.aiReview.scoreAdjustment}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-on-surface-variant">{selectedEvidence.aiReview.summary}</p>
                        </div>
                        {(selectedEvidence.aiReview.risks || []).length > 0 && (
                          <div className="rounded-lg border border-error/20 bg-error-container/30 p-3">
                            <p className="font-label-md text-label-md uppercase text-error">Risks</p>
                            <ul className="mt-2 space-y-1 text-sm text-error">
                              {selectedEvidence.aiReview.risks.map((risk) => <li key={risk}>{risk}</li>)}
                            </ul>
                          </div>
                        )}
                        {(selectedEvidence.aiReview.reviewQuestions || []).length > 0 && (
                          <div className="rounded-lg border border-outline-variant bg-surface p-3">
                            <p className="font-label-md text-label-md uppercase text-on-surface-variant">Questions For Leader</p>
                            <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                              {selectedEvidence.aiReview.reviewQuestions.map((question) => <li key={question}>{question}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-on-surface-variant">
                        No AI review has been created for this task yet.
                      </p>
                    )}
                  </section>

                  <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                    <h3 className="font-label-md text-label-md uppercase text-on-surface-variant">Score Breakdown</h3>
                    {(selectedEvidence.scoreSummary?.scoreBreakdown || []).length === 0 ? (
                      <p className="mt-2 text-sm text-on-surface-variant">No score penalties recorded.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-sm text-on-surface-variant">
                        {selectedEvidence.scoreSummary.scoreBreakdown.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default CodeInsightPage
