import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import taskService from '@features/kanban/services/taskService'
import sprintService from '../services/sprintService'
import SprintFormModal from '../components/SprintFormModal'
import SprintDetailDrawer from '../components/SprintDetailDrawer'

const statusTone = {
  PLANNED: 'bg-primary-fixed text-on-primary-fixed',
  ACTIVE: 'bg-[#dcfce7] text-[#166534]',
  COMPLETED: 'bg-surface-container-high text-on-surface-variant',
}

const statusDot = {
  PLANNED: 'bg-primary',
  ACTIVE: 'bg-[#16a34a]',
  COMPLETED: 'bg-outline',
}

const formatStatus = (value) => String(value || 'PLANNED').replaceAll('_', ' ')

const formatUpdatedAt = (value) => {
  if (!value) return 'Not updated yet'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Updated recently'
  return `Updated ${date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

const SummaryCard = ({ label, value, icon, helper }) => (
  <div className="rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">{label}</p>
      <span className="material-symbols-outlined text-xl text-primary">{icon}</span>
    </div>
    <p className="mt-3 text-3xl font-black text-on-surface">{value}</p>
    {helper && <p className="mt-1 text-xs text-on-surface-variant">{helper}</p>}
  </div>
)

const SprintCard = ({ sprint, selected, onOpen }) => (
  <button
    className={`text-left rounded-2xl border p-5 bg-surface-container-lowest hover:border-primary/50 hover:shadow-md transition-all ${selected ? 'border-primary shadow-md' : 'border-outline-variant/60'}`}
    onClick={() => onOpen(sprint.id)}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusDot[sprint.status] || statusDot.PLANNED}`}></span>
          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${statusTone[sprint.status] || statusTone.PLANNED}`}>
            {formatStatus(sprint.status)}
          </span>
        </div>
        <h3 className="text-lg font-black text-on-surface truncate">{sprint.name}</h3>
        <p className="text-xs text-on-surface-variant mt-1">{sprint.startDate} to {sprint.endDate}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">{formatUpdatedAt(sprint.updatedAt)}</p>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
    </div>
    <p className="text-sm text-on-surface-variant mt-4 line-clamp-2 min-h-10">{sprint.goal || 'No sprint goal recorded yet.'}</p>
    <div className="mt-5 space-y-2">
      <div className="flex items-center justify-between text-xs font-bold">
        <span className="text-on-surface-variant">Progress</span>
        <span className="text-on-surface">{sprint.progressPercent || 0}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${sprint.progressPercent || 0}%` }}></div>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-4 gap-2 text-center">
      <div className="rounded-lg bg-surface-container-low p-2">
        <p className="font-black">{sprint.totalTasks || 0}</p>
        <p className="text-[9px] uppercase font-bold text-on-surface-variant">Tasks</p>
      </div>
      <div className="rounded-lg bg-surface-container-low p-2">
        <p className="font-black text-[#166534]">{sprint.doneTasks || 0}</p>
        <p className="text-[9px] uppercase font-bold text-on-surface-variant">Done</p>
      </div>
      <div className="rounded-lg bg-surface-container-low p-2">
        <p className="font-black text-primary">{sprint.inProgressTasks || 0}</p>
        <p className="text-[9px] uppercase font-bold text-on-surface-variant">Active</p>
      </div>
      <div className="rounded-lg bg-surface-container-low p-2">
        <p className="font-black text-error">{sprint.riskCount || 0}</p>
        <p className="text-[9px] uppercase font-bold text-on-surface-variant">Risk</p>
      </div>
    </div>
  </button>
)

const SprintPage = () => {
  const activeProject = useProjectStore((state) => state.activeProject)
  const [sprints, setSprints] = useState([])
  const [projectTasks, setProjectTasks] = useState([])
  const [sprintTasks, setSprintTasks] = useState([])
  const [selectedSprintId, setSelectedSprintId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tasksLoading, setTasksLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSprint, setEditingSprint] = useState(null)

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => String(sprint.id) === String(selectedSprintId)) || null,
    [sprints, selectedSprintId]
  )

  const loadSprintsAndTasks = useCallback(async () => {
    if (!activeProject?.id) return
    setLoading(true)
    try {
      const [sprintRows, taskRows] = await Promise.all([
        sprintService.getSprints(activeProject.id),
        taskService.getProjectTasks(activeProject.id),
      ])
      setSprints(sprintRows)
      setProjectTasks(taskRows)
      if (selectedSprintId && !sprintRows.some((sprint) => String(sprint.id) === String(selectedSprintId))) {
        setSelectedSprintId(null)
      }
    } catch (error) {
      console.error('Error loading sprints:', error)
      toast.error(error.response?.data?.message || 'Unable to load sprints')
    } finally {
      setLoading(false)
    }
  }, [activeProject?.id, selectedSprintId])

  const loadSelectedSprintTasks = useCallback(async () => {
    if (!activeProject?.id || !selectedSprintId) {
      setSprintTasks([])
      return
    }
    setTasksLoading(true)
    try {
      setSprintTasks(await sprintService.getSprintTasks(activeProject.id, selectedSprintId))
    } catch (error) {
      console.error('Error loading sprint tasks:', error)
      toast.error(error.response?.data?.message || 'Unable to load sprint tasks')
    } finally {
      setTasksLoading(false)
    }
  }, [activeProject?.id, selectedSprintId])

  useEffect(() => {
    loadSprintsAndTasks()
  }, [loadSprintsAndTasks])

  useEffect(() => {
    loadSelectedSprintTasks()
  }, [loadSelectedSprintTasks])

  const availableTasks = useMemo(() => (
    projectTasks.filter((task) => !task.sprintId)
  ), [projectTasks])

  const summary = useMemo(() => {
    const activeSprint = sprints.find((sprint) => sprint.status === 'ACTIVE')
    const planned = sprints.filter((sprint) => sprint.status === 'PLANNED').length
    const completed = sprints.filter((sprint) => sprint.status === 'COMPLETED').length
    const activeCapacity = activeSprint?.capacityUsagePercent || 0
    return { activeSprint, planned, completed, activeCapacity }
  }, [sprints])

  const refreshSelectedSprint = async () => {
    await loadSprintsAndTasks()
    await loadSelectedSprintTasks()
  }

  const openCreate = () => {
    setEditingSprint(null)
    setFormOpen(true)
  }

  const openEdit = (sprint) => {
    setEditingSprint(sprint)
    setFormOpen(true)
  }

  const handleSubmitSprint = async (payload) => {
    if (!activeProject?.id) return
    setSaving(true)
    try {
      const sprint = editingSprint
        ? await sprintService.updateSprint(activeProject.id, editingSprint.id, payload)
        : await sprintService.createSprint(activeProject.id, payload)
      toast.success(editingSprint ? 'Sprint updated' : 'Sprint created')
      setSelectedSprintId(sprint.id)
      setFormOpen(false)
      setEditingSprint(null)
      await refreshSelectedSprint()
    } catch (error) {
      console.error('Error saving sprint:', error)
      toast.error(error.response?.data?.message || 'Unable to save sprint')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSprint = async (sprint) => {
    if (!activeProject?.id) return
    const ok = window.confirm(`Delete ${sprint.name}? A sprint with assigned tasks cannot be deleted.`)
    if (!ok) return
    try {
      await sprintService.deleteSprint(activeProject.id, sprint.id)
      toast.success('Sprint deleted')
      setSelectedSprintId(null)
      await refreshSelectedSprint()
    } catch (error) {
      console.error('Error deleting sprint:', error)
      toast.error(error.response?.data?.message || 'Unable to delete sprint')
    }
  }

  const handleStatusChange = async (status) => {
    if (!activeProject?.id || !selectedSprint) return
    try {
      await sprintService.updateSprintStatus(activeProject.id, selectedSprint.id, status)
      toast.success('Sprint status updated')
      await refreshSelectedSprint()
    } catch (error) {
      console.error('Error updating sprint status:', error)
      toast.error(error.response?.data?.message || 'Unable to update sprint status')
    }
  }

  const handleAssignTask = async (taskId) => {
    if (!activeProject?.id || !selectedSprint) return
    setAssigning(true)
    try {
      await sprintService.assignTask(activeProject.id, selectedSprint.id, taskId)
      toast.success('Task assigned to sprint')
      await refreshSelectedSprint()
    } catch (error) {
      console.error('Error assigning task:', error)
      toast.error(error.response?.data?.message || 'Unable to assign task')
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveTask = async (taskId) => {
    if (!activeProject?.id || !selectedSprint) return
    try {
      await sprintService.removeTask(activeProject.id, selectedSprint.id, taskId)
      toast.success('Task removed from sprint')
      await refreshSelectedSprint()
    } catch (error) {
      console.error('Error removing task:', error)
      toast.error(error.response?.data?.message || 'Unable to remove task')
    }
  }

  const handlePlanDateChange = async (taskId, sprintPlanDate) => {
    if (!activeProject?.id || !selectedSprint) return
    const previous = sprintTasks
    setSprintTasks((current) => current.map((task) => String(task.id) === String(taskId) ? { ...task, sprintPlanDate } : task))
    try {
      await sprintService.updateTaskPlanDate(activeProject.id, selectedSprint.id, taskId, sprintPlanDate)
      await refreshSelectedSprint()
    } catch (error) {
      setSprintTasks(previous)
      console.error('Error updating sprint plan date:', error)
      toast.error(error.response?.data?.message || 'Unable to update plan date')
    }
  }

  if (!activeProject) {
    return (
      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-background flex items-center justify-center">
        <div className="max-w-md text-center bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/60 shadow-lg space-y-4">
          <span className="material-symbols-outlined text-5xl text-primary">folder_open</span>
          <h3 className="font-extrabold text-xl text-on-surface">No project selected</h3>
          <p className="text-sm text-on-surface-variant">Return to Dashboard and select a project to plan sprints.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background select-none">
      <div className="relative z-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
        <section className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black tracking-wider px-2.5 py-1 rounded-md uppercase bg-primary-fixed text-on-primary-fixed">
                {activeProject.title}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-primary">history_toggle_off</span>
              Sprints
            </h1>
            <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">
              Plan sprint scope, assign existing tasks, and distribute work across each sprint week.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-high font-black flex items-center gap-2" onClick={loadSprintsAndTasks}>
              <span className="material-symbols-outlined text-lg">refresh</span>
              Refresh
            </button>
            <button className="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-black flex items-center gap-2" onClick={openCreate}>
              <span className="material-symbols-outlined text-lg">add</span>
              New Sprint
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard label="Active Sprint" value={summary.activeSprint?.name || 'None'} icon="play_circle" helper={summary.activeSprint ? `${summary.activeSprint.progressPercent || 0}% complete` : 'No sprint active'} />
          <SummaryCard label="Planned" value={summary.planned} icon="event" helper="Upcoming sprint count" />
          <SummaryCard label="Completed" value={summary.completed} icon="verified" helper="Finished sprint count" />
          <SummaryCard label="Capacity Usage" value={`${summary.activeCapacity}%`} icon="speed" helper="Current active sprint" />
        </section>

        {loading && sprints.length === 0 ? (
          <section className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl p-12 text-center shadow-sm">
            <span className="material-symbols-outlined text-5xl text-primary animate-spin">progress_activity</span>
            <p className="mt-4 text-sm font-bold text-on-surface-variant">Loading sprints...</p>
          </section>
        ) : sprints.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-primary">event_available</span>
            <h3 className="mt-4 text-xl font-black text-on-surface">No sprints yet</h3>
            <p className="mt-2 text-sm text-on-surface-variant">Create the first sprint, then assign existing Task Board items into it.</p>
            <button className="mt-5 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container font-black" onClick={openCreate}>
              Create Sprint
            </button>
          </section>
        ) : (
          <section className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sprints.map((sprint) => (
              <SprintCard key={sprint.id} sprint={sprint} selected={String(sprint.id) === String(selectedSprintId)} onOpen={setSelectedSprintId} />
            ))}
          </section>
        )}
      </div>

      <SprintDetailDrawer
        open={Boolean(selectedSprint)}
        sprint={selectedSprint}
        sprintTasks={sprintTasks}
        availableTasks={availableTasks}
        loading={tasksLoading}
        assigning={assigning}
        onClose={() => setSelectedSprintId(null)}
        onEdit={openEdit}
        onDelete={handleDeleteSprint}
        onStatusChange={handleStatusChange}
        onAssignTask={handleAssignTask}
        onRemoveTask={handleRemoveTask}
        onPlanDateChange={handlePlanDateChange}
      />

      <SprintFormModal
        open={formOpen}
        sprint={editingSprint}
        onClose={() => {
          setFormOpen(false)
          setEditingSprint(null)
        }}
        onSubmit={handleSubmitSprint}
        saving={saving}
      />
    </main>
  )
}

export default SprintPage
