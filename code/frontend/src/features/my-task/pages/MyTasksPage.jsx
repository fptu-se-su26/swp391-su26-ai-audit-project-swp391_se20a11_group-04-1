import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import myTaskService from '../services/myTaskService'
import DailyView from '../components/DailyView'
import WeeklyView from '../components/WeeklyView'

/**
 * MyTasksPage - Trang My Tasks với toggle Daily / Weekly
 * Sidebar và TopNavBar giữ nguyên từ MainLayout / ProjectLayout.
 *
 * Kiến trúc: Frontend chỉ gọi API và render.
 * Mọi logic tính toán (phân loại task, stats, member workload, AI insight)
 * đều được xử lý ở backend.
 */
const MyTasksPage = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [view, setView]               = useState('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailyData, setDailyData]     = useState(null)
  const [weeklyData, setWeeklyData]   = useState(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  // ── Fetch Daily ───────────────────────────────────────────────────────────
  const loadDaily = useCallback(async (date) => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await myTaskService.getDailyView(projectId, date)
      setDailyData(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // ── Fetch Weekly ──────────────────────────────────────────────────────────
  const loadWeekly = useCallback(async (date) => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      // Tính Thứ 2 của tuần chứa date
      const d = new Date(date)
      const day = d.getDay()
      const diff = day === 0 ? -6 : 1 - day
      d.setDate(d.getDate() + diff)
      const data = await myTaskService.getWeeklyView(projectId, d)
      setWeeklyData(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // ── Load khi view hoặc date thay đổi ─────────────────────────────────────
  useEffect(() => {
    if (view === 'daily') {
      loadDaily(selectedDate)
    } else {
      loadWeekly(selectedDate)
    }
  }, [view, selectedDate, loadDaily, loadWeekly])

  // ── Date navigation ───────────────────────────────────────────────────────
  const shiftDate = (days) => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + days)
      return d
    })
  }

  const goToThisWeek = () => setSelectedDate(new Date())

  // Khi click ngày trong WeeklyGrid → chuyển sang Daily view ngày đó
  const handleDayClick = (date) => {
    setSelectedDate(date)
    setView('daily')
  }

  // ── Task click → navigate to detail ──────────────────────────────────────
  const handleTaskClick = (task) => {
    if (projectId) {
      navigate(`/projects/${projectId}/tasks/${task.id}`)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F3F4F6]">
      <div className="p-margin_mobile md:p-margin_desktop flex flex-col gap-4 min-h-full">

        {/* Header + Toggle */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline-md text-headline-md text-[#1E3A5F] mb-1">
              {view === 'daily' ? 'Daily View' : 'Weekly View'}
            </h2>
            <p className="text-on-surface-variant font-body-md">
              {view === 'daily'
                ? 'Daily Team Work Overview'
                : 'Weekly Team Work Overview'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center p-1 bg-surface-container-high rounded-xl">
            <button
              onClick={() => setView('daily')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                view === 'daily'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setView('weekly')}
              className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${
                view === 'weekly'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] animate-spin">
                progress_activity
              </span>
              <span className="text-sm">Đang tải dữ liệu...</span>
            </div>
          </div>
        ) : view === 'daily' ? (
          <DailyView
            data={dailyData}
            selectedDate={selectedDate}
            onPrevDay={() => shiftDate(-1)}
            onNextDay={() => shiftDate(1)}
            onSelectDate={setSelectedDate}
            onTaskClick={handleTaskClick}
          />
        ) : (
          <WeeklyView
            data={weeklyData}
            selectedDate={selectedDate}
            onPrevWeek={() => shiftDate(-7)}
            onNextWeek={() => shiftDate(7)}
            onThisWeek={goToThisWeek}
            onTaskClick={handleTaskClick}
            onDayClick={handleDayClick}
          />
        )}

      </div>
    </div>
  )
}

export default MyTasksPage
