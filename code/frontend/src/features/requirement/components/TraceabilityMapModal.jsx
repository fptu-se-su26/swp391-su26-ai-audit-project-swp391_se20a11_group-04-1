import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TraceabilityProvider } from './traceability/TraceabilityContext';
import TraceabilityCanvas from './traceability/TraceabilityCanvas';
import LevelLegend from './traceability/LevelLegend';

const TraceabilityMapModal = ({ isOpen, onClose, requirement, data }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E707D]/10 border border-[#1E707D]/20 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[#1E707D] text-[22px]">account_tree</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Enterprise Traceability Tree</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-semibold px-2 py-0.5 bg-[#1E707D]/10 text-[#1E707D] rounded uppercase tracking-wide">
                  {requirement?.reqCode || 'REQ'}
                </span>
                <span className="text-sm text-slate-500 font-medium truncate max-w-lg">
                  {requirement?.title || 'Loading Traceability Map...'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/projects/${projectId}/requirements/${requirement?.id}`)}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
            >
              Go to Details
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Main Canvas Body */}
        <div className="relative flex-1 bg-slate-50 overflow-hidden">
          <TraceabilityProvider data={data} requirement={requirement}>
            <TraceabilityCanvas />
            <LevelLegend />
          </TraceabilityProvider>
        </div>
      </div>
    </div>
  );
};

export default TraceabilityMapModal;
