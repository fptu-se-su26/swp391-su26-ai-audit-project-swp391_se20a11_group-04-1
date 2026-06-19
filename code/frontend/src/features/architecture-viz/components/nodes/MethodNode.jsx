import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { getTypeColor } from './nodeStyles'
import { useArchitectureStore } from '../../store/architectureStore'

export default function MethodNode({ data, id }) {
  const { setSelectedNode } = useArchitectureStore()

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

  const color = getTypeColor('METHOD')

  return (
    <div
      onClick={handleSelect}
      className="px-3 py-1.5 rounded-lg border bg-surface hover:shadow transition-all cursor-pointer flex items-center space-x-2 select-none"
      style={{
        borderColor: data.isFocused ? '#2196F3' : '#e2e8f0',
        width: 140,
        height: 34,
      }}
    >
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 !bg-primary" />

      <div 
        className="w-4 h-4 rounded-full flex items-center justify-center text-white"
        style={{ backgroundColor: color }}
      >
        <span className="material-icons text-[10px]">bolt</span>
      </div>
      <span className="text-[10px] font-bold text-on-surface truncate flex-1">{data.name}</span>

      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 !bg-primary" />
    </div>
  )
}
