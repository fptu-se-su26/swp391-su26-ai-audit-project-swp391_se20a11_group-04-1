import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { TechIcon } from './TechIcon';

const GROUP_THEMES = {
  CI_CD: {
    bg:     'bg-orange-500/5 dark:bg-orange-400/5',
    border: 'border-orange-400 dark:border-orange-500',
    borderStyle: 'border-solid',
    header: 'bg-orange-100/80 dark:bg-orange-950 border-orange-300 dark:border-orange-700/60',
    text:   'text-orange-850 dark:text-orange-400',
    dot:    'bg-orange-500',
    name:   'CI/CD Pipeline',
  },
  CLOUD_INSTANCE: {
    bg:     'bg-sky-500/5 dark:bg-sky-400/5',
    border: 'border-sky-500 dark:border-sky-500',
    borderStyle: 'border-solid',
    header: 'bg-sky-100/80 dark:bg-sky-950 border-sky-300 dark:border-sky-700/60',
    text:   'text-sky-850 dark:text-sky-400',
    dot:    'bg-sky-500',
    name:   'AWS EC2 Instance',
  },
  CONTAINER_CLUSTER: {
    bg:     'bg-teal-500/5 dark:bg-teal-400/5',
    border: 'border-teal-400 dark:border-teal-500',
    borderStyle: 'border-dashed',
    header: 'bg-teal-100/80 dark:bg-teal-950 border-teal-300 dark:border-teal-700/60',
    text:   'text-teal-850 dark:text-teal-400',
    dot:    'bg-teal-500',
    name:   'Docker Compose Cluster',
  },
  MONITORING: {
    bg:     'bg-purple-500/5 dark:bg-purple-400/5',
    border: 'border-purple-400 dark:border-purple-500',
    borderStyle: 'border-dashed',
    header: 'bg-purple-100/80 dark:bg-purple-950 border-purple-300 dark:border-purple-700/60',
    text:   'text-purple-855 dark:text-purple-400',
    dot:    'bg-purple-500',
    name:   'Observability Stack',
  },
  EXTERNAL: {
    bg:     'bg-slate-500/5 dark:bg-slate-400/5',
    border: 'border-slate-300 dark:border-slate-550',
    borderStyle: 'border-dashed',
    header: 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700/60',
    text:   'text-slate-700 dark:text-slate-400',
    dot:    'bg-slate-500',
    name:   'External Services',
  },
  default: {
    bg:     'bg-slate-500/5 dark:bg-slate-400/5',
    border: 'border-slate-400 dark:border-slate-500',
    borderStyle: 'border-dashed',
    header: 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700/60',
    text:   'text-slate-700 dark:text-slate-400',
    dot:    'bg-slate-400',
    name:   'Infrastructure Group',
  },
};

export const InfraGroupNode = ({ id, data }) => {
  const groupType = data.metadata?.groupType || data.groupType || 'default';
  const isCollapsed = data.isCollapsed || false;
  const childCount = data.childCount || 0;
  const theme = GROUP_THEMES[groupType] || GROUP_THEMES.default;
  const displayName = data.name || theme.name;
  const tech = data.metadata?.tech || data.tech || '';
  const icon = data.metadata?.icon || data.icon || '';

  if (isCollapsed) {
    return (
      <div
        onClick={() => data.onToggle?.(id)}
        className={`w-[220px] px-4 py-3 rounded-none border-2 ${theme.borderStyle} flex items-center gap-3 hover:brightness-95 transition-all ${theme.border} ${theme.bg} cursor-pointer shadow-sm`}
      >
        <Handle type="target" position={Position.Top}    id="t" className="opacity-0" />
        <Handle type="source" position={Position.Bottom} id="b" className="opacity-0" />
        <Handle type="target" position={Position.Left}   id="l" className="opacity-0" />
        <Handle type="source" position={Position.Right}  id="r" className="opacity-0" />

        {icon && <TechIcon iconKey={icon} size={20} />}
        <div className="flex flex-col min-w-0">
          <span className={`text-[11px] font-bold uppercase tracking-wide leading-tight truncate ${theme.text}`}>
            {displayName}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-550 font-vietnamese mt-0.5">
            {childCount} dịch vụ · Bấm để mở
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full rounded-none border-2 ${theme.borderStyle} ${theme.bg} ${theme.border} pointer-events-none relative transition-all`}>
      {/* Handles */}
      <Handle type="target" position={Position.Top}    id="t-in"  className="opacity-0" />
      <Handle type="source" position={Position.Top}    id="t-out" className="opacity-0" />
      <Handle type="target" position={Position.Bottom} id="b-in"  className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="b-out" className="opacity-0" />
      <Handle type="target" position={Position.Left}   id="l-in"  className="opacity-0" />
      <Handle type="source" position={Position.Left}   id="l-out" className="opacity-0" />
      <Handle type="target" position={Position.Right}  id="r-in"  className="opacity-0" />
      <Handle type="source" position={Position.Right}  id="r-out" className="opacity-0" />

      {/* Integrated Header bar (AWS/drawio style) */}
      <div className={`
        absolute top-0 left-0 right-0 h-[36px]
        flex items-center gap-2
        px-3 border-b pointer-events-auto select-none
        ${theme.header} ${theme.text} ${theme.border}
      `}>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
        {icon && <TechIcon iconKey={icon} size={16} />}
        <span className="text-[11px] font-bold uppercase tracking-wide leading-tight truncate">{displayName}</span>
        {tech && <span className="font-mono font-normal opacity-60 text-[9px]">· {tech}</span>}
        {childCount > 0 && <span className="opacity-50 font-normal text-[10px]">({childCount})</span>}
        <button
          onClick={(e) => { e.stopPropagation(); data.onToggle?.(id); }}
          className="ml-auto pl-2 border-l border-current/20 opacity-60 hover:opacity-100 cursor-pointer transition-opacity font-vietnamese text-[10px] font-semibold"
        >
          Thu gọn
        </button>
      </div>
    </div>
  );
};

export default InfraGroupNode;
