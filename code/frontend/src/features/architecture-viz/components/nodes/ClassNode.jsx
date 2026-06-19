import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { getTypeColor, getRiskBorderColor, getTypeIconName } from './nodeStyles'
import { useArchitectureStore } from '../../store/architectureStore'

export default function ClassNode({ data, id }) {
  const { setDrillDown } = useArchitectureStore()

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    setDrillDown('FLOW', data.name, id)
  }

  const color = getTypeColor(data.type)
  const borderColor = getRiskBorderColor(data.riskLevel)
  const icon = getTypeIconName(data.type)

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="px-4 py-3 rounded-xl border-2 bg-surface hover:shadow-md transition-all cursor-pointer flex flex-col justify-between select-none space-y-2"
      style={{
        borderColor: data.isDimmed ? '#e2e8f0' : (data.isFocused ? '#2196F3' : borderColor),
        opacity: data.isDimmed ? 0.25 : 1,
        width: 190,
      }}
    >
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-outline-variant" />
      
      <div className="flex items-center space-x-2">
        <div 
          className="p-1.5 rounded-lg flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          <span className="material-icons text-sm">{icon}</span>
        </div>
        <div className="truncate flex-1">
          <h4 className="font-bold text-xs text-on-surface truncate">{data.name}</h4>
          <span className="text-[9px] text-on-surface-variant font-medium">
            {data.type}
          </span>
        </div>
      </div>

      {data.metadata?.annotations && data.metadata.annotations.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-outline-variant/30">
          {data.metadata.annotations.slice(0, 2).map((anno, idx) => (
            <span key={idx} className="text-[8px] font-mono bg-surface-container-highest text-on-surface-variant px-1 py-0.2 rounded border border-outline-variant/40 truncate max-w-[80px]">
              {anno}
            </span>
          ))}
          {data.metadata.annotations.length > 2 && (
            <span className="text-[8px] font-mono bg-surface-container-highest text-on-surface-variant px-1 py-0.2 rounded border border-outline-variant/40">
              +{data.metadata.annotations.length - 2}
            </span>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-outline-variant" />
    </div>
  )
}
