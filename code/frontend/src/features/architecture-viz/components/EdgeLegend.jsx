import React, { useState } from 'react';

const LEGEND_ITEMS = [
  { label: 'HTTP / REST', color: '#3b82f6', style: 'solid' },
  { label: 'Database / SQL', color: '#8b5cf6', style: 'solid' },
  { label: 'Cache / Key-Value', color: '#a855f7', style: 'solid' },
  { label: 'Message Queue / Broker', color: '#f59e0b', style: 'solid' },
  { label: 'Monitoring / Metrics', color: '#10b981', style: 'solid' },
  { label: 'Asynchronous / Event', color: '#94a3b8', style: 'dashed' },
  { label: 'CI/CD / Quality Scan', color: '#f97316', style: 'solid' },
  { label: 'Network / Low-level', color: '#64748b', style: 'solid' },
];

export default function EdgeLegend() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 left-4 z-50 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[10px] font-bold shadow-md hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer select-none text-slate-600 dark:text-slate-400"
      >
        📖 Hiện Chú Thích
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-50 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg p-3 select-none">
      <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Chú thích đường nối</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="space-y-1.5">
        {LEGEND_ITEMS.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5 text-[10px] font-medium text-slate-700 dark:text-slate-350">
            {/* Line indicator */}
            <div className="w-8 flex items-center shrink-0">
              <div
                style={{
                  borderTop: `2px ${item.style === 'dashed' ? 'dashed' : 'solid'} ${item.color}`,
                  width: '100%',
                }}
              />
            </div>
            {/* Label */}
            <span className="truncate">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
