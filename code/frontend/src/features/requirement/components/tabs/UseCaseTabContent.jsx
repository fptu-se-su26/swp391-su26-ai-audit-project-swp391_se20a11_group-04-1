import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const UseCaseTabContent = ({ useCases, requirement, onOpenUseCaseModal }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!useCases || useCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[24px]">emoji_people</span>
        </div>
        <p className="text-slate-600 text-sm mb-4">No use cases linked to this requirement yet</p>
        <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm" onClick={onOpenUseCaseModal || (() => console.log('Generate Use Cases clicked'))}>
          Generate Use Cases
        </button>
      </div>
    );
  }



  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED': return 'text-slate-600 bg-slate-100 border-slate-200/50';
      case 'DRAFT': return 'text-slate-500 bg-slate-50 border-slate-200/50';
      case 'NEED_REVIEW': return 'text-indigo-700 bg-indigo-50 border-indigo-200/50';
      default: return 'text-slate-600 bg-slate-100 border-slate-200/50';
    }
  };

  return (
    <div className="w-full">
      {/* List Header */}
      <div className="grid grid-cols-[100px_1fr_200px_120px] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/30 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div>ID</div>
        <div>Use Case Name</div>
        <div>Actors</div>
        <div className="text-right">Status</div>
      </div>

      {/* List Body */}
      <div className="flex flex-col">
        {useCases.map((uc, index) => {
          const code = uc.code || `UC-${String(uc.id).padStart(3, '0')}`;
          const actor = uc.primaryActors || 'System';
          const status = uc.status || 'DRAFT';

          return (
            <div 
              key={uc.id} 
              onClick={() => navigate(`/projects/${projectId}/use-cases/${uc.id}`)}
              className={`grid grid-cols-[100px_1fr_200px_120px] gap-4 px-6 py-3 items-center hover:bg-indigo-50/40 transition-colors cursor-pointer ${index !== useCases.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="text-sm font-medium text-slate-500">{code}</div>
              <div className="text-sm font-medium text-slate-800 truncate pr-4" title={uc.name}>{uc.name}</div>
              
              <div className="flex items-center gap-1.5 text-sm text-slate-600 truncate" title={actor}>
                <span className="material-symbols-outlined text-[16px] text-slate-400">person</span>
                <span className="truncate">{actor}</span>
              </div>
              
              <div className="text-right">
                <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase border ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UseCaseTabContent;
