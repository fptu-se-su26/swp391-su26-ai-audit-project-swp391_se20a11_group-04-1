import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useProjectStore from '@store/useProjectStore'
import axiosInstance from '@api/axiosConfig'

export function ArchivedProjectsPage() {
  const navigate = useNavigate()
  const {
    projects,
    loading,
    error,
    fetchProjects,
    reopenProject,
    selectProject
  } = useProjectStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recent') // 'recent' | 'name' | 'progress'
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 6

  const [exportingId, setExportingId] = useState(null)
  const [reopeningId, setReopeningId] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isOverdue = (project) => {
    if (project.status === 'COMPLETED' || project.status === 'ARCHIVED') return false
    if (!project.deadline) return false
    const d = new Date(project.deadline)
    return d < today
  }

  // Lọc danh sách dự án thuộc mục Archived (Gồm ARCHIVED và COMPLETED)
  const archivedProjects = projects
    .filter((project) => {
      return project.status === 'ARCHIVED' || project.status === 'COMPLETED'
    })
    .filter((project) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        (project.title && project.title.toLowerCase().includes(q)) ||
        (project.major && project.major.toLowerCase().includes(q)) ||
        (project.role && project.role.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '')
      if (sortBy === 'progress') return (b.progress || 0) - (a.progress || 0)

      // Sort by recent (updatedAt DESC, or deadline DESC)
      const dateA = new Date(a.updatedAt || a.createdAt || 0)
      const dateB = new Date(b.updatedAt || b.createdAt || 0)
      return dateB - dateA
    })

  // Pagination calculation
  const totalItems = archivedProjects.length
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const paginatedProjects = archivedProjects.slice(startIndex, startIndex + pageSize)

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const openProject = (project) => {
    selectProject(project)
    navigate(`/projects/${project.id}/dashboard`)
  }

  const handleExportTracking = async (projectId) => {
    setExportingId(projectId)
    try {
      const res = await axiosInstance.get(`/v1/projects/${projectId}/export-tracking`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `project-tracking-${projectId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Exported tracking file successfully!')
    } catch (err) {
      toast.error('Failed to export tracking file.')
    } finally {
      setExportingId(null)
    }
  }

  const handleReopen = async (projectId) => {
    const reason = window.prompt('Enter reason to reopen project (min 10 characters):')
    if (!reason || reason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters.')
      return
    }
    setReopeningId(projectId)
    try {
      await reopenProject(projectId, reason.trim())
      toast.success('Project has been reopened successfully!')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reopen project.')
    } finally {
      setReopeningId(null)
    }
  }

  return (
    <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-[#f8fafc] select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-2xl">inbox</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Archived & Overdue Projects
              </h1>
            </div>
            <p className="text-slate-500 text-sm pl-13 font-medium">
              View completed, archived, and expired projects. Sorted by most recently updated/finished.
            </p>
          </div>
          <div className="bg-slate-100/80 px-4 py-2 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-slate-500">inventory_2</span>
            Total {totalItems} {totalItems === 1 ? 'project' : 'projects'}
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search archived projects..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] transition-all"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Sort by:
            </label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] cursor-pointer"
            >
              <option value="recent">Recently Finished / Updated</option>
              <option value="name">Project Name (A-Z)</option>
              <option value="progress">Completion Progress</option>
            </select>
          </div>
        </div>

        {/* Content Section: Loading, Empty, or Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-pulse space-y-4">
                <div className="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
                <div className="h-4 w-1/2 bg-slate-100 rounded-lg"></div>
                <div className="h-20 bg-slate-100 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : paginatedProjects.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">inbox</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Archived or Overdue Projects</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {searchQuery ? 'No archived projects matched your search keywords.' : 'All your archived and completed projects will be stored and listed here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProjects.map((project) => {
              const projectIsOverdue = isOverdue(project)
              const projectIsCompleted = project.status === 'COMPLETED'
              const projectIsArchived = project.status === 'ARCHIVED'

              return (
                <div
                  key={project.id}
                  onClick={() => openProject(project)}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer group hover:-translate-y-1"
                >
                  {/* Card Top / Header */}
                  <div className="p-6 space-y-4">
                    {/* Status Badge & Major */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-wider">
                        {project.major || 'Project'}
                      </span>
                      {projectIsArchived && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="material-symbols-outlined text-[14px]">archive</span>
                          Archived
                        </span>
                      )}
                      {projectIsCompleted && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Completed
                        </span>
                      )}
                      {projectIsOverdue && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          <span className="material-symbols-outlined text-[14px]">history_toggle_off</span>
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#0284c7] transition-colors line-clamp-1">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {project.description || 'No description provided for this project.'}
                      </p>
                      {project.closedReason && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 font-medium mt-2 flex items-center gap-1.5 truncate">
                          <span className="material-symbols-outlined text-[13px] text-amber-600">info</span>
                          Reason: {project.closedReason}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Completion Progress</span>
                        <span className="text-slate-800">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            projectIsCompleted ? 'bg-emerald-500' : projectIsOverdue ? 'bg-rose-500' : 'bg-[#0284c7]'
                          }`}
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom / Footer Actions */}
                  <div className="p-6 pt-0 border-t border-slate-100/80 mt-2">
                    <div className="flex items-center justify-between pt-4 gap-2">
                      <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">event</span>
                        {project.deadline ? new Date(project.deadline).toLocaleDateString('vi-VN') : 'No deadline'}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Export Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExportTracking(project.id)
                          }}
                          disabled={exportingId === project.id}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Export Tracking Excel"
                        >
                          <span className="material-symbols-outlined text-lg">download</span>
                        </button>

                        {/* Reopen Button if Archived/Completed */}
                        {(projectIsArchived || projectIsCompleted) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReopen(project.id)
                            }}
                            disabled={reopeningId === project.id}
                            className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0284c7] font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-base">settings_backup_restore</span>
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Bar Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mt-8">
            <p className="text-xs font-semibold text-slate-500">
              Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(startIndex + pageSize, totalItems)}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> archived projects
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-xl font-bold text-xs transition-all ${
                    currentPage === pageNum
                      ? 'bg-[#0284c7] text-white shadow-md shadow-sky-600/20'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default ArchivedProjectsPage
