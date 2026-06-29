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
        {/* Sleek Minimalist Top Bar */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-sans gap-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">System Architecture</h1>
            
            {/* Search Input directly in header */}
            {hasData && (
              <div className="relative max-w-xs w-full">
                <span className="material-symbols-outlined absolute left-2.5 top-1.5 text-slate-400 dark:text-slate-650 text-base">search</span>
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-slate-400 dark:focus:border-slate-700 transition-colors text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasData && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer shadow-sm select-none"
              >
                ✏️ Edit Diagram
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
              {/* Graph canvas - Full viewport */}
              <div className="flex-1 flex min-w-0 relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/70 dark:bg-slate-950/70 flex items-center justify-center z-50">
                    <div className="flex flex-col items-center space-y-2">
                      <svg className="animate-spin h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Loading graph data...</span>
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
                  <div className="w-full h-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center p-6">
                    <Network className="w-8 h-8 text-slate-350 dark:text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 font-medium">No system architecture data found</p>
                  </div>
                )}
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
