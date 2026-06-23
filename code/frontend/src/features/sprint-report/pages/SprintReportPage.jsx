import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import { sprintService } from '@features/sprint/services/sprintService'

import { sprintReportService } from '@features/sprint-report/services/sprintReportService'
import SprintReportHeader from '@features/sprint-report/components/SprintReportHeader'
import SprintSelector from '@features/sprint-report/components/SprintSelector'
import SprintSummary from '@features/sprint-report/components/SprintSummary'
import SlaRiskTable from '@features/sprint-report/components/SlaRiskTable'
import SprintReportResult from '@features/sprint-report/components/SprintReportResult'
import {
  canGenerateSprintReport,
  getAssigneeName,
  getRiskReasons,
  statusColors,
  statusLabels,
  taskHasSlaCategory,
  todayStr,
} from '@features/sprint-report/utils/sprintReportUtils'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import SprintReportPdfTemplate from '@features/sprint-report/components/SprintReportPdfTemplate'

export default function SprintReportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const activeProject = useProjectStore((state) => state.activeProject)
  const reportResultRef = useRef(null)
  const requestedReportId = useMemo(() => Number(new URLSearchParams(location.search).get('reportId')) || null, [location.search])

  const [sprints, setSprints] = useState([])
  const [sprintTasks, setSprintTasks] = useState([])
  const [sprintReports, setSprintReports] = useState([])
  const [selectedReportDetail, setSelectedReportDetail] = useState(null)
  const [selectedSprintId, setSelectedSprintId] = useState(null)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [sprintsLoading, setSprintsLoading] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportDetailLoading, setReportDetailLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isTestingDigest, setIsTestingDigest] = useState(false)
  const exportRef = useRef(null)
  const canGenerate = canGenerateSprintReport(activeProject?.role)

  const loadSprints = useCallback(async () => {
    if (!activeProject?.id) return
    setSprintsLoading(true)
    try {
      const data = await sprintService.getSprints(activeProject.id)
      const nextSprints = Array.isArray(data) ? data : []
      setSprints(nextSprints)
      if (nextSprints.length) {
        const activeSprint = nextSprints.find((sprint) => sprint.status === 'ACTIVE')
        setSelectedSprintId((current) => current || activeSprint?.id || nextSprints[0].id)
      } else {
        setSelectedSprintId(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load sprints')
    } finally {
      setSprintsLoading(false)
    }
  }, [activeProject?.id])

  const loadReports = useCallback(async () => {
    if (!activeProject?.id || !selectedSprintId) {
      setSprintReports([])
      setSelectedReportId(null)
      setSelectedReportDetail(null)
      return
    }
    setReportLoading(true)
    try {
      const data = await sprintReportService.getReports(activeProject.id, selectedSprintId)
      const nextReports = Array.isArray(data) ? data : []
      setSprintReports(nextReports)
      const urlReportExists = requestedReportId && nextReports.some((report) => report.id === requestedReportId)
      setSelectedReportId(urlReportExists ? requestedReportId : nextReports[0]?.id || null)
      setSelectedReportDetail(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load reports')
    } finally {
      setReportLoading(false)
    }
  }, [activeProject?.id, requestedReportId, selectedSprintId])

  useEffect(() => {
    loadSprints()
  }, [loadSprints])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  useEffect(() => {
    const focusRequestedReport = async () => {
      if (!activeProject?.id || !requestedReportId) return
      try {
        const report = await sprintReportService.getReport(activeProject.id, requestedReportId)
        if (report?.sprintId) setSelectedSprintId(report.sprintId)
        setSelectedReportId(report?.id || requestedReportId)
        setSelectedReportDetail(report || null)
        window.setTimeout(() => {
          reportResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 150)
      } catch {
        // Keep the normal sprint report list behavior if the referenced report no longer exists.
      }
    }

    focusRequestedReport()
  }, [activeProject?.id, requestedReportId])

  useEffect(() => {
    const loadTasks = async () => {
      if (!activeProject?.id || !selectedSprintId) {
        setSprintTasks([])
        return
      }

      setTasksLoading(true)
      try {
        const data = await sprintService.getSprintTasks(activeProject.id, selectedSprintId)
        setSprintTasks(Array.isArray(data) ? data : [])
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load sprint tasks')
      } finally {
        setTasksLoading(false)
      }
    }

    loadTasks()
  }, [activeProject?.id, selectedSprintId])

  useEffect(() => {
    const loadReportDetail = async () => {
      if (!activeProject?.id || !selectedReportId) {
        setSelectedReportDetail(null)
        return
      }

      setReportDetailLoading(true)
      try {
        const report = await sprintReportService.getReport(activeProject.id, selectedReportId)
        setSelectedReportDetail(report || null)
      } catch (error) {
        setSelectedReportDetail(null)
        toast.error(error.response?.data?.message || 'Failed to load report detail')
      } finally {
        setReportDetailLoading(false)
      }
    }

    loadReportDetail()
  }, [activeProject?.id, selectedReportId])

  const handleExportPdf = async () => {
    if (!exportRef.current || !selectedSprintId) return
    setIsExporting(true)
    const toastId = toast.loading(canGenerate ? 'Generating report and exporting PDF...' : 'Exporting PDF...')
    try {
      if (canGenerate) {
        try {
          const report = await sprintReportService.generate(activeProject.id, selectedSprintId)
          setSelectedReportDetail(report || null)
          await loadReports()
          if (report?.id) setSelectedReportId(report.id)
          // Wait a tick (300ms) for React to re-render the template with the new report details
          await new Promise((resolve) => setTimeout(resolve, 300))
        } catch (genError) {
          console.error('Failed to generate report in background:', genError)
          toast.error(
            genError.response?.data?.message || 'Could not save new report snapshot, exporting live data instead.',
            { id: toastId }
          )
          // Pause briefly so the user sees the error before the PDF exports
          await new Promise((resolve) => setTimeout(resolve, 1500))
          // Re-create the loading toast
          toast.loading('Exporting PDF...', { id: toastId })
        }
      }

      const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      // Create PDF with custom dimensions matching the canvas to avoid cutting
      const pdf = new jsPDF('p', 'px', [canvas.width, canvas.height])
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      
      const projectName = activeProject.name || activeProject.title || 'project'
      const sprintName = selectedSprint?.name || 'sprint'
      const fileName = `sprint-report-${projectName}-${sprintName}.pdf`.replace(/\s+/g, '-').toLowerCase()
      
      pdf.save(fileName)
      toast.success('PDF exported successfully', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error('Failed to export PDF', { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  const handleTestDigest = async () => {
    if (!activeProject?.id) {
      toast.error('Không tìm thấy project ID')
      return
    }
    setIsTestingDigest(true)
    const toastId = toast.loading('Đang kích hoạt hệ thống nhắc nhở...')
    try {
      await sprintReportService.triggerDailyDigest(activeProject.id)
      toast.success('Đã chạy thử hệ thống gửi mail thành công', { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Có lỗi khi chạy thử gửi mail', { id: toastId })
    } finally {
      setIsTestingDigest(false)
    }
  }

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => sprint.id === selectedSprintId),
    [sprints, selectedSprintId]
  )

  const selectedReport = selectedReportDetail?.id === selectedReportId ? selectedReportDetail : null

  const today = todayStr()

  const summary = useMemo(() => {
    const total = sprintTasks.length || selectedSprint?.totalTasks || 0
    const done = sprintTasks.filter((task) => task.status === 'DONE').length || selectedSprint?.doneTasks || 0
    const blocked = sprintTasks.filter((task) => task.status === 'BLOCKED').length || selectedSprint?.blockedTasks || 0
    const overdue = sprintTasks.filter((task) => (
      taskHasSlaCategory(task, ['OVERDUE_SHORT'])
      || (!Array.isArray(task.slaCategories) && task.deadline && task.deadline < today && task.status !== 'DONE')
    )).length
    const penalty = sprintTasks.filter((task) => (
      taskHasSlaCategory(task, ['OVERDUE_PENALTY'])
      || (!Array.isArray(task.slaCategories) && task.overduePenaltyApplied)
    )).length
    const progress = total ? Math.round((done / total) * 100) : selectedSprint?.progressPercent || 0
    const health = Math.max(0, Math.min(100, progress - blocked * 8 - overdue * 6 - penalty * 10))

    return { total, done, blocked, overdue, penalty, progress, health }
  }, [selectedSprint, sprintTasks, today])

  const burndownData = useMemo(() => {
    if (!selectedSprint?.startDate || !selectedSprint?.endDate) return []
    const start = new Date(selectedSprint.startDate)
    const end = new Date(selectedSprint.endDate)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []

    const days = []
    const current = new Date(start)
    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days.map((day, index) => {
      const date = day.toISOString().split('T')[0]
      const ideal = summary.total - (summary.total / Math.max(1, days.length - 1)) * index
      const doneCount = sprintTasks.filter((task) => (
        task.status === 'DONE' && (task.completedAt ? task.completedAt.slice(0, 10) <= date : task.sprintPlanDate <= date)
      )).length

      return {
        date,
        ideal: Math.max(0, ideal).toFixed(1),
        actual: date > today ? null : summary.total - doneCount,
      }
    })
  }, [selectedSprint, sprintTasks, summary.total, today])

  const distributionData = useMemo(() => {
    const counts = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0, BLOCKED: 0 }
    sprintTasks.forEach((task) => {
      if (counts[task.status] !== undefined) counts[task.status] += 1
    })

    return Object.entries(counts)
      .map(([status, value]) => ({ name: statusLabels[status], value, color: statusColors[status] }))
      .filter((item) => item.value > 0)
  }, [sprintTasks])

  const riskTasks = useMemo(() => {
    return sprintTasks
      .map((task) => ({ ...task, risk: getRiskReasons(task, today) }))
      .filter((task) => task.risk.reasons.length > 0)
      .sort((a, b) => b.risk.overdueDays - a.risk.overdueDays)
  }, [sprintTasks, today])

  const members = useMemo(() => {
    const map = new Map()
    sprintTasks.forEach((task) => {
      const name = getAssigneeName(task)
      const current = map.get(name) || { name, total: 0, done: 0, risk: 0 }
      current.total += 1
      if (task.status === 'DONE') current.done += 1
      if (getRiskReasons(task, today).reasons.length) current.risk += 1
      map.set(name, current)
    })
    return Array.from(map.values()).sort((a, b) => b.risk - a.risk || b.total - a.total)
  }, [sprintTasks, today])

  const liveReportMetrics = useMemo(() => ({
    redMemberCount: members.filter((member) => member.risk > 0).length,
    totalOverdueTasks: summary.overdue,
    totalPenalizedTasks: riskTasks.filter((task) => task.risk.reasons.some((reason) => reason.type === 'PENALTY')).length,
  }), [members, riskTasks, summary.overdue])

  if (!activeProject) {
    return (
      <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-background">
        <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-8 text-center shadow-sm">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">folder_off</span>
          <h2 className="text-xl font-bold text-on-surface">No project selected</h2>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background p-6">
      <div className="w-full space-y-5">
        <SprintReportHeader
          activeProject={activeProject}
          onRefresh={() => {
            loadSprints()
            if (selectedSprintId) loadReports()
          }}
          onExportPdf={handleExportPdf}
          isExporting={isExporting}
          canExport={!!selectedSprintId && (!!selectedReportId || sprintTasks.length > 0)}
          onTestDigest={handleTestDigest}
          isTestingDigest={isTestingDigest}
        />

        <div className="space-y-5 rounded-lg bg-background">
          {!canGenerate && (
            <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant">
              Your current project role is <span className="font-bold text-on-surface">{activeProject?.role || 'Unknown'}</span>. Only Leader/Mentor can generate reports (automatically saved when exporting PDF).
            </div>
          )}

          {sprintsLoading && !sprints.length ? (
            <div className="py-12 text-center text-sm text-on-surface-variant">Loading sprints...</div>
          ) : sprints.length === 0 ? (
            <section className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-8 text-center">
              <p className="text-sm text-on-surface-variant">No sprints yet. Create one from the Sprints page.</p>
            </section>
          ) : (
          <>
            <SprintSelector
              sprints={sprints}
              selectedSprint={selectedSprint}
              selectedSprintId={selectedSprintId}
              onChange={setSelectedSprintId}
            />

            {selectedSprint && (
              <>
                <SprintSummary
                  selectedSprint={selectedSprint}
                  summary={summary}
                  riskTaskCount={riskTasks.length}
                  tasksLoading={tasksLoading}
                  burndownData={burndownData}
                  distributionData={distributionData}
                />

                <SlaRiskTable
                  activeProject={activeProject}
                  riskTasks={riskTasks}
                  reportResultRef={reportResultRef}
                  onOpenTask={(projectId, taskId) => navigate(`/projects/${projectId}/tasks/${taskId}`)}
                />

                <SprintReportResult
                  selectedSprint={selectedSprint}
                  selectedReport={selectedReport}
                  selectedReportId={selectedReportId}
                  sprintReports={sprintReports}
                  reportLoading={reportLoading || reportDetailLoading}
                  members={members}
                  liveMetrics={liveReportMetrics}
                />
              </>
            )}
          </>
        )}
        </div>

        {/* Hidden PDF Template */}
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div ref={exportRef}>
            <SprintReportPdfTemplate
              project={activeProject}
              sprint={selectedSprint}
              summary={summary}
              riskTasks={riskTasks}
              members={members}
              report={selectedReport}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
