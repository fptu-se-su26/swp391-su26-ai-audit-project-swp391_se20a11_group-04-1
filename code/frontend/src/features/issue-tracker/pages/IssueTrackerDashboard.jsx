import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import bugService from '../services/bugService'
import taskService from '../../kanban/services/taskService'
import axiosInstance from '@/api/axiosConfig'

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
  const [expandedIssues, setExpandedIssues] = useState({})
  // Sub-task inline creation: { [rowId]: { text: '', loading: false } }
  const [addingSubtask, setAddingSubtask] = useState({})

  const [newIssue, setNewIssue] = useState({
    uiType: null, // null means showing template selection
    title: '',
    description: '',
    severity: 'MEDIUM',
    environment: 'DEV',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    priority: 'MEDIUM',
    taskType: 'DEVELOPMENT',
    deadline: '',
    assigneeId: ''
  })

  const toggleExpand = (e, id) => {
    e.stopPropagation()
    setExpandedIssues(prev => ({ ...prev, [id]: !prev[id] }))
  }
  const loadBugs = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const bugsResponse = await bugService.getProjectBugs(projectId) || []
      const tasksResponse = await taskService.getProjectTasks(projectId) || []

      const mappedBugs = bugsResponse.map(b => ({
        ...b,
        isBug: true,
        displayTitle: b.title,
        displayType: 'Bug Report',
        displaySeverity: b.severity,
        displayEnv: b.environment,
        displayStatus: b.status,
      }))

      // Include BUG_FIX tasks so they can be attached as children
      const allTasks = tasksResponse.map(t => ({
        ...t,
        isBug: false,
        displayTitle: t.title,
        displayType: t.type === 'DEVELOPMENT' ? 'Feature / Task'
                   : t.type === 'BUG_FIX'     ? 'Fix Bug Task'
                   : t.type === 'TESTING'     ? 'Test Task'
                   : t.type === 'REFACTOR'    ? 'Refactor Task'
                   : t.type,
        displaySeverity: t.priority,
        displayEnv: 'N/A',
        displayStatus: t.status,
      }))

      const subTasksByParentId = {}
      allTasks.filter(t => t.parentId).forEach(sub => {
        if (!subTasksByParentId[sub.parentId]) {
          subTasksByParentId[sub.parentId] = []
        }
        subTasksByParentId[sub.parentId].push(sub)
      })

      // Map relatedTaskId -> fixBugTask for quick lookup
      const fixBugTaskById = {}
      allTasks.filter(t => t.type === 'BUG_FIX').forEach(t => {
        fixBugTaskById[t.id] = {
          ...t,
          subTasks: subTasksByParentId[t.id] || []
        }
      })

      // Attach fix-bug task as a child to its parent bug report
      const bugsWithChildren = mappedBugs.map(bug => ({
        ...bug,
        fixTask: bug.relatedTaskId ? fixBugTaskById[bug.relatedTaskId] || null : null,
      }))

      // Top-level list = bug reports + non-BUG_FIX top-level tasks
      const topLevelTasks = allTasks.filter(t => !t.parentId && t.type !== 'BUG_FIX').map(t => ({
        ...t,
        subTasks: subTasksByParentId[t.id] || []
      }))

      const combined = [...bugsWithChildren, ...topLevelTasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setBugs(combined)
    } catch (err) {
      console.error('Error loading issues:', err)
      toast.error('Unable to load project issues')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadBugs()
  }, [loadBugs])

  useEffect(() => {
    const handleRefreshBugs = (e) => {
      const { projectId: eventProjectId } = e.detail || {}
      if (String(eventProjectId) === String(projectId)) {
        loadBugs()
      }
    }
    window.addEventListener('refresh-bugs', handleRefreshBugs)
    return () => {
      window.removeEventListener('refresh-bugs', handleRefreshBugs)
    }
  }, [projectId, loadBugs])

  const triggerCreateSubtask = (e, issue) => {
    e.stopPropagation()
    const targetTaskId = issue.isBug ? issue.relatedTaskId : issue.id
    if (!targetTaskId) {
      toast.error('This issue has no associated task to add sub-tasks to. Approve the bug first.')
      return
    }

    setNewIssue({
      uiType: null, // Allow choosing template/type!
      title: '',
      description: '',
      severity: 'MEDIUM',
      environment: 'DEV',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
      priority: 'MEDIUM',
      taskType: 'DEVELOPMENT',
      deadline: '',
      parentId: targetTaskId,
      parentTitle: issue.displayTitle,
      assigneeId: ''
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setNewIssue({
      uiType: null,
      title: '',
      description: '',
      severity: 'MEDIUM',
      environment: 'DEV',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
      priority: 'MEDIUM',
      taskType: 'DEVELOPMENT',
      deadline: '',
      assigneeId: ''
    })
  }

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  // Filtered List computations
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const statusMatches = filters.status === 'ALL' || bug.displayStatus === filters.status
      const severityMatches = filters.severity === 'ALL' || bug.displaySeverity === filters.severity
      const envMatches = filters.environment === 'ALL' || bug.displayEnv === filters.environment
      return statusMatches && severityMatches && envMatches
    })
  }, [bugs, filters])

  // Count stats
  const stats = useMemo(() => {
    const total = bugs.length
    const open = bugs.filter(b => b.displayStatus === 'OPEN').length
    const drafts = bugs.filter(b => b.isBug && b.relatedTaskId === null).length
    const fixed = bugs.filter(b => b.displayStatus === 'CLOSED' || b.displayStatus === 'FIXED' || b.displayStatus === 'DONE').length
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

  const handleCreateIssue = async (e) => {
    e.preventDefault()

    if (!newIssue.title.trim()) {
      toast.error('Issue title is required!')
      return
    }

    setModalLoading(true)
    try {
      if (newIssue.uiType === 'BUG') {
        const payload = {
          title: newIssue.title.trim(),
          description: newIssue.description,
          severity: newIssue.severity,
          environment: newIssue.environment,
          stepsToReproduce: newIssue.stepsToReproduce,
          expectedResult: newIssue.expectedResult,
          actualResult: newIssue.actualResult,
          assignedToId: newIssue.assigneeId ? Number(newIssue.assigneeId) : null
        }
        await bugService.createBug(projectId, payload)
        toast.success('Bug report created successfully!')
      } else if (newIssue.uiType === 'BUG_FIX') {
        const payload = {
          title: newIssue.title.trim(),
          description: newIssue.description,
          type: 'BUG_FIX',
          priority: newIssue.priority,
          deadline: newIssue.deadline || null,
          parentId: newIssue.parentId || null,
          primaryAssigneeId: newIssue.assigneeId ? Number(newIssue.assigneeId) : null
        }
        await taskService.createTask(projectId, payload)
        toast.success(newIssue.parentId ? 'Sub-task created!' : 'Fix Bug Task created!')
      } else {
        // For FEATURE, REFACTOR, TEST, BLANK
        const payload = {
          title: newIssue.title.trim(),
          description: newIssue.description,
          type: newIssue.taskType,
          priority: newIssue.priority,
          deadline: newIssue.deadline || null,
          parentId: newIssue.parentId || null,
          primaryAssigneeId: newIssue.assigneeId ? Number(newIssue.assigneeId) : null
        }
        await taskService.createTask(projectId, payload)
        toast.success(newIssue.parentId ? 'Sub-task created!' : 'Task created!')
      }

      // Always reload list and close modal
      await loadBugs()
      setIsModalOpen(false)
      setNewIssue({
        uiType: null,
        title: '',
        description: '',
        severity: 'MEDIUM',
        environment: 'DEV',
        stepsToReproduce: '',
        expectedResult: '',
        actualResult: '',
        priority: 'MEDIUM',
        taskType: 'DEVELOPMENT',
        deadline: '',
        assigneeId: ''
      })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file issue')
    } finally {
      setModalLoading(false)
    }
  }

  const handleToggleChecklist = async (taskEntity, itemId, isDone) => {
    const updatedChecklist = taskEntity.checklist.map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    )

    setBugs(prev => prev.map(b => {
      if (!b.isBug && b.id === taskEntity.id) {
        return { ...b, checklist: updatedChecklist }
      }
      if (b.isBug && b.fixTask && b.fixTask.id === taskEntity.id) {
        return { ...b, fixTask: { ...b.fixTask, checklist: updatedChecklist } }
      }
      if (!b.isBug && b.subTasks) {
        const updatedSubs = b.subTasks.map(s => s.id === taskEntity.id ? { ...s, checklist: updatedChecklist } : s)
        return { ...b, subTasks: updatedSubs }
      }
      if (b.isBug && b.fixTask && b.fixTask.subTasks) {
        const updatedSubs = b.fixTask.subTasks.map(s => s.id === taskEntity.id ? { ...s, checklist: updatedChecklist } : s)
        return { ...b, fixTask: { ...b.fixTask, subTasks: updatedSubs } }
      }
      return b
    }))

    try {
      const payload = {
        title: taskEntity.title,
        description: taskEntity.description,
        type: taskEntity.type,
        priority: taskEntity.priority,
        status: taskEntity.status,
        primaryAssigneeId: taskEntity.primaryAssignee?.id || null,
        sprintId: taskEntity.sprintId || null,
        checklist: updatedChecklist.map(item => ({
          id: item.id,
          content: item.content,
          done: item.id === itemId ? !isDone : item.done
        }))
      }
      await axiosInstance.put(`/v1/tasks/${taskEntity.id}`, payload)
      toast.success('Checklist updated!')
    } catch (err) {
      console.error('Failed to toggle checklist item:', err)
      toast.error('Failed to sync checklist update')
      loadBugs()
    }
  }

  const handleAddChecklistItem = async (taskEntity, content) => {
    if (!content || !content.trim()) return

    const currentChecklist = taskEntity.checklist || []
    const updatedChecklist = [
      ...currentChecklist,
      {
        id: 'temp-' + Date.now(),
        content: content.trim(),
        done: false,
        orderIndex: currentChecklist.length
      }
    ]

    try {
      const payload = {
        title: taskEntity.title,
        description: taskEntity.description,
        type: taskEntity.type,
        priority: taskEntity.priority,
        status: taskEntity.status,
        primaryAssigneeId: taskEntity.primaryAssignee?.id || null,
        sprintId: taskEntity.sprintId || null,
        checklist: updatedChecklist.map(item => ({
          content: item.content,
          done: item.done
        }))
      }
      await axiosInstance.put(`/v1/tasks/${taskEntity.id}`, payload)
      toast.success('Requirement added!')
      loadBugs()
    } catch (err) {
      console.error('Failed to add checklist item:', err)
      toast.error('Failed to add requirement')
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

  const getTaskTypeBadge = (type) => {
    switch (type) {
      case 'BUG_FIX':
      case 'Fix Bug Task':
        return 'bg-red-500/10 text-red-600 border border-red-500/20'
      case 'DEVELOPMENT':
      case 'Feature / Task':
        return 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
      case 'TESTING':
      case 'Test Task':
        return 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
      case 'REFACTOR':
      case 'Refactor Task':
        return 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
      default:
        return 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
    }
  }

  const getStatusBadge = (bug) => {
    if (bug.isBug && bug.relatedTaskId === null) {
      return <span className="text-[10px] font-black tracking-wider uppercase bg-gray-500/10 text-gray-500 border border-gray-500/25 px-2 py-0.5 rounded">DRAFT</span>
    }
    switch (bug.displayStatus) {
      case 'CLOSED':
      case 'FIXED':
      case 'DONE':
        return <span className="text-[10px] font-black tracking-wider uppercase bg-green-500/10 text-green-600 border border-green-500/25 px-2 py-0.5 rounded">CLOSED</span>
      case 'IN_PROGRESS':
        return <span className="text-[10px] font-black tracking-wider uppercase bg-blue-500/10 text-blue-600 border border-blue-500/25 px-2 py-0.5 rounded">IN PROGRESS</span>
      case 'OPEN':
      case 'TODO':
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
              <span>File New Issue</span>
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
                <option value="OPEN">Active (Open/Todo)</option>
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
          <section className="flex flex-col gap-2">
            {filteredBugs.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant font-medium text-sm">No issues found matching the criteria.</div>
            ) : filteredBugs.map((bug) => {
              const rowId = bug.isBug ? `bug-${bug.id}` : `task-${bug.id}`
              const isExpanded = !!expandedIssues[rowId]
              const gitHubNumber = bug.isBug ? getGitHubIssueNumber(bug.stepsToReproduce) : bug.githubIssueNumber;
              
              return (
                <div key={rowId} className="flex flex-col bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm overflow-hidden hover:border-primary/45 transition-colors">
                  {/* Row Header */}
                  <div
                    onClick={(e) => toggleExpand(e, rowId)}
                    className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 cursor-pointer group"
                  >
                    {/* Left Expand Chevron */}
                    <div className="flex-shrink-0 w-6 flex justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                      <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </div>

                    <div className="flex-shrink-0 flex justify-center">
                      <span className={`material-symbols-outlined text-lg ${bug.isBug ? 'text-red-500' : 'text-blue-500'}`}>
                        {bug.isBug ? 'bug_report' : 'task'}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-[200px] flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{bug.displayType}</span>
                        {gitHubNumber && (
                          <span className="text-[9px] font-bold bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.25 rounded flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[9px] font-bold">settings_ethernet</span>
                            #{gitHubNumber}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm text-on-surface leading-snug truncate group-hover:text-primary transition-colors">
                        {bug.displayTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold uppercase bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded hidden sm:inline-block">
                        Env: {bug.displayEnv}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden md:inline-block ${getSeverityColor(bug.displaySeverity)}`}>
                        {bug.displaySeverity}
                      </span>
                      {getStatusBadge(bug)}
                      
                      {isLeader && bug.isBug && bug.relatedTaskId === null && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveBug(e, bug.id);
                          }}
                          disabled={approvingId === bug.id}
                          className="py-1 px-3 bg-primary hover:bg-primary/95 text-on-primary text-[10px] font-bold rounded-lg transition-all shadow flex items-center gap-1 disabled:opacity-50"
                        >
                          {approvingId === bug.id ? (
                            <span className="material-symbols-outlined text-[10px] animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[10px]">task_alt</span>
                          )}
                          Approve
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (bug.isBug) {
                            navigate(`/projects/${projectId}/issues/${bug.id}`)
                          } else {
                            toast('This is a Feature/Task. Please view it in Kanban Board for full details.')
                            navigate(`/projects/${projectId}/kanban`)
                          }
                        }}
                        className="py-1.5 px-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-bold rounded-lg transition-colors border border-outline-variant flex items-center gap-1"
                      >
                        Details
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content (Tree View) */}
                  {isExpanded && (() => {
                    const parentChecklist = bug.isBug ? (bug.fixTask?.checklist || []) : (bug.checklist || [])
                    const canHaveChecklist = (!bug.isBug) || (bug.isBug && bug.relatedTaskId)
                    
                    return (
                      <div className="bg-surface-container-low border-t border-outline-variant/30 py-4 flex flex-col relative">
                        {/* Vertical line connecting children */}
                        <div className="absolute left-7 top-0 bottom-6 w-0.5 bg-blue-600 rounded-full hidden sm:block"></div>
                        
                        {/* Parent Description */}
                        <div className="pl-14 pr-6 pb-3">
                          <strong className="text-xs text-on-surface-variant uppercase tracking-wider">Description</strong>
                          <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-xs text-on-surface font-semibold">{bug.description || 'No description provided.'}</p>
                        </div>

                        {/* Parent Checklist Requirements */}
                        {canHaveChecklist && (
                          <div className="mt-2.5 pb-2">
                            <div className="pl-14 pr-6 pb-1.5 flex items-center gap-2">
                               <span className="material-symbols-outlined text-sm font-bold text-primary">rule</span>
                               <strong className="text-xs text-on-surface-variant uppercase tracking-wider">Requirements Checklist (Các bước thực hiện)</strong>
                            </div>
                            {parentChecklist.length > 0 ? (
                              <ul className="flex flex-col mb-2">
                                {parentChecklist.map(item => (
                                  <li key={item.id} className="flex items-center gap-3 py-1.5 pl-14 pr-6 hover:bg-surface-container-highest transition-colors border-l-2 border-transparent hover:border-primary">
                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={item.done}
                                        onChange={() => {
                                          const taskEntity = bug.isBug ? bug.fixTask : bug
                                          handleToggleChecklist(taskEntity, item.id, item.done)
                                        }}
                                        className="accent-primary h-4 w-4 shrink-0 rounded border-outline-variant cursor-pointer"
                                      />
                                      <span className={`text-sm ${item.done ? 'line-through text-on-surface/50 font-medium' : 'text-on-surface font-semibold'}`}>
                                        {item.content}
                                      </span>
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <div className="pl-14 pr-6 py-1 mb-2">
                                <p className="text-xs text-on-surface-variant italic">No checklist requirements defined for this parent task.</p>
                              </div>
                            )}
                            
                            {/* Inline input to add checklist item to parent */}
                            <div className="pl-14 pr-6 py-1">
                              <div className="flex items-center gap-2 max-w-md">
                                <input
                                  type="text"
                                  id={`new-parent-checklist-input-${bug.id}`}
                                  placeholder="Add checklist requirement for parent task..."
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const taskEntity = bug.isBug ? bug.fixTask : bug
                                      handleAddChecklistItem(taskEntity, e.target.value)
                                      e.target.value = ''
                                    }
                                  }}
                                  className="flex-1 px-3 py-1.5 text-xs bg-surface-container-low border border-outline-variant/60 rounded-lg focus:outline-none focus:border-primary text-on-surface font-semibold"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const input = document.getElementById(`new-parent-checklist-input-${bug.id}`)
                                    if (input && input.value.trim()) {
                                      const taskEntity = bug.isBug ? bug.fixTask : bug
                                      handleAddChecklistItem(taskEntity, input.value)
                                      input.value = ''
                                    }
                                  }}
                                  className="flex items-center justify-center p-1.5 bg-primary text-on-primary hover:bg-primary/90 rounded-lg shadow transition-all cursor-pointer shrink-0"
                                >
                                  <span className="material-symbols-outlined text-sm font-bold">add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Add Sub-task Button */}
                        {canHaveChecklist && (
                          <div className="pl-14 pr-6 pt-2 pb-3 border-b border-outline-variant/20 mb-4">
                            <button
                              type="button"
                              onClick={(e) => triggerCreateSubtask(e, bug)}
                              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary-hover transition-colors py-1.5 bg-surface-container-high/65 hover:bg-surface-container-highest px-3 rounded-lg border border-outline-variant/60 shadow-sm font-bold"
                            >
                              <span className="material-symbols-outlined text-sm font-bold">add_circle</span>
                              Create Sub-task (Full Form)
                            </button>
                          </div>
                        )}

                        {/* SUB-TASKS BLOCK FOR BUGS */}
                        {bug.isBug && bug.fixTask && (
                          <div className="flex flex-col">
                            {/* Fix Bug Task Header */}
                            <div
                              className="flex items-center gap-3 pl-10 pr-4 py-2.5 bg-surface-container-high/40 border-y border-outline-variant/20 hover:bg-surface-container-high transition-colors cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation()
                                toast('Fix Bug Task is on Kanban Board.')
                                navigate(`/projects/${projectId}/kanban`)
                              }}
                            >
                              <div className="flex-shrink-0 flex items-center gap-1 text-outline">
                                <span className="w-4 h-px bg-outline/40 inline-block"></span>
                                <span className="material-symbols-outlined text-amber-500 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>build_circle</span>
                              </div>
                              <div className="flex-1 flex items-center justify-between gap-3">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Fix Bug Task</span>
                                  <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">{bug.fixTask.displayTitle}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getSeverityColor(bug.fixTask.displaySeverity)}`}>
                                    {bug.fixTask.displaySeverity}
                                  </span>
                                  {getStatusBadge(bug.fixTask)}
                                </div>
                              </div>
                            </div>

                            {/* Sub-tasks checklist render for Bug's fixTask */}
                            {bug.fixTask.subTasks && bug.fixTask.subTasks.length > 0 && (
                              <div className="flex flex-col bg-surface-container-low/40">
                                {bug.fixTask.subTasks.map((sub) => (
                                  <div
                                    key={`sub-${sub.id}`}
                                    className="flex flex-col border-b border-outline-variant/10 last:border-b-0 p-3 pl-14 pr-4 bg-surface-container-low/20"
                                  >
                                    <div
                                      className="flex items-center gap-3 cursor-pointer group mb-2"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(`/projects/${projectId}/kanban`)
                                      }}
                                    >
                                      <div className="flex-shrink-0 flex items-center gap-1 text-outline">
                                        <span className="material-symbols-outlined text-blue-500 text-base">subdirectory_arrow_right</span>
                                      </div>
                                      <div className="flex-1 flex items-center justify-between gap-3">
                                        <div className="flex flex-col items-start gap-1">
                                          <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.25 rounded-md ${getTaskTypeBadge(sub.displayType)}`}>
                                            {sub.displayType}
                                          </span>
                                          <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">{sub.displayTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getSeverityColor(sub.displaySeverity)}`}>
                                            {sub.displaySeverity}
                                          </span>
                                          {getStatusBadge(sub)}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Checklist for Bug Subtask */}
                                    <div className="pl-6 space-y-2.5">
                                      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Subtask Checklist Requirements</span>
                                      </div>
                                      {sub.checklist && sub.checklist.length > 0 ? (
                                        <div className="space-y-1.5">
                                          {sub.checklist.map(item => (
                                            <label
                                              key={item.id}
                                              className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-high/40 p-1 rounded transition-colors select-none"
                                            >
                                              <input
                                                type="checkbox"
                                                checked={item.done}
                                                onChange={() => handleToggleChecklist(sub, item.id, item.done)}
                                                className="accent-primary h-3.5 w-3.5 shrink-0 rounded border-outline-variant cursor-pointer"
                                              />
                                              <span className={`text-xs ${item.done ? 'line-through text-on-surface/50 font-medium' : 'text-on-surface font-semibold'}`}>
                                                {item.content}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-on-surface-variant italic">No requirements checklist defined for this sub-task.</p>
                                      )}
                                      <div className="flex items-center gap-2 max-w-sm mt-1">
                                        <input
                                          type="text"
                                          id={`new-subtask-checklist-input-${sub.id}`}
                                          placeholder="Add subtask requirement..."
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleAddChecklistItem(sub, e.target.value)
                                              e.target.value = ''
                                            }
                                          }}
                                          className="flex-1 px-2 py-1 text-[10px] bg-surface-container-low border border-outline-variant/60 rounded-md focus:outline-none focus:border-primary text-on-surface font-semibold"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const input = document.getElementById(`new-subtask-checklist-input-${sub.id}`)
                                            if (input && input.value.trim()) {
                                              handleAddChecklistItem(sub, input.value)
                                              input.value = ''
                                            }
                                          }}
                                          className="flex items-center justify-center p-1 bg-primary text-on-primary hover:bg-primary/90 rounded-md shadow transition-all cursor-pointer shrink-0"
                                        >
                                          <span className="material-symbols-outlined text-xs font-bold">add</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* SUB-TASKS BLOCK FOR NON-BUGS */}
                        {!bug.isBug && bug.subTasks && bug.subTasks.length > 0 && (
                          <div className="flex flex-col bg-surface-container-low/40">
                            {bug.subTasks.map((sub) => (
                              <div
                                key={`sub-${sub.id}`}
                                className="flex flex-col border-b border-outline-variant/10 last:border-b-0 p-3 pl-10 pr-4 bg-surface-container-low/20"
                              >
                                <div
                                  className="flex items-center gap-3 cursor-pointer group mb-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/projects/${projectId}/kanban`)
                                  }}
                                >
                                  <div className="flex-shrink-0 flex items-center gap-1 text-outline">
                                    <span className="material-symbols-outlined text-blue-500 text-base">subdirectory_arrow_right</span>
                                  </div>
                                  <div className="flex-1 flex items-center justify-between gap-3">
                                    <div className="flex flex-col items-start gap-1">
                                      <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.25 rounded-md ${getTaskTypeBadge(sub.displayType)}`}>
                                        {sub.displayType}
                                      </span>
                                      <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-colors truncate">{sub.displayTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getSeverityColor(sub.displaySeverity)}`}>
                                        {sub.displaySeverity}
                                      </span>
                                      {getStatusBadge(sub)}
                                    </div>
                                  </div>
                                </div>

                                {/* Checklist for Non-Bug Subtask */}
                                <div className="pl-6 space-y-2.5">
                                  <div className="flex items-center justify-between border-b border-outline-variant/20 pb-1">
                                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-wider">Subtask Checklist Requirements</span>
                                  </div>
                                  {sub.checklist && sub.checklist.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {sub.checklist.map(item => (
                                        <label
                                          key={item.id}
                                          className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-high/40 p-1 rounded transition-colors select-none"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={item.done}
                                            onChange={() => handleToggleChecklist(sub, item.id, item.done)}
                                            className="accent-primary h-3.5 w-3.5 shrink-0 rounded border-outline-variant cursor-pointer"
                                          />
                                          <span className={`text-xs ${item.done ? 'line-through text-on-surface/50 font-medium' : 'text-on-surface font-semibold'}`}>
                                            {item.content}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-on-surface-variant italic">No requirements checklist defined for this sub-task.</p>
                                  )}
                                  <div className="flex items-center gap-2 max-w-sm mt-1">
                                    <input
                                      type="text"
                                      id={`new-nonbug-subtask-checklist-input-${sub.id}`}
                                      placeholder="Add subtask requirement..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          handleAddChecklistItem(sub, e.target.value)
                                          e.target.value = ''
                                        }
                                      }}
                                      className="flex-1 px-2 py-1 text-[10px] bg-surface-container-low border border-outline-variant/60 rounded-md focus:outline-none focus:border-primary text-on-surface font-semibold"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const input = document.getElementById(`new-nonbug-subtask-checklist-input-${sub.id}`)
                                        if (input && input.value.trim()) {
                                          handleAddChecklistItem(sub, input.value)
                                          input.value = ''
                                        }
                                      }}
                                      className="flex items-center justify-center p-1 bg-primary text-on-primary hover:bg-primary/90 rounded-md shadow transition-all cursor-pointer shrink-0"
                                    >
                                      <span className="material-symbols-outlined text-xs font-bold">add</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })()}
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
                onClick={closeModal}
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>

              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/60">
                <span className="material-symbols-outlined text-primary text-2xl font-bold">add_task</span>
                <h2 className="text-lg font-black text-on-surface">
                  {newIssue.parentId ? `Create Sub-task under "${newIssue.parentTitle}"` : 'File New Issue'}
                </h2>
              </div>

              {newIssue.uiType === null ? (
                /* Step 1: Template Selection */
                <div className="space-y-3 py-2 animate-fade-in">
                  {[
                    { type: 'BUG',     title: 'Bug Report',           desc: 'Báo cáo lỗi trong code hoặc test',                         icon: 'bug_report' },
                    { type: 'BUG_FIX', title: 'Fix Bug Task',         desc: 'Tạo task để xử lý và sửa một bug cụ thể',                  icon: 'build_circle' },
                    { type: 'FEATURE', title: 'Feature Request',      desc: 'Đề xuất tính năng / class / method mới cần xây dựng',      icon: 'auto_awesome' },
                    { type: 'REFACTOR',title: 'Refactor / Tech Debt', desc: 'Cải thiện code hiện có mà không thay đổi hành vi',          icon: 'build' },
                    { type: 'TEST',    title: 'Test Task',             desc: 'Nhiệm vụ viết hoặc cải thiện unit test',                   icon: 'science' },
                    { type: 'BLANK',   title: 'Blank issue',           desc: 'Create a new issue from scratch',                           icon: 'article' },
                  ].map((tpl) => (
                    <div 
                      key={tpl.type}
                      onClick={() => {
                        let mappedTaskType = 'DEVELOPMENT';
                        if (tpl.type === 'TEST')    mappedTaskType = 'TESTING';
                        if (tpl.type === 'BUG_FIX') mappedTaskType = 'BUG_FIX';
                        setNewIssue(prev => ({ ...prev, uiType: tpl.type, taskType: mappedTaskType }));
                      }}
                      className="group flex items-center justify-between p-4 border border-outline-variant/50 hover:border-primary/50 hover:bg-surface-container-high rounded-xl cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">{tpl.icon}</span>
                        <div>
                          <h4 className="font-bold text-sm text-on-surface">{tpl.title}</h4>
                          <p className="text-xs text-on-surface-variant mt-0.5">{tpl.desc}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all">arrow_forward</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Step 2: Form View */
                <form onSubmit={handleCreateIssue} className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 mb-4 -mt-2">
                    <button 
                      type="button"
                      onClick={() => setNewIssue(prev => ({ ...prev, uiType: null }))}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">arrow_back</span>
                      Back to templates
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Title *</label>
                    <input
                      type="text"
                      value={newIssue.title}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Briefly describe the issue..."
                      className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface"
                      required
                    />
                  </div>

                  {/* DYNAMIC FIELDS: BUG */}
                  {newIssue.uiType === 'BUG' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-on-surface-variant pl-0.5">Severity</label>
                        <select
                          value={newIssue.severity}
                          onChange={(e) => setNewIssue(prev => ({ ...prev, severity: e.target.value }))}
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
                          value={newIssue.environment}
                          onChange={(e) => setNewIssue(prev => ({ ...prev, environment: e.target.value }))}
                          className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none text-on-surface"
                        >
                          <option value="DEV">Development</option>
                          <option value="STAGING">Staging</option>
                          <option value="PRODUCTION">Production</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* DYNAMIC FIELDS: NOT BUG (TASKS) */}
                  {newIssue.uiType !== 'BUG' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-on-surface-variant pl-0.5">Priority</label>
                        <select
                          value={newIssue.priority}
                          onChange={(e) => setNewIssue(prev => ({ ...prev, priority: e.target.value }))}
                          className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none text-on-surface"
                        >
                          <option value="CRITICAL">Critical</option>
                          <option value="HIGH">High</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="LOW">Low</option>
                        </select>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-on-surface-variant pl-0.5">Deadline</label>
                        <input
                          type="date"
                          value={newIssue.deadline}
                          onChange={(e) => setNewIssue(prev => ({ ...prev, deadline: e.target.value }))}
                          className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Description</label>
                    <textarea
                      value={newIssue.description}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide a general description of the issue or feature..."
                      rows={2.5}
                      className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Assignee</label>
                    <select
                      value={newIssue.assigneeId}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, assigneeId: e.target.value }))}
                      className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none text-on-surface font-semibold"
                    >
                      <option value="">Unassigned (No one)</option>
                      {(activeProject?.members || []).map(member => (
                        <option key={member.id} value={member.id}>
                          {member.fullName || member.username} ({member.role || 'Member'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* MORE DYNAMIC FIELDS: BUG */}
                  {newIssue.uiType === 'BUG' && (
                    <>
                      <div className="flex flex-col gap-1 animate-fade-in">
                        <label className="text-xs font-bold text-on-surface-variant pl-0.5">Steps to Reproduce</label>
                        <textarea
                          value={newIssue.stepsToReproduce}
                          onChange={(e) => setNewIssue(prev => ({ ...prev, stepsToReproduce: e.target.value }))}
                          placeholder="1. Go to...\n2. Click...\n3. Observe..."
                          rows={3}
                          className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-on-surface-variant pl-0.5">Expected Result</label>
                          <textarea
                            value={newIssue.expectedResult}
                            onChange={(e) => setNewIssue(prev => ({ ...prev, expectedResult: e.target.value }))}
                            placeholder="What should have happened?"
                            rows={2}
                            className="px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-on-surface-variant pl-0.5">Actual Result</label>
                          <textarea
                            value={newIssue.actualResult}
                            onChange={(e) => setNewIssue(prev => ({ ...prev, actualResult: e.target.value }))}
                            placeholder="What actually went wrong?"
                            rows={2}
                            className="px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2 flex justify-end gap-3 border-t border-outline-variant/60">
                    <button
                      type="button"
                      onClick={closeModal}
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
                      <span>Save Draft</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default IssueTrackerDashboard;
