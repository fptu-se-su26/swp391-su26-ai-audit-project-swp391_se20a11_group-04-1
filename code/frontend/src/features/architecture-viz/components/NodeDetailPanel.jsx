import React from 'react'
import { useArchitectureStore } from '../store/architectureStore'

export default function NodeDetailPanel() {
  const { selectedNode, setSelectedNode } = useArchitectureStore()

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-on-surface-variant/60 bg-surface-container-low border-l border-outline-variant/30">
        <span className="material-icons-outlined text-4xl mb-3 text-outline">info</span>
        <p className="text-sm font-medium">Chọn một thành phần trên đồ thị để xem thông tin chi tiết</p>
      </div>
    )
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-error/10 text-error border-error/30'
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 border-orange-500/30'
      case 'MEDIUM': return 'bg-warning/10 text-warning-variant border-warning/30'
      default: return 'bg-success/10 text-success border-success/30'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PACKAGE': return 'folder'
      case 'FILE': return 'description'
      case 'CLASS': return 'class'
      case 'INTERFACE': return 'settings_ethernet'
      case 'METHOD':
      case 'FUNCTION': return 'bolt'
      case 'COMPONENT': return 'widgets'
      case 'HOOK': return 'extension'
      default: return 'help_outline'
    }
  }

  const metadata = selectedNode.metadata || {}

  return (
    <div className="h-full flex flex-col bg-surface border-l border-outline-variant/30 shadow-lg w-full max-w-sm transition-all duration-300">
      <div className="flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface-container-low">
        <div className="flex items-center space-x-2 truncate">
          <span className="material-icons-outlined text-primary text-xl">
            {getTypeIcon(selectedNode.type)}
          </span>
          <span className="font-bold text-on-surface truncate">{selectedNode.name}</span>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1.5 rounded-full hover:bg-surface-container-highest transition-colors focus:outline-none"
        >
          <span className="material-icons-outlined text-lg">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant font-medium">Loại đối tượng:</span>
            <span className="font-bold text-primary px-2 py-0.5 bg-primary/10 rounded">{selectedNode.type}</span>
          </div>
          {selectedNode.language && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant font-medium">Ngôn ngữ:</span>
              <span className="font-bold text-on-surface uppercase">{selectedNode.language}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant font-medium">Mức độ rủi ro:</span>
            <span className={`font-bold border px-2 py-0.5 rounded ${getRiskColor(selectedNode.riskLevel)}`}>
              {selectedNode.riskLevel || 'LOW'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-on-surface-variant font-medium">Số lượng liên kết:</span>
            <span className="font-bold text-on-surface">{selectedNode.connectionCount || 0}</span>
          </div>
        </div>

        {selectedNode.filePath && (
          <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 space-y-1">
            <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">Đường dẫn tệp</span>
            <p className="text-xs text-on-surface font-mono break-all">{selectedNode.filePath}</p>
            {selectedNode.lineStart && (
              <p className="text-xs text-on-surface-variant font-medium">
                Dòng: {selectedNode.lineStart} - {selectedNode.lineEnd}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Thông số kỹ thuật</h4>

          {metadata.annotations && metadata.annotations.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-on-surface-variant font-medium">Annotations:</span>
              <div className="flex flex-wrap gap-1">
                {metadata.annotations.map((anno, idx) => (
                  <span key={idx} className="text-xs font-mono bg-surface-container-highest text-on-surface px-1.5 py-0.5 rounded border border-outline-variant/50">
                    {anno}
                  </span>
                ))}
              </div>
            </div>
          )}

          {metadata.extends && (
            <div className="text-xs">
              <span className="text-on-surface-variant font-medium">Kế thừa từ class:</span>
              <p className="font-mono text-primary font-semibold mt-0.5">{metadata.extends}</p>
            </div>
          )}
          {metadata.implements && metadata.implements.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-on-surface-variant font-medium">Implements:</span>
              <div className="flex flex-wrap gap-1">
                {metadata.implements.map((impl, idx) => (
                  <span key={idx} className="text-xs font-mono bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                    {impl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {metadata.signature && (
            <div className="space-y-1">
              <span className="text-xs text-on-surface-variant font-medium">Chữ ký hàm:</span>
              <p className="text-xs font-mono bg-surface-container-highest text-on-surface p-2 rounded border border-outline-variant/50 break-all">
                {metadata.signature}
              </p>
            </div>
          )}

          {metadata.parameters && metadata.parameters.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs text-on-surface-variant font-medium">Tham số:</span>
              <ul className="list-disc pl-4 text-xs space-y-0.5 text-on-surface font-mono">
                {metadata.parameters.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {metadata.methodCount !== undefined && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant font-medium">Số lượng phương thức:</span>
              <span className="font-bold text-on-surface">{metadata.methodCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
