import React, { useState, useEffect } from 'react'
import axiosInstance from '@api/axiosConfig'
import toast from 'react-hot-toast'

const SchedulerJobsPage = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [jobNameFilter, setJobNameFilter] = useState('')
  const [uniqueJobNames, setUniqueJobNames] = useState([])

  const fetchLogs = async (currentPage = 0, jobName = '') => {
    setLoading(true)
    try {
      const response = await axiosInstance.get('/v1/scheduler-logs', {
        params: {
          page: currentPage,
          size: 20,
          jobName: jobName || undefined
        }
      })
      if (response.data.success) {
        setLogs(response.data.data.content)
        setTotalPages(response.data.data.totalPages)
        
        // Append unique job names
        setUniqueJobNames(prev => {
          const names = [...new Set([...prev, ...response.data.data.content.map(log => log.jobName)])]
          return names
        })
      } else {
        toast.error(response.data.message || 'Failed to fetch scheduler logs')
      }
    } catch (error) {
      console.error('Error fetching scheduler logs:', error)
      toast.error('Could not load scheduler logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(page, jobNameFilter)
  }, [page, jobNameFilter])

  const handleRefresh = () => {
    fetchLogs(page, jobNameFilter)
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SUCCESS':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 border border-green-200">SUCCESS</span>
      case 'FAILED':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 border border-red-200">FAILED</span>
      case 'RUNNING':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 border border-yellow-200">RUNNING</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800 border border-gray-200">{status}</span>
    }
  }

  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return '-'
    if (seconds < 60) return `${seconds}s`
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  return (
    <div className="p-6 bg-surface-container-lowest min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">schedule</span>
            Scheduler Logs
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">View the history and status of background tasks</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            value={jobNameFilter}
            onChange={(e) => {
              setJobNameFilter(e.target.value)
              setPage(0)
            }}
          >
            <option value="">All Jobs</option>
            {uniqueJobNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-surface rounded-xl shadow-sm border border-outline-variant">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant text-sm border-b border-outline-variant">
              <th className="p-4 font-semibold w-1/4">Job Name</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Started At</th>
              <th className="p-4 font-semibold">Duration</th>
              <th className="p-4 font-semibold text-center">Scanned</th>
              <th className="p-4 font-semibold text-center">Created</th>
              <th className="p-4 font-semibold text-center">Sent</th>
              <th className="p-4 font-semibold">Error</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span>
                    <p>Loading logs...</p>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-on-surface-variant">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-outline">history_toggle_off</span>
                    <p>No scheduler logs found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-outline-variant hover:bg-surface-container-lowest transition-colors group">
                  <td className="p-4 font-medium text-on-surface">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary/70 group-hover:text-primary transition-colors">code_blocks</span>
                      {log.jobName}
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(log.status)}</td>
                  <td className="p-4 text-on-surface-variant whitespace-nowrap">
                    {new Date(log.startedAt).toLocaleString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td className="p-4 font-mono text-xs">{formatDuration(log.durationSeconds)}</td>
                  <td className="p-4 text-center font-medium">{log.totalScanned}</td>
                  <td className="p-4 text-center font-medium text-green-600">{log.totalCreated > 0 ? `+${log.totalCreated}` : '0'}</td>
                  <td className="p-4 text-center font-medium text-blue-600">{log.totalSent > 0 ? `+${log.totalSent}` : '0'}</td>
                  <td className="p-4 text-error text-xs max-w-[200px] truncate" title={log.errorMessage}>
                    {log.errorMessage || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-on-surface-variant">
            Showing page <span className="font-semibold text-on-surface">{page + 1}</span> of <span className="font-semibold text-on-surface">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="p-2 rounded-lg bg-surface border border-outline-variant disabled:opacity-50 hover:bg-surface-container-low transition-colors flex items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button 
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              className="p-2 rounded-lg bg-surface border border-outline-variant disabled:opacity-50 hover:bg-surface-container-low transition-colors flex items-center justify-center text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SchedulerJobsPage
