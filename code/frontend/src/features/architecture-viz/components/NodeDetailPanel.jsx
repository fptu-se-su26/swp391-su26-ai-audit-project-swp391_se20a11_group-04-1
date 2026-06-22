import React, { useMemo } from 'react'
import { useArchitectureStore } from '../store/architectureStore'
import { FileText, Folder, Cpu, Sparkles, Box, Settings2, Info, X } from 'lucide-react'

const getThemeIcon = (type, annotations = [], language = '') => {
  if (type === 'PACKAGE') return Folder
  
  const annos = annotations || []
  if (annos.includes('RestController') || annos.includes('Controller')) return Cpu
  if (annos.includes('Service')) return Sparkles
  if (annos.includes('Repository')) return Box
  if (language === 'tsx' || language === 'jsx' || annos.includes('Component')) return Settings2
  
  return FileText
}

export default function NodeDetailPanel() {
  const { selectedNode, setSelectedNode, graphData } = useArchitectureStore()

  const { incoming, outgoing } = useMemo(() => {
    if (!selectedNode || !graphData.edges) return { incoming: [], outgoing: [] }
    
    const nid = selectedNode.nodeId
    
    // Find all imports relationships
    const inEdges = graphData.edges.filter(e => e.target === nid && e.type !== 'CONTAINS' && !(e.edgeId || e.id || '').includes('contains'))
    const outEdges = graphData.edges.filter(e => e.source === nid && e.type !== 'CONTAINS' && !(e.edgeId || e.id || '').includes('contains'))
    
    const nodesMap = {}
    if (graphData.nodes) {
      graphData.nodes.forEach(n => {
        nodesMap[n.nodeId] = n
      })
    }

    const mapEdgesToNodes = (edges, key) => {
      return edges.map(e => {
        const targetId = e[key]
        const targetNode = nodesMap[targetId]
        return {
          id: targetId,
          name: targetNode ? targetNode.name : targetId.split('/').pop().split(':').pop(),
          filePath: targetNode ? targetNode.filePath : '',
          type: targetNode ? targetNode.type : 'FILE'
        }
      })
    }

    return {
      incoming: mapEdgesToNodes(inEdges, 'source'),
      outgoing: mapEdgesToNodes(outEdges, 'target')
    }
  }, [selectedNode, graphData])

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/10 border-l border-slate-200 dark:border-slate-800 font-sans">
        <Info className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-700" />
        <p className="text-xs font-semibold">Chọn một thành phần trên đồ thị để xem thông tin chi tiết</p>
      </div>
    )
  }

  const annotations = selectedNode.metadata?.annotations || []
  const Icon = getThemeIcon(selectedNode.type, annotations, selectedNode.language)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl w-full transition-all duration-300 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="font-bold text-xs text-slate-850 dark:text-slate-100 truncate">{selectedNode.name}</span>
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {selectedNode.type}
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
        {/* Core Stats */}
        <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Ngôn ngữ:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">{selectedNode.language || 'folder'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Mức độ rủi ro:</span>
            <span className={`font-bold border px-1.5 py-0.5 rounded text-[10px] uppercase
              ${selectedNode.riskLevel === 'CRITICAL' ? 'bg-red-50 text-red-650 border-red-200 dark:bg-red-950/20 dark:text-red-405 dark:border-red-800/40' :
                selectedNode.riskLevel === 'HIGH' ? 'bg-orange-50 text-orange-655 border-orange-200 dark:bg-orange-950/20 dark:text-orange-405 dark:border-orange-800/40' :
                selectedNode.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-650 border-amber-200 dark:bg-amber-950/20 dark:text-amber-405 dark:border-amber-800/40' :
                'bg-emerald-50 text-emerald-650 border-emerald-250 dark:bg-emerald-950/10 dark:text-emerald-405 dark:border-emerald-800/20'}`}>
              {selectedNode.riskLevel || 'LOW'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Số lượng liên kết:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{selectedNode.connectionCount || 0}</span>
          </div>
          {selectedNode.metadata?.sizeBytes !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Kích thước tệp:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {(selectedNode.metadata.sizeBytes / 1024).toFixed(2)} KB
              </span>
            </div>
          )}
        </div>

        {/* Path Info */}
        {selectedNode.filePath && (
          <div className="p-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-850 space-y-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Đường dẫn tệp</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-mono break-all leading-normal">{selectedNode.filePath}</p>
          </div>
        )}

        {/* Technical Annotations */}
        {annotations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Đặc tả / Annotations</h4>
            <div className="flex flex-wrap gap-1">
              {annotations.map((anno, idx) => (
                <span key={idx} className="text-[10px] font-semibold font-mono bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/40">
                  @{anno}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Imports list (Outgoing) */}
        {selectedNode.type === 'FILE' && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Imports tệp khác ({outgoing.length})</h4>
            {outgoing.length === 0 ? (
              <p className="text-[11px] text-slate-450 italic">Không import tệp nào trong cùng service.</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl p-1.5 bg-slate-50/30">
                {outgoing.map((out, idx) => (
                  <div key={idx} className="px-2.5 py-1.5 text-[11px] text-slate-650 dark:text-slate-350 truncate hover:bg-slate-50 dark:hover:bg-slate-800 rounded font-medium">
                    {out.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Imported By list (Incoming) */}
        {selectedNode.type === 'FILE' && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider font-semibold">Được tệp khác import ({incoming.length})</h4>
            {incoming.length === 0 ? (
              <p className="text-[11px] text-slate-450 italic">Chưa được tệp nào import trong cùng service.</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto border border-slate-100 dark:border-slate-800/60 rounded-xl p-1.5 bg-slate-50/30">
                {incoming.map((inc, idx) => (
                  <div key={idx} className="px-2.5 py-1.5 text-[11px] text-slate-650 dark:text-slate-350 truncate hover:bg-slate-50 dark:hover:bg-slate-800 rounded font-medium">
                    {inc.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

