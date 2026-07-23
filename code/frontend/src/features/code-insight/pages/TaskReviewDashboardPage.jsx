import { useEffect, useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import useProjectStore from '@store/useProjectStore'
import TaskReviewService from '../services/taskReviewService'

export function TaskReviewDashboardPage() {
  const { projectId } = useParams()
  const activeProject = useProjectStore((state) => state.activeProject)
  
  const [reviewQueue, setReviewQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters state
  const [filterType, setFilterType] = useState('ALL')
  const [filterAssignee, setFilterAssignee] = useState('ALL')
  const [filterGate, setFilterGate] = useState('ALL')

  useEffect(() => {
    if (projectId) {
      loadReviewQueue()
    }
  }, [projectId])

  const loadReviewQueue = async () => {
    setLoading(true)
    try {
      const data = await TaskReviewService.getReviewQueue(projectId)
      setReviewQueue(data || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load Task Review queue')
    } finally {
      setLoading(false)
    }
  }

  // Derive filter options
  const typeOptions = useMemo(() => {
    const types = new Set(reviewQueue.map(item => item.task?.type).filter(Boolean))
    return ['ALL', ...Array.from(types)]
  }, [reviewQueue])

  const assigneeOptions = useMemo(() => {
    const assignees = new Set(reviewQueue.map(item => item.task?.assigneeName).filter(Boolean))
    return ['ALL', ...Array.from(assignees)]
  }, [reviewQueue])

  const getGateStatus = (item) => {
    const evidence = item.task?.evidenceSummary || {}
    const gate = item.task?.approvalGate || {}
    return gate.approvalStatus || (evidence.riskLevel === 'BLOCKED' ? 'BLOCKED' : evidence.riskLevel === 'WARNING' ? 'CAN_APPROVE_WITH_WARNING' : 'CAN_APPROVE')
  }

  // Filtered Data
  const filteredQueue = useMemo(() => {
    return reviewQueue.filter(item => {
      const matchType = filterType === 'ALL' || item.task?.type === filterType
      const matchAssignee = filterAssignee === 'ALL' || item.task?.assigneeName === filterAssignee
      const matchGate = filterGate === 'ALL' || getGateStatus(item) === filterGate
      return matchType && matchAssignee && matchGate
    })
  }, [reviewQueue, filterType, filterAssignee, filterGate])

  // Metrics
  const metrics = useMemo(() => {
    let ready = 0, warning = 0, blocked = 0;
    reviewQueue.forEach(item => {
      const status = getGateStatus(item)
      if (status === 'BLOCKED') blocked++
      else if (status === 'CAN_APPROVE_WITH_WARNING') warning++
      else ready++
    })
    return {
      total: reviewQueue.length,
      ready,
      warning,
      blocked
    }
  }, [reviewQueue])

  const getGateBadge = (status) => {
    if (status === 'BLOCKED') return <span className="bg-error-container text-error px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">lock</span> Blocked</span>
    if (status === 'CAN_APPROVE_WITH_WARNING') return <span className="bg-[#fef3c7] text-[#92400e] px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">warning</span> Warning</span>
    return <span className="bg-[#dcfce7] text-[#166534] px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max"><span className="material-symbols-outlined text-[14px]">check_circle</span> Ready</span>
  }

  if (loading) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
        <div className="flex items-center justify-center h-full">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      {/* Glow Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] rounded-full bg-tertiary-fixed opacity-[0.08] blur-[120px]"></div>
      </div>

      <div className="relative z-10 w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary-container/50 text-primary text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md uppercase">
                {activeProject?.major || 'PROJ'} • {activeProject?.semester || 'SEM'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface">Task Review</h1>
            <p className="text-on-surface-variant text-sm max-w-2xl">
              Monitor and evaluate pending task deliverables, check automated gate results, and ensure requirement alignment.
            </p>
          </div>
          <button
            onClick={loadReviewQueue}
            className="flex items-center gap-2 bg-surface text-on-surface border border-outline-variant px-4 py-2 rounded-xl font-bold text-sm hover:bg-surface-container-low transition-all shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh Queue
          </button>
        </div>

        {/* Metrics Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group cursor-default">
            <div>
              <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider block mb-1">Total Pending</span>
              <span className="text-3xl font-black text-on-surface group-hover:text-primary transition-colors">{metrics.total}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">inbox</span>
            </div>
          </div>
          
          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group cursor-default">
            <div>
              <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider block mb-1">Ready to Approve</span>
              <span className="text-3xl font-black text-on-surface group-hover:text-green-600 transition-colors">{metrics.ready}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-green-600 text-[22px]">verified</span>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group cursor-default">
            <div>
              <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider block mb-1">Needs Attention</span>
              <span className="text-3xl font-black text-on-surface group-hover:text-amber-500 transition-colors">{metrics.warning}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-amber-500 text-[22px]">warning</span>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant/40 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group cursor-default">
            <div>
              <span className="text-[11px] font-extrabold text-on-surface-variant uppercase tracking-wider block mb-1">Blocked</span>
              <span className="text-3xl font-black text-on-surface group-hover:text-error transition-colors">{metrics.blocked}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-error-container/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-error text-[22px]">lock</span>
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/60 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">filter_list</span>
            <span className="text-sm font-bold text-on-surface">Filters:</span>
          </div>
          <select 
            className="bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Types</option>
            {typeOptions.filter(t => t !== 'ALL').map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select 
            className="bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
          >
            <option value="ALL">All Assignees</option>
            {assigneeOptions.filter(a => a !== 'ALL').map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select 
            className="bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            value={filterGate}
            onChange={(e) => setFilterGate(e.target.value)}
          >
            <option value="ALL">All Gate Status</option>
            <option value="CAN_APPROVE">Ready</option>
            <option value="CAN_APPROVE_WITH_WARNING">Warning</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>

        {/* Table */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
          {error && (
            <div className="p-4 m-4 bg-error-container text-error rounded-xl font-semibold text-sm">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-bold border-b border-outline-variant/60">
                <tr>
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Assignee</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Gate Status</th>
                  <th className="px-6 py-4">Submitted</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-on-surface-variant">
                      No tasks found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map(item => (
                    <tr key={item.id} className="hover:bg-surface-container-low/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-on-surface">{item.task?.title}</div>
                        <div className="text-xs text-primary font-mono mt-1">{item.task?.requirementCode || 'NO-REQ'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[10px] font-bold">
                            {item.task?.assigneeName?.charAt(0) || '?'}
                          </div>
                          <span className="text-sm text-on-surface">{item.task?.assigneeName || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">
                        {item.task?.type || 'UNKNOWN'}
                      </td>
                      <td className="px-6 py-4">
                        {getGateBadge(getGateStatus(item))}
                      </td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">
                        {new Date(item.task?.updatedAt || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/projects/${projectId}/task-reviews/${item.task?.id}`}
                          className="inline-flex items-center gap-1.5 bg-primary text-white hover:bg-primary-hover hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        >
                          Review <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

export default TaskReviewDashboardPage
