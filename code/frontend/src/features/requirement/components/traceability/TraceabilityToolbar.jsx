import React from 'react';

const TraceabilityToolbar = ({ zoom, onZoomIn, onZoomOut, onReset }) => {
  return (
    <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 shadow-sm p-1.5 flex flex-col gap-1 z-50">
      <button 
        onClick={onZoomIn}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        title="Zoom In"
      >
        <span className="material-symbols-outlined text-[20px]">zoom_in</span>
      </button>
      <div className="h-px w-full bg-slate-200 my-0.5" />
      <button 
        onClick={onZoomOut}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        title="Zoom Out"
      >
        <span className="material-symbols-outlined text-[20px]">zoom_out</span>
      </button>
      <div className="h-px w-full bg-slate-200 my-0.5" />
      <button 
        onClick={onReset}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        title="Reset View"
      >
        <span className="material-symbols-outlined text-[18px]">fit_screen</span>
      </button>

      <div className="mt-2 text-center text-[10px] font-medium text-slate-400 select-none">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default TraceabilityToolbar;
