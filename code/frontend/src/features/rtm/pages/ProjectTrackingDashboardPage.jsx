import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import axiosInstance from '@api/axiosConfig'
import rtmService from '../services/rtmService'
import RtmSummaryCards from '../components/RtmSummaryCards'
import RtmToolbar from '../components/RtmToolbar'
import RtmMatrixTable from '../components/RtmMatrixTable'
import RtmDetailDrawer from '../components/RtmDetailDrawer'
import RtmSnapshotPanel from '../components/RtmSnapshotPanel'
import Card from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#1E707D', '#0D9488', '#0f766e', '#14b8a6', '#5eead4', '#2dd4bf', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7']

const initialFilters = {
  status: 'ALL',
  priority: 'ALL',
}

export function ProjectTrackingDashboardPage() {
  const activeProject = useProjectStore((state) => state.activeProject)
  
  // Tab control
  const [activeTab, setActiveTab] = useState('contribution') // 'contribution' | 'rtm'

  // RTM state
  const [matrix, setMatrix] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [selectedRow, setSelectedRow] = useState(null)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [loadingRtm, setLoadingRtm] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [savingRtm, setSavingRtm] = useState(false)

  // Tracking state
  const [trackingData, setTrackingData] = useState(null)
  const [loadingTracking, setLoadingTracking] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Data fetching functions
  const loadMatrix = useCallback(async () => {
    if (!activeProject?.id) return
    setLoadingRtm(true)
    try {
      const response = await rtmService.getMatrix(activeProject.id)
      setMatrix(response)
    } catch (err) {
      console.error('Error loading RTM:', err)
      toast.error(err.response?.data?.message || 'Failed to load traceability matrix (RTM).')
    } finally {
      setLoadingRtm(false)
    }
  }, [activeProject?.id])

  const loadSnapshots = useCallback(async () => {
    if (!activeProject?.id) return
    setSnapshotLoading(true)
    try {
      const response = await rtmService.getSnapshots(activeProject.id)
      setSnapshots(response || [])
    } catch (err) {
      console.error('Error loading RTM snapshots:', err)
      toast.error(err.response?.data?.message || 'Failed to load RTM snapshots.')
    } finally {
      setSnapshotLoading(false)
    }
  }, [activeProject?.id])

  const loadTrackingData = useCallback(async () => {
    if (!activeProject?.id) return
    setLoadingTracking(true)
    try {
      const data = await rtmService.getTrackingData(activeProject.id)
      setTrackingData(data)
    } catch (err) {
      console.error('Error loading tracking data:', err)
      toast.error(err.response?.data?.message || 'Failed to load contribution tracking data.')
    } finally {
      setLoadingTracking(false)
    }
  }, [activeProject?.id])

  // Initial fetch
  useEffect(() => {
    if (activeProject?.id) {
      loadTrackingData()
      loadMatrix()
      loadSnapshots()
    }
  }, [activeProject?.id, loadTrackingData, loadMatrix, loadSnapshots])

  // Filter RTM rows
  const rows = matrix?.rows || []
  const filteredRows = useMemo(() => rows.filter((row) => {
    const statusMatches = filters.status === 'ALL' || row.traceabilityStatus === filters.status
    const priorityMatches = filters.priority === 'ALL' || row.priority === filters.priority
    return statusMatches && priorityMatches
  }), [rows, filters])

  const priorityOptions = useMemo(() => [...new Set(rows.map((row) => row.priority).filter(Boolean))], [rows])
  const statusOptions = useMemo(() => [...new Set(rows.map((row) => row.traceabilityStatus).filter(Boolean))], [rows])

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleSaveSnapshot = async () => {
    if (!activeProject?.id) return
    setSavingRtm(true)
    try {
      const snapshot = await rtmService.saveSnapshot(activeProject.id)
      setSnapshots((current) => [snapshot, ...current])
      toast.success('RTM snapshot saved successfully!')
      if (snapshot?.id) {
        await rtmService.exportSnapshotExcel(activeProject.id, snapshot.id)
      }
    } catch (err) {
      console.error('Error saving RTM snapshot:', err)
      toast.error(err.response?.data?.message || 'Failed to save RTM snapshot.')
    } finally {
      setSavingRtm(false)
    }
  }

  const handleExportExcel = async () => {
    if (!activeProject?.id) return
    setExporting(true)
    try {
      const res = await axiosInstance.get(`/v1/projects/${activeProject.id}/export-tracking`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `project-tracking-${activeProject.id}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Excel report exported successfully!')
    } catch (err) {
      console.error('Error exporting tracking Excel:', err)
      toast.error('Failed to export Excel report.')
    } finally {
      setExporting(false)
    }
  }

  if (!activeProject) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-lg space-y-4">
          <span className="material-symbols-outlined text-5xl text-[#1E707D] animate-bounce">folder_open</span>
          <h3 className="font-extrabold text-xl text-on-surface">No project selected</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Please return to the Dashboard and select a project to view the tracking and contribution report.
          </p>
        </div>
      </main>
    )
  }

  // Pre-calculate totals for tracking members
  const memberTotals = useMemo(() => {
    if (!trackingData?.members?.length) return null
    const members = trackingData.members
    const count = members.length
    
    let totalTasks = 0
    let doneTasks = 0
    let cancelledTasks = 0
    let sumCompletionPct = 0
    let sumOnTimePct = 0
    let totalEst = 0
    let totalAct = 0
    let sumAvgQuality = 0
    let totalPoints = 0
    let totalContrib = 0
    let activeQualityCount = 0

    members.forEach(m => {
      totalTasks += m.totalTasks
      doneTasks += m.doneTasks
      cancelledTasks += m.cancelledTasks
      sumCompletionPct += m.completionPct
      sumOnTimePct += m.onTimePct
      totalEst += m.estimatedHours
      totalAct += m.actualHours
      totalPoints += m.totalPoints
      totalContrib += m.contributionPct
      if (m.avgQuality > 0) {
        sumAvgQuality += m.avgQuality
        activeQualityCount++
      }
    });

    return {
      name: 'TOTAL',
      totalTasks,
      doneTasks,
      cancelledTasks,
      completionPct: count ? Math.round((doneTasks * 100) / totalTasks) : 0,
      onTimePct: doneTasks ? Math.round((members.reduce((acc, m) => acc + (m.doneTasks * m.onTimePct), 0)) / doneTasks * 10) / 10 : 0,
      estimatedHours: Math.round(totalEst * 100) / 100,
      actualHours: Math.round(totalAct * 100) / 100,
      avgQuality: activeQualityCount ? Math.round((sumAvgQuality / activeQualityCount) * 10) / 10 : 0,
      totalPoints: Math.round(totalPoints * 100) / 100,
      contributionPct: Math.round(totalContrib)
    }
  }, [trackingData])

  // Pie chart data
  const pieData = useMemo(() => {
    if (!trackingData?.members) return []
    return trackingData.members
      .filter(m => m.totalPoints > 0)
      .map(m => ({
        name: m.name,
        value: m.totalPoints,
      }))
  }, [trackingData])

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#D7EEF1] opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full space-y-6 animate-fade-in">
        {/* Header Section */}
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase bg-[#D7EEF1] text-[#1E707D]">
                {activeProject.title}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-[#1E707D]">monitoring</span>
              Project Tracking Dashboard
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
              Monitor member contributions, task quality, and system traceability (RTM).
            </p>
          </div>

          {/* Quick Metrics */}
          {activeTab === 'rtm' && matrix?.summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <Card style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p className="text-lg font-black text-on-surface">{matrix.summary.totalTasks}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Tasks</p>
              </Card>
              <Card style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p className="text-lg font-black text-on-surface">{matrix.summary.totalTests}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Tests</p>
              </Card>
              <Card style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p className="text-lg font-black text-error">{matrix.summary.openBugs}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Bugs</p>
              </Card>
              <Card style={{ padding: '12px 16px', borderRadius: '12px' }}>
                <p className="text-lg font-black text-[#047857]">{matrix.summary.acceptedEvidence}</p>
                <p className="text-[10px] uppercase font-bold text-on-surface-variant">Evidence</p>
              </Card>
            </div>
          )}
        </section>

        {/* Tab switcher */}
        <div className="flex border-b border-outline-variant/60">
          <button
            onClick={() => setActiveTab('contribution')}
            className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'contribution'
                ? 'border-[#1E707D] text-[#1E707D]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            Team Contribution
          </button>
          <button
            onClick={() => setActiveTab('rtm')}
            className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'rtm'
                ? 'border-[#1E707D] text-[#1E707D]'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">reorder</span>
            Traceability Matrix (RTM)
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CONTRIBUTION REPORT */}
        {/* ========================================================================= */}
        {activeTab === 'contribution' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <Card className="p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">Members</p>
                  <p className="text-2xl font-black text-on-surface mt-1">{trackingData?.totalMembers ?? 0}</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-[#1E707D] bg-surface-container-high/40 p-2.5 rounded-xl">group</span>
              </Card>
              
              <Card className="p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">Completed / Total Tasks</p>
                  <p className="text-2xl font-black text-on-surface mt-1">{trackingData?.completedTasks ?? 0}/{trackingData?.totalTasks ?? 0}</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-[#1E707D] bg-surface-container-high/40 p-2.5 rounded-xl">checklist</span>
              </Card>

              <Card className="p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">Completion Rate</p>
                  <p className="text-2xl font-black text-on-surface mt-1">{trackingData?.completionPercentage ?? 0}%</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-[#1E707D] bg-surface-container-high/40 p-2.5 rounded-xl">done_all</span>
              </Card>

              <Card className="p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">On-Time Rate</p>
                  <p className="text-2xl font-black text-[#047857] mt-1">{trackingData?.averageOnTimePercentage ?? 0}%</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-[#047857] bg-surface-container-high/40 p-2.5 rounded-xl">schedule</span>
              </Card>

              <Card className="p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">Average Quality</p>
                  <p className="text-2xl font-black text-on-surface mt-1">{trackingData?.averageQualityScore ?? 0}/10</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-on-surface bg-surface-container-high/40 p-2.5 rounded-xl">star</span>
              </Card>

              <Card className="p-4 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-wider">Total Project Points</p>
                  <p className="text-2xl font-black text-primary mt-1">{trackingData?.totalPoints ?? 0}</p>
                </div>
                <span className="material-symbols-outlined text-2xl text-primary bg-surface-container-high/40 p-2.5 rounded-xl">payments</span>
              </Card>
            </div>

            {/* Layout 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left Column: Member Table */}
              <div className="xl:col-span-3 space-y-4">
                <Card style={{ padding: 0 }} className="overflow-hidden shadow-sm">
                  <div className="p-4 bg-surface-container-low border-b border-outline-variant/60 flex items-center justify-between">
                    <h3 className="font-black text-sm text-on-surface uppercase tracking-wide">Performance & Contribution Report</h3>
                    <span className="text-[10px] font-bold text-on-surface-variant">Unit: hours (h), points (Points)</span>
                  </div>
                  <div className="overflow-x-auto">
                    {loadingTracking ? (
                      <div className="p-12 text-center">
                        <span className="material-symbols-outlined animate-spin text-4xl text-[#1E707D]">progress_activity</span>
                        <p className="text-xs font-bold text-on-surface-variant mt-3">Loading contribution data...</p>
                      </div>
                    ) : trackingData?.members?.length ? (
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-surface-container-low border-b border-outline-variant/60 text-on-surface-variant font-black text-[9px] uppercase tracking-wider" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                            <th className="px-4 py-3">Member</th>
                            <th className="px-4 py-3 text-center">Tasks</th>
                            <th className="px-4 py-3 text-center">Done</th>
                            <th className="px-4 py-3 text-center">Cancelled</th>
                            <th className="px-4 py-3 text-center">Completed%</th>
                            <th className="px-4 py-3 text-center">On-Time%</th>
                            <th className="px-4 py-3 text-center">Estimated (h)</th>
                            <th className="px-4 py-3 text-center">Actual (h)</th>
                            <th className="px-4 py-3 text-center">Quality Score</th>
                            <th className="px-4 py-3 text-center">Accumulated Points</th>
                            <th className="px-4 py-3 text-center">Contribution%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30 text-xs">
                          {trackingData.members.map((m) => (
                            <tr key={m.name} className="hover:bg-surface-container-low/40 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-on-surface">{m.name}</td>
                              <td className="px-4 py-3.5 text-center font-bold">{m.totalTasks}</td>
                              <td className="px-4 py-3.5 text-center text-[#047857] font-bold">{m.doneTasks}</td>
                              <td className="px-4 py-3.5 text-center text-error font-medium">{m.cancelledTasks}</td>
                              <td className="px-4 py-3.5 text-center font-black">{m.completionPct}%</td>
                              <td className="px-4 py-3.5 text-center text-[#047857] font-bold">{m.onTimePct}%</td>
                              <td className="px-4 py-3.5 text-center text-on-surface-variant">{m.estimatedHours}h</td>
                              <td className="px-4 py-3.5 text-center font-bold text-[#1E707D]">{m.actualHours}h</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded-lg text-[10px] font-black ${
                                  m.avgQuality >= 8.0 ? 'bg-[#d1fae5] text-[#065f46]' : m.avgQuality >= 5.0 ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#fee2e2] text-[#991b1b]'
                                }`}>
                                  {m.avgQuality > 0 ? `${m.avgQuality}/10` : 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center text-primary font-black">{m.totalPoints} pts</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-block px-1.5 py-0.5 rounded-lg text-[10px] font-black ${
                                  m.contributionPct >= 30.0 ? 'bg-success-container text-on-success-container' : m.contributionPct >= 15.0 ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-error-container text-on-error-container'
                                }`}>
                                  {m.contributionPct}%
                                </span>
                              </td>
                            </tr>
                          ))}
                          {/* Total Row */}
                          {memberTotals && (
                            <tr className="bg-surface-container-low/70 font-black border-t-2 border-outline-variant/60">
                              <td className="px-4 py-3.5 text-[#1E707D]">{memberTotals.name}</td>
                              <td className="px-4 py-3.5 text-center">{memberTotals.totalTasks}</td>
                              <td className="px-4 py-3.5 text-center text-[#047857]">{memberTotals.doneTasks}</td>
                              <td className="px-4 py-3.5 text-center text-error">{memberTotals.cancelledTasks}</td>
                              <td className="px-4 py-3.5 text-center">{memberTotals.completionPct}%</td>
                              <td className="px-4 py-3.5 text-center text-[#047857]">{memberTotals.onTimePct}%</td>
                              <td className="px-4 py-3.5 text-center text-on-surface-variant">{memberTotals.estimatedHours}h</td>
                              <td className="px-4 py-3.5 text-center text-[#1E707D]">{memberTotals.actualHours}h</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="inline-block px-1.5 py-0.5 rounded-lg bg-[#d1fae5] text-[#065f46] text-[10px]">
                                  {memberTotals.avgQuality}/10
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-center text-primary">{memberTotals.totalPoints} pts</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className="inline-block px-1.5 py-0.5 rounded-lg bg-[#D7EEF1] text-[#1E707D] text-[10px]">
                                  {memberTotals.contributionPct}%
                                </span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-12 text-center text-on-surface-variant italic">
                        No member contribution data available.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Right Column: Donut Chart & Action Panel */}
              <div className="space-y-6 xl:col-span-1">
                {/* Donut Chart */}
                <Card className="shadow-sm flex flex-col p-5 h-[340px]">
                  <h3 className="font-black text-sm text-on-surface uppercase tracking-wide border-b border-outline-variant/20 pb-2 mb-4 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">pie_chart</span>
                    Contribution Ratio (Points)
                  </h3>
                  <div className="flex-1 min-h-0 relative">
                    {pieData.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `${value} pts`} />
                          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-on-surface-variant italic">
                        No points accumulated yet
                      </div>
                    )}
                  </div>
                </Card>

                {/* Operations Panel */}
                <Card className="shadow-sm p-5 space-y-4">
                  <h3 className="font-black text-sm text-on-surface uppercase tracking-wide border-b border-outline-variant/20 pb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Report Actions
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    <Button
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2 py-3"
                      onClick={handleExportExcel}
                      disabled={exporting}
                    >
                      {exporting ? (
                        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      )}
                      {exporting ? 'Exporting...' : 'Export Excel Report'}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 py-3"
                      onClick={loadTrackingData}
                      disabled={loadingTracking}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${loadingTracking ? 'animate-spin' : ''}`}>refresh</span>
                      Refresh Data
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-outline-variant/20 flex flex-col gap-1 text-[10px] text-on-surface-variant font-medium">
                    <div className="flex justify-between">
                      <span>Updated at:</span>
                      <span className="font-bold">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Source:</span>
                      <span className="font-bold text-[#1E707D]">Tasks & SLA Engine</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TRACEABILITY MATRIX (RTM) */}
        {/* ========================================================================= */}
        {activeTab === 'rtm' && (
          <div className="space-y-6">
            {/* Standard Summary Cards */}
            <RtmSummaryCards summary={matrix?.summary} />

            {/* Standard Toolbar */}
            <RtmToolbar
              filters={filters}
              onFilterChange={handleFilterChange}
              priorityOptions={priorityOptions}
              statusOptions={statusOptions}
              onRefresh={loadMatrix}
              onSaveSnapshot={handleSaveSnapshot}
              onToggleSnapshots={() => setShowSnapshots(true)}
              loading={loadingRtm}
              saving={savingRtm}
            />

            {/* 4-column layout split: 3/4 left (table), 1/4 right (panels) */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Left: Matrix Table (Accordion inside!) */}
              <div className="xl:col-span-3">
                {loadingRtm && !matrix ? (
                  <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center shadow-sm">
                    <span className="material-symbols-outlined text-5xl text-[#1E707D] animate-spin">progress_activity</span>
                    <p className="mt-4 text-sm font-bold text-on-surface-variant">Loading traceability matrix...</p>
                  </section>
                ) : (
                  <RtmMatrixTable rows={filteredRows} onSelectRow={setSelectedRow} />
                )}
              </div>

              {/* Right: Heatmap & Trace Flow Diagram */}
              <div className="space-y-6 xl:col-span-1">
                {/* Completion Heatmap */}
                <Card className="shadow-sm p-5 flex flex-col max-h-[380px] overflow-y-auto">
                  <h3 className="font-black text-sm text-on-surface uppercase tracking-wide border-b border-outline-variant/20 pb-2 mb-4 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                    Requirement Completion
                  </h3>
                  {rows.length ? (
                    <>
                      <div className="space-y-3.5 flex-grow">
                        {rows.slice(0, 8).map((row) => {
                          const percent = row.taskTotal ? Math.round((row.taskDone / row.taskTotal) * 100) : 0
                          return (
                            <div key={row.requirementId} className="space-y-1">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-primary font-mono">{row.requirementCode}</span>
                                <span className={`text-[10px] font-black ${
                                  percent >= 80 ? 'text-[#10b981]' : percent >= 40 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                                }`}>{percent}%</span>
                              </div>
                              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    percent >= 80 ? 'bg-[#10b981]' : percent >= 40 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <p className="text-[10px] text-on-surface-variant truncate font-medium">{row.title}</p>
                            </div>
                          )
                        })}
                        {rows.length > 8 && (
                          <p className="text-[10px] text-center text-on-surface-variant italic font-semibold pt-1">
                            Showing top 8 of {rows.length} requirements
                          </p>
                        )}
                      </div>
                      
                      {/* Risk Legend */}
                      <div className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-between text-[9px] font-black uppercase text-on-surface-variant">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#ef4444]"></span>
                          <span>High (0-39%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                          <span>Medium (40-79%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#10b981]"></span>
                          <span>Low (80-100%)</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-on-surface-variant italic py-6 text-center">
                      No requirements found.
                    </div>
                  )}
                </Card>

                {/* CSS Trace Flow Diagram */}
                <Card className="shadow-sm p-5 flex flex-col">
                  <h3 className="font-black text-sm text-on-surface uppercase tracking-wide border-b border-outline-variant/20 pb-2 mb-4 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">schema</span>
                    Trace Flow Diagram
                  </h3>
                  
                  <div className="relative pl-6 space-y-6 text-xs before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/60">
                    {/* Node 1: Requirement */}
                    <div className="relative">
                      <div className="absolute -left-[20px] top-0 w-[11px] h-[11px] rounded-full border-2 border-[#1E707D] bg-background"></div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#1E707D] bg-[#D7EEF1] p-1 rounded-md">description</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">Requirement</span>
                          <span className="text-[10px] text-on-surface-variant">Software development based on Use Cases</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 2: Task */}
                    <div className="relative">
                      <div className="absolute -left-[20px] top-0 w-[11px] h-[11px] rounded-full border-2 border-primary bg-background"></div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-primary bg-primary-container/20 p-1 rounded-md">assignment</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">Task</span>
                          <span className="text-[10px] text-on-surface-variant">Team member executing task</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 3: Test Case */}
                    <div className="relative">
                      <div className="absolute -left-[20px] top-0 w-[11px] h-[11px] rounded-full border-2 border-tertiary bg-background"></div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-tertiary bg-tertiary-container/20 p-1 rounded-md">checklist_rtl</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">Test Case</span>
                          <span className="text-[10px] text-on-surface-variant">Validate task functionality</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 4: Bug */}
                    <div className="relative">
                      <div className="absolute -left-[20px] top-0 w-[11px] h-[11px] rounded-full border-2 border-error bg-background"></div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-error bg-error-container/20 p-1 rounded-md">bug_report</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">Bug</span>
                          <span className="text-[10px] text-on-surface-variant">Defect found during test execution</span>
                        </div>
                      </div>
                    </div>

                    {/* Node 5: Evidence */}
                    <div className="relative">
                      <div className="absolute -left-[20px] top-0 w-[11px] h-[11px] rounded-full border-2 border-success bg-background"></div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-success bg-[#d1fae5] p-1 rounded-md">inventory_2</span>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">Evidence</span>
                          <span className="text-[10px] text-on-surface-variant">Evidence of task completion</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RTM detail drawer */}
      <RtmDetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />

      {/* Snapshots side-panel */}
      <RtmSnapshotPanel
        open={showSnapshots}
        snapshots={snapshots}
        loading={snapshotLoading}
        onClose={() => setShowSnapshots(false)}
        projectId={activeProject?.id}
      />
    </main>
  )
}

export default ProjectTrackingDashboardPage
