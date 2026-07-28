import React, { useEffect, useRef } from 'react'
import { useArchitectureStore } from '../store/architectureStore'
import { triggerSync, getSyncStatus } from '../api/architectureApi'
import toast from 'react-hot-toast'

export default function SyncButton({ projectId: propProjectId, onSyncSuccess }) {
  const { projectId: storeProjectId, syncStatus, setSyncStatus } = useArchitectureStore()
  const activeProjectId = propProjectId || storeProjectId
  const userRole = localStorage.getItem('userRole') || 'MEMBER'
  const pollIntervalRef = useRef(null)

  const isMentor = userRole === 'MENTOR'

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const startPolling = (targetProjectId = activeProjectId) => {
    stopPolling()
    if (!targetProjectId) return
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await getSyncStatus(targetProjectId)
        if (res.success && res.data) {
          setSyncStatus(res.data)
          
          if (res.data.status === 'READY') {
            stopPolling()
            toast.success('System architecture analysis completed!')
            if (onSyncSuccess) onSyncSuccess()
          } else if (res.data.status === 'ERROR') {
            stopPolling()
            toast.error(res.data.errorMessage || 'Analysis process failed')
          }
        }
      } catch (err) {
        console.error("Failed to poll status", err)
      }
    }, 2500)
  }

  useEffect(() => {
    if (syncStatus.status === 'SYNCING' && activeProjectId) {
      startPolling(activeProjectId)
    }
    return () => stopPolling()
  }, [syncStatus.status, activeProjectId])

  const handleSync = async () => {
    const targetProjectId = propProjectId || storeProjectId
    if (!targetProjectId) {
      toast.error('Không tìm thấy mã dự án')
      return
    }

    try {
      setSyncStatus({
        status: 'SYNCING',
        progress: 5,
        currentStep: 'Sending analysis request...',
        errorMessage: null
      })
      
      const res = await triggerSync(targetProjectId)
      if (res.success && res.data) {
        setSyncStatus(res.data)
        startPolling(targetProjectId)
        toast.success('Analysis process started...')
      } else {
        throw new Error(res.message || 'Failed to start sync')
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Unknown error'
      setSyncStatus({
        status: 'ERROR',
        progress: 0,
        currentStep: 'Failed to start sync',
        errorMessage: errMsg
      })
      toast.error(errMsg)
    }
  }

  if (isMentor) {
    return (
      <div className="flex items-center space-x-1.5 text-xs text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full border border-outline-variant/30 font-medium">
        <span className="material-symbols-outlined text-sm">visibility</span>
        <span>Mentor (View Only)</span>
      </div>
    )
  }

  const isSyncing = syncStatus.status === 'SYNCING'

  return (
    <div className="flex flex-col space-y-2 w-full md:w-auto">
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`flex items-center justify-center px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm cursor-pointer ${
            isSyncing
              ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed border border-outline-variant'
              : 'bg-primary text-on-primary hover:bg-primary/95 hover:shadow-md'
          }`}
        >
          {isSyncing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-on-surface-variant" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Syncing ({syncStatus.progress}%)
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm mr-2">sync</span>
              Sync
            </>
          )}
        </button>
      </div>

      {isSyncing && (
        <div className="w-full md:w-64 space-y-1">
          <div className="w-full bg-outline-variant/30 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500 rounded-full" 
              style={{ width: `${syncStatus.progress}%` }}
            />
          </div>
          <div className="text-[10px] text-on-surface-variant truncate font-medium">
            {syncStatus.currentStep}
          </div>
        </div>
      )}
    </div>
  )
}
