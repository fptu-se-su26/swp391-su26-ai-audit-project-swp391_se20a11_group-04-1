import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import rtmService from '../services/rtmService'
import RtmSummaryCards from '../components/RtmSummaryCards'
import RtmToolbar from '../components/RtmToolbar'
import RtmMatrixTable from '../components/RtmMatrixTable'
import RtmDetailDrawer from '../components/RtmDetailDrawer'
import RtmSnapshotPanel from '../components/RtmSnapshotPanel'

const initialFilters = {
  status: 'ALL',
  priority: 'ALL',
}

export function RtmPage() {
  const activeProject = useProjectStore((state) => state.activeProject)
  const [matrix, setMatrix] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [filters, setFilters] = useState(initialFilters)
  const [selectedRow, setSelectedRow] = useState(null)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [loading, setLoading] = useState(false)
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadMatrix = useCallback(async () => {
    if (!activeProject?.id) return
    setLoading(true)
    try {
      const response = await rtmService.getMatrix(activeProject.id)
      setMatrix(response)
    } catch (err) {
      console.error('Error loading RTM:', err)
      toast.error(err.response?.data?.message || 'Unable to load traceability matrix')
    } finally {
      setLoading(false)
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
      toast.error(err.response?.data?.message || 'Unable to load RTM snapshots')
    } finally {
      setSnapshotLoading(false)
    }
  }, [activeProject?.id])

  useEffect(() => {
    loadMatrix()
    loadSnapshots()
  }, [loadMatrix, loadSnapshots])

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
    setSaving(true)
    try {
      const snapshot = await rtmService.saveSnapshot(activeProject.id)
      setSnapshots((current) => [snapshot, ...current])
      toast.success('RTM snapshot saved')
    } catch (err) {
      console.error('Error saving RTM snapshot:', err)
      toast.error(err.response?.data?.message || 'Unable to save RTM snapshot')
    } finally {
      setSaving(false)
    }
  }

  if (!activeProject) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-lg space-y-4">
          <span className="material-symbols-outlined text-5xl text-primary animate-bounce">folder_open</span>
          <h3 className="font-extrabold text-xl text-on-surface">No project selected</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Return to Dashboard and select a project to view its requirement traceability matrix.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-primary-fixed opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase bg-primary-fixed text-on-primary-fixed">
                {activeProject.title}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">reorder</span>
              Requirement Traceability Matrix
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
              Live mapping from requirements to tasks, test cases, bugs, and accepted evidence.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3">
              <p className="text-lg font-black text-on-surface">{matrix?.summary?.totalTasks || 0}</p>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Tasks</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3">
              <p className="text-lg font-black text-on-surface">{matrix?.summary?.totalTests || 0}</p>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Tests</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3">
              <p className="text-lg font-black text-error">{matrix?.summary?.openBugs || 0}</p>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Bugs</p>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl px-4 py-3">
              <p className="text-lg font-black text-[#047857]">{matrix?.summary?.acceptedEvidence || 0}</p>
              <p className="text-[10px] uppercase font-bold text-on-surface-variant">Evidence</p>
            </div>
          </div>
        </section>

        <RtmSummaryCards summary={matrix?.summary} />

        <RtmToolbar
          filters={filters}
          onFilterChange={handleFilterChange}
          priorityOptions={priorityOptions}
          statusOptions={statusOptions}
          onRefresh={loadMatrix}
          onSaveSnapshot={handleSaveSnapshot}
          onToggleSnapshots={() => setShowSnapshots(true)}
          loading={loading}
          saving={saving}
        />

        {loading && !matrix ? (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            <p className="mt-4 text-sm font-bold text-on-surface-variant">Loading traceability matrix...</p>
          </section>
        ) : (
          <RtmMatrixTable rows={filteredRows} onSelectRow={setSelectedRow} />
        )}
      </div>

      <RtmDetailDrawer row={selectedRow} onClose={() => setSelectedRow(null)} />
      <RtmSnapshotPanel
        open={showSnapshots}
        snapshots={snapshots}
        loading={snapshotLoading}
        onClose={() => setShowSnapshots(false)}
      />
    </main>
  )
}

export default RtmPage
