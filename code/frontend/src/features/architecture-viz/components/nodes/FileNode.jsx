import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { FileText, Code2, Cpu, Settings2, Box, Sparkles } from 'lucide-react'

const FILE_THEMES = {
  controller: {
    bg: 'bg-blue-50/90 dark:bg-blue-950/20',
    border: 'border-blue-300 dark:border-blue-800 hover:border-blue-500 dark:hover:border-blue-600',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    icon: Cpu
  },
  service: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/20',
    border: 'border-emerald-300 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    icon: Sparkles
  },
  repository: {
    bg: 'bg-purple-50/90 dark:bg-purple-950/20',
    border: 'border-purple-300 dark:border-purple-800 hover:border-purple-500 dark:hover:border-purple-600',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    icon: Box
  },
  entity: {
    bg: 'bg-amber-50/90 dark:bg-amber-950/20',
    border: 'border-amber-300 dark:border-amber-800 hover:border-amber-500 dark:hover:border-amber-600',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    icon: FileText
  },
  component: {
    bg: 'bg-orange-50/90 dark:bg-orange-950/20',
    border: 'border-orange-300 dark:border-orange-800 hover:border-orange-500 dark:hover:border-orange-600',
    text: 'text-orange-700 dark:text-orange-300',
    dot: 'bg-orange-500',
    icon: Code2
  },
  hook: {
    bg: 'bg-violet-50/90 dark:bg-violet-950/20',
    border: 'border-violet-300 dark:border-violet-800 hover:border-violet-500 dark:hover:border-violet-600',
    text: 'text-violet-700 dark:text-violet-300',
    dot: 'bg-violet-500',
    icon: Settings2
  },
  configuration: {
    bg: 'bg-slate-50/90 dark:bg-slate-900/40',
    border: 'border-slate-300 dark:border-slate-700 hover:border-slate-500 dark:hover:border-slate-500',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-500',
    icon: Settings2
  },
  default: {
    bg: 'bg-slate-50/50 dark:bg-slate-900/10',
    border: 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600',
    text: 'text-slate-600 dark:text-slate-400',
    dot: 'bg-slate-400',
    icon: FileText
  }
}

const getFileTheme = (annotations, language) => {
  const annos = annotations || []
  if (annos.includes('RestController') || annos.includes('Controller')) return 'controller'
  if (annos.includes('Service')) return 'service'
  if (annos.includes('Repository')) return 'repository'
  if (annos.includes('Entity')) return 'entity'
  if (annos.includes('Configuration')) return 'configuration'
  if (annos.includes('Component')) return 'component'
  if (annos.includes('Hook')) return 'hook'
  
  if (language === 'tsx' || language === 'jsx') return 'component'
  
  return 'default'
}

export const FileNode = ({ data, selected }) => {
  const annotations = data.metadata?.annotations || []
  const themeKey = getFileTheme(annotations, data.language)
  const theme = FILE_THEMES[themeKey]
  const Icon = theme.icon

  return (
    <div className={`w-[160px] px-3 py-2 rounded border bg-white dark:bg-slate-900 shadow-sm transition-all duration-200
      ${theme.bg} ${theme.border} ${selected ? 'ring-2 ring-blue-500/30' : ''}`}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} className="!bg-slate-300 dark:!bg-slate-700 w-1.5 h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 dark:!bg-slate-700 w-1.5 h-1.5" />

      <div className="flex items-center gap-2 min-w-0">
        {/* Color Indicator Dot */}
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
        
        <Icon className={`w-3.5 h-3.5 shrink-0 ${theme.text}`} />
        
        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate min-w-0">
          {data.name || 'File'}
        </span>
      </div>
    </div>
  )
}

export default FileNode
