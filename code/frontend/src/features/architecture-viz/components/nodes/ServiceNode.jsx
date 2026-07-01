import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { TechIcon } from './TechIcon';

const TYPE_COLORS = {
  client:   'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  service:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  database: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  cache:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  broker:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  worker:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  external: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300',
  other:    'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300',
};

const TYPE_LABELS = {
  client: 'Client', service: 'Service', database: 'DB',
  cache: 'Cache', broker: 'Broker', worker: 'Worker',
  external: 'External', other: 'Comp.',
};

export const ServiceNode = ({ data, selected }) => {
  const type = data.metadata?.type || data.type || 'service';
  const icon = data.metadata?.icon || '';
  const port = data.metadata?.port || data.port || '';
  const typeColor = TYPE_COLORS[type] || TYPE_COLORS.other;
  const typeLabel = TYPE_LABELS[type] || 'Comp.';
  const description = data.metadata?.description || data.description || '';

  return (
    <div 
      title={description}
      className={`
        w-[180px] rounded-lg border bg-white dark:bg-slate-900 shadow-sm
        transition-all duration-150
        border-slate-200 dark:border-slate-700/80
        hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md
        ${selected ? 'ring-2 ring-blue-500/60 border-blue-400' : ''}
      `}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Left}   id="l" className="!w-1.5 !h-1.5 !bg-slate-300 dark:!bg-slate-600 !border-none" />
      <Handle type="target" position={Position.Top}    id="t" className="!w-1.5 !h-1.5 !bg-slate-300 dark:!bg-slate-600 !border-none" />
      <Handle type="source" position={Position.Right}  id="r" className="!w-1.5 !h-1.5 !bg-slate-300 dark:!bg-slate-600 !border-none" />
      <Handle type="source" position={Position.Bottom} id="b" className="!w-1.5 !h-1.5 !bg-slate-300 dark:!bg-slate-600 !border-none" />

      {/* Content */}
      <div className="px-2.5 py-2 flex items-center gap-2">
        {/* Icon */}
        <div className="shrink-0">
          <TechIcon iconKey={icon} size={18} />
        </div>

        {/* Name + badge */}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight select-none">
            {data.name || 'Unnamed'}
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-[8px] font-bold px-1 py-0.5 rounded-full leading-none select-none flex items-center gap-0.5 ${typeColor}`}>
              {type === 'database' && <span className="text-[9px]">🛢️</span>}
              {typeLabel}
            </span>
            {port && (
              <span className="text-[8px] font-mono text-slate-400 dark:text-slate-550 leading-none select-none">
                :{port}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceNode;

