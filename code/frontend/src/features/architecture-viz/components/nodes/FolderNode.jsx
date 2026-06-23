import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { useArchitectureStore } from '../../store/architectureStore'

export const FolderNode = ({ id, data, selected }) => {
  const toggleFolder = useArchitectureStore((state) => state.toggleFolder)
  const isExpanded = useArchitectureStore((state) => state.expandedFolders.has(id))
  
  const handleToggle = (e) => {
    e.stopPropagation() // Stop selection/drag events
    toggleFolder(id)
  }

  // Parse path to calculate depth and parent breadcrumbs
  const parts = (data.filePath || '').split('/').filter(Boolean)
  const depth = parts.length || 1

  let parentPath = ''
  if (parts.length > 1) {
    const parentParts = parts.slice(0, -1)
    if (parentParts.length > 2) {
      parentPath = '.../' + parentParts.slice(-2).join('/')
    } else {
      parentPath = parentParts.join('/')
    }
  }

  // Styles based on folder depth (hierarchy levels)
  const getDepthStyles = () => {
    if (isExpanded) {
      // Expanded folder styles
      if (depth === 1) {
        return 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/30 ring-1 ring-blue-600/30'
      } else if (depth === 2) {
        return 'border-blue-500 bg-blue-50/15 dark:bg-blue-950/20 ring-1 ring-blue-500/20'
      } else {
        return 'border-blue-400/80 bg-blue-50/10 dark:bg-blue-950/10 ring-1 ring-blue-400/10'
      }
    } else {
      // Collapsed folder styles
      if (depth === 1) {
        return 'border-slate-400 dark:border-slate-500 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-500 dark:hover:border-slate-400 shadow-sm'
      } else if (depth === 2) {
        return 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
      } else if (depth === 3) {
        return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600'
      } else {
        return 'border-slate-200/60 dark:border-slate-800/50 bg-slate-50/10 dark:bg-slate-900/10 hover:border-slate-300 dark:hover:border-slate-700 opacity-95'
      }
    }
  }

  const getIconColor = () => {
    if (isExpanded) {
      if (depth === 1) return 'text-blue-600 dark:text-blue-400'
      if (depth === 2) return 'text-blue-500 dark:text-blue-500'
      return 'text-blue-450 dark:text-blue-550'
    } else {
      if (depth === 1) return 'text-amber-600 dark:text-amber-500'
      if (depth === 2) return 'text-amber-500 dark:text-amber-400'
      if (depth === 3) return 'text-amber-400 dark:text-amber-500'
      return 'text-amber-300/80 dark:text-amber-600/80'
    }
  }

  const getTextSize = () => {
    if (depth === 1) return 'text-[12px] font-semibold text-slate-900 dark:text-slate-100'
    if (depth === 2) return 'text-[11.5px] font-medium text-slate-800 dark:text-slate-200'
    return 'text-[11px] font-normal text-slate-700 dark:text-slate-350'
  }

  return (
    <div 
      onClick={handleToggle}
      className={`w-[180px] px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer select-none
        ${getDepthStyles()} ${selected ? 'ring-2 ring-blue-500/40' : ''}`}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-slate-300 dark:!bg-slate-700 w-2 h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 dark:!bg-slate-700 w-2 h-2" />

      {parentPath && (
        <div className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate mb-1" title={data.filePath}>
          {parentPath}
        </div>
      )}

      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Folder className={`w-4 h-4 shrink-0 ${getIconColor()}`} />
          <span className={`${getTextSize()} truncate`}>
            {data.name || 'Folder'}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          {data.fileCount !== undefined && !isExpanded && (
            <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200/40">
              {data.fileCount}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>
    </div>
  )
}

export default FolderNode
