import axiosInstance from '@api/axiosConfig'

const unwrap = (response) => response.data?.data

/**
 * Service gọi API cho tính năng My Tasks (Daily / Weekly view)
 * Mọi logic tính toán đều ở backend — frontend chỉ gọi API và render.
 */
const myTaskService = {
  /**
   * GET /api/v1/projects/{projectId}/tasks/daily?date=YYYY-MM-DD
   * Backend trả về: { overdueTasks, dueTasks, doneTasks, stats, memberProgress, aiInsight }
   * Nếu không truyền date → backend dùng ngày hôm nay
   */
  getDailyView: async (projectId, date) => {
    const params = { _t: Date.now() }
    if (date) {
      params.date = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    }
    const response = await axiosInstance.get(`/v1/projects/${projectId}/tasks/daily`, { params })
    return unwrap(response)
  },

  /**
   * GET /api/v1/projects/{projectId}/tasks/weekly?weekStart=YYYY-MM-DD
   * Backend trả về: { tasksByDay, weekStats, activeSprint, sprintProgress, teamWorkload, aiInsight }
   * Nếu không truyền weekStart → backend dùng Thứ 2 tuần hiện tại
   */
  getWeeklyView: async (projectId, weekStart) => {
    const params = { _t: Date.now() }
    if (weekStart) {
      params.weekStart = new Date(weekStart.getTime() - (weekStart.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    }
    const response = await axiosInstance.get(`/v1/projects/${projectId}/tasks/weekly`, { params })
    return unwrap(response)
  },

  /**
   * Lấy task theo projectId (dùng cho Kanban board — giữ nguyên)
   */
  getProjectTasks: async (projectId) => {
    const response = await axiosInstance.get(`/v1/projects/${projectId}/tasks`)
    return unwrap(response) || []
  },

  /**
   * Lấy tất cả task được assign cho user hiện tại (dùng cho My Tasks list cũ)
   */
  getMyTasks: async () => {
    const response = await axiosInstance.get('/v1/my-tasks')
    return unwrap(response) || []
  },
}

export default myTaskService
