import React, { useMemo } from 'react';
import { useArchitectureStore } from '../store/architectureStore';
import { X, Info, HelpCircle } from 'lucide-react';
import { TechIcon } from './nodes/TechIcon';

export default function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, graphData } = useArchitectureStore();

  const { incoming, outgoing } = useMemo(() => {
    if (!selectedNode || !graphData.edges) return { incoming: [], outgoing: [] };
    
    const nid = selectedNode.nodeId;
    const inEdges = graphData.edges.filter(e => e.target === nid);
    const outEdges = graphData.edges.filter(e => e.source === nid);
    
    const nodesMap = {};
    if (graphData.nodes) {
      graphData.nodes.forEach(n => {
        nodesMap[n.id || n.nodeId] = n;
      });
    }

    const mapEdgesToConnections = (edges, targetKey) => {
      return edges.map(e => {
        const nodeId = e[targetKey];
        const node = nodesMap[nodeId];
        const protocol = e.label || e.metadata?.label || 'depends_on';
        return {
          id: nodeId,
          name: node ? (node.data?.name || node.name) : nodeId.split(':').pop(),
          protocol
        };
      });
    };

    return {
      incoming: mapEdgesToConnections(inEdges, 'source'),
      outgoing: mapEdgesToConnections(outEdges, 'target')
    };
  }, [selectedNode, graphData]);

  const groupNode = useMemo(() => {
    if (!selectedNode || !graphData.nodes) return null;
    const parentId = selectedNode.parentId;
    if (!parentId) return null;
    return graphData.nodes.find(n => n.nodeId === parentId || n.id === parentId);
  }, [selectedNode, graphData]);

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/10 border-l border-slate-200 dark:border-slate-800 font-sans">
        <Info className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-700" />
        <p className="text-xs font-semibold font-vietnamese">Chọn một dịch vụ trên sơ đồ để xem thông tin chi tiết</p>
      </div>
    );
  }

  const groupName = groupNode ? groupNode.name : 'N/A';
  const icon = selectedNode.metadata?.icon || '';

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl w-full transition-all duration-300 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
            {icon ? <TechIcon iconKey={icon} size={18} /> : <HelpCircle className="w-4.5 h-4.5 text-slate-400" />}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{selectedNode.name}</span>
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-550 uppercase tracking-wider font-vietnamese">
              Dịch vụ hệ thống
            </span>
          </div>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Tech and Env Info */}
        <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 dark:text-slate-500 font-medium font-vietnamese">Công nghệ (Stack):</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{selectedNode.metadata?.tech || 'N/A'}</span>
          </div>
          {selectedNode.metadata?.port && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 dark:text-slate-500 font-medium font-vietnamese">Cổng (Port):</span>
              <span className="px-1.5 py-0.5 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 rounded text-slate-850 dark:text-slate-200 font-semibold border border-slate-200/40">
                {selectedNode.metadata.port}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-slate-400 dark:text-slate-500 font-medium font-vietnamese">Hạ tầng (Infra Group):</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{groupName}</span>
          </div>
        </div>

        {/* Description */}
        {selectedNode.metadata?.description && (
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold font-vietnamese">Mô tả vai trò</span>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-vietnamese">{selectedNode.metadata.description}</p>
          </div>
        )}

        {/* Connections Outgoing */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Kết nối gửi đi (Call Out / {outgoing.length})</h4>
          {outgoing.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic font-vietnamese">Không có kết nối gửi đi nào được phát hiện.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl p-1.5 bg-slate-50/30">
              {outgoing.map((out, idx) => (
                <div key={idx} className="flex justify-between items-center px-2.5 py-1.5 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-100/40 dark:border-slate-800/20">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{out.name}</span>
                  <span className="px-1.5 py-0.5 font-mono text-[9px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded border border-blue-200/30">
                    {out.protocol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Connections Incoming */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider font-vietnamese">Được gọi từ (Call In / {incoming.length})</h4>
          {incoming.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic font-vietnamese">Không có kết nối gọi vào nào được phát hiện.</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl p-1.5 bg-slate-50/30">
              {incoming.map((inc, idx) => (
                <div key={idx} className="flex justify-between items-center px-2.5 py-1.5 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-slate-100/40 dark:border-slate-800/20">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{inc.name}</span>
                  <span className="px-1.5 py-0.5 font-mono text-[9px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 rounded border border-blue-200/30">
                    {inc.protocol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
