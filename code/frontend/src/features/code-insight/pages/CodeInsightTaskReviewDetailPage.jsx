import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import codeInsightService from '../services/codeInsightService'

const tabs = ['Overview', 'Evidence', 'Changed Files', 'AI Review', 'Manual Links', 'Decision History', 'Snapshots']

const formatDateTime = (value) => {
  if (!value) return 'Not available'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const statusTone = (value = 'READY') => {
  if (value === 'BLOCKED') return 'border-error/30 bg-error-container text-error'
  if (value === 'WARNING' || value === 'CAN_APPROVE_WITH_WARNING') return 'border-[#f59e0b]/30 bg-[#fef3c7] text-[#92400e]'
  return 'border-[#16a34a]/30 bg-[#dcfce7] text-[#166534]'
}

const confidenceTone = (value) => {
  if (value === 'STRONG') return 'border-[#16a34a]/30 bg-[#dcfce7] text-[#166534]'
  if (value === 'PARTIAL') return 'border-[#f59e0b]/30 bg-[#fef3c7] text-[#92400e]'
  if (value === 'WEAK') return 'border-error/20 bg-[#fef2f2] text-[#991b1b]'
  return 'border-outline-variant bg-[#f3f4f6] text-[#4b5563]'
}

const riskTone = (value, taskType) => {
  if (taskType && taskType !== 'DEVELOPMENT' && taskType !== 'BUG_FIX') {
    return 'border-outline-variant bg-[#f3f4f6] text-[#4b5563]'
  }
  if (value === 'LOW') return 'border-[#16a34a]/30 bg-[#dcfce7] text-[#166534]'
  if (value === 'MEDIUM') return 'border-[#f59e0b]/30 bg-[#fef3c7] text-[#92400e]'
  if (value === 'HIGH' || value === 'CRITICAL') return 'border-error/30 bg-[#fef2f2] text-[#991b1b]'
  return 'border-outline-variant bg-[#f3f4f6] text-[#4b5563]'
}

const isCodeTask = (taskType) => {
  return taskType === 'DEVELOPMENT' || taskType === 'BUG_FIX'
}

const Card = ({ title, children, action }) => (
  <section className="rounded-lg border border-outline-variant bg-surface-container-lowest">
    <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-5 py-4">
      <h2 className="font-label-md text-label-md uppercase text-on-surface-variant">{title}</h2>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </section>
)

const Empty = ({ children = 'No data available.' }) => (
  <p className="text-sm text-on-surface-variant">{children}</p>
)

const CodeInsightTaskReviewDetailPage = () => {
  const { projectId, taskId } = useParams()
  const [detail, setDetail] = useState(null)
  const [activeTab, setActiveTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDetail = async () => {
    setLoading(true)
    setError('')
    try {
      setDetail(await codeInsightService.getReviewDetail(projectId, taskId))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load review detail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetail()
  }, [projectId, taskId])

  const gateLabel = useMemo(() => {
    const status = detail?.approvalGate?.approvalStatus
    if (status === 'BLOCKED') return 'BLOCKED'
    if (status === 'CAN_APPROVE_WITH_WARNING') return 'WARNING'
    return 'READY'
  }, [detail])

  const evidence = detail?.evidence || {}
  const task = evidence.task || {}

  return (
    <div className="min-h-screen bg-surface-bright px-6 py-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link to={`/projects/${projectId}/code-insight`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Code Insight
            </Link>
            <p className="mt-4 font-label-md text-label-md uppercase text-primary">Review Detail</p>
            <h1 className="mt-1 font-headline-md text-headline-md text-on-surface">{task.title || `Task ${taskId}`}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">
              Task #{task.id || taskId} · {task.status || 'Unknown status'}
            </p>
          </div>
          <button
            type="button"
            onClick={loadDetail}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </header>

        {error && (
          <div className="rounded-lg border border-error/30 bg-error-container/40 px-4 py-3 text-error">{error}</div>
        )}

        {loading ? (
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-8 text-center text-on-surface-variant">
            Loading review detail...
          </div>
        ) : detail && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Pillar 1: Gate Result */}
              <div className={`rounded-lg border p-5 ${statusTone(detail.gateResult)}`}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">traffic</span>
                  <p className="font-label-md text-label-md uppercase font-bold">Gate Result</p>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {detail.gateResult === 'CAN_APPROVE' && 'READY'}
                  {detail.gateResult === 'CAN_APPROVE_WITH_WARNING' && 'WARNING'}
                  {detail.gateResult === 'BLOCKED' && 'BLOCKED'}
                  {!detail.gateResult && 'PENDING'}
                </p>
              </div>

              {/* Pillar 2: Evidence Confidence */}
              <div className={`rounded-lg border p-5 ${confidenceTone(detail.evidenceConfidence)}`}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">analytics</span>
                  <p className="font-label-md text-label-md uppercase font-bold">Evidence Confidence</p>
                </div>
                <p className="mt-2 text-2xl font-bold">{detail.evidenceConfidence || 'NONE'}</p>
              </div>

              {/* Pillar 3: Code Risk */}
              <div className={`rounded-lg border p-5 ${riskTone(detail.codeRiskLevel, task.type)}`}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px]">warning_amber</span>
                  <p className="font-label-md text-label-md uppercase font-bold">Code Risk</p>
                </div>
                <p className="mt-2 text-2xl font-bold">
                  {isCodeTask(task.type) ? (detail.codeRiskLevel || 'PENDING') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto rounded-lg border border-outline-variant bg-surface-container-lowest p-2">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`shrink-0 rounded px-3 py-2 text-sm font-semibold ${activeTab === tab ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Overview' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title="Task">
                  <dl className="space-y-3 text-sm">
                    <div><dt className="font-semibold text-on-surface">Assignee</dt><dd className="text-on-surface-variant">{task.assigneeName || 'Unassigned'}</dd></div>
                    <div><dt className="font-semibold text-on-surface">Requirement</dt><dd className="text-on-surface-variant">{task.requirementCode || 'No requirement'}</dd></div>
                    <div><dt className="font-semibold text-on-surface">Priority</dt><dd className="text-on-surface-variant">{task.priority || 'MEDIUM'}</dd></div>
                  </dl>
                </Card>
                <Card title="Gate Checklist">
                  {detail.gateChecks && detail.gateChecks.length > 0 ? (
                    <div className="space-y-4">
                      {detail.gateChecks.map((check) => (
                        <div key={check.name} className="flex items-start gap-3 rounded border border-outline-variant p-3 bg-surface-container-lowest">
                          <div className="mt-0.5 shrink-0">
                            {check.status === 'PASS' && (
                              <span className="material-symbols-outlined text-green-600 font-bold text-[20px]">check_circle</span>
                            )}
                            {check.status === 'FAIL' && (
                              <span className="material-symbols-outlined text-red-600 font-bold text-[20px]">cancel</span>
                            )}
                            {check.status === 'WARNING' && (
                              <span className="material-symbols-outlined text-yellow-600 font-bold text-[20px]">warning</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-on-surface">{check.name}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{check.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty>No gate checklist rules evaluated.</Empty>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'Evidence' && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card title="GitHub Issue">
                  {evidence.githubIssue ? <a className="font-semibold text-primary hover:underline" href={evidence.githubIssue.url} target="_blank" rel="noreferrer">Issue #{evidence.githubIssue.number}</a> : <Empty>No linked GitHub issue.</Empty>}
                </Card>
                <Card title="Pull Requests">
                  {(evidence.pullRequests || []).length === 0 ? <Empty>No pull request evidence.</Empty> : (
                    <div className="space-y-3">{evidence.pullRequests.map((pr) => <div key={pr.id} className="rounded border border-outline-variant p-3"><p className="font-semibold">#{pr.prNumber} {pr.title}</p><p className="text-sm text-on-surface-variant">{pr.state} {pr.mergedAt ? `· merged ${formatDateTime(pr.mergedAt)}` : ''}</p></div>)}</div>
                  )}
                </Card>
                <Card title="Commits">
                  {(evidence.commits || []).length === 0 ? <Empty>No commit evidence.</Empty> : (
                    <div className="space-y-3">{evidence.commits.map((commit) => <div key={commit.id} className="rounded border border-outline-variant p-3"><p className="font-semibold">{commit.sha?.slice(0, 7)} - {commit.message}</p><p className="text-sm text-on-surface-variant">{formatDateTime(commit.committedAt)}</p></div>)}</div>
                  )}
                </Card>
                <Card title="CI / Checks">
                  {(evidence.checkRuns || []).length === 0 ? <Empty>No CI/check evidence.</Empty> : (
                    <div className="space-y-3">{evidence.checkRuns.map((check) => <div key={check.id} className="rounded border border-outline-variant p-3"><p className="font-semibold">{check.name || check.eventType}</p><p className="text-sm text-on-surface-variant">{check.status} / {check.conclusion || 'pending'} · {check.sha?.slice(0, 7)}</p></div>)}</div>
                  )}
                </Card>
              </div>
            )}

            {activeTab === 'Changed Files' && (
              <Card title="Changed Files">
                {(evidence.changedFiles || []).length === 0 ? <Empty>No changed-file metadata loaded.</Empty> : (
                  <div className="space-y-3">{evidence.changedFiles.map((file) => <div key={file.id} className="rounded border border-outline-variant p-3"><p className="break-all font-semibold">{file.filePath}</p><p className="text-sm text-on-surface-variant">{file.status} · +{file.additions || 0} / -{file.deletions || 0} · {file.patchHash ? 'Patch cached' : 'No patch'}</p>{file.patchSummary && <p className="mt-2 text-sm text-on-surface-variant">{file.patchSummary}</p>}</div>)}</div>
                )}
              </Card>
            )}

            {activeTab === 'AI Review' && (
              <Card title="AI Review">
                {evidence.aiReview ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded bg-primary-fixed px-2 py-1 font-label-md text-label-md text-primary">{evidence.aiReview.recommendation}</span>
                      <span className="rounded bg-surface-container-high px-2 py-1 font-label-md text-label-md text-on-surface-variant">{evidence.aiReview.provider} / {evidence.aiReview.model}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{evidence.aiReview.summary}</p>
                  </div>
                ) : <Empty>No AI review has been created.</Empty>}
              </Card>
            )}

            {activeTab === 'Manual Links' && (
              <Card title="Manual Evidence Links">
                {(detail.manualEvidenceLinks || []).length === 0 ? <Empty>No manual evidence links.</Empty> : (
                  <div className="space-y-3">{detail.manualEvidenceLinks.map((link) => <div key={link.id} className="rounded border border-outline-variant p-3"><p className="font-semibold">{link.evidenceType} #{link.evidenceId}</p><p className="text-sm text-on-surface-variant">{link.status} · suggested by {link.suggestedBy?.name || 'Unknown'}</p>{link.reason && <p className="mt-2 text-sm text-on-surface-variant">{link.reason}</p>}</div>)}</div>
                )}
              </Card>
            )}

            {activeTab === 'Decision History' && (
              <Card title="Decision History">
                {(detail.decisionHistory || []).length === 0 ? <Empty>No review decisions recorded.</Empty> : (
                  <div className="space-y-3">{detail.decisionHistory.map((decision) => <div key={decision.id} className="rounded border border-outline-variant p-3"><p className="font-semibold">{decision.decision} · {decision.fromStatus} → {decision.toStatus}</p><p className="text-sm text-on-surface-variant">{formatDateTime(decision.createdAt)}</p>{decision.reason && <p className="mt-2 text-sm text-on-surface-variant">{decision.reason}</p>}</div>)}</div>
                )}
              </Card>
            )}

            {activeTab === 'Snapshots' && (
              <Card title="Snapshots">
                {(detail.snapshots || []).length === 0 ? <Empty>No snapshots recorded.</Empty> : (
                  <div className="space-y-3">{detail.snapshots.map((snapshot) => <div key={snapshot.id} className="rounded border border-outline-variant p-3"><p className="font-semibold">Snapshot #{snapshot.id}</p><p className="text-sm text-on-surface-variant">{formatDateTime(snapshot.createdAt)}</p></div>)}</div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CodeInsightTaskReviewDetailPage
