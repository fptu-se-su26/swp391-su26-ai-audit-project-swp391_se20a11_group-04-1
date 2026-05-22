import React from 'react';
import { Link, useParams } from 'react-router-dom';
import useProjectStore from '../../../store/useProjectStore';

const RequirementDetailHeader = ({ requirement, onEdit }) => {
  const { projectId } = useParams();
  if (!requirement) return null;

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between mb-gutter gap-stack_md pb-4 border-b border-outline-variant/50">
      <div className="flex-1">
        {/* Breadcrumb & Badges */}
        <div className="flex items-center gap-3 mb-3">
          <Link to={`/projects/${projectId}/requirements`} className="flex items-center gap-1 text-secondary hover:text-primary transition-colors font-body-md text-body-md">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Requirements
          </Link>
          <div className="w-px h-4 bg-outline-variant"></div>
          <span className="font-label-md text-label-md bg-[#e6f0ff] text-[#1e40af] px-2 py-1 rounded font-bold">
            {requirement.reqCode || `REQ-${String(requirement.id).padStart(2, '0')}`}
          </span>
          {requirement.status && (
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
              requirement.status === 'DRAFT'        ? 'bg-slate-50 text-slate-600 border-slate-200' :
              requirement.status === 'IN_PROGRESS'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
              requirement.status === 'IN_REVIEW'    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              requirement.status === 'DONE'         ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              requirement.status === 'DEPRECATED'   ? 'bg-rose-50 text-rose-700 border-rose-200' :
              'bg-surface-container text-secondary border-outline-variant'
            }`}>
              {requirement.status.replace('_', ' ')}
            </span>
          )}
          {requirement.priority && (
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
              requirement.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' :
              requirement.priority === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              requirement.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              requirement.priority === 'LOW' ? 'bg-slate-50 text-slate-700 border-slate-200' :
              'bg-surface-container text-secondary border-outline-variant'
            }`}>
              {requirement.priority} Priority
            </span>
          )}
        </div>
        
        <h1 className="font-display-lg text-display-lg text-on-background font-bold">{requirement.title}</h1>
        <p className="font-body-md text-body-md text-secondary mt-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">person</span>
          Owner: {(() => {
            const activeProject = useProjectStore((state) => state.activeProject);
            const projectMembers = activeProject?.members || [];
            const member = projectMembers.find(m => m.id === requirement.ownerId);
            return member ? (
              <span className="flex items-center gap-1.5">
                <span 
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[9px] shadow-sm"
                  style={{ backgroundColor: member.bg || '#2563eb' }}
                >
                  {member.initials}
                </span>
                <span className="font-medium text-on-surface">{member.name}</span>
              </span>
            ) : <span className="italic">Chưa phân công</span>;
          })()}
        </p>
      </div>
      
      <div className="flex gap-3 items-center mt-2 md:mt-8">
        <button className="px-4 py-2 bg-primary text-on-primary rounded font-body-md text-body-md font-medium hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center">
          <span className="material-symbols-outlined text-[18px] mr-1">smart_toy</span> Generate Tasks
        </button>
      </div>
    </div>
  );
};

export default RequirementDetailHeader;
