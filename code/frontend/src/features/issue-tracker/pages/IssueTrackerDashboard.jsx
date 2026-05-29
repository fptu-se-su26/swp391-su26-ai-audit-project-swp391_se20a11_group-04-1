import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import bugService from '../services/bugService'

export function IssueTrackerDashboard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)
  const currentUserId = useAuthStore((state) => state.userId)

  const [bugs, setBugs] = useState([])
  const [loading, setLoading] = useState(false)
  const [approvingId, setApprovingId] = useState(null)

  // Filter States
  const [filters, setFilters] = useState({
    status: 'ALL',
    severity: 'ALL',
    environment: 'ALL'
  })

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    environment: 'DEV',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: ''
  })

  const loadBugs = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const response = await bugService.getProjectBugs(projectId)
      setBugs(response || [])
    } catch (err) {
      console.error('Error loading bugs:', err)
      toast.error('Unable to load project bug reports')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadBugs()
  }, [loadBugs])

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Filtered List computations
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const statusMatches = filters.status === 'ALL' || bug.status === filters.status
      const severityMatches = filters.severity === 'ALL' || bug.severity === filters.severity
      const envMatches = filters.environment === 'ALL' || bug.environment === filters.environment
      return statusMatches && severityMatches && envMatches
    })
  }, [bugs, filters])

  // Count stats
  const stats = useMemo(() => {
    const total = bugs.length
    const open = bugs.filter(b => b.status === 'OPEN').length
    const drafts = bugs.filter(b => b.relatedTaskId === null).length
    const fixed = bugs.filter(b => b.status === 'CLOSED' || b.status === 'FIXED').length
    return { total, open, drafts, fixed }
  }, [bugs])

  const handleApproveBug = async (e, bugId) => {
    e.stopPropagation() // Prevent card click trigger details
    setApprovingId(bugId)
    try {
      await bugService.approveBug(bugId)
      toast.success('Bug approved! Synced to GitHub & Task Board.')
      loadBugs()
    } catch (err) {
      console.error('Error approving bug:', err)
      toast.error(err.response?.data?.message || 'Failed to approve bug report')
    } finally {
      setApprovingId(null)
    }
  }

  const handleCreateBug = async (e) => {
    e.preventDefault()
    if (!newBug.title.trim()) {
      toast.error('Bug title is required!')
      return
    }

    setModalLoading(true)
    try {
      await bugService.createBug(projectId, {
        ...newBug,
        title: newBug.title.trim()
      })
      toast.success('Bug report draft created successfully!')
      setIsModalOpen(false)
      // Reset Form
      setNewBug({
        title: '',
        description: '',
        severity: 'MEDIUM',
        environment: 'DEV',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: ''
      })
      loadBugs()
    } catch (err) {
      console.error('Error creating bug:', err)
      toast.error(err.response?.data?.message || 'Failed to file bug report')
    } finally {
      setModalLoading(false)
    }
  }

  const isLeader = activeProject?.role === 'Project Leader'

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-600 border border-red-500/20'
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
      case 'LOW':
      default:
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
    }
  }

  const getStatusBadge = (bug) => {
    if (bug.relatedTaskId === null) {
      return <span className="text-[10px] font-black tracking-wider uppercase bg-gray-500/10 text-gray-500 border border-gray-500/25 px-2 py-0.5 rounded">DRAFT</span>
    }
    switch (bug.status) {
      case 'CLOSED':
      case 'FIXED':
        return <span className="text-[10px] font-black tracking-wider uppercase bg-green-500/10 text-green-600 border border-green-500/25 px-2 py-0.5 rounded">CLOSED</span>
      case 'IN_PROGRESS':
        return <span className="text-[10px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-600 border border-blue-500/25 px-2 py-0.5 rounded">IN PROGRESS</span>
      case 'OPEN':
      default:
        return <span className="text-[10px] font-black tracking-wider uppercase bg-rose-500/10 text-rose-600 border border-rose-500/25 px-2 py-0.5 rounded">ACTIVE</span>
    }
  }

  // Parse GitHub issue number from metadata if present
  const getGitHubIssueNumber = (stepsToReproduce) => {
    if (!stepsToReproduce) return null
    try {
      const meta = JSON.parse(stepsToReproduce)
      return meta.github_issue_number || null
    } catch {
      return null
    }
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      {/* Blurred background visuals */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-primary-fixed opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header toolbar */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase bg-primary-fixed text-on-primary-fixed">
                {activeProject?.title || 'DevTrack AI'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary font-bold">bug_report</span>
              Issue Tracker
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
              Log code errors, manage quality workflows, and synchronize directly with active GitHub repository issues.
            </p>
          </div>

          <div className="flex gap-2 self-stretch sm:self-auto">
            {isLeader && (
              <button
                onClick={() => navigate(`/projects/${projectId}/github-config`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 border border-outline-variant hover:bg-surface-container-high text-on-surface text-sm font-bold rounded-xl transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-sm font-bold">settings_ethernet</span>
                <span>GitHub Config</span>
              </button>
            )}

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-5 bg-primary text-on-primary hover:bg-primary/95 text-sm font-bold rounded-xl transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              <span>Log Bug Report</span>
            </button>
          </div>
        </section>

        {/* Mini stats counters */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-black text-on-surface">{stats.total}</p>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant mt-0.5">Total Bugs Logged</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-black text-rose-600">{stats.open}</p>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant mt-0.5">Active Fixing Issues</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-black text-amber-600">{stats.drafts}</p>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant mt-0.5">Draft Reports (Unapproved)</p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 shadow-sm">
            <p className="text-2xl font-black text-emerald-700">{stats.fixed}</p>
            <p className="text-[10px] uppercase font-bold text-on-surface-variant mt-0.5">Resolved Bugs (Closed)</p>
          </div>
        </section>

        {/* Toolbar Filters */}
        <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3.5 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-on-surface-variant pl-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface font-semibold focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Drafts (Unapproved)</option>
                <option value="OPEN">Active (Open)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed / Resolved</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-on-surface-variant pl-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface font-semibold focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase text-on-surface-variant pl-1">Environment</label>
              <select
                value={filters.environment}
                onChange={(e) => handleFilterChange('environment', e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface font-semibold focus:outline-none"
              >
                <option value="ALL">All Environments</option>
                <option value="DEV">Development</option>
                <option value="STAGING">Staging</option>
                <option value="PRODUCTION">Production</option>
              </select>
            </div>
          </div>

          <button
            onClick={loadBugs}
            className="flex items-center justify-center gap-1 py-2 px-3.5 border border-outline-variant hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all text-primary shrink-0 self-start md:self-auto"
          >
            <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span>Refresh list</span>
          </button>
        </section>

        {/* Bug Reports Grid List */}
        {loading ? (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-16 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            <p className="mt-4 text-sm font-bold text-on-surface-variant">Scanning repository for logged issues...</p>
          </section>
        ) : filteredBugs.length === 0 ? (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-16 text-center shadow-sm space-y-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">check_circle</span>
            <h3 className="font-extrabold text-lg text-on-surface">No Bug Reports Found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              No bugs matching the current filters were found in this project. Congratulations on high quality code!
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBugs.map((bug) => {
              const gitHubNumber = getGitHubIssueNumber(bug.stepsToReproduce)
              return (
                <div
                  key={bug.id}
                  onClick={() => navigate(`/projects/${projectId}/issues/${bug.id}`)}
                  className="bg-surface-container-lowest border border-outline-variant/60 hover:border-primary/45 rounded-2xl p-5 shadow-sm transition-all duration-200 cursor-pointer hover:shadow flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      {getStatusBadge(bug)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSeverityColor(bug.severity)}`}>
                        {bug.severity}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-on-surface leading-snug line-clamp-2">
                      {bug.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                      {bug.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="border-t border-outline-variant/50 pt-3 flex flex-wrap justify-between items-center gap-2">
                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[9px] font-bold uppercase bg-surface-container-high text-on-surface-variant px-1.5 py-0.25 rounded">
                        Env: {bug.environment}
                      </span>

                      {bug.relatedTaskId && (
                        <span className="text-[9px] font-bold bg-primary-fixed text-on-primary-fixed px-1.5 py-0.25 rounded flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[9px]">assignment</span>
                          Task #{bug.relatedTaskId}
                        </span>
                      )}

                      {gitHubNumber && (
                        <span className="text-[9px] font-bold bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.25 rounded flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[9px] font-bold">settings_ethernet</span>
                          GitHub #{gitHubNumber}
                        </span>
                      )}
                    </div>

                    {/* Quick Approve Action for Leader on Draft Bugs */}
                    {isLeader && bug.relatedTaskId === null && (
                      <button
                        onClick={(e) => handleApproveBug(e, bug.id)}
                        disabled={approvingId === bug.id}
                        className="py-1 px-3 bg-primary hover:bg-primary/95 text-on-primary text-[10px] font-bold rounded-lg transition-all shadow flex items-center gap-1 disabled:opacity-50"
                      >
                        {approvingId === bug.id ? (
                          <>
                            <span className="material-symbols-outlined text-[10px] animate-spin">progress_activity</span>
                            <span>Syncing...</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[10px]">task_alt</span>
                            <span>Approve & Sync</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {/* Modal: Log New Bug Draft */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-4 relative animate-scale-up">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/60">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">bug_report</span>
                <h2 className="text-lg font-black text-on-surface">File New Bug Report</h2>
              </div>

              <form onSubmit={handleCreateBug} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant pl-0.5">Bug Title *</label>
                  <input
                    type="text"
                    value={newBug.title}
                    onChange={(e) => setNewBug(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Briefly describe the defect (e.g. Stripe checkout page throws 500 error)"
                    className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Severity</label>
                    <select
                      value={newBug.severity}
                      onChange={(e) => setNewBug(prev => ({ ...prev, severity: e.target.value }))}
                      className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none text-on-surface"
                    >
                      <option value="CRITICAL">Critical (Crash/Data Loss)</option>
                      <option value="HIGH">High (Major blocks)</option>
                      <option value="MEDIUM">Medium (General error)</option>
                      <option value="LOW">Low (UI/Minor issues)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Environment</label>
                    <select
                      value={newBug.environment}
                      onChange={(e) => setNewBug(prev => ({ ...prev, environment: e.target.value }))}
                      className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none text-on-surface"
                    >
                      <option value="DEV">Development</option>
                      <option value="STAGING">Staging</option>
                      <option value="PRODUCTION">Production</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant pl-0.5">Detailed Description</label>
                  <textarea
                    value={newBug.description}
                    onChange={(e) => setNewBug(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Provide a general description of the issue..."
                    rows={2.5}
                    className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface-variant pl-0.5">Steps to Reproduce</label>
                  <textarea
                    value={newBug.stepsToReproduce}
                    onChange={(e) => setNewBug(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
                    placeholder="1. Go to...\n2. Click...\n3. Observe..."
                    rows={3}
                    className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Expected Result</label>
                    <textarea
                      value={newBug.expectedResult}
                      onChange={(e) => setNewBug(prev => ({ ...prev, expectedResult: e.target.value }))}
                      placeholder="What should have happened?"
                      rows={2}
                      className="px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Actual Result</label>
                    <textarea
                      value={newBug.actualResult}
                      onChange={(e) => setNewBug(prev => ({ ...prev, actualResult: e.target.value }))}
                      placeholder="What actually went wrong?"
                      rows={2}
                      className="px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3 border-t border-outline-variant/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="py-2 px-5 border border-outline-variant hover:bg-surface-container-high rounded-xl text-sm font-bold transition-all text-on-surface"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="py-2 px-6 bg-primary text-on-primary hover:bg-primary/95 rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {modalLoading && (
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                    )}
                    <span>Save Draft Bug</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default IssueTrackerDashboard;
