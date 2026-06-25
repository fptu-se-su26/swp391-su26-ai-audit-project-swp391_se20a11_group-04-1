import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const TaskTabContent = ({ tasks, requirement }) => {
  const navigate = useNavigate();
  const { projectId } = useParams();

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[24px]">task</span>
        </div>
        <p className="text-slate-600 text-sm mb-4">No tasks created for this requirement yet</p>
      </div>
    );
  }

  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'LOW': return <span className="text-[11px] font-bold tracking-wide uppercase text-emerald-600">LOW</span>;
      case 'MEDIUM': return <span className="text-[11px] font-bold tracking-wide uppercase text-amber-600">MEDIUM</span>;
      case 'HIGH': return <span className="text-[11px] font-bold tracking-wide uppercase text-orange-600">HIGH</span>;
      case 'CRITICAL': return <span className="text-[11px] font-bold tracking-wide uppercase text-red-600">CRITICAL</span>;
      default: return <span className="text-[11px] font-bold tracking-wide uppercase text-slate-600">{priority || 'MEDIUM'}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'TODO': return <span className="text-[11px] font-bold tracking-wide uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">TODO</span>;
      case 'IN_PROGRESS': return <span className="text-[11px] font-bold tracking-wide uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/50">IN_PROGRESS</span>;
      case 'IN_REVIEW': return <span className="text-[11px] font-bold tracking-wide uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/50">IN_REVIEW</span>;
      case 'DONE': return <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">DONE ✅</span>;
      case 'BLOCKED': return <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50">BLOCKED ⛔</span>;
      default: return <span className="text-[11px] font-bold tracking-wide uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/50">{status}</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full">
      {/* List Header */}
      <div className="grid grid-cols-[100px_3fr_2fr_1.5fr_1.5fr] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/30 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div>ID</div>
        <div>Task Title</div>
        <div>Assignee</div>
        <div>Priority</div>
        <div className="text-right">Status</div>
      </div>

      {/* List Body */}
      <div className="flex flex-col">
        {tasks.map((task, index) => {
          const code = task.code || `TSK-${String(task.id).padStart(3, '0')}`;
          const isOverdue = task.isOverdue || (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE');
          const isBlocked = task.status === 'BLOCKED';
          
          let rowClass = "grid grid-cols-[100px_3fr_2fr_1.5fr_1.5fr] gap-4 px-6 py-3 items-center hover:bg-[#1E707D]/10/40 transition-colors bg-white relative cursor-pointer";
          if (index !== tasks.length - 1) rowClass += " border-b border-slate-100";
          if (isOverdue) rowClass += " border-l-2 border-l-red-400";

          return (
            <div key={task.id} className={rowClass} onClick={() => navigate(`/projects/${projectId}/tasks/${task.id}`)}>
              {/* Overdue Warning Icon */}
              {isOverdue && (
                <div className="absolute left-1 top-1/2 -translate-y-1/2 text-red-500" title="Overdue">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                </div>
              )}

              <div className="text-sm font-medium text-[#1E707D]">{code}</div>
              
              <div className="flex items-center gap-2 pr-4 overflow-hidden">
                {isBlocked && <span className="material-symbols-outlined text-[14px] text-rose-500 shrink-0">block</span>}
                <div className="text-sm font-medium text-slate-800 truncate" title={task.title}>{task.title}</div>
              </div>
              
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-6 h-6 shrink-0 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                  {getInitials(task.primaryAssignee?.name)}
                </div>
                <span className="text-sm text-slate-600 truncate" title={task.primaryAssignee?.name || 'Unassigned'}>
                  {task.primaryAssignee?.name || 'Unassigned'}
                </span>
              </div>
              
              <div className="flex items-center">
                {getPriorityBadge(task.priority)}
              </div>
              
              <div className="text-right flex items-center justify-end">
                {getStatusBadge(task.status)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskTabContent;
