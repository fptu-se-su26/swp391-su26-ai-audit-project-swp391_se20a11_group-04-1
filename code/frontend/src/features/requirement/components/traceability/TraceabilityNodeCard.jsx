import React, { useEffect, useRef, useState } from 'react';
import { useTraceability } from './TraceabilityContext';
import { useNavigate, useParams } from 'react-router-dom';

const TraceabilityNodeCard = ({ level, item, isEmpty = false, taskEvidences = [] }) => {
  const { registerNode, activePath, setActivePath } = useTraceability();
  const nodeRef = useRef(null);
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [showEvidence, setShowEvidence] = useState(false);

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

  if (isEmpty) {
    return (
      <div 
        ref={nodeRef}
        className="relative z-10 w-56 flex flex-col items-center justify-center h-20 bg-white/60 backdrop-blur-sm border border-slate-300 border-dashed rounded-xl shadow-sm"
      >
        <span className="text-xs text-slate-400 italic">No {level}</span>
      </div>
    );
  }

  // Level specific styling
  let icon, labelColor, borderColor, hoverBorderColor, statusBg, statusText;
  
  switch (level) {
    case 'Requirement':
      icon = 'assignment'; labelColor = 'text-indigo-600 bg-indigo-50'; borderColor = 'border-indigo-200'; hoverBorderColor = 'hover:border-indigo-400';
      break;
    case 'Use Cases':
      icon = 'emoji_people'; labelColor = 'text-cyan-600 bg-cyan-50'; borderColor = 'border-slate-200'; hoverBorderColor = 'hover:border-cyan-400';
      break;
    case 'Tasks':
      icon = 'task'; labelColor = 'text-amber-600 bg-amber-50'; borderColor = 'border-slate-200'; hoverBorderColor = 'hover:border-amber-400';
      break;
    case 'Tests':
      icon = 'science'; labelColor = 'text-emerald-600 bg-emerald-50'; borderColor = 'border-slate-200'; hoverBorderColor = 'hover:border-emerald-400';
      break;
    case 'Evidence':
      icon = 'inventory_2'; labelColor = 'text-purple-600 bg-purple-50'; borderColor = 'border-slate-200'; hoverBorderColor = 'hover:border-purple-400';
      break;
    default:
      icon = 'article'; labelColor = 'text-slate-600 bg-slate-50'; borderColor = 'border-slate-200'; hoverBorderColor = 'hover:border-slate-400';
  }

  let statusClass = 'bg-slate-50 text-slate-600 border-slate-200';
  const status = item.status?.toUpperCase() || 'UNKNOWN';
  if (status === 'PASS' || status === 'DONE' || status === 'VERIFIED') statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'FAIL') statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
  if (status === 'IN_PROGRESS') statusClass = 'bg-amber-50 text-amber-700 border-amber-200';

  const isRequirement = level === 'Requirement';
  const countCriteria = (text) => {
    if (!text) return 0;
    if (Array.isArray(text)) return text.length;
    return String(text).split('\n').filter(line => line.trim().length > 0).length;
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'LOW': return 'text-emerald-600 font-bold';
      case 'MEDIUM': return 'text-amber-600 font-bold';
      case 'HIGH': return 'text-orange-600 font-bold';
      case 'CRITICAL': return 'text-red-600 font-bold';
      default: return 'text-slate-600 font-bold';
    }
  };

  const renderRequirementMetadata = () => (
    <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-slate-500">
      <div className="flex items-center justify-between">
        <span className="truncate">Owner: {item.ownerId || 'Unassigned'}</span>
        <span className={getPriorityColor(item.priority)}>{item.priority || 'MEDIUM'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Criteria: {countCriteria(item.acceptanceCriteria)}</span>
        <span className="truncate max-w-[80px]">Tags: {item.tags?.join(', ') || 'None'}</span>
      </div>
    </div>
  );

  const renderUseCaseMetadata = () => (
    <div className="mt-2 flex flex-col gap-1 text-[10px] text-slate-500">
      <div>Actor: {item.actors && item.actors.length > 0 ? item.actors.join(', ') : 'N/A'}</div>
    </div>
  );

  const renderTaskMetadata = () => (
    <div className="mt-1.5 flex flex-col gap-1 text-[10px] text-slate-500">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 truncate pr-2">
          <span className="material-symbols-outlined text-[12px] text-slate-400">person</span>
          {item.primaryAssignee?.name || 'Unassigned'}
        </span>
        <span className={getPriorityColor(item.priority)}>{item.priority || 'MEDIUM'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[12px] text-slate-400">calendar_today</span>
          {item.deadline || 'No Due Date'}
        </span>
      </div>

      {/* Internal Evidence Accordion */}
      {taskEvidences && taskEvidences.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setShowEvidence(!showEvidence); }}
            className="flex items-center justify-between w-full hover:bg-slate-50 p-1.5 rounded-md transition-colors group"
          >
            <div className="flex items-center gap-1.5 font-medium text-slate-600 group-hover:text-purple-600 transition-colors">
              <span className="material-symbols-outlined text-[14px]">inventory_2</span>
              <span>{taskEvidences.length} Evidence</span>
            </div>
            <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-purple-600 transition-transform duration-200" style={{ transform: showEvidence ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              expand_more
            </span>
          </button>
          
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out`}
            style={{ 
              maxHeight: showEvidence ? `${taskEvidences.length * 60 + 20}px` : '0px',
              opacity: showEvidence ? 1 : 0,
              marginTop: showEvidence ? '8px' : '0px'
            }}
          >
            <div className="flex flex-col gap-2">
              {taskEvidences.map(ev => (
                <div 
                  key={ev.id} 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${projectId}/evidence/${ev.id}`);
                  }}
                  className="flex items-center justify-between bg-white border border-slate-200 rounded p-2 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="material-symbols-outlined text-[14px] text-purple-500">description</span>
                    <span className="font-medium text-slate-700 truncate" title={ev.title || ev.name}>{ev.title || ev.name || 'Untitled File'}</span>
                  </div>
                  <span className="text-[9px] text-slate-400 shrink-0">{ev.fileSize || '245 KB'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {taskEvidences && taskEvidences.length === 0 && (
         <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-slate-400 italic">
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
            <span>No Evidence</span>
         </div>
      )}
    </div>
  );

  const renderTestMetadata = () => (
    <div className="mt-2 flex flex-col gap-1 text-[10px] text-slate-500">
      <div className="flex items-center justify-between">
        <span>Tester: {item.createdBy?.name || 'Unassigned'}</span>
        <span>{item.testType || 'MANUAL'}</span>
      </div>
      <div className="flex items-center justify-between">
        <span>Last run: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}</span>
      </div>
      {item.status === 'PASS' && (
        <div className="mt-0.5 font-medium text-emerald-600 flex items-center gap-1">
          🟢 Passed
        </div>
      )}
    </div>
  );

  const renderEvidenceMetadata = () => {
    const linkedTask = item.evidenceLinks?.find(l => l.entityType?.toUpperCase() === 'TASK');
    const linkedText = linkedTask ? `TSK-${linkedTask.entityId}` : 'Unlinked';

    return (
      <div className="mt-2 flex flex-col gap-1 text-[10px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>{item.fileSize || 'Unknown Size'}</span>
          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>By: {item.uploadedByName || 'Unknown'}</span>
          <span>For: {linkedText}</span>
        </div>
      </div>
    );
  };

  let leftBorderClass = '';
  if (level === 'Tests') {
    leftBorderClass = status === 'PASS' || status === 'PASSED' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500';
  } else if (level === 'Evidence') {
    leftBorderClass = 'border-l-4 border-l-purple-500';
  } else if (level === 'Tasks') {
    leftBorderClass = 'border-l-2 border-l-amber-400';
  }

  return (
    <div 
      ref={nodeRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleNavigate}
      className={`relative z-10 transition-all duration-200 cursor-pointer shrink-0 text-left
        ${isRequirement ? 'w-[240px] p-3' : 'w-[190px] p-2.5'}
        bg-white border ${isActive ? `ring-2 ring-slate-200 border-transparent shadow-md -translate-y-0.5` : `${borderColor} shadow-sm`}
        ${hoverBorderColor} rounded-xl
        ${isFaded ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
        ${isPathActive ? 'shadow-md' : ''}
        ${leftBorderClass}
      `}
      data-no-drag="true"
    >
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`material-symbols-outlined text-[14px] ${labelColor.split(' ')[0]}`}>{icon}</span>
          <span className={`font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${labelColor} truncate`}>
            {item.code || item.reqCode || level.replace('s', '')}
          </span>
        </div>
        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${statusClass}`}>
          {status}
        </span>
      </div>
      
      <h4 className={`font-semibold text-slate-800 ${isRequirement ? 'text-xs line-clamp-2' : 'text-xs truncate'}`} title={item.title || item.name}>
        {item.title || item.name || 'Untitled'}
      </h4>

      <div className="border-t border-slate-100 mt-2 pt-1">
        {level === 'Requirement' && renderRequirementMetadata()}
        {level === 'Use Cases' && renderUseCaseMetadata()}
        {level === 'Tasks' && renderTaskMetadata()}
        {level === 'Tests' && renderTestMetadata()}
        {level === 'Evidence' && renderEvidenceMetadata()}
      </div>
    </div>
  );
};

export default TraceabilityNodeCard;
