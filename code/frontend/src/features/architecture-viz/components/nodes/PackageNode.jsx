import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { getTypeColor, getTypeIconName } from './nodeStyles'
import { useArchitectureStore } from '../../store/architectureStore'

export default function PackageNode({ data, id }) {
  const { setDrillDown } = useArchitectureStore()

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    const nextLayer = 'MODULE'
    setDrillDown(nextLayer, data.name, id)
  }

  const color = getTypeColor(data.type)
  const icon = getTypeIconName(data.type)

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="px-4 py-3 rounded-xl border bg-surface hover:shadow-md transition-all cursor-pointer flex items-center space-x-3 select-none"
      style={{
        borderColor: data.isDimmed ? '#e2e8f0' : (data.isFocused ? '#2196F3' : '#cbd5e1'),
        opacity: data.isDimmed ? 0.25 : 1,
        width: 180,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-outline-variant" />
      
      <div 
        className="p-2 rounded-lg flex items-center justify-center text-white"
        style={{ backgroundColor: color }}
      >
        <span className="material-icons text-lg">{icon}</span>
      </div>

      <div className="truncate flex-1">
        <h4 className="font-bold text-sm text-on-surface truncate">{data.name}</h4>
        {data.type === 'PACKAGE' && data.metadata?.fileCount !== undefined && (
          <p className="text-[10px] text-on-surface-variant font-medium">
            {data.metadata.fileCount} tệp
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-outline-variant" />
    </div>
  )
}
