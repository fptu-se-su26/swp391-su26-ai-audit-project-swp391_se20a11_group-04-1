import React, { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import { sprintService } from '@features/sprint/services/sprintService'
import analyticsService from '../services/analyticsService'
import MttrCard from '../components/MttrCard'
import AvailabilityGauge from '../components/AvailabilityGauge'
import ErrorBudgetBar from '../components/ErrorBudgetBar'
import ReliabilityTrendChart from '../components/ReliabilityTrendChart'

const ReliabilityScoreBadge = ({ score }) => {
  if (score == null) return null
  const s = parseFloat(score)
  const color = s >= 85 ? 'text-green-600 bg-green-50 border-green-200'
    : s >= 65 ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200'
  const label = s >= 85 ? 'Reliable' : s >= 65 ? 'At Risk' : 'Unreliable'
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${color}`}>
      <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
      {s.toFixed(1)} / 100 &bull; {label}
    </div>
  )
}

export default function ReliabilityDashboardPage() {
  const activeProject = useProjectStore((state) => state.activeProject)

  const [sprints, setSprints] = useState([])
  const [selectedSprintId, setSelectedSprintId] = useState(null)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sprintsLoading, setSprintsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Load sprint list
  useEffect(() => {
    if (!activeProject?.id) return
    setSprintsLoading(true)
    sprintService.getSprints(activeProject.id)
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setSprints(list)
        if (list.length) {
          const active = list.find((s) => s.status === 'ACTIVE')
          setSelectedSprintId(active?.id ?? list[0].id)
        }
      })
      .catch(() => toast.error('Could not load sprints'))
      .finally(() => setSprintsLoading(false))
  }, [activeProject?.id])

  const loadReport = useCallback(async (sprintId) => {
    if (!activeProject?.id || !sprintId) return
    setLoading(true)
    try {
      const data = await analyticsService.getReliabilityReport(activeProject.id, sprintId, false)
      setReport(data)
    } catch {
      toast.error('Could not load reliability report for this sprint')
      setReport(null)
    } finally {
      setLoading(false)
    }
  }, [activeProject?.id])

  useEffect(() => {
    if (selectedSprintId) loadReport(selectedSprintId)
  }, [selectedSprintId, loadReport])

  const [jobStatusLabel, setJobStatusLabel] = useState(null)
  const pollIntervalRef = React.useRef(null)

  const clearPoll = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  // Cleanup poll when unmounting or changing sprints
  useEffect(() => {
    return () => clearPoll()
  }, [selectedSprintId])

  const handleRefreshClick = async () => {
    if (!activeProject?.id || !selectedSprintId) return
    setRefreshing(true)
    setJobStatusLabel('Queued...')
    try {
      const job = await analyticsService.createAnalysisJob(activeProject.id, selectedSprintId)
      
      clearPoll() // clear any existing poll
      
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusData = await analyticsService.getAnalysisJob(activeProject.id, selectedSprintId, job.id)
          
          if (statusData.status === 'RUNNING') {
             setJobStatusLabel('Computing...')
          } else if (statusData.status === 'DONE') {
             clearPoll()
             setReport(statusData.report)
             setJobStatusLabel(null)
             setRefreshing(false)
             toast.success('Reliability report computed successfully')
          } else if (statusData.status === 'FAILED') {
             clearPoll()
             setJobStatusLabel(null)
             setRefreshing(false)
             toast.error(statusData.errorMessage || 'Compute failed')
          } else {
             setJobStatusLabel('Queued...')
          }
        } catch (err) {
          clearPoll()
          setJobStatusLabel(null)
          setRefreshing(false)
          toast.error('Failed to get job status')
        }
      }, 2500)
      
    } catch (err) {
      setRefreshing(false)
      setJobStatusLabel(null)
      toast.error('Could not queue analysis job')
    }
  }

  const selectedSprint = sprints.find((s) => s.id === selectedSprintId)
  const isLoading = loading || sprintsLoading

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">monitor_heart</span>
            Reliability Dashboard
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            MTTR · Availability · Error Budget · Trend Analysis
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sprint selector */}
          <select
            value={selectedSprintId ?? ''}
            onChange={(e) => setSelectedSprintId(Number(e.target.value))}
            disabled={sprintsLoading || sprints.length === 0}
            className="text-sm border border-outline-variant rounded-lg px-3 py-2 bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            {sprints.length === 0 && <option value="">No sprints</option>}
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.status === 'ACTIVE' ? '(Active)' : ''}
              </option>
            ))}
          </select>

          {/* Refresh button */}
          <button
            onClick={handleRefreshClick}
            disabled={!selectedSprintId || refreshing}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-low disabled:opacity-50 transition-colors"
          >
            <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {jobStatusLabel || 'Refresh'}
          </button>
        </div>
      </div>

      {/* Reliability Score badge */}
      {report && !isLoading && (
        <div className="flex items-center gap-3 flex-wrap">
          <ReliabilityScoreBadge score={report.reliabilityScore} />
          {report.computedAt && (
            <span className="text-xs text-on-surface-variant">
              Computed {new Date(report.computedAt).toLocaleString('vi-VN')}
            </span>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container rounded-2xl p-5 border border-outline-variant/40 h-40 animate-pulse" />
          ))}
        </div>
      )}

      {/* Metric cards */}
      {!isLoading && report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AvailabilityGauge
            availabilityPct={report.availabilityPct}
            healthyThreshold={report.healthyThreshold}
            totalIntervals={report.totalIntervals}
            healthyIntervals={report.healthyIntervals}
          />
          <MttrCard
            mttrHours={report.mttrHours}
            sampleCount={report.mttrSampleCount}
            trend={report.mttrTrend}
          />
          <ErrorBudgetBar
            consumedPct={report.errorBudgetConsumedPct}
            remainingPct={report.errorBudgetRemainingPct}
            totalTasks={report.totalTasks}
            penalizedTasks={report.penalizedTasks}
            budgetPct={report.budgetPct}
          />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !report && selectedSprintId && (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant gap-2">
          <span className="material-symbols-outlined text-5xl opacity-30">monitor_heart</span>
          <p className="text-sm">No reliability data yet for this sprint.</p>
          <p className="text-xs opacity-70">Data is computed automatically when a sprint ends, or click Refresh to compute now.</p>
        </div>
      )}

      {/* AI Narrative */}
      {!isLoading && report?.aiNarrative && (
        <div className="bg-primary-fixed/10 border border-primary/20 rounded-2xl p-4 flex gap-3">
          <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">smart_toy</span>
          <div>
            <p className="text-xs font-semibold text-primary mb-1">AI Reliability Summary</p>
            <p className="text-sm text-on-surface leading-relaxed">{report.aiNarrative}</p>
          </div>
        </div>
      )}

      {/* Trend chart */}
      {!isLoading && (
        <ReliabilityTrendChart trendHistory={report?.trendHistory} />
      )}
    </div>
  )
}
