import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArchitectureStore } from '../store/architectureStore';
import { getSyncStatus, getGraphData, resetNodePositions } from '../api/architectureApi';
import SyncButton from '../components/SyncButton';
import GraphCanvas from '../components/GraphCanvas';
import NodeDetailPanel from '../components/NodeDetailPanel';
import EmptyState from '../components/EmptyState';
import OnboardingTooltip from '../components/OnboardingTooltip';
import ManualServiceModal from '../components/ManualServiceModal';
import toast from 'react-hot-toast';
import { ReactFlowProvider } from '@xyflow/react';
import { Network, Download } from 'lucide-react';
import { exportToPng, exportToSvg } from '../utils/imageExporter';
import { exportToDrawioXML } from '../utils/drawioExporter';

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
    setIsLoading,
    resetStore
  } = useArchitectureStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const fetchStatus = async (targetProjectId = projectId) => {
    try {
      const res = await getSyncStatus(targetProjectId);
      if (res.success && res.data) {
        if (useArchitectureStore.getState().projectId === Number(targetProjectId)) {
          setSyncStatus(res.data);
        }
        return res.data;
      }
    } catch (err) {
      console.error('Failed to fetch sync status', err);
    }
    return null;
  };

  const fetchGraph = async (targetProjectId = projectId) => {
    setIsLoading(true);
    try {
      const res = await getGraphData(targetProjectId);
      if (useArchitectureStore.getState().projectId === Number(targetProjectId)) {
        if (res.success && res.data) {
          setGraphData(res.data);
        } else {
          setGraphData({ nodes: [], edges: [], stats: {} });
        }
      }
    } catch (err) {
      console.error('Failed to fetch graph data', err);
      if (useArchitectureStore.getState().projectId === Number(targetProjectId)) {
        if (syncStatus.status === 'READY') {
          toast.error(err.response?.data?.message || 'Không thể tải dữ liệu đồ thị');
        }
        setGraphData({ nodes: [], edges: [], stats: {} });
      }
    } finally {
      if (useArchitectureStore.getState().projectId === Number(targetProjectId)) {
        setIsLoading(false);
      }
    }
  };

  const handleSyncSuccess = () => {
    const currentId = Number(projectId);
    fetchStatus(currentId).then((status) => {
      if (status && status.status === 'READY') {
        fetchGraph(currentId);
      }
    });
  };

  useEffect(() => {
    if (projectId) {
      const currentId = Number(projectId);
      resetStore();
      setProjectId(currentId);
      
      fetchStatus(currentId).then((status) => {
        if (useArchitectureStore.getState().projectId === currentId) {
          if (status && status.status === 'READY') {
            fetchGraph(currentId);
          } else {
            setGraphData({ nodes: [], edges: [], stats: {} });
          }
        }
      });
    }

    return () => {
      resetStore();
    };
  }, [projectId]);

  const handleResetLayout = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn khôi phục bố cục tự động mặc định? Mọi vị trí kéo thả trước đó sẽ bị xóa.")) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await resetNodePositions(projectId);
      if (res.success) {
        toast.success("Đã khôi phục bố cục mặc định thành công");
        await fetchGraph();
      } else {
        toast.error("Không thể khôi phục bố cục");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi khôi phục bố cục");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPng = async () => {
    const loadingToast = toast.loading("Đang xuất ảnh PNG...");
    try {
      await exportToPng(projectId);
      toast.success("Xuất ảnh PNG thành công", { id: loadingToast });
    } catch (err) {
      toast.error("Lỗi khi xuất ảnh PNG", { id: loadingToast });
    }
  };

  const handleExportSvg = async () => {
    const loadingToast = toast.loading("Đang xuất ảnh SVG...");
    try {
      await exportToSvg(projectId);
      toast.success("Xuất ảnh SVG thành công", { id: loadingToast });
    } catch (err) {
      toast.error("Lỗi khi xuất ảnh SVG", { id: loadingToast });
    }
  };

  const handleExportDrawio = () => {
    try {
      const xml = exportToDrawioXML(graphData.nodes, graphData.edges);
      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `project-${projectId}-architecture.drawio`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Tải tệp tin .drawio thành công! Bạn có thể nhập tệp tin này vào app.diagrams.net");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tạo file Draw.io");
    }
  };

  const hasData = graphData.nodes && graphData.nodes.length > 0;
  const isSyncing = syncStatus.status === 'SYNCING';

  return (
    <ReactFlowProvider>
      <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100">
        {/* Sleek Minimalist Top Bar */}
        <div className="flex justify-between items-center pl-4 pr-36 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 font-sans gap-4">
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

          {/* Analysis Method Badge */}
          {hasData && graphData.stats?.analysisMethod && (() => {
            const isAI = graphData.stats.analysisMethod === 'AI';
            const repoType = graphData.stats.repoType || '';
            const confidence = graphData.stats.classifierConfidence || '';
            const repoLabel = {
              WEB_CONTAINERIZED:  'Containerized',
              LOCAL_MONOLITH_WEB: 'Monolith',
              AI_DATA_PIPELINE:   'AI / Data',
              SECURITY_IA_TOOL:   'Security Tool',
              DEVOPS_IAC:         'DevOps / IaC',
              LOCAL_STANDALONE_APP: 'Standalone App',
            }[repoType] || repoType;
            return (
              <div
                title={`Phân tích bởi: ${isAI ? 'Gemini AI' : 'Rule Engine'} · Loại repo: ${repoLabel} · Confidence: ${confidence}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none cursor-default ${
                  isAI
                    ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-700/50'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50'
                }`}
              >
                <span className="text-sm leading-none">{isAI ? '✨' : '⚡'}</span>
                <span>{isAI ? 'AI Generated' : 'Rule-based'}</span>
                {repoLabel && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isAI
                      ? 'bg-violet-100 text-violet-600 dark:bg-violet-800/50 dark:text-violet-200'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-800/50 dark:text-amber-200'
                  }`}>{repoLabel}</span>
                )}
              </div>
            );
          })()}

          <div className="flex items-center gap-2 relative">
            {hasData && (
              <>
                <button
                  onClick={handleResetLayout}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer shadow-sm select-none"
                  title="Khôi phục về bố cục tự động mặc định"
                >
                  📐 Reset Layout
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer shadow-sm select-none"
                >
                  ✏️ Edit Diagram
                </button>

                {/* Export Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 bg-white dark:bg-slate-900 cursor-pointer shadow-sm select-none"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                  {isExportDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 text-left">
                      <button
                        onClick={() => { setIsExportDropdownOpen(false); handleExportPng(); }}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Tải ảnh PNG
                      </button>
                      <button
                        onClick={() => { setIsExportDropdownOpen(false); handleExportSvg(); }}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Tải ảnh SVG
                      </button>
                      <button
                        onClick={() => { setIsExportDropdownOpen(false); handleExportDrawio(); }}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Tải file Draw.io (.drawio)
                      </button>
                    </div>
                  )}
                </div>
              </>
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
