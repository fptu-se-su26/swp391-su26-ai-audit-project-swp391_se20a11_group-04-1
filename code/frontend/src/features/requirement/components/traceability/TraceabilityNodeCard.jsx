import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTraceability } from './TraceabilityContext';
import { useNavigate, useParams } from 'react-router-dom';

const TraceabilityNodeCard = ({ level, item, isEmpty = false, taskEvidences = [] }) => {
  const { registerNode, activePath, setActivePath } = useTraceability();
  const nodeRef = useRef(null);
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [showEvidence, setShowEvidence] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEvidence && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEvidence(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEvidence]);

  const id = isEmpty ? (item?.id || `empty-${level}`) : item.id;

  useEffect(() => {
    registerNode(id, level, nodeRef.current);
    return () => registerNode(id, level, null);
  }, [id, level, registerNode]);

  const handleMouseEnter = () => setActivePath({ level, id });
  const handleMouseLeave = () => setActivePath(null);

  const isActive = activePath && activePath.id === id;
  // If activePath exists and this is not it, we might fade it. 
  // Wait, if it's an ancestor/descendant, it should stay active! 
  // Since we don't have deep lineage data mapped right now, we will fade everything NOT in the direct level path, or we can just fade siblings.
  // For now, if activePath is set, we dim items that are NOT the active one, UNLESS they are in a different level (which means they could be parents).
  // Actually, to make it simple without lineage: fade siblings in the same level.
  const isFaded = activePath && activePath.level === level && activePath.id !== id;
  const isPathActive = activePath && activePath.level !== level; // Assume it's part of the path if it's on another level (simplified)

  const handleNavigate = () => {
    if (isEmpty) return;
    switch (level) {
      case 'Use Cases': navigate(`/projects/${projectId}/use-cases/${item.id}`); break;
      case 'Tasks': navigate(`/projects/${projectId}/tasks/${item.id}`); break;
      case 'Tests': navigate(`/projects/${projectId}/test-cases/${item.id}`); break;
      case 'Evidence': navigate(`/projects/${projectId}/evidence/${item.id}`); break;
      default: break;
    }
  };

  if (isEmpty && level === 'Tests') {
    return (
      <div 
        ref={nodeRef}
        className="relative z-10 w-[200px] min-h-[120px] flex flex-col items-center justify-center bg-slate-50 border-[0.5px] border-slate-300 border-dashed rounded-xl shadow-sm cursor-default"
      >
        <span className="material-symbols-outlined text-[20px] text-slate-400 mb-1">science</span>
        <span className="text-xs font-medium text-slate-600">Chưa có test</span>
        <span className="text-[10px] text-slate-400 mt-0.5">liên kết task để tạo</span>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div 
        ref={nodeRef}
        className="relative z-10 w-56 flex flex-col items-center justify-center h-20 bg-slate-50 border-[0.5px] border-slate-300 border-dashed rounded-xl shadow-sm"
      >
        <span className="text-xs text-slate-400 italic">No {level}</span>
      </div>
    );
  }

  // Color mapping based on exact user specification
  let icon, themeColor;
  switch (level) {
    case 'Requirement':
      icon = 'content_paste'; themeColor = { borderLeft: 'border-l-indigo-400', text: 'text-indigo-600' }; break;
    case 'Use Cases':
      icon = 'route'; themeColor = { borderLeft: 'border-l-amber-400', text: 'text-amber-600' }; break;
    case 'Tasks':
      icon = 'article'; themeColor = { borderLeft: 'border-l-orange-500', text: 'text-orange-600' }; break;
    case 'Tests':
      icon = 'science'; themeColor = { borderLeft: 'border-l-emerald-500', text: 'text-emerald-600' }; break;
    case 'Evidence':
      icon = 'inventory_2'; themeColor = { borderLeft: 'border-l-purple-500', text: 'text-purple-600' }; break;
    default:
      icon = 'article'; themeColor = { borderLeft: 'border-l-slate-400', text: 'text-slate-600' };
  }

  const getStatusColor = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PASS' || s === 'DONE' || s === 'VERIFIED') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'FAIL' || s === 'BLOCKED') return 'bg-red-50 text-red-700 border-red-200';
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return 'bg-amber-50 text-amber-700 border-amber-200';
    if (s === 'IN_REVIEW' || s === 'IN REVIEW') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-slate-50 text-slate-600 border-slate-200'; // DRAFT / DEFAULT
  };

  const getPriorityInfo = (priority) => {
    const p = (priority || 'MEDIUM').toUpperCase();
    if (p === 'LOW') return { dot: 'bg-slate-400', text: 'Low' };
    if (p === 'HIGH' || p === 'CRITICAL') return { dot: 'bg-red-500', text: 'High' };
    return { dot: 'bg-orange-500', text: 'Medium' };
  };

  const isRequirement = level === 'Requirement';
  
  const countCriteria = (text) => {
    if (!text) return 0;
    if (Array.isArray(text)) return text.length;
    return String(text).split('\n').filter(line => line.trim().length > 0).length;
  };

  const renderRequirementMetadata = () => {
    const prio = getPriorityInfo(item.priority);
    return (
      <div className="mt-3 pt-2 border-t border-slate-200 grid grid-cols-2 gap-y-2 gap-x-1 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-[14px]">account_circle</span>
          <span className="truncate">{item.ownerId || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <div className={`w-1.5 h-1.5 rounded-full ${prio.dot}`}></div>
          <span>{prio.text}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-[14px]">checklist</span>
          <span>{countCriteria(item.acceptanceCriteria)} criteria</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end truncate">
          <span className="material-symbols-outlined text-[14px]">local_offer</span>
          <span className={`truncate ${!item.tags?.length ? 'text-slate-300 italic' : ''}`}>{item.tags?.join(', ') || 'No tags'}</span>
        </div>
      </div>
    );
  };

  const renderUseCaseMetadata = () => {
    const taskCount = item.tasks?.length || 0;
    return (
      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-[14px]">account_circle</span>
          <span className="truncate">{item.actors && item.actors.length > 0 ? item.actors.join(', ') : 'N/A'}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <span className="material-symbols-outlined text-[14px]">check_box</span>
          <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  };

  const renderTaskMetadata = () => {
    const prio = getPriorityInfo(item.priority);
    return (
      <>
        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[14px]">person</span>
            <span className="truncate">{item.primaryAssignee?.name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${prio.dot}`}></div>
            <span>{prio.text}</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            <span>{item.deadline || 'No Date'}</span>
          </div>
          <div className="relative" ref={dropdownRef}>
            <div 
              className={`flex items-center gap-1 shrink-0 ${taskEvidences?.length ? 'text-purple-600 hover:bg-purple-50 px-1.5 py-0.5 rounded cursor-pointer font-medium transition-colors -mr-1' : 'italic text-slate-400'}`}
              onClick={taskEvidences?.length ? (e) => { e.stopPropagation(); setShowEvidence(!showEvidence); } : undefined}
            >
              <span className="material-symbols-outlined text-[14px]">attach_file</span>
              <span>{taskEvidences?.length ? `${taskEvidences.length} evidence` : 'No evidence'}</span>
              {taskEvidences?.length > 0 && (
                <span className="material-symbols-outlined text-[14px] transition-transform duration-200" style={{ transform: showEvidence ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  expand_more
                </span>
              )}
            </div>

            {/* Floating Evidence Popover */}
            {taskEvidences && taskEvidences.length > 0 && showEvidence && (
              <div 
                className="absolute top-full left-0 mt-2 w-[220px] bg-white border-[0.5px] border-slate-300 border-l-[3px] border-l-purple-500 rounded-xl rounded-tl-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] z-[9999] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-0.5 p-2 max-h-[220px] overflow-y-auto">
                  {taskEvidences.map(ev => (
                    <div 
                      key={ev.id} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEvidence(false);
                        if (ev.fileUrl || ev.externalUrl) {
                          setPreviewImage(ev.fileUrl || ev.externalUrl);
                        } else {
                          navigate(`/projects/${projectId}/evidence/${ev.id}`);
                        }
                      }}
                      className="flex items-center justify-between bg-white border border-transparent rounded p-1.5 hover:bg-purple-50 hover:border-purple-100 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-purple-600 transition-colors">
                          {ev.fileUrl || ev.externalUrl ? 'image' : 'description'}
                        </span>
                        <span className="font-medium text-[11px] text-slate-700 truncate group-hover:text-purple-700" title={ev.title || ev.name}>{ev.title || ev.name || 'Untitled'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderTestMetadata = () => {
    const linkedTask = item.testLinks?.find(l => l.entityType === 'TASK');
    return (
      <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          <span className="truncate">Run: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</span>
        </div>
        {linkedTask && (
          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer" 
               onClick={(e) => { e.stopPropagation(); navigate(`/projects/${projectId}/tasks/${linkedTask.entityId}`); }}>
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            TSK-{linkedTask.entityId}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={nodeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNavigate}
      className={`relative transition-all duration-200 cursor-pointer shrink-0 text-left
        ${showEvidence ? 'z-50' : 'z-10'}
        ${isRequirement ? 'w-[280px]' : 'w-[220px]'}
        bg-white border-[0.5px] ${isActive ? `border-slate-400 shadow-md -translate-y-0.5` : `border-slate-300 shadow-sm`}
        hover:border-slate-400 rounded-xl rounded-l-none border-l-[3px] ${themeColor.borderLeft}
        ${isFaded ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
        ${isPathActive ? 'shadow-md' : ''}
        p-3.5
      `}
      data-no-drag="true"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className={`flex items-center gap-1.5 ${themeColor.text} font-mono text-[11px] font-bold uppercase`}>
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
          <span>{item.code || item.reqCode || level.replace('s', '')}</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${getStatusColor(item.status)}`}>
          {item.status || 'DRAFT'}
        </span>
      </div>
      
      <h4 className={`font-medium text-slate-800 ${isRequirement ? 'text-[15px]' : 'text-[13px] line-clamp-2'} leading-snug`} title={item.title || item.name}>
        {item.title || item.name || 'Untitled'}
      </h4>

      {level === 'Requirement' && renderRequirementMetadata()}
      {level === 'Use Cases' && renderUseCaseMetadata()}
      {level === 'Tasks' && renderTaskMetadata()}
      {level === 'Tests' && renderTestMetadata()}

      {/* Image Preview Modal via Portal */}
      {previewImage && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center transition-all cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
          >
            <span className="material-symbols-outlined text-2xl pointer-events-none">close</span>
          </button>
          
          <img 
            src={previewImage} 
            alt="Evidence Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>,
        document.body
      )}
    </div>
  );
};

export default TraceabilityNodeCard;
