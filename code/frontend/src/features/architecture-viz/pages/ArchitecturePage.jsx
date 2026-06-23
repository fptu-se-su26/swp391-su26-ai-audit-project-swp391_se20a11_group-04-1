import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArchitectureStore } from '../store/architectureStore';
import { getSyncStatus, getGraphData } from '../api/architectureApi';
import SyncButton from '../components/SyncButton';
import GraphCanvas from '../components/GraphCanvas';
import NodeDetailPanel from '../components/NodeDetailPanel';
import EmptyState from '../components/EmptyState';
import OnboardingTooltip from '../components/OnboardingTooltip';
import ManualServiceModal from '../components/ManualServiceModal';
import toast from 'react-hot-toast';
import { ReactFlowProvider } from '@xyflow/react';
import { Network } from 'lucide-react';

export default function ArchitecturePage() {
  const { projectId } = useParams();
  const {
    setProjectId,
    selectedNode,
    syncStatus,
    setSyncStatus,
    graphData,
    setGraphData,
    isLoading,
    setIsLoading
  } = useArchitectureStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getSyncStatus(projectId);
      if (res.success && res.data) {
        setSyncStatus(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to fetch sync status', err);
    }
    return null;
  };

  const fetchGraph = async () => {
    setIsLoading(true);
    try {
      const res = await getGraphData(projectId);
      if (res.success && res.data) {
        setGraphData(res.data);
      } else {
        setGraphData({ nodes: [], edges: [], stats: {} });
      }
    } catch (err) {
      console.error('Failed to fetch graph data', err);
      if (syncStatus.status === 'READY') {
        toast.error(err.response?.data?.message || 'Không thể tải dữ liệu đồ thị');
      }
      setGraphData({ nodes: [], edges: [], stats: {} });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncSuccess = () => {
    fetchStatus().then((status) => {
      if (status && status.status === 'READY') {
        fetchGraph();
      }
    });
  };

  useEffect(() => {
    if (projectId) {
      setProjectId(Number(projectId));
      
      fetchStatus().then((status) => {
        if (status && status.status === 'READY') {
          fetchGraph();
        }
      });
    }
  }, [projectId]);

  const hasData = graphData.nodes && graphData.nodes.length > 0;
  const isSyncing = syncStatus.status === 'SYNCING';

  return (
    <ReactFlowProvider>
      <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-3 shrink-0 font-sans">
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-vietnamese">Sơ đồ kiến trúc hệ thống</h1>
            <p className="text-[11px] text-slate-450 dark:text-slate-550 font-semibold font-vietnamese">
              System Architecture Diagram mô tả cấu trúc lồng ghép hạ tầng, quy trình CI/CD và kết nối dịch vụ.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasData && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-vietnamese hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer shadow-sm select-none"
              >
                ✏️ Chỉnh sửa sơ đồ
              </button>
            )}
            <SyncButton projectId={projectId} onSyncSuccess={handleSyncSuccess} />
          </div>
        </div>

        {/* Workspace area */}
        <div className="flex-1 flex overflow-hidden">
          {syncStatus.status === 'IDLE' && !hasData && !isSyncing ? (
            <EmptyState 
              projectId={projectId} 
              syncStatus={syncStatus} 
              onSyncSuccess={handleSyncSuccess} 
            />
          ) : (
            <>
              {/* Graph canvas */}
              <div className="flex-1 flex flex-col p-4 min-w-0">
                <div className="flex-1 min-h-0 relative">
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 flex items-center justify-center z-50 rounded-xl">
                      <div className="flex flex-col items-center space-y-2">
                        <svg className="animate-spin h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-[11px] text-slate-550 dark:text-slate-400 font-bold font-vietnamese">Đang tải dữ liệu đồ thị...</span>
                      </div>
                    </div>
                  )}
                  
                  {hasData ? (
                    <GraphCanvas 
                      rawNodes={graphData.nodes} 
                      rawEdges={graphData.edges} 
                      searchQuery={searchQuery}
                      onSearch={setSearchQuery}
                    />
                  ) : (
                    <div className="w-full h-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center p-6">
                      <Network className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-xs text-slate-450 font-medium font-vietnamese">Không tìm thấy dữ liệu cấu trúc cho phần này</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel Detail */}
              {selectedNode && (
                <div className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <NodeDetailPanel />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <ManualServiceModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        projectId={Number(projectId)} 
        graphData={graphData} 
        onRefresh={fetchGraph} 
      />
      <OnboardingTooltip />
    </ReactFlowProvider>
  );
}
