import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import useAuthStore from '@store/useAuthStore'
import bugService from '../services/bugService'
import taskService from '../../kanban/services/taskService'
import axiosInstance from '@/api/axiosConfig'
import proposalService from '../services/proposalService'
import FeatureDiscussionModal from '../components/FeatureDiscussionModal'

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

const isBlankGitHubIssue = (item) => {
  return item?.description && item.description.includes('<!-- sync-source: github-blank');
}

const isFeatureProposal = (item) => {
  return item?.description && item.description.includes('<!-- sync-source: feature-proposal');
}

const isBlankDraft = (item) => {
  return item?.description && (item.description.includes('github-blank-draft') || item.description.includes('feature-proposal-draft'));
}

const cleanDescription = (desc) => {
  if (!desc) return '';
  return desc
    .replace(/<!--\s*sync-source:\s*github-blank(?:-draft|-approved)?\s*-->/g, '')
    .replace(/<!--\s*sync-source:\s*feature-proposal(?:-draft|-approved)?\s*-->/g, '')
    .trim();
}

export function IssueTrackerDashboard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const activeProject = useProjectStore((state) => state.activeProject)
  const currentUserId = useAuthStore((state) => state.userId)

  const [bugs, setBugs] = useState([])
  const [loading, setLoading] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [assigningTaskId, setAssigningTaskId] = useState(null)
  const [activeListTab, setActiveListTab] = useState('open')

  // Toggle states for stats and filters (inline, corresponding to image 2 buttons)
  const [showStats, setShowStats] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [assistiveOpen, setAssistiveOpen] = useState(false)

  // Dragging states & helpers for AssistiveTouch floating bubble
  const [position, setPosition] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, posX: 0, posY: 0, hasMoved: false })

  const getPositionStyle = (isPanel = false) => {
    if (!position) return {}
    if (isPanel) {
      const buttonWidth = 56
      const buttonHeight = 56
      const panelWidth = 256
      const panelHeight = 256
      
      let panelX = position.x + buttonWidth / 2 - panelWidth / 2
      let panelY = position.y + buttonHeight / 2 - panelHeight / 2
      
      const margin = 10
      panelX = Math.max(margin, Math.min(panelX, window.innerWidth - panelWidth - margin))
      panelY = Math.max(margin, Math.min(panelY, window.innerHeight - panelHeight - margin))
      
      return {
        left: `${panelX}px`,
        top: `${panelY}px`,
      }
    }
    return {
      left: `${position.x}px`,
      top: `${position.y}px`,
    }
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    const element = e.currentTarget
    const rect = element.getBoundingClientRect()
    
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: rect.left,
      posY: rect.top,
      hasMoved: false
    }
    
    setIsDragging(true)
    
    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - dragRef.current.startX
      const deltaY = moveEvent.clientY - dragRef.current.startY
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        dragRef.current.hasMoved = true
      }
      
      let newX = dragRef.current.posX + deltaX
      let newY = dragRef.current.posY + deltaY
      
      const margin = 10
      const maxW = window.innerWidth - rect.width - margin
      const maxH = window.innerHeight - rect.height - margin
      
      newX = Math.max(margin, Math.min(newX, maxW))
      newY = Math.max(margin, Math.min(newY, maxH))
      
      setPosition({ x: newX, y: newY })
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTouchStart = (e) => {
    const touch = e.touches[0]
    const element = e.currentTarget
    const rect = element.getBoundingClientRect()
    
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      posX: rect.left,
      posY: rect.top,
      hasMoved: false
    }
    
    setIsDragging(true)
    
    const handleTouchMove = (moveEvent) => {
      const moveTouch = moveEvent.touches[0]
      const deltaX = moveTouch.clientX - dragRef.current.startX
      const deltaY = moveTouch.clientY - dragRef.current.startY
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        dragRef.current.hasMoved = true
      }
      
      let newX = dragRef.current.posX + deltaX
      let newY = dragRef.current.posY + deltaY
      
      const margin = 10
      const maxW = window.innerWidth - rect.width - margin
      const maxH = window.innerHeight - rect.height - margin
      
      newX = Math.max(margin, Math.min(newX, maxW))
      newY = Math.max(margin, Math.min(newY, maxH))
      
      setPosition({ x: newX, y: newY })
    }
    
    const handleTouchEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }

  // Quick Feature Proposal state and handler
  const [quickProposalText, setQuickProposalText] = useState('')
  const [quickProposalLoading, setQuickProposalLoading] = useState(false)

  const handleQuickProposalSubmit = async (e) => {
    e.preventDefault()
    if (!quickProposalText.trim()) return

    setQuickProposalLoading(true)
    try {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const startDate = `${year}-${month}-${day}`

      const deadlineDate = new Date()
      deadlineDate.setDate(today.getDate() + 7)
      const dlYear = deadlineDate.getFullYear()
      const dlMonth = String(deadlineDate.getMonth() + 1).padStart(2, '0')
      const dlDay = String(deadlineDate.getDate()).padStart(2, '0')
      const deadline = `${dlYear}-${dlMonth}-${dlDay}`

      const payload = {
        title: quickProposalText.trim(),
        description: 'Quick feature proposal created from Dashboard.\n\n<!-- sync-source: feature-proposal-draft -->',
        type: 'DEVELOPMENT',
        priority: 'MEDIUM',
        startDate,
        deadline,
        parentId: null,
        primaryAssigneeId: null
      }
      await taskService.createTask(projectId, payload)
      toast.success('New feature proposal submitted successfully!')
      setQuickProposalText('')
      await loadBugs()
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit proposal!')
    } finally {
      setQuickProposalLoading(false)
    }
  }

  // Discussion Feature States
  const [discussSearchQuery, setDiscussSearchQuery] = useState('')
  const [activeDiscussTaskId, setActiveDiscussTaskId] = useState(null)
  const [activeProposals, setActiveProposals] = useState([])
  const [newProposalText, setNewProposalText] = useState('')
  const [proposalCommentsInputs, setProposalCommentsInputs] = useState({})
  const [expandedProposalComments, setExpandedProposalComments] = useState({})

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
  const loadBugs = useCallback(async (silent = false) => {
    if (!projectId) return
    if (!silent) setLoading(true)
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
          : t.type === 'BUG_FIX' ? 'Fix Bug Task'
            : t.type === 'TESTING' ? 'Test Task'
              : t.type === 'REFACTOR' ? 'Refactor Task'
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

      // Sort sub-tasks: active/open tasks first, closed/done tasks last
      Object.keys(subTasksByParentId).forEach(parentId => {
        subTasksByParentId[parentId].sort((a, b) => {
          const aClosed = a.status === 'CLOSED' || a.status === 'DONE' || a.status === 'FIXED';
          const bClosed = b.status === 'CLOSED' || b.status === 'DONE' || b.status === 'FIXED';
          if (aClosed !== bClosed) {
            return aClosed ? 1 : -1;
          }
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
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
      const topLevelTasks = allTasks.filter(t => {
        if (t.parentId || t.type === 'BUG_FIX') return false;
        
        // Show if it is a blank github issue (tagged proposal) or a feature proposal
        if (isBlankGitHubIssue(t) || isFeatureProposal(t)) return true;
        
        // For old tasks created before our tag implementation:
        // Show them if they are unassigned and have no github issue number
        const createdAtTime = t.createdAt ? new Date(t.createdAt).getTime() : Date.now();
        const thresholdTime = new Date('2026-07-06T01:15:00Z').getTime(); // July 6, 2026, 08:15 AM UTC+7
        
        if (createdAtTime < thresholdTime) {
          const hasAssignee = t.primaryAssignee || t.assignee || t.primaryAssigneeId || t.assigneeId;
          if (!t.githubIssueNumber && !hasAssignee && (t.status === 'TODO' || t.status === 'APPROVED')) {
            return true;
          }
          if (t.githubIssueNumber) {
            return true;
          }
        }
        
        return false;
      }).map(t => ({
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

  const openNewIssueModal = (initialTitle = '') => {
    setNewIssue({
      uiType: null,
      title: initialTitle || '',
      description: '',
      severity: 'MEDIUM',
      environment: 'DEV',
      stepsToReproduce: '',
      expectedResult: '',
      actualResult: '',
      priority: 'MEDIUM',
      taskType: 'DEVELOPMENT',
      deadline: '',
      assigneeId: '',
      parentId: null,
      parentTitle: ''
    })
    setIsModalOpen(true)
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
    // DRAFT = bugs whose backend status is DRAFT (pending leader approval)
    const drafts = bugs.filter(b => b.isBug && b.displayStatus === 'DRAFT').length
    const fixed = bugs.filter(b => b.displayStatus === 'CLOSED' || b.displayStatus === 'FIXED' || b.displayStatus === 'DONE').length
    return { total, open, drafts, fixed }
  }, [bugs])

  const handleApproveBug = async (e, bugId) => {
    e.stopPropagation() // Prevent card click trigger details
    setApprovingId(bugId)
    try {
      await bugService.approveBug(bugId)
      toast.success('Bug approved! Synced to GitHub & Task Board.')
      loadBugs(true)
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
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const startDate = `${year}-${month}-${day}`

      const deadlineDate = new Date()
      deadlineDate.setDate(today.getDate() + 7)
      const dlYear = deadlineDate.getFullYear()
      const dlMonth = String(deadlineDate.getMonth() + 1).padStart(2, '0')
      const dlDay = String(deadlineDate.getDate()).padStart(2, '0')
      const defaultDeadline = `${dlYear}-${dlMonth}-${dlDay}`

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
          startDate,
          deadline: newIssue.deadline || defaultDeadline,
          parentId: newIssue.parentId || null,
          primaryAssigneeId: newIssue.assigneeId ? Number(newIssue.assigneeId) : null
        }
        await taskService.createTask(projectId, payload)
        toast.success(newIssue.parentId ? 'Sub-task created!' : 'Fix Bug Task created!')
      } else {
        // For FEATURE, REFACTOR, TEST, BLANK
        const payload = {
          title: newIssue.title.trim(),
          description: (newIssue.description || '').trim() + '\n\n<!-- sync-source: feature-proposal-draft -->',
          type: newIssue.taskType,
          priority: newIssue.priority,
          startDate,
          deadline: newIssue.deadline || defaultDeadline,
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

  const isLeader = ['PROJECT_LEADER', 'LEADER', 'Project Leader', 'MENTOR'].includes(activeProject?.role)

  const canApproveReject = (assigneeId) => {
    if (!assigneeId) return false
    if (Number(assigneeId) === Number(currentUserId)) return false
    const member = activeProject?.members?.find(m => Number(m.id) === Number(assigneeId))
    const assigneeIsLeader = ['PROJECT_LEADER', 'LEADER', 'Project Leader', 'MENTOR'].includes(member?.role)
    if (assigneeIsLeader) {
      return true
    } else {
      return isLeader
    }
  }

  const formatSafeDate = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Just now'
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSafeTime = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Just now'
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSafeDateDiscuss = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    const pad = (num) => String(num).padStart(2, '0')
    const day = pad(date.getDate())
    const month = pad(date.getMonth() + 1)
    const year = date.getFullYear()
    let hours = date.getHours()
    const minutes = pad(date.getMinutes())
    const seconds = pad(date.getSeconds())
    const ampm = hours >= 12 ? 'CH' : 'SA'
    hours = hours % 12
    hours = hours ? hours : 12
    return `${pad(hours)}:${minutes}:${seconds} ${ampm} ${day}/${month}/${year}`
  }

  const discussBugs = useMemo(() => {
    const featureTasks = bugs.filter(b => !b.isBug);
    const approvedBugs = bugs.filter(b => b.isBug && b.relatedTaskId != null).map(b => ({
      ...b,
      id: b.relatedTaskId, // Use task ID for discussion stats and action
      bugReportId: b.id,
      displayTitle: `[BUG] ${b.title}`,
      displayType: 'Bug Fix Task',
    }));
    const draftBugs = bugs.filter(b => b.isBug && b.relatedTaskId == null).map(b => ({
      ...b,
      displayTitle: `[BUG] ${b.title}`,
      displayType: 'Bug Report',
    }));
    const combined = [...featureTasks, ...approvedBugs, ...draftBugs];

    // Sort order:
    // 1. Unapproved (DRAFT status) first, Approved (non-DRAFT status) last
    // 2. If same approval status, Bug first, Feature/Task last
    // 3. If both are bugs, higher severity first
    // 4. Default to newest first (createdAt descending)
    combined.sort((a, b) => {
      const isApproved = (item) => {
        if (isBlankGitHubIssue(item)) {
          return !isBlankDraft(item);
        }
        if (item.isBug) {
          return item.relatedTaskId != null && item.displayStatus !== 'DRAFT' && item.status !== 'DRAFT';
        }
        return item.githubIssueNumber != null;
      }
      
      const aApproved = isApproved(a);
      const bApproved = isApproved(b);
      
      if (aApproved !== bApproved) {
        return aApproved ? 1 : -1;
      }

      const aIsBug = a.isBug || a.type === 'BUG_FIX' || a.displayType === 'Bug Fix Task';
      const bIsBug = b.isBug || b.type === 'BUG_FIX' || b.displayType === 'Bug Fix Task';
      
      if (aIsBug !== bIsBug) {
        return aIsBug ? -1 : 1;
      }

      if (aIsBug) {
        const getSeverityValue = (item) => {
          const sev = item.severity || item.displaySeverity || item.priority || 'LOW';
          switch (sev) {
            case 'CRITICAL': return 4;
            case 'HIGH': return 3;
            case 'MEDIUM': return 2;
            case 'LOW':
            default:
              return 1;
          }
        }
        const aSev = getSeverityValue(a);
        const bSev = getSeverityValue(b);
        if (aSev !== bSev) {
          return bSev - aSev;
        }
      }

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return combined;
  }, [bugs])

  // Real-time stats state for the discussion cards
  const [liveStatsMap, setLiveStatsMap] = useState({})

  // Fetch stats for all discussion tasks
  const fetchDiscussStats = useCallback(async () => {
    if (discussBugs.length === 0) return
    const newStatsMap = {}
    try {
      await Promise.all(
        discussBugs.map(async (b) => {
          try {
            const votesData = await proposalService.getTaskVotes(b.id)
            const commentsData = await proposalService.getTaskComments(b.id)
            const proposalsData = await proposalService.getProposals(b.id)
            
            const totalComments = (commentsData || []).reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0)
            const hasDiscussion = (proposalsData || []).length > 0
            const isAllApproved = hasDiscussion && proposalsData.every(p => p.status === 'APPROVED')

            newStatsMap[b.id] = {
              totalVotes: votesData?.upvotes || 0,
              totalDownvotes: votesData?.downvotes || 0,
              totalComments,
              isAllApproved,
              hasDiscussion,
              proposals: proposalsData || []
            }
          } catch (e) {
            newStatsMap[b.id] = {
              totalVotes: 0,
              totalDownvotes: 0,
              totalComments: 0,
              isAllApproved: false,
              hasDiscussion: false,
              proposals: []
            }
          }
        })
      )
      setLiveStatsMap(newStatsMap)
    } catch (err) {
      console.error('Error fetching discussion stats:', err)
    }
  }, [discussBugs])

  useEffect(() => {
    fetchDiscussStats()
  }, [fetchDiscussStats])

  // Real-time WebSocket listener for comment updates
  useEffect(() => {
    const handleCommentEvent = (event) => {
      const { type, taskId: eventTaskId } = event.detail
      // Re-fetch stats for this specific task
      if (eventTaskId) {
        // Trigger a reload of all discussion stats to be simple and accurate, or reload just that one
        fetchDiscussStats()
      }
    }

    window.addEventListener('task-comment-event', handleCommentEvent)
    return () => {
      window.removeEventListener('task-comment-event', handleCommentEvent)
    }
  }, [fetchDiscussStats])

  const discussBugsStats = liveStatsMap

  const filteredDiscussBugs = useMemo(() => {
    return discussBugs.filter(b => {
      if (!discussSearchQuery.trim()) return true
      const query = discussSearchQuery.toLowerCase()
      const titleMatches = (b.displayTitle || b.title || '').toLowerCase().includes(query)
      const descMatches = (b.description || '').toLowerCase().includes(query)
      return titleMatches || descMatches
    })
  }, [discussBugs, discussSearchQuery])

  // Load proposals from API when user opens a feature discussion
  useEffect(() => {
    if (activeDiscussTaskId) {
      proposalService.getProposals(activeDiscussTaskId)
        .then(data => setActiveProposals(data || []))
        .catch(() => setActiveProposals([]))
    } else {
      setActiveProposals([])
    }
  }, [activeDiscussTaskId])

  // Helper to reload proposals from API and refresh state
  const reloadProposals = async (taskId) => {
    try {
      const data = await proposalService.getProposals(taskId)
      setActiveProposals(data || [])
      fetchDiscussStats() // refresh stats on the dashboard
    } catch {
      // silently ignore
    }
  }

  const handleAddProposal = async (e) => {
    e.preventDefault()
    if (!newProposalText.trim() || !activeDiscussTaskId) return
    try {
      await proposalService.createProposal(activeDiscussTaskId, newProposalText.trim())
      setNewProposalText('')
      toast.success('New checklist proposal submitted!')
      await reloadProposals(activeDiscussTaskId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit proposal!')
    }
  }

  const handleVoteProposal = async (propId) => {
    try {
      await proposalService.vote(propId, true)
      await reloadProposals(activeDiscussTaskId)
    } catch (err) {
      toast.error('Vote failed!')
    }
  }

  const handleDownvoteProposal = async (propId) => {
    try {
      await proposalService.vote(propId, false)
      await reloadProposals(activeDiscussTaskId)
    } catch (err) {
      toast.error('Vote failed!')
    }
  }

  const handleAddProposalComment = async (e, propId) => {
    e.preventDefault()
    const text = proposalCommentsInputs[propId] || ''
    if (!text.trim()) return
    try {
      await proposalService.addComment(propId, text.trim())
      setProposalCommentsInputs((prev) => ({ ...prev, [propId]: '' }))
      toast.success('Feedback submitted!')
      await reloadProposals(activeDiscussTaskId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit comment!')
    }
  }

  const handleApproveProposal = async (prop) => {
    const hasChecklist = prop.content && prop.content.split('\n').some(line => /^-\s+\[([ xX])\]\s+(.*)$/.test(line.trim()));
    if (!hasChecklist) {
      toast.error('Proposal must contain at least one checklist item (starting with "- [ ]" or "- [x]")!');
      return;
    }
    try {
      await proposalService.approve(prop.id)
      toast.success('Checklist item approved and published!')
      await reloadProposals(activeDiscussTaskId)
      loadBugs(true) // refresh checklist on the task card
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve proposal!')
    }
  }

  const handleRejectProposal = async (propId) => {
    try {
      await proposalService.reject(propId)
      toast.success('Proposal rejected!')
      await reloadProposals(activeDiscussTaskId)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject proposal!')
    }
  }

  const handleBulkApprove = async (e, bug) => {
    e.stopPropagation()
    if (!isLeader) {
      toast.error('Only Project Leaders are authorized to approve proposals!')
      return
    }

    const loadToast = toast.loading('Approving and syncing sub-tasks to GitHub...')
    try {
      await proposalService.approveAndSyncTask(bug.id)
      toast.success('Proposals converted to sub-tasks and synced to GitHub successfully!', { id: loadToast })
      loadBugs(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sync failed!', { id: loadToast })
    }
  }

  const isMentor = activeProject?.role === 'Mentor'
  
  const reviewBugs = useMemo(() => {
    return filteredBugs.filter(b => {
      if (b.displayStatus === 'IN_REVIEW') return true;
      const taskEntity = b.isBug ? b.fixTask : b;
      if (taskEntity && taskEntity.subTasks) {
        return taskEntity.subTasks.some(sub => sub.status === 'IN_REVIEW');
      }
      return false;
    });
  }, [filteredBugs]);

  const openBugs = useMemo(() => {
    const list = [];
    filteredBugs.forEach(b => {
      const isClosed = b.displayStatus === 'CLOSED' || b.displayStatus === 'FIXED' || b.displayStatus === 'DONE' || b.displayStatus === 'IN_REVIEW';
      if (isClosed) return;

      // Bug reports in DRAFT status belong in Discussion
      if (b.isBug && b.displayStatus === 'DRAFT') {
        return;
      }

      // Nếu là Blank Issue ở trạng thái DRAFT thì thuộc Discuss, không hiện ở Open
      if (!b.isBug && isBlankGitHubIssue(b) && isBlankDraft(b)) {
        return;
      }

      // Feature tasks (không phải từ GitHub)
      if (!b.isBug && b.githubIssueNumber == null) {
        // Nếu là Task thông thường chưa được approve (ví dụ: tạo offline chưa sync)
        return;
      }

      list.push(b);
    });
    return list;
  }, [filteredBugs]);

  const closedBugs = useMemo(() => {
    const list = [];
    filteredBugs.forEach(b => {
      const isClosedForReal = b.displayStatus === 'CLOSED' || b.displayStatus === 'FIXED' || b.displayStatus === 'DONE';
      if (isClosedForReal) {
        list.push(b);
      }
    });
    return list;
  }, [filteredBugs]);
  
  const displayList = activeListTab === 'open' ? openBugs : activeListTab === 'closed' ? closedBugs : [];

  const handleRequestReview = async (e, taskEntity) => {
    e.stopPropagation()
    const taskData = taskEntity.isBug ? taskEntity.fixTask : taskEntity
    if (!taskData) return
    const currentAssignee = taskData.primaryAssignee?.id || taskData.primaryAssigneeId
    if (!currentAssignee) {
      toast.error('Task is not assigned. Please request Leader to assign it first!')
      return
    }
    setApprovingId(taskData.id)
    try {
      await taskService.requestTaskReview(taskData.id, 'Review request from Issue Tracker')
      toast.success('Review request sent!')
      loadBugs(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review request failed')
    } finally {
      setApprovingId(null)
    }
  }

  const handleApproveTask = async (e, taskId) => {
    e.stopPropagation()
    setApprovingId(taskId)
    try {
      await taskService.approveTaskReview(taskId, 'Approved via Issue Tracker')
      toast.success('Task approved successfully!')
      loadBugs(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve task')
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectTask = async (e, taskId) => {
    e.stopPropagation()
    setApprovingId(taskId)
    try {
      await taskService.rejectTaskReview(taskId, 'Rejected review via Issue Tracker', 'IN_PROGRESS')
      toast.success('Task review rejected!')
      loadBugs(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject task review')
    } finally {
      setApprovingId(null)
    }
  }

  const handleLeaderAssign = async (e, taskEntity, newAssigneeId) => {
    e.stopPropagation()

    // In backend, we don't have a clear unassign route, but let's assume we just update task
    const taskData = taskEntity.isBug ? taskEntity.fixTask : taskEntity
    if (!taskData) return

    setAssigningTaskId(taskData.id)
    try {
      await axiosInstance.patch(`/v1/tasks/${taskData.id}/assignee`, {
        assigneeId: newAssigneeId ? Number(newAssigneeId) : null
      })

      // Cascade to ALL sub-tasks when assigning a new person
      const subTasks = taskData.subTasks || []
      let count = 0
      
      if (newAssigneeId) {
        const subTasksToUpdate = subTasks
        if (subTasksToUpdate.length > 0) {
          await Promise.all(subTasksToUpdate.map(sub => {
            return axiosInstance.patch(`/v1/tasks/${sub.id}/assignee`, {
              assigneeId: Number(newAssigneeId)
            })
          }))
          count = subTasksToUpdate.length
        }
      }

      const memberName = activeProject?.members?.find(m => Number(m.id) === Number(newAssigneeId))?.fullName || 'member'
      if (count > 0) {
        toast.success(`Assigned to ${memberName} and ${count} sub-tasks!`)
      } else {
        toast.success(newAssigneeId ? `Assigned to ${memberName}!` : 'Unassigned successfully!')
      }
      await loadBugs(true)
    } catch (err) {
      toast.error('Failed to assign task')
    } finally {
      setAssigningTaskId(null)
    }
  }


  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-600 border border-red-500/20'
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
      case 'LOW':
      default:
        return 'bg-[#1E707D]/10 text-[#1E707D] border border-blue-500/20'
    }
  }

  const getTaskTypeBadge = (type) => {
    switch (type) {
      case 'BUG_FIX':
      case 'Fix Bug Task':
        return 'bg-red-500/10 text-red-600 border border-red-500/20'
      case 'DEVELOPMENT':
      case 'Feature / Task':
        return 'bg-[#1E707D]/10 text-[#1E707D] border border-blue-500/20'
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
    // Check DRAFT status directly from backend-provided displayStatus
    if (bug.isBug && bug.displayStatus === 'DRAFT') {
      return <span className="text-[10px] font-black tracking-wider uppercase bg-slate-500/10 text-slate-500 border border-slate-500/25 px-2.5 py-0.5 rounded-full">DRAFT</span>
    }
    switch (bug.displayStatus) {
      case 'CLOSED':
      case 'FIXED':
      case 'DONE':
        return <span className="text-[10px] font-black tracking-wider uppercase bg-green-500/10 text-green-600 border border-green-500/25 px-2.5 py-0.5 rounded-full">CLOSED</span>
      case 'IN_PROGRESS':
        return <span className="text-[10px] font-black tracking-wider uppercase bg-[#1E707D]/10 text-[#1E707D] border border-blue-500/25 px-2.5 py-0.5 rounded-full">IN PROGRESS</span>
      case 'IN_REVIEW':
        return <span className="text-[10px] font-black tracking-wider uppercase bg-amber-500/10 text-amber-600 border border-amber-500/25 px-2.5 py-0.5 rounded-full">IN REVIEW</span>
      case 'OPEN':
      case 'TODO':
      default:
        return <span className="text-[10px] font-black tracking-wider uppercase bg-rose-500/10 text-rose-600 border border-rose-500/25 px-2.5 py-0.5 rounded-full">ACTIVE</span>
    }
  }

  const getDeadlineBadge = (deadline) => {
    if (!deadline) return null
    const dlDate = new Date(deadline)
    dlDate.setHours(23, 59, 59, 999)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const diffTime = dlDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let colorClass = 'bg-gray-500/10 text-gray-600 border-gray-500/25'
    if (diffDays < 0) {
      colorClass = 'bg-red-500/10 text-red-600 border-red-500/20'
    } else if (diffDays <= 3) {
      colorClass = 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    }

    const formattedDate = dlDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border hidden sm:flex items-center gap-1 ${colorClass}`}>
        <span className="material-symbols-outlined text-[10px]">schedule</span>
        {formattedDate}
      </span>
    )
  }



  return (
    <main className="flex-1 p-4 md:p-6 overflow-y-auto relative bg-background select-none">
      {/* Blurred background visuals */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[5%] left-[5%] w-[450px] h-[450px] rounded-full bg-[#D7EEF1] opacity-[0.08] blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-secondary-fixed opacity-[0.1] blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full space-y-3.5 animate-fade-in">
        {/* Header toolbar */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-3xl text-[#1E707D] font-bold">bug_report</span>
                <span>Issue Tracker</span>
              </h1>
              <span className="text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase bg-[#D7EEF1] text-[#1E707D] shrink-0">
                {activeProject?.title || 'DevTrack AI'}
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
              Log code errors, manage quality workflows, and synchronize directly with active GitHub repository issues.
            </p>
          </div>
        </section>


        {/* Mini stats counters (conditional showStats) */}
        {showStats && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
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
        )}

        {/* Toolbar Filters (conditional showFilters) */}
        {showFilters && (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 animate-fade-in">
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
              className="flex items-center justify-center gap-1 py-2 px-3.5 border border-outline-variant hover:bg-surface-container-high rounded-xl text-xs font-bold transition-all text-[#1E707D] shrink-0 self-start md:self-auto"
            >
              <span className={`material-symbols-outlined text-sm ${loading ? 'animate-spin' : ''}`}>refresh</span>
              <span>Refresh list</span>
            </button>
          </section>
        )}

        {/* Unified Search & Quick Proposal Bar */}
        {activeListTab === 'discuss' && (
          <div className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant/60 rounded-2xl py-2 px-4 shadow-sm select-none">
            <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
            <input
              type="text"
              value={discussSearchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setDiscussSearchQuery(val);
                setQuickProposalText(val);
              }}
              placeholder="Search or enter new proposal..."
              className="flex-1 text-xs bg-transparent border-none outline-none text-on-surface placeholder:text-on-surface-variant/60 font-semibold"
            />
            {discussSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setDiscussSearchQuery('');
                  setQuickProposalText('');
                }}
                className="text-on-surface-variant hover:text-on-surface mr-2"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => openNewIssueModal(quickProposalText)}
              className="rounded-full border border-blue-500 text-[#1E707D] bg-white hover:bg-[#1E707D]/10 px-4 py-1.5 transition-all text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xs">add</span>
              <span>Propose</span>
            </button>
          </div>
        )}


        {/* Tab Filters */}
        <section className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setActiveListTab('discuss')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${activeListTab === 'discuss'
                ? 'bg-[#1E707D] text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <span className="material-symbols-outlined text-sm">chat_bubble</span>
            <span>Discuss ({discussBugs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveListTab('open')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${activeListTab === 'open'
                ? 'bg-[#1E707D] text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <span className="material-symbols-outlined text-sm">assignment</span>
            <span>Open Issues / Tasks ({openBugs?.length || 0})</span>
          </button>



          <button
            onClick={() => setActiveListTab('closed')}
            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border flex items-center gap-1 cursor-pointer ${activeListTab === 'closed'
                ? 'bg-[#1E707D] text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <span className="material-symbols-outlined text-sm">history</span>
            <span>Closed ({closedBugs?.length || 0})</span>
          </button>
        </section>



        {/* Bug Reports Grid List */}
        {loading ? (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-16 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-[#1E707D] animate-spin">progress_activity</span>
            <p className="mt-4 text-sm font-bold text-on-surface-variant">Scanning repository for logged issues...</p>
          </section>
        ) : activeListTab === 'discuss' ? (
          <div className="space-y-3">
            {/* Discussion Feed list */}
            {filteredDiscussBugs.length === 0 ? (
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center shadow-sm">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">forum</span>
                <p className="mt-3 text-xs font-bold text-on-surface-variant">No discussion topics found matching the keyword.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredDiscussBugs.map((bug, index) => {
                  const stats = discussBugsStats[bug.id] || { totalVotes: 0, totalDownvotes: 0, totalComments: 0, isAllApproved: false }
                  const creatorName = bug.createdBy?.fullName || bug.createdBy?.username || bug.createdByName || 'Proposer'
                  const avatarLetter = (bug.displayTitle || bug.title || 'F').charAt(0).toUpperCase()
                  const formattedDate = formatSafeDateDiscuss(bug.createdAt)
                  
                  const hasGitHubNumber = bug.isBug 
                    ? (getGitHubIssueNumber(bug.stepsToReproduce) != null) 
                    : (bug.githubIssueNumber != null);
                  const isBlankGit = isBlankGitHubIssue(bug);
                  const isBlankDr = isBlankDraft(bug);
                  const isDiscussApproved = bug.isBug 
                    ? (bug.displayStatus !== 'DRAFT')
                    : (isBlankGit 
                      ? !isBlankDr 
                      : (hasGitHubNumber || stats.isAllApproved));

                  return (
                    <div
                      key={bug.id}
                      onClick={() => setActiveDiscussTaskId(bug.id)}
                      className="group bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md hover:border-sky-400/60 transition-all cursor-pointer overflow-hidden w-full"
                    >
                      {/* Top header — giống ProposalTab */}
                      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                          {avatarLetter}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-slate-900 truncate">{bug.displayTitle || bug.title}</span>
                            {bug.isBug || bug.displayType === 'Bug Fix Task' || bug.type === 'BUG_FIX' ? (
                              <span className="text-[10px] font-black tracking-wider uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20 px-2 py-0.5 rounded-full shrink-0">
                                BUG REPORT
                              </span>
                            ) : isBlankGit ? (
                              <span className="text-[10px] font-black tracking-wider uppercase bg-slate-500/10 text-slate-600 border border-slate-500/20 px-2 py-0.5 rounded-full shrink-0">
                                BLANK ISSUE
                              </span>
                            ) : (
                              <span className="text-[10px] font-black tracking-wider uppercase bg-[#0ea5e9]/10 text-[#0284c7] border border-[#0ea5e9]/30 px-2 py-0.5 rounded-full shrink-0">
                                PROPOSAL
                              </span>
                            )}
                            {creatorName && (
                              <span className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-full shrink-0" title="Proposer">
                                <span className="material-symbols-outlined text-[11px]">person</span>
                                {creatorName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-semibold">ID: #{String(bug.id).slice(0,7).toUpperCase()}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400 font-semibold">{formattedDate}</span>
                            <span className="text-slate-300">•</span>
                            {isDiscussApproved ? (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                Approved
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <span className="material-symbols-outlined text-[10px]">schedule</span>
                                Awaiting Approval
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {bug.description && (
                        <p className="px-4 pb-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {cleanDescription(bug.description)}
                        </p>
                      )}

                      {/* Divider + Footer */}
                      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-400 select-none">
                          <span className="flex items-center gap-1 hover:text-sky-500 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                            Upvotes ({stats.totalVotes})
                          </span>
                          <span className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">thumb_down</span>
                            Downvotes ({stats.totalDownvotes})
                          </span>
                          <span className="flex items-center gap-1 hover:text-sky-500 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                            Comments ({stats.totalComments})
                          </span>
                        </div>

                        {isLeader && !isDiscussApproved && (
                          <button
                            type="button"
                            onClick={(e) => handleBulkApprove(e, bug)}
                            className="py-1 px-3 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : displayList.length === 0 ? (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-16 text-center shadow-sm space-y-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">check_circle</span>
            <h3 className="font-extrabold text-lg text-on-surface">No Bug Reports Found</h3>
            <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
              No bugs matching the current filters were found in this project. Congratulations on high quality code!
            </p>
          </section>
        ) : (
          <section className="flex flex-col gap-2">
            {displayList.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant font-medium text-sm">No issues found matching the criteria.</div>
            ) : displayList.map((bug) => {
              const rowId = bug.isSubTask ? `subtask-${bug.id}` : (bug.isBug ? `bug-${bug.id}` : `task-${bug.id}`)
              const isExpanded = !!expandedIssues[rowId]
              const gitHubNumber = bug.isBug ? getGitHubIssueNumber(bug.stepsToReproduce) : bug.githubIssueNumber;
              const taskEntity = bug.isSubTask ? bug : (bug.isBug ? bug.fixTask : bug);

              // Checklist & subtask calculations for parent task
              const parentChecklist = taskEntity?.checklist || []
              const isChecklistPassed = !parentChecklist || parentChecklist.length === 0 || parentChecklist.every(item => item.done)
              const subTasksList = taskEntity?.subTasks || []
              const hasSubtasks = subTasksList.length > 0
              const areAllSubtasksDone = hasSubtasks && subTasksList.every(t => t.status === 'DONE' || t.status === 'FIXED' || t.status === 'CLOSED')
              const isReviewActionEnabled = hasSubtasks ? (areAllSubtasksDone && isChecklistPassed) : isChecklistPassed

              return (
                <div key={rowId} className="flex flex-col bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm overflow-hidden hover:border-[#1E707D]/45 transition-colors">
                  {/* Row Header */}
                  <div
                    onClick={(e) => {
                      if (bug.isSubTask) return;
                      toggleExpand(e, rowId);
                    }}
                    className="flex flex-wrap md:flex-nowrap items-center gap-3 p-3 cursor-pointer group"
                  >
                    {/* Left Expand Chevron */}
                    <div className="flex-shrink-0 w-6 flex justify-center text-on-surface-variant group-hover:text-[#1E707D] transition-colors">
                      {!bug.isSubTask ? (
                        <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      ) : (
                        <span className="material-symbols-outlined text-[16px] text-amber-600">subdirectory_arrow_right</span>
                      )}
                    </div>

                    <div className="flex-shrink-0 flex justify-center">
                      <span className={`material-symbols-outlined text-lg ${bug.isSubTask ? 'text-amber-500 font-bold' : (bug.isBug ? 'text-red-500' : 'text-[#1E707D]')}`}>
                        {bug.isSubTask ? 'rate_review' : (bug.isBug ? 'bug_report' : 'task')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-[200px] flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                          {bug.isSubTask ? `Sub-task của: ${bug.parentTitle}` : bug.displayType}
                        </span>
                        {gitHubNumber && (
                          <span className="text-[9px] font-bold bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.25 rounded flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[9px] font-bold">settings_ethernet</span>
                            #{gitHubNumber}
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-sm text-on-surface leading-snug truncate group-hover:text-[#1E707D] transition-colors">
                        {bug.displayTitle}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      {!bug.isSubTask && (
                        <span className="text-[9px] font-bold uppercase bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                          Env: {bug.displayEnv}
                        </span>
                      )}
                      {getDeadlineBadge(bug.deadline)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full hidden md:inline-block ${getSeverityColor(bug.displaySeverity)}`}>
                        {bug.displaySeverity}
                      </span>
                      {getStatusBadge(bug)}

                      {bug.isSubTask && (() => {
                        const currentAssigneeId = bug.primaryAssigneeId || bug.primaryAssignee?.id;
                        const assignee = activeProject?.members?.find(m => String(m.id) === String(currentAssigneeId));
                        return (
                          <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/50 hidden lg:inline-block truncate max-w-[120px]">
                            {assignee?.fullName || assignee?.username || 'Unassigned'}
                          </span>
                        );
                      })()}

                      {!bug.isSubTask && isLeader && (!bug.isBug || (bug.isBug && bug.fixTask)) && (() => {
                        const currentAssigneeId = bug.isBug ? (bug.fixTask?.primaryAssigneeId || bug.fixTask?.primaryAssignee?.id) : (bug.primaryAssigneeId || bug.primaryAssignee?.id);
                        
                        const taskWithSubtasks = bug.isBug ? bug.fixTask : bug;
                        const subTasksListSelect = taskWithSubtasks?.subTasks || [];
                        const uniqueAssigneeIds = new Set();
                        subTasksListSelect.forEach(sub => {
                            const subAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id;
                            if (subAssigneeId) uniqueAssigneeIds.add(String(subAssigneeId));
                        });
                        const hasMultipleAssignees = uniqueAssigneeIds.size > 1;
                        const isSelectDisabled = assigningTaskId === (bug.isBug ? bug.fixTask?.id : bug.id) || hasMultipleAssignees;

                        let firstName = "";
                        if (hasMultipleAssignees) {
                           const firstId = Array.from(uniqueAssigneeIds)[0];
                           const firstMember = activeProject?.members?.find(m => String(m.id) === firstId);
                           firstName = firstMember?.name || firstMember?.fullName || firstMember?.username || 'Member';
                        }
                        
                        const displayValue = currentAssigneeId || '';

                        return (
                          <div onClick={e => e.stopPropagation()} className="relative flex flex-shrink-0 items-center gap-1.5 ml-1 border-l border-outline-variant/50 pl-3">
                            <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">Assignee:</span>
                            {hasMultipleAssignees ? (
                              <div 
                                className="flex flex-col justify-center text-xs font-bold px-2.5 py-0.5 rounded-full border max-w-[180px] bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30 opacity-50 cursor-not-allowed"
                                title="Locked due to multiple assignees on sub-tasks"
                              >
                                <span className="truncate leading-tight">{firstName}</span>
                                <span className="text-[9px] font-semibold opacity-80 leading-tight">and +{uniqueAssigneeIds.size - 1} others</span>
                              </div>
                            ) : (
                              <select
                                value={displayValue}
                                onChange={(e) => handleLeaderAssign(e, bug, e.target.value)}
                                disabled={isSelectDisabled}
                                className={`text-xs font-bold px-2.5 py-1 rounded-full border focus:outline-none focus:ring-1 focus:ring-[#1E707D] max-w-[180px] truncate transition-all cursor-pointer ${
                                  assigningTaskId === (bug.isBug ? bug.fixTask?.id : bug.id) ? 'opacity-50 cursor-wait' : ''
                                } ${
                                  displayValue
                                    ? 'bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30 hover:bg-[#1E707D]/20'
                                    : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                                }`}
                                title="Assign to member"
                              >
                                <option value="" className="bg-surface text-on-surface font-semibold">-- Unassigned --</option>
                                {activeProject?.members?.filter(m => m.role !== 'Mentor').map(m => (
                                  <option key={m.id} value={m.id} className="bg-surface text-on-surface font-semibold">{m.name || m.fullName || m.username}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        );
                      })()}
                      
                      {!bug.isSubTask && !isLeader && (!bug.isBug || (bug.isBug && bug.fixTask)) && (() => {
                        const currentAssigneeId = bug.isBug ? (bug.fixTask?.primaryAssigneeId || bug.fixTask?.primaryAssignee?.id) : (bug.primaryAssigneeId || bug.primaryAssignee?.id);
                        
                        const taskWithSubtasks = bug.isBug ? bug.fixTask : bug;
                        const subTasksListSelect = taskWithSubtasks?.subTasks || [];
                        const uniqueAssigneeIds = new Set();
                        subTasksListSelect.forEach(sub => {
                            const subAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id;
                            if (subAssigneeId) uniqueAssigneeIds.add(String(subAssigneeId));
                        });
                        const hasMultipleAssignees = uniqueAssigneeIds.size > 1;

                        let content;
                        if (hasMultipleAssignees) {
                           const firstId = Array.from(uniqueAssigneeIds)[0];
                           const firstMember = activeProject?.members?.find(m => String(m.id) === firstId);
                           const firstName = firstMember?.name || firstMember?.fullName || firstMember?.username || 'Member';
                           content = (
                             <div className="flex flex-col justify-center text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30 max-w-[180px]">
                               <span className="truncate leading-tight">{firstName}</span>
                               <span className="text-[9px] font-semibold opacity-80 leading-tight">and +{uniqueAssigneeIds.size - 1} others</span>
                             </div>
                           );
                        } else {
                           const assignee = activeProject?.members?.find(m => String(m.id) === String(currentAssigneeId));
                           content = (
                             <span className={`text-xs font-bold px-2.5 py-1 rounded-full border max-w-[180px] truncate ${
                               currentAssigneeId
                                 ? 'bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30 hover:bg-[#1E707D]/20'
                                 : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                             }`}>
                               {assignee?.name || assignee?.fullName || assignee?.username || '-- Unassigned --'}
                             </span>
                           );
                        }

                        return (
                          <div className="flex flex-shrink-0 items-center gap-1.5 ml-1 border-l border-outline-variant/50 pl-3">
                            <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wider">Assignee:</span>
                            {content}
                          </div>
                        );
                      })()}



                      {taskEntity && taskEntity.status !== 'IN_REVIEW' && taskEntity.status !== 'DONE' && taskEntity.status !== 'FIXED' && taskEntity.status !== 'CLOSED' && isReviewActionEnabled && (
                        <div onClick={e => e.stopPropagation()} className="relative group flex items-center">
                          <button
                            onClick={(e) => handleRequestReview(e, bug)}
                            disabled={approvingId === taskEntity.id}
                            className="py-1 px-3.5 rounded-full text-[10px] font-bold transition-all shadow flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[10px]">rate_review</span>
                            Request Review
                          </button>
                        </div>
                      )}

                      {isLeader && taskEntity && taskEntity.status === 'IN_REVIEW' && (
                        <div onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 ml-1 border-l border-outline-variant/50 pl-3">
                          <button
                            onClick={(e) => handleApproveTask(e, taskEntity.id)}
                            disabled={approvingId === taskEntity.id}
                            className="py-1 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-full transition-all shadow flex items-center gap-1 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[12px]">task_alt</span>
                            Approve
                          </button>
                          <button
                            onClick={(e) => handleRejectTask(e, taskEntity.id)}
                            disabled={approvingId === taskEntity.id}
                            className="py-1 px-3.5 bg-error hover:bg-error/90 text-on-error text-[10px] font-bold rounded-full transition-all shadow flex items-center gap-1 disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[12px]">cancel</span>
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Approve button: only visible to leaders when the bug is in DRAFT state */}
                      {isLeader && bug.isBug && bug.displayStatus === 'DRAFT' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveBug(e, bug.id);
                          }}
                          disabled={approvingId === bug.id}
                          className="py-1 px-3.5 bg-[#1E707D] hover:bg-[#1E707D]/95 text-white text-[10px] font-bold rounded-full transition-all shadow flex items-center gap-1 disabled:opacity-50"
                        >
                          {approvingId === bug.id ? (
                            <span className="material-symbols-outlined text-[10px] animate-spin">progress_activity</span>
                          ) : (
                            <span className="material-symbols-outlined text-[10px]">task_alt</span>
                          )}
                          Approve & Push to GitHub
                        </button>
                      )}


                    </div>
                  </div>

                  {/* Expanded Content (Tree View) */}
                  {isExpanded && !bug.isSubTask && (() => {
                    const parentChecklist = bug.isBug ? (bug.fixTask?.checklist || []) : (bug.checklist || [])
                    const canHaveChecklist = (!bug.isBug) || (bug.isBug && bug.relatedTaskId)

                    return (
                      <div className="bg-surface-container-low border-t border-outline-variant/30 py-4 flex flex-col relative">
                        {/* Vertical line connecting children */}
                        <div className="absolute left-7 top-0 bottom-6 w-0.5 bg-[#1E707D] rounded-full hidden sm:block"></div>

                        {/* Parent Description */}
                        <div className="pl-14 pr-6 pb-3">
                          <strong className="text-xs text-on-surface-variant uppercase tracking-wider">Description</strong>
                          <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-xs text-on-surface font-semibold">{cleanDescription(bug.description) || 'No description provided.'}</p>
                        </div>



                        {/* Add Sub-task Button */}
                        {isLeader && canHaveChecklist && (
                          <div className="pl-14 pr-6 pt-2 pb-3 border-b border-outline-variant/20 mb-4">
                            <button
                              type="button"
                              onClick={(e) => triggerCreateSubtask(e, bug)}
                              className="flex items-center gap-1.5 text-xs text-[#1E707D] hover:text-[#165964] transition-colors py-1.5 bg-surface-container-high/65 hover:bg-surface-container-highest px-3 rounded-lg border border-outline-variant/60 shadow-sm font-bold"
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
                                  <span className="text-xs font-bold text-on-surface group-hover:text-[#1E707D] transition-colors truncate">{bug.fixTask.displayTitle}</span>
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
                                        <span className="material-symbols-outlined text-[#1E707D] text-base">subdirectory_arrow_right</span>
                                      </div>
                                      <div className="flex-1 flex items-center justify-between gap-3">
                                        <div className="flex flex-col items-start gap-1">
                                          <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.25 rounded-md ${getTaskTypeBadge(sub.displayType)}`}>
                                            {sub.displayType}
                                          </span>
                                          <span className="text-xs font-bold text-on-surface group-hover:text-[#1E707D] transition-colors truncate">{sub.displayTitle}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getSeverityColor(sub.displaySeverity)}`}>
                                            {sub.displaySeverity}
                                          </span>
                                          {getStatusBadge(sub)}

                                          {sub.status !== 'IN_REVIEW' && sub.status !== 'DONE' && sub.status !== 'FIXED' && sub.status !== 'CLOSED' && (() => {
                                            const subChecklistPassed = !sub.checklist || sub.checklist.length === 0 || sub.checklist.every(item => item.done)
                                            if (!subChecklistPassed) return null;
                                            return (
                                              <div onClick={e => e.stopPropagation()} className="relative group flex items-center">
                                                <button
                                                  onClick={(e) => handleRequestReview(e, sub)}
                                                  disabled={approvingId === sub.id}
                                                  className="py-0.5 px-2.5 rounded-full text-[9px] font-bold transition-all shadow flex items-center gap-0.5 bg-amber-600 hover:bg-amber-700 text-white"
                                                >
                                                  <span className="material-symbols-outlined text-[9px]">rate_review</span>
                                                  Request Review
                                                </button>
                                              </div>
                                            )
                                          })()}

                                          {isLeader && sub.status === 'IN_REVIEW' && (
                                            <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 ml-1 border-l border-outline-variant/50 pl-2">
                                              <button
                                                onClick={(e) => handleApproveTask(e, sub.id)}
                                                disabled={approvingId === sub.id}
                                                className="py-0.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-full transition-all shadow flex items-center gap-0.5 disabled:opacity-50"
                                              >
                                                Approve
                                              </button>
                                              <button
                                                onClick={(e) => handleRejectTask(e, sub.id)}
                                                disabled={approvingId === sub.id}
                                                className="py-0.5 px-2.5 bg-error hover:bg-error/90 text-on-error text-[9px] font-bold rounded-full transition-all shadow flex items-center gap-0.5 disabled:opacity-50"
                                              >
                                                Reject
                                              </button>
                                            </div>
                                          )}

                                          {isLeader ? (() => {
                                            const currentAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id;
                                            return (
                                              <div onClick={e => e.stopPropagation()} className="relative flex flex-shrink-0 items-center gap-1.5 ml-1 border-l border-outline-variant/50 pl-2">
                                                <span className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider hidden sm:inline">Assignee:</span>
                                                <select
                                                  value={currentAssigneeId || ''}
                                                  onChange={(e) => handleLeaderAssign(e, sub, e.target.value)}
                                                  disabled={assigningTaskId === sub.id}
                                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1E707D] max-w-[120px] truncate transition-all ${
                                                    assigningTaskId === sub.id ? 'opacity-50 cursor-wait' : ''
                                                  } ${
                                                    currentAssigneeId
                                                      ? 'bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30 hover:bg-[#1E707D]/20'
                                                      : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                                                  }`}
                                                  title="Assign to member"
                                                >
                                                  <option value="" className="bg-surface text-on-surface font-semibold">-- Unassigned --</option>
                                                  {activeProject?.members?.filter(m => m.role !== 'Mentor').map(m => (
                                                    <option key={m.id} value={m.id} className="bg-surface text-on-surface font-semibold">{m.name || m.fullName || m.username}</option>
                                                  ))}
                                                </select>
                                              </div>
                                            );
                                          })() : (() => {
                                            const currentAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id;
                                            const assignee = activeProject?.members?.find(m => String(m.id) === String(currentAssigneeId));
                                            return (
                                              <div className="relative flex flex-shrink-0 items-center gap-1.5 ml-1 border-l border-outline-variant/50 pl-2">
                                                <span className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider hidden sm:inline">Assignee:</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                  currentAssigneeId
                                                    ? 'bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30'
                                                    : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
                                                }`}>
                                                  {assignee?.name || assignee?.fullName || assignee?.username || '-- Unassigned --'}
                                                </span>
                                              </div>
                                            );
                                          })()}
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
                                          {sub.checklist.map(item => {
                                            const parentAssigneeId = bug.isBug ? (bug.fixTask?.primaryAssigneeId || bug.fixTask?.primaryAssignee?.id) : (bug.primaryAssigneeId || bug.primaryAssignee?.id);
                                            const subAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id || parentAssigneeId;
                                            const canToggle = isLeader || String(currentUserId) === String(subAssigneeId);
                                            return (
                                              <label
                                                key={item.id}
                                                className={`flex items-center gap-3 p-1 rounded transition-colors select-none ${
                                                  canToggle ? 'cursor-pointer hover:bg-surface-container-high/40' : 'cursor-not-allowed opacity-60'
                                                }`}
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={item.done}
                                                  disabled={!canToggle}
                                                  onChange={() => handleToggleChecklist(sub, item.id, item.done)}
                                                  className={`accent-primary h-3.5 w-3.5 shrink-0 rounded border-outline-variant ${
                                                    canToggle ? 'cursor-pointer' : 'cursor-not-allowed'
                                                  }`}
                                                />
                                                <span className={`text-xs ${item.done ? 'line-through text-on-surface/50 font-medium' : 'text-on-surface font-semibold'}`}>
                                                  {item.content}
                                                </span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p className="text-[10px] text-on-surface-variant italic">No requirements checklist defined for this sub-task.</p>
                                      )}
                                      {isLeader && (
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
                                            className="flex-1 px-2 py-1 text-[10px] bg-surface-container-low border border-outline-variant/60 rounded-md focus:outline-none focus:border-[#1E707D] text-on-surface font-semibold"
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
                                            className="flex items-center justify-center p-1 bg-[#1E707D] text-white hover:bg-[#1E707D]/90 rounded-md shadow transition-all cursor-pointer shrink-0"
                                          >
                                            <span className="material-symbols-outlined text-xs font-bold">add</span>
                                          </button>
                                        </div>
                                      )}
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
                                    <span className="material-symbols-outlined text-[#1E707D] text-base">subdirectory_arrow_right</span>
                                  </div>
                                  <div className="flex-1 flex items-center justify-between gap-3">
                                    <div className="flex flex-col items-start gap-1">
                                      <span className={`text-[8px] font-black tracking-wider uppercase px-1.5 py-0.25 rounded-md ${getTaskTypeBadge(sub.displayType)}`}>
                                        {sub.displayType}
                                      </span>
                                      <span className="text-xs font-bold text-on-surface group-hover:text-[#1E707D] transition-colors truncate">{sub.displayTitle}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${getSeverityColor(sub.displaySeverity)}`}>
                                        {sub.displaySeverity}
                                      </span>
                                      {getStatusBadge(sub)}

                                      {sub.status !== 'IN_REVIEW' && sub.status !== 'DONE' && sub.status !== 'FIXED' && sub.status !== 'CLOSED' && (() => {
                                        const subChecklistPassed = !sub.checklist || sub.checklist.length === 0 || sub.checklist.every(item => item.done)
                                        if (!subChecklistPassed) return null;
                                        return (
                                          <div onClick={e => e.stopPropagation()} className="relative group flex items-center">
                                            <button
                                              onClick={(e) => handleRequestReview(e, sub)}
                                              disabled={approvingId === sub.id}
                                              className="py-0.5 px-2.5 rounded-full text-[9px] font-bold transition-all shadow flex items-center gap-0.5 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                                            >
                                              <span className="material-symbols-outlined text-[9px]">rate_review</span>
                                              Request Review
                                            </button>
                                          </div>
                                        )
                                      })()}

                                      {isLeader && sub.status === 'IN_REVIEW' && (
                                        <div onClick={e => e.stopPropagation()} className="flex items-center gap-1 ml-1 border-l border-outline-variant/50 pl-2">
                                          <button
                                            onClick={(e) => handleApproveTask(e, sub.id)}
                                            disabled={approvingId === sub.id}
                                            className="py-0.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold rounded-full transition-all shadow flex items-center gap-0.5 disabled:opacity-50"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={(e) => handleRejectTask(e, sub.id)}
                                            disabled={approvingId === sub.id}
                                            className="py-0.5 px-2.5 bg-error hover:bg-error/90 text-on-error text-[9px] font-bold rounded-full transition-all shadow flex items-center gap-0.5 disabled:opacity-50"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      )}

                                      {isLeader ? (() => {
                                        const currentAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id;
                                        return (
                                          <div onClick={e => e.stopPropagation()} className="relative flex flex-shrink-0 items-center gap-1.5 ml-1 border-l border-outline-variant/50 pl-2">
                                            <span className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider hidden sm:inline">Assignee:</span>
                                            <select
                                              value={currentAssigneeId || ''}
                                              onChange={(e) => handleLeaderAssign(e, sub, e.target.value)}
                                              disabled={assigningTaskId === sub.id}
                                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1E707D] max-w-[120px] truncate transition-all ${
                                                assigningTaskId === sub.id ? 'opacity-50 cursor-wait' : ''
                                              } ${
                                                currentAssigneeId
                                                  ? 'bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30 hover:bg-[#1E707D]/20'
                                                  : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:bg-surface-container-high'
                                              }`}
                                              title="Assign to member"
                                            >
                                              <option value="" className="bg-surface text-on-surface font-semibold">-- Unassigned --</option>
                                              {activeProject?.members?.filter(m => m.role !== 'Mentor').map(m => (
                                                <option key={m.id} value={m.id} className="bg-surface text-on-surface font-semibold">{m.name || m.fullName || m.username}</option>
                                              ))}
                                            </select>
                                          </div>
                                        );
                                      })() : (() => {
                                        const currentAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id;
                                        const assignee = activeProject?.members?.find(m => String(m.id) === String(currentAssigneeId));
                                        return (
                                          <div className="relative flex flex-shrink-0 items-center gap-1.5 ml-1 border-l border-outline-variant/50 pl-2">
                                            <span className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider hidden sm:inline">Assignee:</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                              currentAssigneeId
                                                ? 'bg-[#1E707D]/10 text-[#1E707D] border-blue-500/30'
                                                : 'bg-surface-container-highest text-on-surface-variant border-outline-variant'
                                            }`}>
                                              {assignee?.name || assignee?.fullName || assignee?.username || '-- Unassigned --'}
                                            </span>
                                          </div>
                                        );
                                      })()}
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
                                      {sub.checklist.map(item => {
                                        const parentAssigneeId = bug.isBug ? (bug.fixTask?.primaryAssigneeId || bug.fixTask?.primaryAssignee?.id) : (bug.primaryAssigneeId || bug.primaryAssignee?.id);
                                        const subAssigneeId = sub.primaryAssigneeId || sub.primaryAssignee?.id || parentAssigneeId;
                                        const canToggle = isLeader || String(currentUserId) === String(subAssigneeId);
                                        return (
                                          <label
                                            key={item.id}
                                            className={`flex items-center gap-3 p-1 rounded transition-colors select-none ${
                                              canToggle ? 'cursor-pointer hover:bg-surface-container-high/40' : 'cursor-not-allowed opacity-60'
                                            }`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={item.done}
                                              disabled={!canToggle}
                                              onChange={() => handleToggleChecklist(sub, item.id, item.done)}
                                              className={`accent-primary h-3.5 w-3.5 shrink-0 rounded border-outline-variant ${
                                                canToggle ? 'cursor-pointer' : 'cursor-not-allowed'
                                              }`}
                                            />
                                            <span className={`text-xs ${item.done ? 'line-through text-on-surface/50 font-medium' : 'text-on-surface font-semibold'}`}>
                                              {item.content}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-on-surface-variant italic">No requirements checklist defined for this sub-task.</p>
                                  )}
                                  {isLeader && (
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
                                        className="flex-1 px-2 py-1 text-[10px] bg-surface-container-low border border-outline-variant/60 rounded-md focus:outline-none focus:border-[#1E707D] text-on-surface font-semibold"
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
                                        className="flex items-center justify-center p-1 bg-[#1E707D] text-white hover:bg-[#1E707D]/90 rounded-md shadow transition-all cursor-pointer shrink-0"
                                      >
                                        <span className="material-symbols-outlined text-xs font-bold">add</span>
                                      </button>
                                    </div>
                                  )}
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-100 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 relative animate-scale-up font-sans">
              <button
                onClick={closeModal}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer border border-slate-100"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>

              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl font-bold">assignment_add</span>
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-800">
                    {newIssue.parentId ? `Create Sub-task under "${newIssue.parentTitle}"` : 'File New Issue'}
                  </h2>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Select a task type or report an issue to begin</p>
                </div>
              </div>

              {newIssue.uiType === null ? (
                /* Step 1: Template Selection */
                <div className="space-y-3 py-1 animate-fade-in">
                  {[
                    { type: 'BUG', title: 'Bug Report', desc: 'Report errors in code, tests, or features', icon: 'bug_report' },
                    { type: 'FEATURE', title: 'Feature Request', desc: 'Propose a new feature, class, or method to build', icon: 'auto_awesome' },
                  ].map((tpl) => (
                    <div
                      key={tpl.type}
                      onClick={() => {
                        let mappedTaskType = 'DEVELOPMENT';
                        if (tpl.type === 'TEST') mappedTaskType = 'TESTING';
                        if (tpl.type === 'BUG_FIX') mappedTaskType = 'BUG_FIX';
                        setNewIssue(prev => ({ ...prev, uiType: tpl.type, taskType: mappedTaskType }));
                      }}
                      className="group flex items-center justify-between p-4 bg-white border border-slate-100 hover:bg-sky-500/5 hover:border-sky-500/30 rounded-2xl cursor-pointer transition-all duration-200 select-none shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-sky-500/10 text-slate-500 group-hover:text-sky-500 flex items-center justify-center transition-all duration-200 shrink-0">
                          <span className="material-symbols-outlined text-xl">{tpl.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-700 group-hover:text-slate-800 transition-colors">{tpl.title}</h4>
                          <p className="text-xs text-slate-500/90 mt-0.5 font-medium">{tpl.desc}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition-all text-lg font-bold">arrow_forward</span>
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
                      className="text-xs font-bold text-[#1E707D] hover:underline flex items-center gap-1"
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
                      className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-[#1E707D] transition-colors text-on-surface"
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



                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant pl-0.5">Description</label>
                    <textarea
                      value={newIssue.description}
                      onChange={(e) => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Provide a general description of the issue or feature..."
                      rows={2.5}
                      className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-[#1E707D] transition-colors text-on-surface resize-none"
                    />
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
                          className="px-3.5 py-2 text-sm bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-[#1E707D] transition-colors text-on-surface resize-none font-mono"
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
                            className="px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-[#1E707D] transition-colors text-on-surface resize-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-on-surface-variant pl-0.5">Actual Result</label>
                          <textarea
                            value={newIssue.actualResult}
                            onChange={(e) => setNewIssue(prev => ({ ...prev, actualResult: e.target.value }))}
                            placeholder="What actually went wrong?"
                            rows={2}
                            className="px-3.5 py-2 text-xs bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-[#1E707D] transition-colors text-on-surface resize-none"
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
                      className="py-2 px-6 bg-[#1E707D] text-white hover:bg-[#1E707D]/95 rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
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

        {/* Modal: Feature Discussion details (Ocean Blue Premium Popup Overlay) */}
        {activeDiscussTaskId && (
          <FeatureDiscussionModal
            taskId={activeDiscussTaskId}
            projectId={projectId}
            discussBug={discussBugs.find(b => b.id === activeDiscussTaskId)}
            onClose={() => {
              setActiveDiscussTaskId(null)
              fetchDiscussStats()
            }}
            onRefreshDashboard={() => {
              loadBugs(true)
              fetchDiscussStats()
            }}
          />
        )}
      </div>

      {/* AssistiveTouch Backdrop to collapse menu when clicking outside */}
      {assistiveOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setAssistiveOpen(false)}
        />
      )}

      {/* AssistiveTouch Floating Button / Widget */}
      <div
        style={position ? getPositionStyle(assistiveOpen) : {}}
        className={`fixed z-50 flex items-center justify-center select-none ${!position ? 'bottom-8 right-8' : ''}`}
      >
        {!assistiveOpen ? (
          /* Collapsed button - handles drag and click */
          <button
            type="button"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onClick={(e) => {
              if (dragRef.current.hasMoved) {
                e.preventDefault()
                e.stopPropagation()
                return
              }
              setAssistiveOpen(true)
            }}
            className={`w-14 h-14 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/60 shadow-2xl rounded-2xl flex items-center justify-center transition-all duration-300 cursor-grab active:cursor-grabbing ${
              isDragging ? 'scale-105 opacity-100 border-sky-500' : 'opacity-40 hover:opacity-100 hover:scale-105'
            }`}
            title="Open quick menu (Drag to move)"
          >
            <div className="w-9 h-9 rounded-full border border-slate-500/30 flex items-center justify-center">
              <div className="w-5.5 h-5.5 rounded-full bg-slate-100 border border-slate-300 shadow-md"></div>
            </div>
          </button>
        ) : (
          /* Expanded menu panel */
          <div
            className="bg-[#181f2a]/95 backdrop-blur-lg border border-slate-700/50 shadow-2xl rounded-[32px] w-64 h-64 p-5 relative transition-all duration-300 scale-100 ease-out text-white"
          >
            {/* 2x2 grid container */}
            <div className="grid grid-cols-2 grid-rows-2 h-full w-full">
              {/* Top-Left: File Issue */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setAssistiveOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-sky-500 text-sky-400 flex items-center justify-center hover:bg-sky-500/10 transition-colors shadow-sm shadow-sky-500/10">
                    <span className="material-symbols-outlined text-2xl font-bold">add</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-slate-300 group-hover/btn:text-white transition-colors">File Issue</span>
                </button>
              </div>

              {/* Top-Right: GitHub */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setAssistiveOpen(false);
                    if (isLeader) {
                      navigate(`/projects/${projectId}/github-config`);
                    } else {
                      toast.error("Only Project Leaders are authorized to configure GitHub!");
                    }
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-sky-500 text-sky-400 flex items-center justify-center hover:bg-sky-500/10 transition-colors shadow-sm shadow-sky-500/10">
                    <span className="text-base font-black tracking-tighter select-none font-sans">&lt;···&gt;</span>
                  </div>
                  <span className="text-[11px] font-bold mt-1 text-slate-300 group-hover/btn:text-white transition-colors">GitHub</span>
                </button>
              </div>

              {/* Bottom-Left: Thống kê */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowStats(prev => !prev)}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center hover:bg-white/10 transition-all ${showStats ? 'border-sky-500 text-sky-400 shadow-sm shadow-sky-500/10' : 'border-slate-500 text-slate-300'}`}>
                    <span className="material-symbols-outlined text-2xl">bar_chart</span>
                  </div>
                  <span className={`text-[11px] font-bold mt-1 transition-colors ${showStats ? 'text-sky-400 font-extrabold' : 'text-slate-300 group-hover/btn:text-white'}`}>Statistics</span>
                </button>
              </div>

              {/* Bottom-Right: Bộ lọc */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setShowFilters(prev => !prev)}
                  className="flex flex-col items-center justify-center cursor-pointer group/btn bg-transparent border-0 outline-none"
                >
                  <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center hover:bg-white/10 transition-all ${showFilters ? 'border-sky-500 text-sky-400 shadow-sm shadow-sky-500/10' : 'border-slate-500 text-slate-300'}`}>
                    <span className="material-symbols-outlined text-2xl">filter_alt</span>
                  </div>
                  <span className={`text-[11px] font-bold mt-1 transition-colors ${showFilters ? 'text-sky-400 font-extrabold' : 'text-slate-300 group-hover/btn:text-white'}`}>Filters</span>
                </button>
              </div>
            </div>

            {/* Center Home Button for collapsing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#141a24] rounded-2xl border border-slate-800 shadow-md flex items-center justify-center pointer-events-auto">
              <button
                type="button"
                onClick={() => setAssistiveOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-400 hover:bg-slate-300 border border-slate-500/50 cursor-pointer shadow-inner transition-colors flex items-center justify-center outline-none"
                title="Close menu"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#141a24]"></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default IssueTrackerDashboard;
