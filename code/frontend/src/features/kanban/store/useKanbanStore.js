import { create } from 'zustand'
import taskService from '../services/taskService'
import { mapTaskFromApi, mapTaskToApi } from '../utils/taskMapper'

export const TASK_STATUSES = [
  { id: 'TODO', title: 'Todo', color: 'bg-outline' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-primary' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-[#a855f7]' },
  { id: 'DONE', title: 'Done', color: 'bg-[#16a34a]' },
  { id: 'BLOCKED', title: 'Blocked', color: 'bg-error' },
]

export const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
export const typeOptions = ['DEV', 'UI/UX', 'QA', 'BUG', 'DOCS']

const replaceTask = (tasks, updatedTask) =>
  tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))

export const useKanbanStore = create((set, get) => ({
  tasks: [],
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
      set({ tasks: [], selectedTaskId: null })
      return
    }
    set({ loading: true, error: null })
    try {
      const tasks = await taskService.getProjectTasks(projectId)
      set({ tasks: tasks.map(mapTaskFromApi), loading: false })
    } catch (error) {
      set({ error: error.response?.data?.message || error.message || 'Failed to fetch tasks', loading: false })
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

  updateTaskStatus: async (taskId, status) => {
    const previousTasks = get().tasks
    set((state) => ({
      tasks: state.tasks.map((task) => task.id === String(taskId) ? { ...task, status } : task),
      error: null,
    }))

    try {
      const task = mapTaskFromApi(await taskService.updateTaskStatus(taskId, status))
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
