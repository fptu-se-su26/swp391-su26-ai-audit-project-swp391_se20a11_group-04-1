import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import weeklyReportService from '../services/weeklyReportService'

const numberFormatter = new Intl.NumberFormat('en-US')

const formatDate = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(new Date(`${value}T00:00:00`))
}

const formatDateTime = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

const formatSchedulerTime = (value) => {
  if (!value) return 'Not run'
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

const getWeekLabel = (report) => {
  if (!report) return 'No report'
  return `${formatDate(report.reportWeekStart)} - ${formatDate(report.reportWeekEnd)}`
}

const MetricCard = ({ icon, label, value, hint, tone, active = false, onClick }) => {
  const tones = {
    progress: 'border-blue-200 bg-blue-50 text-blue-700',
    overdue: 'border-red-200 bg-red-50 text-red-700',
    test: 'border-amber-200 bg-amber-50 text-amber-700',
    evidence: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[120px] rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'ring-2 ring-primary ring-offset-2' : ''
      } ${tones[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase leading-none">
          {label}
          <span className="material-symbols-outlined text-[14px]">touch_app</span>
        </span>
      </div>
      <p className="mt-4 text-4xl font-black leading-none tracking-normal">{value}</p>
      <p className="mt-2 text-xs font-bold leading-snug opacity-80">{hint}</p>
    </button>
  )
}

const StatusDot = ({ color = 'bg-slate-400' }) => <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />

const SlaBadge = ({ flag }) => {
  const tone = {
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[flag.tone] || 'bg-surface-container-low text-on-surface-variant border-outline-variant'

  const dot = {
    danger: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
  }[flag.tone] || 'bg-slate-400'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-black leading-none ${tone}`}>
      <StatusDot color={dot} />
      {flag.label}
    </span>
  )
}

const MiniChip = ({ label, value }) => (
  <span className="inline-flex min-h-8 items-center gap-2 rounded-lg border border-outline-variant/70 bg-surface-container-lowest px-3 text-xs font-bold text-on-surface-variant">
    <span className="font-black text-on-surface">{value}</span>
    {label}
  </span>
)

const buildSummaryText = (report, activeProject) => {
  if (!report) return 'Generate a weekly report to see project health, SLA pressure, member risk, and scheduler activity.'
  if (report.summary) return report.summary
  if ((report.redMemberCount || 0) === 0) {
    return `${activeProject?.title || report.projectName || 'Project'} is stable this week. No red-alert members were detected.`
  }
  return `${activeProject?.title || report.projectName || 'Project'} has ${report.redMemberCount} red-alert member(s), ${report.totalOverdueTasks} overdue task(s), and ${report.totalPenalizedTasks} penalized task(s).`
}

const schedulerName = {
  TASK_SLA_SCAN: 'SLA Scan',
  DAILY_DIGEST_BUILD: 'Digest Build',
  DAILY_DIGEST_SEND: 'Digest Send',
  WEEKLY_REPORT_GENERATE: 'Weekly Report',
  OUTBOX_PUBLISH: 'Outbox Publish',
}

const schedulerAccent = {
  TASK_SLA_SCAN: 'border-l-blue-500 bg-blue-50/60',
  DAILY_DIGEST_BUILD: 'border-l-amber-500 bg-amber-50/60',
  DAILY_DIGEST_SEND: 'border-l-emerald-500 bg-emerald-50/60',
  WEEKLY_REPORT_GENERATE: 'border-l-violet-500 bg-violet-50/60',
  OUTBOX_PUBLISH: 'border-l-sky-500 bg-sky-50/60',
}

const schedulerItems = (run) => Math.max(run?.totalScanned || 0, run?.totalCreated || 0, run?.totalSent || 0)

const schedulerTone = (status) => {
  if (status === 'SUCCESS') return 'bg-emerald-50 text-emerald-700'
  if (status === 'FAILED') return 'bg-red-50 text-red-700'
  if (status === 'RUNNING') return 'bg-blue-50 text-blue-700'
  return 'bg-surface-container-low text-on-surface-variant'
}

const eventTone = (status) => {
  if (status === 'PUBLISHED' || status === 'SUCCESS') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'FAILED') return 'bg-red-50 text-red-700 border-red-200'
  if (status === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-surface-container-low text-on-surface-variant border-outline-variant'
}

const schedulerEventTypes = {
  DAILY_DIGEST_BUILD: ['DAILY_DIGEST_BUILT'],
  DAILY_DIGEST_SEND: ['EMAIL_DAILY_DIGEST_SENT'],
  WEEKLY_REPORT_GENERATE: ['WEEKLY_REPORT_GENERATED'],
  OUTBOX_PUBLISH: ['TASK_PENALTY_APPLIED', 'WEEKLY_REPORT_GENERATED', 'EMAIL_DAILY_DIGEST_SENT', 'EVIDENCE_REVIEW_REQUIRED'],
}

const schedulerDetailIntro = {
  TASK_SLA_SCAN: 'This run scans tasks for overdue, due-soon, missing-evidence, and penalty risks.',
  DAILY_DIGEST_BUILD: 'This run groups risky tasks into the daily reminder list.',
  DAILY_DIGEST_SEND: 'This run sends reminder emails to the related members.',
  WEEKLY_REPORT_GENERATE: 'This run generates the weekly report for leader and mentor review.',
  OUTBOX_PUBLISH: 'This run publishes queued notifications such as emails, penalty alerts, evidence reviews, and reports.',
}

const primarySchedulerStat = (job) => {
  if (job?.totalSent > 0) return ['Sent', job.totalSent]
  if (job?.totalCreated > 0) return ['Created', job.totalCreated]
  return ['Scanned', job?.totalScanned || 0]
}

const metricDetails = {
  all: 'Showing every task-level SLA issue returned by backend.',
  progress: 'Progress is based on done tasks over total project tasks. The issue list shows all open SLA risks affecting progress.',
  overdue: 'Overdue shows tasks past deadline. This filter includes recently overdue and frozen tasks.',
  test: 'Test rate is calculated from passed test cases over all test cases. No task filter is applied because test cases are a separate dataset.',
  evidence: 'Evidence rate is calculated from accepted evidence over all uploaded evidence. This filter shows tasks missing accepted evidence.',
}

const categoryLabel = {
  DUE_SOON: 'DUE 24h',
  OVERDUE_SHORT: 'OVERDUE',
  OVERDUE_PENALTY: 'PENALTY',
  OVERDUE_FROZEN: 'FROZEN',
  BLOCKED: 'BLOCKED',
  MISSING_EVIDENCE: 'MISSING EV.',
}

const categoryTone = (category) => {
  if (category === 'OVERDUE_FROZEN' || category === 'OVERDUE_PENALTY') return 'bg-red-50 text-red-700 border-red-200'
  if (category === 'DUE_SOON' || category === 'MISSING_EVIDENCE') return 'bg-amber-50 text-amber-700 border-amber-200'
  if (category === 'BLOCKED') return 'bg-blue-50 text-blue-700 border-blue-200'
  return 'bg-surface-container-low text-on-surface-variant border-outline-variant'
}

const flagToCategory = (flag) => {
  if (!flag?.label) return null
  if (flag.label.startsWith('FROZEN')) return 'OVERDUE_FROZEN'
  if (flag.label.startsWith('PENALTY')) return 'OVERDUE_PENALTY'
  if (flag.label.startsWith('MISSING')) return 'MISSING_EVIDENCE'
  if (flag.label.startsWith('DUE')) return 'DUE_SOON'
  return null
}

export function WeeklyReportPage() {
  const activeProject = useProjectStore((state) => state.activeProject)
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [activeTab, setActiveTab] = useState('this')
  const [expandedMemberId, setExpandedMemberId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [slaDashboard, setSlaDashboard] = useState(null)
  const [schedulerRuns, setSchedulerRuns] = useState([])
  const [outboxSummary, setOutboxSummary] = useState(null)
  const [issueFilter, setIssueFilter] = useState({ type: 'all' })
  const [selectedScheduler, setSelectedScheduler] = useState(null)
  const [schedulerTab, setSchedulerTab] = useState('emails')
  const [schedulerEmails, setSchedulerEmails] = useState([])
  const [schedulerEvents, setSchedulerEvents] = useState([])
  const [schedulerDetailLoading, setSchedulerDetailLoading] = useState(false)

  const refreshLiveData = useCallback(async () => {
    if (!activeProject?.id) return
    const [dashboard, runs, outbox] = await Promise.all([
      weeklyReportService.getProjectSlaDashboard(activeProject.id),
      weeklyReportService.getLatestSchedulerRuns(),
      weeklyReportService.getOutboxSummary(),
    ])
    setSlaDashboard(dashboard || null)
    setSchedulerRuns(runs || [])
    setOutboxSummary(outbox || null)
  }, [activeProject?.id])

  const loadReports = useCallback(async () => {
    if (!activeProject?.id) return
    setLoading(true)
    try {
      const [items] = await Promise.all([
        weeklyReportService.getProjectReports(activeProject.id),
        refreshLiveData(),
      ])
      setReports(items || [])
      if (items?.length > 0) {
        const first = await weeklyReportService.getProjectReport(activeProject.id, items[0].id)
        setSelectedReport(first)
        setActiveTab('this')
      } else {
        setSelectedReport(null)
      }
    } catch (err) {
      console.error('Error loading weekly reports:', err)
      toast.error(err.response?.data?.message || 'Unable to load weekly reports')
    } finally {
      setLoading(false)
    }
  }, [activeProject?.id, refreshLiveData])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  useEffect(() => {
    if (!selectedScheduler?.jobName) return
    let active = true
    setSchedulerDetailLoading(true)
    Promise.all([
      weeklyReportService.getSchedulerRunEmails(selectedScheduler.jobName),
      weeklyReportService.getSchedulerRunEvents(selectedScheduler.jobName),
    ])
      .then(([emails, events]) => {
        if (!active) return
        setSchedulerEmails(emails || [])
        setSchedulerEvents(events || [])
      })
      .catch((err) => {
        console.error('Error loading scheduler detail:', err)
        if (active) {
          setSchedulerEmails([])
          setSchedulerEvents([])
        }
      })
      .finally(() => {
        if (active) setSchedulerDetailLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedScheduler?.jobName])

  const tabReports = useMemo(() => ({
    this: reports[0] || null,
    last: reports[1] || null,
  }), [reports])

  const selectReport = async (report) => {
    if (!activeProject?.id || !report?.id || selectedReport?.id === report.id) return
    setDetailLoading(true)
    setExpandedMemberId(null)
    try {
      const detail = await weeklyReportService.getProjectReport(activeProject.id, report.id)
      setSelectedReport(detail)
    } catch (err) {
      console.error('Error loading weekly report detail:', err)
      toast.error(err.response?.data?.message || 'Unable to load report detail')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    selectReport(tabReports[tab])
  }

  const handleGenerate = async () => {
    if (!activeProject?.id) return
    setGenerating(true)
    try {
      const report = await weeklyReportService.generateProjectReport(activeProject.id)
      setSelectedReport(report)
      setReports((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== report.id)
        return [report, ...withoutDuplicate].sort((a, b) => `${b.reportWeekStart}`.localeCompare(`${a.reportWeekStart}`))
      })
      setActiveTab('this')
      await refreshLiveData()
      toast.success('Weekly report generated')
    } catch (err) {
      console.error('Error generating weekly report:', err)
      toast.error(err.response?.data?.message || 'Unable to generate weekly report')
    } finally {
      setGenerating(false)
    }
  }

  const members = selectedReport?.members || []
  const violations = slaDashboard?.violations || []
  const progress = slaDashboard?.progressPercent || 0
  const testRate = slaDashboard?.testRatePercent || 0
  const evidenceRate = slaDashboard?.evidenceRatePercent || 0
  const flags = slaDashboard?.flags || []
  const overdueCount = slaDashboard?.overdueCount ?? selectedReport?.totalOverdueTasks ?? 0
  const outboxPending = outboxSummary?.pendingCount || 0
  const outboxEvents = outboxSummary?.recentEvents || []
  const selectedEventTypes = schedulerEventTypes[selectedScheduler?.jobName] || []
  const selectedSchedulerEvents = selectedEventTypes.length > 0
    ? outboxEvents.filter((event) => selectedEventTypes.includes(event.eventType))
    : []
  const filteredViolations = violations.filter((violation) => {
    if (issueFilter.type === 'member') return violation.assigneeId === issueFilter.memberId
    if (issueFilter.type === 'category') return violation.categories?.includes(issueFilter.category)
    if (issueFilter.type === 'categories') return issueFilter.categories?.some((category) => violation.categories?.includes(category))
    return true
  })
  const filterLabel = issueFilter.type === 'member'
    ? `Member: ${issueFilter.label}`
    : issueFilter.type === 'category'
      ? `Flag: ${categoryLabel[issueFilter.category] || issueFilter.category}`
      : issueFilter.type === 'categories'
        ? issueFilter.label
        : issueFilter.type === 'metric'
          ? issueFilter.label
          : 'All issues'
  const insightText = metricDetails[issueFilter.metric || issueFilter.type] || metricDetails.all

  if (!activeProject) {
    return (
      <main className="flex flex-1 items-center justify-center bg-background p-6" lang="en">
        <div className="w-full max-w-md rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-8 text-center shadow-lg">
          <span className="material-symbols-outlined text-5xl text-primary">folder_open</span>
          <h3 className="mt-4 text-xl font-extrabold text-on-surface">No project selected</h3>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">Return to Dashboard and select a project to view weekly reports.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-4 text-on-surface sm:p-6 md:p-8" lang="en">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="inline-flex max-w-full rounded-md bg-primary-fixed px-2.5 py-1 text-[10px] font-black uppercase tracking-normal text-on-primary-fixed">
              {activeProject.title}
            </span>
            <h1 className="mt-3 flex items-center gap-2 text-2xl font-black tracking-normal text-on-surface md:text-3xl">
              <span className="material-symbols-outlined text-3xl text-primary">assessment</span>
              Report
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadReports}
              disabled={loading || generating}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-60"
              title="Refresh"
            >
              <span className={`material-symbols-outlined text-[19px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-black text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[18px] ${generating ? 'animate-spin' : ''}`}>
                {generating ? 'progress_activity' : 'add_chart'}
              </span>
              Generate
              <span className="material-symbols-outlined text-[17px]">north_east</span>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon="trending_up"
            label="Progress"
            value={`${progress}%`}
            hint="Click to show all risks"
            tone="progress"
            active={issueFilter.metric === 'progress'}
            onClick={() => setIssueFilter({ type: 'metric', metric: 'progress', label: 'Progress risks' })}
          />
          <MetricCard
            icon="event_busy"
            label="Overdue"
            value={numberFormatter.format(overdueCount)}
            hint="Click to show overdue tasks"
            tone="overdue"
            active={issueFilter.metric === 'overdue'}
            onClick={() => setIssueFilter({
              type: 'categories',
              metric: 'overdue',
              label: 'Overdue issues',
              categories: ['OVERDUE_SHORT', 'OVERDUE_FROZEN'],
            })}
          />
          <MetricCard
            icon="fact_check"
            label="Test rate"
            value={`${testRate}%`}
            hint="Click for test context"
            tone="test"
            active={issueFilter.metric === 'test'}
            onClick={() => setIssueFilter({ type: 'metric', metric: 'test', label: 'Test rate context' })}
          />
          <MetricCard
            icon="verified"
            label="Evidence"
            value={`${evidenceRate}%`}
            hint="Click to show missing proof"
            tone="evidence"
            active={issueFilter.metric === 'evidence'}
            onClick={() => setIssueFilter({ type: 'category', metric: 'evidence', category: 'MISSING_EVIDENCE', label: 'Missing evidence' })}
          />
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="space-y-5">
            <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
              <div className="flex flex-col gap-3 border-b border-outline-variant/60 p-4 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex w-full rounded-lg bg-surface-container-low p-1 md:w-auto">
                  {[
                    ['this', 'This week'],
                    ['last', 'Last week'],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTabChange(key)}
                      disabled={!tabReports[key]}
                      className={`min-h-9 flex-1 rounded-md px-4 text-sm font-black transition-colors md:flex-none ${
                        activeTab === key
                          ? 'bg-surface-container-lowest text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface disabled:opacity-40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-on-surface-variant">{getWeekLabel(selectedReport)}</span>
              </div>

              {detailLoading ? (
                <div className="p-10 text-center">
                  <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
                  <p className="mt-3 text-sm font-bold text-on-surface-variant">Loading report...</p>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  <p className="max-w-4xl text-sm leading-6 text-on-surface">
                    {buildSummaryText(selectedReport, activeProject)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <MiniChip label="red" value={selectedReport?.redMemberCount || 0} />
                    <MiniChip label="overdue" value={selectedReport?.totalOverdueTasks || 0} />
                    <MiniChip label="penalty" value={selectedReport?.totalPenalizedTasks || 0} />
                    <MiniChip label="generated" value={formatDateTime(selectedReport?.generatedAt)} />
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant/60 p-4">
                <div>
                  <h2 className="text-base font-black">Member status</h2>
                  <p className="text-xs font-bold text-on-surface-variant">Click a member to inspect exact task issues.</p>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black text-red-700">{members.length} red</span>
              </div>

              {members.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-5xl text-emerald-600">verified</span>
                  <p className="mt-3 text-sm font-black text-emerald-700">No red-alert members</p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/60">
                  {members.map((member) => {
                    const expanded = expandedMemberId === member.userId
                    const memberIssues = violations.filter((violation) => violation.assigneeId === member.userId)
                    return (
                      <article key={member.userId} className="p-4">
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedMemberId(expanded ? null : member.userId)
                            setIssueFilter({ type: 'member', memberId: member.userId, label: member.name || 'Unnamed member' })
                          }}
                          className="flex w-full items-center justify-between gap-3 text-left"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-sm font-black text-red-700">
                              {(member.name || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-on-surface">{member.name || 'Unnamed member'}</p>
                              <p className="truncate text-xs font-bold text-on-surface-variant">{member.email || '-'}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <SlaBadge flag={{ label: member.riskLevel || 'RED', tone: 'danger' }} />
                            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                              {expanded ? 'expand_less' : 'expand_more'}
                            </span>
                          </div>
                        </button>

                        {expanded && (
                          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                              <MiniChip label="overdue" value={member.overdueTaskCount || 0} />
                              <MiniChip label="penalty" value={member.penalizedTaskCount || 0} />
                              <MiniChip label="commits" value={Math.max(0, 8 - (member.staleExplanationCount || 0) * 2)} />
                              <MiniChip label="frozen" value={member.frozenTaskCount || 0} />
                            </div>
                            <p className="mt-3 text-xs font-black uppercase text-red-700">Reason</p>
                            <p className="mt-1 text-sm leading-6 text-red-900">{member.reason || 'Red-alert because overdue, penalty, or stale explanation thresholds were reached.'}</p>
                            <div className="mt-4 space-y-2">
                              <p className="text-xs font-black uppercase text-red-700">Task issues</p>
                              {memberIssues.length > 0 ? memberIssues.slice(0, 3).map((issue) => (
                                <Link
                                  key={issue.taskId}
                                  to={`/projects/${activeProject.id}/tasks/${issue.taskId}`}
                                  className="block rounded-lg border border-red-200 bg-surface-container-lowest px-3 py-2 text-left hover:bg-red-100"
                                >
                                  <p className="truncate text-sm font-black text-on-surface">{issue.taskTitle}</p>
                                  <p className="mt-1 text-xs font-bold text-on-surface-variant">
                                    Deadline {formatDate(issue.deadline)} - updated {formatDateTime(issue.updatedAt)}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-red-900">{issue.reason}</p>
                                </Link>
                              )) : (
                                <p className="rounded-lg bg-surface-container-lowest px-3 py-2 text-xs font-bold text-red-800">
                                  No task-level issue returned for this member.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
              <div className="flex flex-col gap-3 border-b border-outline-variant/60 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-black">Issue drill-down</h2>
                  <p className="text-xs font-bold text-on-surface-variant">{filterLabel} - {filteredViolations.length} task(s)</p>
                  <p className="mt-1 text-xs leading-5 text-on-surface-variant">{insightText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIssueFilter({ type: 'all' })}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-xs font-black text-on-surface hover:bg-surface-container-low"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                  All
                </button>
              </div>

              {filteredViolations.length === 0 ? (
                <div className="p-8 text-center">
                  <span className="material-symbols-outlined text-5xl text-emerald-600">task_alt</span>
                  <p className="mt-3 text-sm font-black text-emerald-700">No task issues in this filter</p>
                </div>
              ) : (
                <div className="divide-y divide-outline-variant/60">
                  {filteredViolations.map((issue) => (
                    <article key={issue.taskId} className="p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <Link
                            to={`/projects/${activeProject.id}/tasks/${issue.taskId}`}
                            className="text-sm font-black text-primary hover:underline"
                          >
                            {issue.taskTitle}
                          </Link>
                          <p className="mt-1 text-xs font-bold text-on-surface-variant">
                            {issue.assigneeName || 'Unassigned'} - {issue.status || '-'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(issue.categories || []).map((category) => (
                            <span key={category} className={`rounded-full border px-2 py-1 text-[10px] font-black ${categoryTone(category)}`}>
                              {categoryLabel[category] || category}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                        <MiniChip label="deadline" value={formatDate(issue.deadline)} />
                        <MiniChip label="updated" value={formatDateTime(issue.updatedAt)} />
                        <MiniChip label="overdue" value={`${issue.overdueDays || 0}d`} />
                        <MiniChip label="evidence" value={issue.hasAcceptedEvidence ? 'OK' : 'MISS'} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-on-surface">{issue.reason}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
              <h2 className="text-base font-black">SLA flags</h2>
              <p className="mt-1 text-xs font-bold text-on-surface-variant">Click a flag to filter issue list.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {flags.length > 0 ? flags.map((flag) => {
                  const category = flagToCategory(flag)
                  return (
                    <button
                      key={flag.label}
                      type="button"
                      onClick={() => category ? setIssueFilter({ type: 'category', category }) : setIssueFilter({ type: 'all' })}
                      className="rounded-full text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      title="Filter issue list"
                    >
                      <SlaBadge flag={flag} />
                    </button>
                  )
                }) : <SlaBadge flag={{ label: 'CLEAR', tone: 'success' }} />}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-sm">
              <div className="border-b border-outline-variant/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black">Scheduler</h2>
                    <p className="mt-1 text-xs font-bold text-on-surface-variant">Click a job to inspect emails and outbox events.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const outboxJob = schedulerRuns.find((job) => job.jobName === 'OUTBOX_PUBLISH')
                      if (outboxJob) setSelectedScheduler(outboxJob)
                      setSchedulerTab('events')
                    }}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black ${
                      outboxPending > 0
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    Outbox: {outboxPending} pending
                  </button>
                </div>
              </div>
              <div className="grid gap-3 p-4">
                {schedulerRuns.map((job) => {
                  const [statLabel, statValue] = primarySchedulerStat(job)
                  return (
                    <button
                      key={job.jobName}
                      type="button"
                      onClick={() => {
                        setSelectedScheduler(job)
                        setSchedulerTab(job.jobName === 'DAILY_DIGEST_SEND' ? 'emails' : 'events')
                      }}
                      className={`rounded-xl border border-l-4 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        schedulerAccent[job.jobName] || 'border-l-slate-400 bg-surface-container-lowest'
                      } ${selectedScheduler?.jobName === job.jobName ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black">{schedulerName[job.jobName] || job.jobName}</p>
                          <p className="mt-1 text-xs font-bold text-on-surface-variant">{formatSchedulerTime(job.finishedAt || job.startedAt)}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${schedulerTone(job.status)}`}>{job.status}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-2xl font-black leading-none text-on-surface">{statValue}</p>
                          <p className="mt-1 text-[10px] font-black uppercase text-on-surface-variant">{statLabel}</p>
                        </div>
                        <MiniChip label="created" value={job.totalCreated || 0} />
                        <MiniChip label="sent" value={job.totalSent || 0} />
                      </div>
                    </button>
                  )
                })}
                {schedulerRuns.length === 0 && (
                  <p className="p-4 text-center text-xs font-bold text-on-surface-variant">No scheduler runs yet.</p>
                )}
              </div>
              {selectedScheduler && (
                <div className="border-t border-outline-variant/60 bg-surface-container-low p-4">
                  <p className="text-xs font-black uppercase text-on-surface-variant">What did the system do?</p>
                  <p className="mt-1 text-sm font-black text-on-surface">{schedulerName[selectedScheduler.jobName] || selectedScheduler.jobName}</p>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                    {schedulerDetailIntro[selectedScheduler.jobName] || 'This run processed background system work.'}
                  </p>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-surface-container-lowest p-3"><p className="text-2xl font-black leading-none">{selectedScheduler.totalScanned || 0}</p><p className="mt-1 text-[10px] font-black uppercase text-on-surface-variant">Scanned</p></div>
                    <div className="rounded-xl bg-surface-container-lowest p-3"><p className="text-2xl font-black leading-none">{selectedScheduler.totalCreated || 0}</p><p className="mt-1 text-[10px] font-black uppercase text-on-surface-variant">Created</p></div>
                    <div className="rounded-xl bg-surface-container-lowest p-3"><p className="text-2xl font-black leading-none">{selectedScheduler.totalSent || 0}</p><p className="mt-1 text-[10px] font-black uppercase text-on-surface-variant">Sent</p></div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-outline-variant/50"><div className={`h-full rounded-full ${selectedScheduler.status === 'FAILED' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: selectedScheduler.finishedAt ? '100%' : '45%' }} /></div>
                    <div className="mt-2 flex justify-between gap-3 text-[11px] font-bold text-on-surface-variant"><span>Start {formatDateTime(selectedScheduler.startedAt)}</span><span>Finish {formatDateTime(selectedScheduler.finishedAt)}</span></div>
                  </div>

                  <div className="mt-4 inline-flex w-full rounded-lg bg-surface-container-lowest p-1">
                    {[
                      ['emails', `Emails sent (${schedulerEmails.length})`],
                      ['events', `Outbox events (${schedulerEvents.length})`],
                    ].map(([key, label]) => (
                      <button key={key} type="button" onClick={() => setSchedulerTab(key)} className={`min-h-9 flex-1 rounded-md px-3 text-xs font-black transition-colors ${schedulerTab === key ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>{label}</button>
                    ))}
                  </div>

                  {schedulerDetailLoading ? (
                    <p className="mt-3 rounded-lg bg-surface-container-lowest px-3 py-3 text-center text-xs font-bold text-on-surface-variant">Loading detail...</p>
                  ) : schedulerTab === 'emails' ? (
                    <div className="mt-3 space-y-2">
                      {schedulerEmails.map((email) => (
                        <article key={email.id} className="flex items-start gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-fixed text-xs font-black text-on-primary-fixed">{(email.recipientName || email.recipientEmail || '?').slice(0, 1).toUpperCase()}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-black">{email.recipientName || 'Unknown recipient'}</p><p className="truncate text-xs font-bold text-on-surface-variant">{email.recipientEmail}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${eventTone(email.status)}`}>{email.status}</span></div>
                            <p className="mt-2 text-xs font-bold text-on-surface">{email.subject}</p><p className="mt-1 text-[11px] font-semibold text-on-surface-variant">{formatDateTime(email.sentAt || email.createdAt)}</p>{email.errorMessage && <p className="mt-2 text-xs font-bold text-red-700">{email.errorMessage}</p>}
                          </div>
                        </article>
                      ))}
                      {schedulerEmails.length === 0 && <p className="rounded-lg bg-surface-container-lowest px-3 py-3 text-center text-xs font-bold text-on-surface-variant">No emails for the latest run of this job.</p>}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {schedulerEvents.map((event) => (
                        <article key={event.id} className="rounded-xl border border-outline-variant/70 bg-surface-container-lowest p-3">
                          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-black text-on-surface">{event.actionLabel || event.eventType}</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">{event.message}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${eventTone(event.status)}`}>{event.status || '-'}</span></div>
                          <div className="mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-2"><div className="rounded-lg bg-surface-container-low px-3 py-2"><p className="font-black text-on-surface-variant">Sent to</p><p className="mt-1 truncate font-bold text-on-surface">{event.recipientName || 'Project team'}</p>{event.recipientEmail && <p className="mt-0.5 truncate font-semibold text-on-surface-variant">{event.recipientEmail}</p>}</div><div className="rounded-lg bg-surface-container-low px-3 py-2"><p className="font-black text-on-surface-variant">Related item</p><p className="mt-1 truncate font-bold text-on-surface">{event.targetLabel || '-'}</p><p className="mt-0.5 font-semibold text-on-surface-variant">{formatDateTime(event.publishedAt || event.createdAt)}</p></div></div>
                        </article>
                      ))}
                      {schedulerEvents.length === 0 && <p className="rounded-lg bg-surface-container-lowest px-3 py-3 text-center text-xs font-bold text-on-surface-variant">No outbox events for the latest run of this job.</p>}
                    </div>
                  )}
                  {selectedScheduler.errorMessage && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{selectedScheduler.errorMessage}</p>}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm">
              <h2 className="text-base font-black">History</h2>
              <div className="mt-3 space-y-2">
                {reports.slice(0, 4).map((report) => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => selectReport(report)}
                    className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                      selectedReport?.id === report.id
                        ? 'border-primary bg-secondary-container text-on-secondary-container'
                        : 'border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low'
                    }`}
                  >
                    <span className="min-w-0 truncate text-xs font-black">{getWeekLabel(report)}</span>
                    <span className="shrink-0 text-[11px] font-bold">{report.redMemberCount || 0} red</span>
                  </button>
                ))}
                {!loading && reports.length === 0 && (
                  <p className="rounded-lg bg-surface-container-low p-3 text-center text-xs font-bold text-on-surface-variant">
                    No reports yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

export default WeeklyReportPage
