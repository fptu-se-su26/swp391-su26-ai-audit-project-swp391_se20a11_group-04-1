import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useArchitectureStore } from '../store/architectureStore'
import { getSyncStatus, getGraphData } from '../api/architectureApi'
import SyncButton from '../components/SyncButton'
import LayerTabs from '../components/LayerTabs'
import BreadcrumbNav from '../components/BreadcrumbNav'
import GraphToolbar from '../components/GraphToolbar'
import GraphCanvas from '../components/GraphCanvas'
import NodeDetailPanel from '../components/NodeDetailPanel'
import toast from 'react-hot-toast'

export default function ArchitecturePage() {
  const { projectId } = useParams()
  const {
    setProjectId,
    layer,
    focusNodeId,
    syncStatus,
    setSyncStatus,
    graphData,
    setGraphData,
    isLoading,
    setIsLoading,
    resetBreadcrumbs
  } = useArchitectureStore()

  const [searchQuery, setSearchQuery] = useState('')

  const fetchStatus = async () => {
    try {
      const res = await getSyncStatus(projectId)
      if (res.success && res.data) {
        setSyncStatus(res.data)
        return res.data
      }
    } catch (err) {
      console.error('Failed to fetch sync status', err)
    }
    return null
  }

  const fetchGraph = async () => {
    setIsLoading(true)
    try {
      const res = await getGraphData(projectId, layer, focusNodeId)
      if (res.success && res.data) {
        setGraphData(res.data)
      } else {
        setGraphData({ nodes: [], edges: [], stats: {} })
      }
    } catch (err) {
      console.error('Failed to fetch graph data', err)
      if (syncStatus.status === 'READY') {
        toast.error(err.response?.data?.message || 'Không thể tải dữ liệu đồ thị')
      }
      setGraphData({ nodes: [], edges: [], stats: {} })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      setProjectId(Number(projectId))
      resetBreadcrumbs()
      
      fetchStatus().then((status) => {
        if (status && (status.status === 'READY' || status.status === 'ERROR' || status.status === 'SYNCING')) {
          fetchGraph()
        }
      })
    }
  }, [projectId])

  useEffect(() => {
    if (projectId && (syncStatus.status === 'READY' || syncStatus.status === 'ERROR')) {
      fetchGraph()
    }
  }, [layer, focusNodeId, syncStatus.status])

  const hasData = graphData.nodes && graphData.nodes.length > 0
  const isSyncing = syncStatus.status === 'SYNCING'

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-surface-container-lowest text-on-surface">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-outline-variant/30 bg-surface gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Kiến trúc mã nguồn</h1>
          <p className="text-xs text-on-surface-variant font-medium">
            Visual mô tả cấu trúc mã nguồn theo 3 lớp: Tổng quan → Module → Luồng xử lý.
          </p>
        </div>
        <SyncButton onSyncSuccess={fetchGraph} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {syncStatus.status === 'IDLE' && !hasData && !isSyncing ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner">
              <span className="material-icons-outlined text-3xl">schema</span>
            </div>
            <div className="max-w-md space-y-2">
              <h2 className="text-lg font-bold text-on-surface">Sẵn sàng phân tích kiến trúc</h2>
              <p className="text-sm text-on-surface-variant">
                Dự án chưa được phân tích cấu trúc mã nguồn. Bấm nút "Bắt đầu phân tích" để quét và xây dựng sơ đồ trực quan 2D theo phong cách Obsidian.
              </p>
            </div>
            <SyncButton onSyncSuccess={fetchGraph} />
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col p-4 space-y-3 min-w-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
                <LayerTabs />
                <BreadcrumbNav />
              </div>

              <GraphToolbar onSearch={setSearchQuery} />

              <div className="flex-1 min-h-0 relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-surface/50 flex items-center justify-center z-50 rounded-xl">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-xs text-on-surface-variant font-bold">Đang tải dữ liệu đồ thị...</span>
                    </div>
                  </div>
                )}
                
                {hasData ? (
                  <GraphCanvas 
                    rawNodes={graphData.nodes} 
                    rawEdges={graphData.edges} 
                    searchQuery={searchQuery}
                  />
                ) : (
                  <div className="w-full h-full border border-outline-variant/30 rounded-xl bg-surface-container-low flex flex-col items-center justify-center text-center p-6">
                    <span className="material-icons-outlined text-4xl text-outline mb-2">bubble_chart</span>
                    <p className="text-sm text-on-surface-variant font-medium">Không tìm thấy dữ liệu cấu trúc cho phần này</p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-80 shrink-0 border-l border-outline-variant/30 bg-surface">
              <NodeDetailPanel />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
