import { create } from 'zustand'
import taskService from '../services/taskService'
import { mapTaskFromApi, mapTaskToApi } from '../utils/taskMapper'
import { requirementApi } from '@features/requirement/services/requirementApi'

export const TASK_STATUSES = [
  { id: 'TODO', title: 'Todo', statusKey: 'TODO', color: 'bg-outline' },
  { id: 'IN_PROGRESS', title: 'In Progress', statusKey: 'IN_PROGRESS', color: 'bg-primary' },
  { id: 'IN_REVIEW', title: 'In Review', statusKey: 'IN_REVIEW', color: 'bg-[#a855f7]' },
  { id: 'DONE', title: 'Done', statusKey: 'DONE', color: 'bg-[#16a34a]' },
  { id: 'BLOCKED', title: 'Blocked', statusKey: 'BLOCKED', color: 'bg-error' },
]

export const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
export const typeOptions = ['DEV', 'UI/UX', 'QA', 'BUG', 'DOCS']

const replaceTask = (tasks, updatedTask) =>
  tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))

const mapColumnFromApi = (column) => ({
  id: String(column.id),
  title: column.name,
  statusKey: column.statusKey || null,
  color: column.color || 'bg-outline',
  order: column.columnOrder || 0,
  isDefault: Boolean(column.defaultColumn),
  isArchived: Boolean(column.archived),
})

export const useKanbanStore = create((set, get) => ({
  tasks: [],
  columns: TASK_STATUSES,
  requirementOptions: [],
  sprintOptions: [],
  selectedTaskId: null,
  isTaskFormOpen: false,
  editingTaskId: null,
  loading: false,
  error: null,
  filters: {
    sprint: 'ALL',
    assignee: 'ALL',
    requirement: 'ALL',
    priority: 'ALL',
  },

  fetchProjectTasks: async (projectId) => {
    if (!projectId) {
      set({ tasks: [], columns: TASK_STATUSES, selectedTaskId: null })
      return
    }
    set({ loading: true, error: null })
    try {
      const columns = await taskService.getProjectColumns(projectId)
      const tasks = await taskService.getProjectTasks(projectId)
      const mappedColumns = columns.map(mapColumnFromApi)
      set({
        columns: mappedColumns.length > 0 ? mappedColumns : TASK_STATUSES,
        tasks: tasks.map(mapTaskFromApi),
        loading: false,
      })
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to fetch tasks', loading: false })
    }
  },

  fetchTaskFormOptions: async (projectId) => {
    if (!projectId) {
      set({ requirementOptions: [], sprintOptions: [] })
      return
    }

    try {
      const [requirementResponse, sprintOptions] = await Promise.all([
        requirementApi.getAllRequirements({ projectId, page: 0, size: 100 }),
        taskService.getProjectSprints(projectId),
      ])
      const requirementItems = requirementResponse.items ?? requirementResponse ?? []
      set({
        requirementOptions: requirementItems.map((requirement) => ({
          id: requirement.id,
          code: requirement.reqCode || `REQ-${String(requirement.id).padStart(2, '0')}`,
          title: requirement.title || 'Untitled requirement',
        })),
        sprintOptions: sprintOptions.map((sprint) => ({
          id: sprint.id,
          name: sprint.name || `Sprint ${sprint.id}`,
          status: sprint.status,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
        })),
      })
    } catch (error) {
      set({
        requirementOptions: [],
        sprintOptions: [],
        error: error.response?.data?.message || error.message || 'Failed to load task form options',
      })
    }
  },

  fetchTaskById: async (taskId) => {
    set({ loading: true, error: null })
    try {
      const task = mapTaskFromApi(await taskService.getTask(taskId))
      set((state) => ({
        tasks: state.tasks.some((item) => item.id === task.id) ? replaceTask(state.tasks, task) : [...state.tasks, task],
        loading: false,
      }))
      return task
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to fetch task', loading: false })
      return null
    }
  },

  fetchMyTasks: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await taskService.getMyTasks()
      set({ tasks: tasks.map(mapTaskFromApi), loading: false })
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to fetch my tasks', loading: false })
    }
  },

  openTask: (taskId) => set({ selectedTaskId: String(taskId) }),
  closeTask: () => set({ selectedTaskId: null }),
  openTaskForm: () => set({ isTaskFormOpen: true, editingTaskId: null }),
  openEditTaskForm: (taskId) => set({ isTaskFormOpen: true, editingTaskId: String(taskId) }),
  closeTaskForm: () => set({ isTaskFormOpen: false, editingTaskId: null }),

  setFilter: (key, value) => set((state) => ({
    filters: {
      ...state.filters,
      [key]: value,
    },
  })),

  addColumn: async (projectId, payload) => {
    set({ error: null })
    try {
      const column = mapColumnFromApi(await taskService.createColumn(projectId, payload))
      set((state) => ({ columns: [...state.columns, column].sort((a, b) => a.order - b.order) }))
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to create column' })
    }
  },

  updateColumn: async (projectId, columnId, payload) => {
    set({ error: null })
    try {
      const column = mapColumnFromApi(await taskService.updateColumn(projectId, columnId, payload))
      set((state) => ({
        columns: state.columns.map((item) => item.id === column.id ? column : item).sort((a, b) => a.order - b.order),
      }))
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to update column' })
    }
  },

  archiveColumn: async (projectId, columnId) => {
    set({ error: null })
    try {
      await taskService.archiveColumn(projectId, columnId)
      set((state) => ({ columns: state.columns.filter((column) => column.id !== String(columnId)) }))
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to archive column' })
    }
  },

  addTask: async (projectId, payload) => {
    set({ loading: true, error: null })
    try {
      const task = mapTaskFromApi(await taskService.createTask(projectId, mapTaskToApi(payload)))
      set((state) => ({
        tasks: [task, ...state.tasks],
        isTaskFormOpen: false,
        selectedTaskId: task.id,
        loading: false,
      }))
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to create task', loading: false })
    }
  },

  updateTask: async (taskId, payload) => {
    set({ loading: true, error: null })
    try {
      const task = mapTaskFromApi(await taskService.updateTask(taskId, mapTaskToApi(payload)))
      set((state) => ({
        tasks: replaceTask(state.tasks, task),
        isTaskFormOpen: false,
        editingTaskId: null,
        selectedTaskId: task.id,
        loading: false,
      }))
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to update task', loading: false })
    }
  },

  deleteTask: async (taskId) => {
    set({ loading: true, error: null })
    try {
      await taskService.deleteTask(taskId)
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== String(taskId)),
        selectedTaskId: state.selectedTaskId === String(taskId) ? null : state.selectedTaskId,
        editingTaskId: state.editingTaskId === String(taskId) ? null : state.editingTaskId,
        isTaskFormOpen: state.editingTaskId === String(taskId) ? false : state.isTaskFormOpen,
        loading: false,
      }))
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to delete task', loading: false })
    }
  },

  updateTaskStatus: async (taskId, status, columnId = null) => {
    const previousTasks = get().tasks
    const targetColumn = columnId ? get().columns.find((column) => column.id === String(columnId)) : null
    const nextStatus = targetColumn?.statusKey || status
    set((state) => ({
      tasks: state.tasks.map((task) => task.id === String(taskId) ? {
        ...task,
        status: nextStatus || task.status,
        columnId: columnId ? String(columnId) : task.columnId,
        columnName: targetColumn?.title || task.columnName,
      } : task),
      error: null,
    }))

    try {
      const task = mapTaskFromApi(await taskService.updateTaskStatus(
        taskId,
        targetColumn ? targetColumn.statusKey : nextStatus,
        undefined,
        columnId
      ))
      set((state) => ({ tasks: replaceTask(state.tasks, task) }))
    } catch (error) {
      set({ tasks: previousTasks, error: error.response?.data?.message || error.message || 'Failed to update task status' })
    }
  },

  toggleChecklistItem: async (taskId, checklistId) => {
    const task = get().tasks.find((item) => item.id === String(taskId))
    if (!task) return

    const checklist = task.checklist.map((item) =>
      item.id === String(checklistId) ? { ...item, done: !item.done } : item
    )

    await get().updateTask(taskId, {
      ...task,
      assigneeId: task.assignee.id,
      checklist,
    })
  },
}))

export default useKanbanStore
