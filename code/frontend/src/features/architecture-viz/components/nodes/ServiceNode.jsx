import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Server, Database, MessageSquare, Terminal, Cpu, Play } from 'lucide-react'

// Colors and Icons based on service type
const SERVICE_THEMES = {
  client: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-500',
    headerBg: 'bg-emerald-600 dark:bg-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: Server
  },
  service: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-800/60 hover:border-blue-400 dark:hover:border-blue-500',
    headerBg: 'bg-blue-600 dark:bg-blue-700',
    text: 'text-blue-700 dark:text-blue-300',
    icon: Server
  },
  database: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500',
    headerBg: 'bg-amber-600 dark:bg-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Database
  },
  cache: {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    border: 'border-rose-200 dark:border-rose-800/60 hover:border-rose-400 dark:hover:border-rose-500',
    headerBg: 'bg-rose-600 dark:bg-rose-700',
    text: 'text-rose-700 dark:text-rose-300',
    icon: Cpu
  },
  broker: {
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-500',
    headerBg: 'bg-violet-600 dark:bg-violet-700',
    text: 'text-violet-700 dark:text-violet-300',
    icon: MessageSquare
  },
  parser: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',
    border: 'border-fuchsia-200 dark:border-fuchsia-800/60 hover:border-fuchsia-400 dark:hover:border-fuchsia-500',
    headerBg: 'bg-fuchsia-600 dark:bg-fuchsia-700',
    text: 'text-fuchsia-700 dark:text-fuchsia-300',
    icon: Terminal
  },
  worker: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
    border: 'border-cyan-200 dark:border-cyan-800/60 hover:border-cyan-400 dark:hover:border-cyan-500',
    headerBg: 'bg-cyan-600 dark:bg-cyan-700',
    text: 'text-cyan-700 dark:text-cyan-300',
    icon: Play
  },
  default: {
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-800/60 hover:border-slate-400 dark:hover:border-slate-500',
    headerBg: 'bg-slate-600 dark:bg-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    icon: Server
  }
}

export const ServiceNode = ({ data, selected }) => {
  const type = data.metadata?.type || data.type || 'service'
  const theme = SERVICE_THEMES[type] || SERVICE_THEMES.default
  const Icon = theme.icon

  return (
    <div className={`w-[220px] rounded-xl border shadow-lg transition-all duration-200 ${theme.bg} ${theme.border} ${selected ? 'ring-2 ring-blue-500/50 scale-[1.02]' : ''}`}>
      {/* Handles for connections */}
      <Handle type="target" position={Position.Top} className="!bg-slate-400 dark:!bg-slate-600 w-2.5 h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 dark:!bg-slate-600 w-2.5 h-2.5" />

      {/* Header */}
      <div className={`px-4 py-2.5 rounded-t-xl flex items-center gap-2.5 ${theme.headerBg} text-white font-semibold text-sm`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{data.name || 'Unnamed Service'}</span>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Stack:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{data.metadata?.tech || data.tech || 'N/A'}</span>
        </div>
        {(data.metadata?.port || data.port) && (
          <div className="flex justify-between items-center">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Port:</span>
            <span className="px-1.5 py-0.5 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 rounded text-slate-800 dark:text-slate-200 font-medium border border-slate-200/40">
              {data.metadata?.port || data.port}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServiceNode
