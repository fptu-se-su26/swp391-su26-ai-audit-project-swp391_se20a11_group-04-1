import React from 'react';
import Badge from '../../../components/ui/Badge';
import { Link, useNavigate } from 'react-router-dom';
import useProjectStore from '../../../store/useProjectStore';

const UseCaseTable = ({ useCases, allUseCases = [], diagramData, onEdit, onDelete, onApprove, isDraftView }) => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const navigate = useNavigate();

  const resolveActors = (uc) => {
    const graphicalActors = new Set();

    if (diagramData && diagramData.relations && diagramData.actors) {
      const { relations, actors } = diagramData;

      // 1. Find direct actor connections in the diagram
      const directRelations = relations.filter(r => r.type === 'actor-uc' && String(r.targetId) === String(uc.id));
      directRelations.forEach(r => {
        const actor = actors.find(a => String(a.id) === String(r.sourceId) || String(`actor_${a.id}`) === String(r.sourceId));
        if (actor) graphicalActors.add(actor.name);
      });

      // 2. If no direct graphical actors, check include/extends relations in the diagram backwards
      if (graphicalActors.size === 0) {
        const parentRelations = relations.filter(r => 
          (r.type === 'include' || r.type === 'extends') && String(r.targetId) === String(uc.id)
        );
        
        parentRelations.forEach(pRel => {
          const parentActorRels = relations.filter(r => r.type === 'actor-uc' && String(r.targetId) === String(pRel.sourceId));
          parentActorRels.forEach(r => {
            const actor = actors.find(a => String(a.id) === String(r.sourceId) || String(`actor_${a.id}`) === String(r.sourceId));
            if (actor) graphicalActors.add(actor.name);
          });
        });
      }
    }

    if (graphicalActors.size > 0) {
      return Array.from(graphicalActors);
    }

    // fallback to DB actors
    if (uc.actors && uc.actors.length > 0) return uc.actors;
    if (!allUseCases || allUseCases.length === 0) return [];

    const relatedActors = new Set();
    
    // Check if this UC is included/extended by any other UC
    allUseCases.forEach(parent => {
      const includes = parent.includesList || [];
      const extendsList = parent.extendsList || [];
      if (includes.includes(uc.id) || includes.includes(uc.code) || 
          extendsList.includes(uc.id) || extendsList.includes(uc.code)) {
        if (parent.actors) {
          parent.actors.forEach(a => relatedActors.add(a));
        }
      }
    });

    // Also check if this UC includes/extends another UC that has actors
    const myIncludes = uc.includesList || [];
    const myExtends = uc.extendsList || [];
    allUseCases.forEach(child => {
      if (myIncludes.includes(child.id) || myIncludes.includes(child.code) ||
          myExtends.includes(child.id) || myExtends.includes(child.code)) {
        if (child.actors) {
          child.actors.forEach(a => relatedActors.add(a));
        }
      }
    });

    return Array.from(relatedActors);
  };

  return (
    <div className="overflow-x-auto pb-32">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#f8fafc] border-b border-outline-variant font-label-md text-label-md text-secondary">
            <th className="py-3 px-4 font-semibold uppercase w-12 text-center">
              <input type="checkbox" className="rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D]" />
            </th>
            <th className="py-3 px-4 font-semibold uppercase">ID & Name</th>
            <th className="py-3 px-4 font-semibold uppercase">Linked Req</th>
            <th className="py-3 px-4 font-semibold uppercase">Primary Actor</th>
            <th className="py-3 px-4 font-semibold uppercase">Status</th>
            <th className="py-3 px-4 font-semibold uppercase">AI Score</th>
            <th className="py-3 px-4 font-semibold uppercase w-16 text-center"></th>
          </tr>
        </thead>
        <tbody className="font-body-md text-body-md text-on-surface divide-y divide-outline-variant">
          {useCases.map((uc) => (
            <tr 
              key={uc.id} 
              className="hover:bg-[#1E707D/5] transition-colors group cursor-pointer"
              onClick={() => navigate(`/projects/${activeProject?.id}/use-cases/${uc.id}`)}
            >
              <td className="py-3 px-4 text-center">
                <input type="checkbox" className="rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D]" />
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-[#1E707D] font-bold">{uc.code || `UC-${uc.id}`}</span>
                  <Link to={`/projects/${activeProject?.id}/use-cases/${uc.id}`} className="font-medium text-on-surface hover:text-[#1E707D] transition-colors">{uc.name}</Link>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-outline" style={{ fontSize: '16px' }}>description</span>
                    <Link 
                      to={`/projects/${activeProject?.id}/requirements/${uc.requirementId}`}
                      onClick={(e) => e.stopPropagation()} 
                      className="text-[#1E707D] hover:underline"
                    >
                      {uc.requirement?.reqCode || `REQ-${uc.requirementId || 'X'}`}
                    </Link>
                  </div>
                  {uc.outdated && (
                    <div className="flex items-center gap-1 text-[#E24B4A] text-[11px] font-medium bg-[#FECACA]/30 w-fit px-1.5 py-0.5 rounded">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      Outdated Req
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#1E707D]/10 text-[#1E707D]">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                  </div>
                  <span>
                    {resolveActors(uc).length > 0 ? resolveActors(uc).join(', ') : 'None'}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-0.5 rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-wider
                  ${uc.status === 'DRAFT' ? 'bg-slate-50 text-slate-600 border border-slate-200' : 
                    uc.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                    uc.status === 'IN_REVIEW' ? 'bg-[#1E707D]/10 text-[#1E707D] border border-[#1E707D]/20' : 
                    uc.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                    'bg-surface-variant text-on-surface-variant'}`}>
                  {uc.status ? uc.status.replace('_', ' ') : 'DRAFT'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-surface-variant rounded-full h-1.5 max-w-[60px]">
                    <div 
                      className={`h-1.5 rounded-full ${(uc.completenessScore || 0) < 50 ? 'bg-error' : 'bg-[#1E707D]'}`} 
                      style={{ width: `${uc.completenessScore || 0}%` }}
                    ></div>
                  </div>
                  <span className="font-label-md text-label-md text-on-surface-variant">{uc.completenessScore || 0}%</span>
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                {isDraftView ? (
                  onApprove && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onApprove) onApprove(uc.id);
                      }}
                      className="flex items-center justify-center gap-1 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors ml-auto border border-green-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      Approve
                    </button>
                  )
                ) : (
                  (onEdit || onDelete) && (
                    <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="text-outline hover:text-on-surface opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-surface-container-low"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const current = e.currentTarget.nextElementSibling;
                        document.querySelectorAll('.usecase-action-menu').forEach(el => {
                          if (el !== current) el.classList.add('hidden');
                        });
                        current.classList.toggle('hidden');
                      }}
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    <div className="usecase-action-menu hidden absolute right-0 mt-1 w-32 bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-50">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.parentElement.classList.add('hidden');
                            onEdit(uc);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.parentElement.classList.add('hidden');
                            onDelete(uc.id);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container hover:text-on-error-container flex items-center gap-2 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UseCaseTable;
