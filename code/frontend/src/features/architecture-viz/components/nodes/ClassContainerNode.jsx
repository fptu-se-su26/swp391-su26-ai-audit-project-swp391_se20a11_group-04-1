import React, { useState } from 'react'
import { useArchitectureStore } from '../../store/architectureStore'

export default function ClassContainerNode({ data, id }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { setSelectedNode } = useArchitectureStore()

  const handleToggle = (e) => {
    e.stopPropagation()
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    if (data.onToggleCollapse) {
      data.onToggleCollapse(id, nextState)
    }
  }

  const handleSelect = (e) => {
    e.stopPropagation()
    setSelectedNode({
      nodeId: id,
      name: data.name,
      type: data.type,
      riskLevel: data.riskLevel,
      connectionCount: data.connectionCount,
      filePath: data.filePath,
      lineStart: data.lineStart,
      lineEnd: data.lineEnd,
      metadata: data.metadata
    })
  }

  const isFocused = data.isFocused

  return (
    <div
      onClick={handleSelect}
      className={`rounded-2xl border-2 bg-surface-container-low transition-all select-none ${
        isFocused ? 'ring-2 ring-primary border-primary' : 'border-outline-variant/60 shadow-sm'
      }`}
      style={{
        width: '100%',
        height: '100%',
        opacity: data.isDimmed ? 0.3 : 1,
      }}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-surface-container-highest rounded-t-2xl border-b border-outline-variant/40">
        <div className="flex items-center space-x-1.5 truncate">
          <span className="material-icons-outlined text-primary text-sm">class</span>
          <span className="font-bold text-xs text-on-surface truncate">{data.name}</span>
        </div>
        <button
          onClick={handleToggle}
          className="text-[10px] text-primary hover:text-primary/80 font-bold px-1.5 py-0.5 rounded hover:bg-primary/5 transition-colors focus:outline-none"
        >
          {isCollapsed ? 'Mở rộng ▲' : 'Thu gọn ▼'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="p-3 relative w-full h-[calc(100%-36px)] min-h-[60px]" />
      )}
    </div>
  )
}
