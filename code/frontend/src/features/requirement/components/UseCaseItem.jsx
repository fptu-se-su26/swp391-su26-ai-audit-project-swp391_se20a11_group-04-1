import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../../../store/useProjectStore';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const UseCaseItem = ({ 
  uc, 
  allUseCases = [], 
  diagramData,
  onDelete, 
  onEdit, 
  onRefresh,
  enableReorder = false,
  onApprove,
  onReject
}) => {
  const { id, name, status, aiGenerated, startDate, deadline, code, requirement, requirementId, outdated, aiScore } = uc;
  const navigate = useNavigate();
  const activeProject = useProjectStore((state) => state.activeProject);

  const resolveActors = (ucItem) => {
    const graphicalActors = new Set();
    if (diagramData && diagramData.relations && diagramData.actors) {
      const { relations, actors } = diagramData;
      const directRelations = relations.filter(r => r.type === 'actor-uc' && String(r.targetId) === String(ucItem.id));
      directRelations.forEach(r => {
        const actor = actors.find(a => String(a.id) === String(r.sourceId) || String(`actor_${a.id}`) === String(r.sourceId));
        if (actor) graphicalActors.add(actor.name);
      });
      if (graphicalActors.size === 0) {
        const parentRelations = relations.filter(r => 
          (r.type === 'include' || r.type === 'extends') && String(r.targetId) === String(ucItem.id)
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
    if (graphicalActors.size > 0) return Array.from(graphicalActors);
    if (ucItem.actors && ucItem.actors.length > 0) return ucItem.actors;
    if (!allUseCases || allUseCases.length === 0) return [];

    const relatedActors = new Set();
    allUseCases.forEach(parent => {
      const includes = parent.includesList || [];
      const extendsList = parent.extendsList || [];
      if (includes.includes(ucItem.id) || includes.includes(ucItem.code) || 
          extendsList.includes(ucItem.id) || extendsList.includes(ucItem.code)) {
        if (parent.actors) parent.actors.forEach(a => relatedActors.add(a));
      }
    });
    const myIncludes = ucItem.includesList || [];
    const myExtends = ucItem.extendsList || [];
    allUseCases.forEach(child => {
      if (myIncludes.includes(child.id) || myIncludes.includes(child.code) ||
          myExtends.includes(child.id) || myExtends.includes(child.code)) {
        if (child.actors) child.actors.forEach(a => relatedActors.add(a));
      }
    });
    return Array.from(relatedActors);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const sortableParams = useSortable({ id: uc.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortableParams;

  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleActionMenu = (e) => {
    e.stopPropagation();
    setShowActionMenu(!showActionMenu);
  };

  const handleAction = (e, actionType) => {
    e.stopPropagation();
    setShowActionMenu(false);
    if (actionType === 'Delete') {
      if (onDelete) onDelete(id);
    } else if (actionType === 'Edit') {
      if (onEdit) onEdit(uc);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : showActionMenu ? 50 : 1,
  };

  const actors = resolveActors(uc);

  const getRowStatus = () => {
    if (!deadline || status === 'DONE') return 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dlDate = new Date(deadline);
    dlDate.setHours(0,0,0,0);
    
    const diffTime = dlDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'border-red-400 shadow-[0_2px_12px_rgba(239,68,68,0.3)] z-10'; // Overdue glow
    if (diffDays <= 3) return 'border-amber-400 shadow-[0_2px_12px_rgba(245,158,11,0.3)] z-10'; // Approaching glow
    return 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300';
  };

  return (
    <div 
      ref={enableReorder ? setNodeRef : null}
      style={enableReorder ? style : {}}
      className={`grid grid-cols-12 gap-3 px-stack_md py-3 items-center transition-all group border rounded-xl bg-white relative ${getRowStatus()}`}
    >
      {enableReorder && (
        <div 
          {...attributes}
          {...listeners}
          className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing p-1 hover:bg-surface-container rounded transition-opacity"
          title="Drag to reorder"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">drag_indicator</span>
        </div>
      )}

      <div 
        onClick={() => navigate(`/projects/${activeProject?.id}/use-cases/${id}`)}
        className={`col-span-8 sm:col-span-4 md:col-span-4 lg:col-span-4 flex min-w-0 items-start gap-3 ${enableReorder ? 'pl-6' : ''} cursor-pointer`}
      >
        <span className="font-label-md text-label-md text-[#1E707D] bg-[#1E707D]/10 px-2 py-1 rounded font-bold shrink-0 mt-0.5">{code || `UC-${String(id).padStart(3, '0')}`}</span>
        <div className="min-w-0 flex flex-col gap-1">
          <span className="flex items-center gap-2">
            <span className="block truncate font-body-md text-body-md font-bold text-on-surface">{name}</span>
          </span>
          {(startDate || deadline) && (
            (() => {
              let dateColorClass = "text-[#1E707D] bg-[#1E707D]/10 border border-[#1E707D]/20";
              let iconName = "calendar_today";
              if (deadline) {
                if (status === 'DONE') {
                  dateColorClass = "text-gray-500 bg-gray-100";
                } else {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const dlDate = new Date(deadline);
                  dlDate.setHours(0, 0, 0, 0);
                  const diffTime = dlDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 0) {
                    dateColorClass = "text-red-700 bg-red-100 border border-red-200";
                    iconName = "error"; // Overdue warning
                  } else if (diffDays <= 3) {
                    dateColorClass = "text-amber-700 bg-amber-100 border border-amber-200";
                    iconName = "warning"; // Approaching warning
                  }
                }
              }

              return (
                <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium w-fit ${dateColorClass}`} title={deadline ? "Deadline Warning" : ""}>
                  <span className="material-symbols-outlined text-[12px]">{iconName}</span>
                  {startDate ? formatDate(startDate) : '?'} - {deadline ? formatDate(deadline) : '?'}
                </div>
              );
            })()
          )}
        </div>
      </div>

      <div className="col-span-4 sm:col-span-3 hidden sm:flex flex-col gap-1 pr-2">
        <div 
          className="flex items-center gap-1 cursor-pointer w-fit"
          onClick={(e) => {
            e.stopPropagation();
            if (requirementId) navigate(`/projects/${activeProject?.id}/requirements/${requirementId}`);
          }}
        >
          <span className="material-symbols-outlined text-outline text-[16px]">description</span>
          <span className="text-[#1E707D] hover:underline text-sm font-medium">
            {requirement?.reqCode || (requirementId ? `REQ-${requirementId}` : '')}
          </span>
        </div>
        {outdated && (
          <div className="flex items-center gap-1 text-[#E24B4A] text-[11px] font-medium bg-[#FECACA]/30 w-fit px-1.5 py-0.5 rounded">
            <span className="material-symbols-outlined text-[12px]">warning</span>
            Outdated Req
          </div>
        )}
      </div>

      <div className="col-span-2 hidden md:flex items-center gap-2 truncate">
        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#1E707D]/10 text-[#1E707D] shrink-0">
          <span className="material-symbols-outlined text-[14px]">person</span>
        </div>
        <span className="text-sm text-secondary truncate" title={actors.length > 0 ? actors.join(', ') : 'None'}>
          {actors.length > 0 ? actors.join(', ') : 'None'}
        </span>
      </div>

      <div className="col-span-3 lg:col-span-2 hidden lg:flex items-center justify-center">
        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
          status === 'DRAFT'        ? 'bg-slate-50 text-slate-600 border-slate-200' :
          status === 'IN_PROGRESS'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
          status === 'IN_REVIEW'    ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/20' :
          status === 'DONE'         ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
          'bg-surface-container text-secondary border-outline-variant'
        }`}>
          {status ? status.replace('_', ' ') : 'DRAFT'}
        </span>
      </div>

      <div className="col-span-4 sm:col-span-2 lg:col-span-1 flex items-center justify-end pr-2 gap-2">
        {(onEdit || onDelete || onApprove || onReject) && (
          <div className="relative w-8 flex justify-end shrink-0" ref={actionMenuRef}>
            <button 
              onClick={toggleActionMenu}
              className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>

            {showActionMenu && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-10">
                {onEdit && (
                  <button
                    onClick={(e) => handleAction(e, 'Edit')}
                    className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => handleAction(e, 'Delete')}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container hover:text-on-error-container flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                )}
                {onApprove && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowActionMenu(false); onApprove(id); }}
                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Approve
                  </button>
                )}
                {onReject && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowActionMenu(false); onReject(id); }}
                    className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    Reject
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UseCaseItem;
