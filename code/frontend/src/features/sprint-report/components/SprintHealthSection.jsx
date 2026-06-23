import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosConfig';

export default function SprintHealthSection({ tasks, loading, onOpenTask, activeProject, activeSprintId }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const riskLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  const uniqueMembers = useMemo(() => {
    if (!tasks) return [];
    const members = new Map();
    tasks.forEach(t => {
      if (t.assigneeName && t.assigneeName !== 'Unassigned') {
        members.set(t.assigneeName, (members.get(t.assigneeName) || 0) + 1);
      }
    });
    // Sort by count descending
    return Array.from(members.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return selectedMember 
      ? tasks?.filter(t => t.assigneeName === selectedMember) || []
      : tasks || [];
  }, [tasks, selectedMember]);

  const groupedTasks = useMemo(() => ({
    CRITICAL: filteredTasks.filter(t => t.currentRiskLevel === 'CRITICAL'),
    HIGH: filteredTasks.filter(t => t.currentRiskLevel === 'HIGH'),
    MEDIUM: filteredTasks.filter(t => t.currentRiskLevel === 'MEDIUM'),
    LOW: filteredTasks.filter(t => t.currentRiskLevel === 'LOW'),
  }), [filteredTasks]);

  const [activeTab, setActiveTab] = useState(() => {
    for (const risk of riskLevels) {
      if (groupedTasks[risk]?.length > 0) return risk;
    }
    return 'CRITICAL';
  });

  useEffect(() => {
    if (groupedTasks[activeTab]?.length === 0) {
      for (const risk of riskLevels) {
        if (groupedTasks[risk]?.length > 0) {
          setActiveTab(risk);
          break;
        }
      }
    }
  }, [selectedMember, groupedTasks, activeTab]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] rounded-xl border border-slate-200 bg-white shadow-sm animate-pulse">
        <div className="w-64 border-r border-slate-200 bg-slate-50 p-4">
           <div className="h-6 w-1/2 rounded bg-slate-200 mb-6"></div>
           <div className="space-y-3">
             <div className="h-10 rounded bg-slate-200"></div>
             <div className="h-10 rounded bg-slate-200"></div>
           </div>
        </div>
        <div className="flex-1 p-6">
           <div className="h-8 w-1/3 rounded bg-slate-100 mb-8"></div>
           <div className="grid grid-cols-2 gap-4">
             <div className="h-32 rounded bg-slate-100"></div>
             <div className="h-32 rounded bg-slate-100"></div>
           </div>
        </div>
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-emerald-700 shadow-sm">
        <span className="material-symbols-outlined mb-2 text-4xl">check_circle</span>
        <h3 className="text-lg font-bold">All tasks are on track</h3>
        <p className="text-sm font-medium">No SLA penalties or high-risk tasks found in this sprint.</p>
      </div>
    );
  }

  const handlePing = async (task) => {
    if (isPinging) return;
    setIsPinging(true);
    const toastId = toast.loading('Đang gửi thông báo...', {
      style: { background: '#0f172a', color: '#fff', borderRadius: '8px' }
    });
    try {
      await axiosInstance.post(`/v1/projects/${activeProject.id}/tasks/${task.taskId}/ping`);
      toast.success(`Đã gửi thông báo nhắc nhở rủi ro cho ${task.assigneeName}!`, {
        id: toastId,
        style: { background: '#0f172a', color: '#fff', borderRadius: '8px', fontWeight: 'bold' },
        icon: '🔔'
      });
    } catch (err) {
      console.error(err);
      toast.error('Gửi thông báo thất bại.', { id: toastId });
    } finally {
      setIsPinging(false);
    }
  };

  const handlePingAll = async (member) => {
    if (isPinging) return;
    setIsPinging(true);
    const memberTasksCount = uniqueMembers.find(m => m.name === member)?.count || 0;
    const toastId = toast.loading('Đang gom lỗi và gửi email...', {
      style: { background: '#0f172a', color: '#fff', borderRadius: '8px' }
    });
    try {
      if (activeSprintId) {
        await axiosInstance.post(`/v1/projects/${activeProject.id}/sla/sprints/${activeSprintId}/ping-risk-member?assigneeName=${encodeURIComponent(member)}`);
      }
      toast.success(`Đã gộp ${memberTasksCount} lỗi và gửi thông báo khẩn cho ${member}!`, {
        id: toastId,
        style: { background: '#0f172a', color: '#fff', borderRadius: '8px', fontWeight: 'bold' },
        icon: '🚨'
      });
    } catch (err) {
      console.error(err);
      toast.error('Gửi thông báo khẩn thất bại.', { id: toastId });
    } finally {
      setIsPinging(false);
    }
  };

  const getRiskStyles = (risk) => {
    switch (risk) {
      case 'CRITICAL': return { border: 'border-l-rose-500', badge: 'bg-rose-100 text-rose-800', header: 'text-rose-600', tabActive: 'border-rose-500 text-rose-700 bg-rose-50', tabInactive: 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50' };
      case 'HIGH': return { border: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-800', header: 'text-orange-600', tabActive: 'border-orange-500 text-orange-700 bg-orange-50', tabInactive: 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50' };
      case 'MEDIUM': return { border: 'border-yellow-500', badge: 'bg-yellow-100 text-yellow-800', header: 'text-yellow-600', tabActive: 'border-yellow-500 text-yellow-700 bg-yellow-50', tabInactive: 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50' };
      case 'LOW': return { border: 'border-l-teal-500', badge: 'bg-teal-100 text-teal-800', header: 'text-teal-600', tabActive: 'border-teal-500 text-teal-700 bg-teal-50', tabInactive: 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50' };
      default: return { border: 'border-l-slate-300', badge: 'bg-slate-100 text-slate-800', header: 'text-slate-600', tabActive: '', tabInactive: '' };
    }
  };

  const renderTaskCard = (task, styles) => (
    <div key={task.taskId} className={`flex flex-col rounded-lg border border-slate-200 border-l-[4px] bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${styles.border}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID-{task.taskId}</span>
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${styles.badge}`}>
              {task.currentRiskLevel}
            </span>
          </div>
          <h4 className="truncate text-sm font-bold text-slate-900" title={task.taskTitle}>{task.taskTitle}</h4>
        </div>
        
        {!selectedMember && task.assigneeName !== 'Unassigned' && (
          <div className="flex shrink-0 items-center gap-2">
            <button 
              onClick={() => handlePing(task)}
              title={`Ping ${task.assigneeName}`}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {task.overdueDays > 0 && (
          <span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
            {task.overdueDays}d overdue
          </span>
        )}
        {task.daysUntilDeadline >= 0 && task.overdueDays === 0 && (
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            {task.daysUntilDeadline}d left
          </span>
        )}
        {task.penaltyApplied && (
          <span className="rounded border border-rose-200 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
            Penalty Applied
          </span>
        )}
        {task.predictedRiskLevel && task.predictedRiskLevel !== task.currentRiskLevel && (
          <span className="flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-700" title={`Risk may increase to ${task.predictedRiskLevel}`}>
            <span className="material-symbols-outlined text-[12px]">trending_up</span>
            {task.predictedRiskLevel} (Predicted)
          </span>
        )}
        
        <button
          onClick={() => onOpenTask(activeProject?.id, task.taskId)}
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          View Task <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );

  const isAllEmpty = Object.values(groupedTasks).every(g => g.length === 0);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:flex-row min-h-[500px]">
      
      {/* LEFT SIDEBAR: MASTER */}
      <div className="flex w-full flex-col border-b border-slate-200 bg-slate-50/50 md:w-64 md:border-b-0 md:border-r md:shrink-0">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 bg-white">
          <h3 className="font-bold tracking-tight text-slate-900">Sprint Health</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            onClick={() => setSelectedMember(null)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
              selectedMember === null
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] opacity-70">dashboard</span>
              All Members
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${selectedMember === null ? 'bg-white/20' : 'bg-slate-200 text-slate-600'}`}>
              {tasks.length}
            </span>
          </button>
          
          {uniqueMembers.length > 0 && (
            <div className="pt-4 pb-2">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Members at Risk</p>
            </div>
          )}
          
          {uniqueMembers.map(m => (
            <button
              key={m.name}
              onClick={() => setSelectedMember(m.name)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                selectedMember === m.name
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <span className="flex items-center gap-2 truncate pr-2">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  selectedMember === m.name ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {m.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="truncate">{m.name}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                selectedMember === m.name ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
              }`}>
                {m.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SIDEBAR: DETAIL */}
      <div className="flex flex-1 flex-col min-w-0 bg-slate-50/30">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {selectedMember ? `Risk Tasks: ${selectedMember}` : 'All Risk Tasks'}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {selectedMember 
                ? `Reviewing ${filteredTasks.length} tasks requiring attention for this member.` 
                : 'Reviewing all SLA risk tasks in this sprint.'}
            </p>
          </div>
          
          {selectedMember && filteredTasks.length > 0 && (
            <button
              onClick={() => handlePingAll(selectedMember)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow"
            >
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              Ping {selectedMember}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {isAllEmpty ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined mb-3 text-5xl text-slate-200">task_alt</span>
              <h3 className="text-base font-bold text-slate-700">No issues found</h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedMember ? `${selectedMember} has no tasks at risk.` : 'All tasks in the sprint are healthy.'}
              </p>
            </div>
          ) : (
            <>
              {/* Tabs Navigation */}
              <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                  {riskLevels.map((risk) => {
                    const count = groupedTasks[risk].length;
                    if (count === 0 && activeTab !== risk) return null; // Hide empty tabs unless selected
                    
                    const styles = getRiskStyles(risk);
                    const isActive = activeTab === risk;
                    
                    return (
                      <button
                        key={risk}
                        onClick={() => setActiveTab(risk)}
                        className={`whitespace-nowrap border-b-2 py-3 px-1 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                          isActive ? styles.tabActive : styles.tabInactive
                        }`}
                      >
                        {risk}
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                          isActive ? 'bg-white/50 border border-current/10' : 'bg-slate-200/50 text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {groupedTasks[activeTab]?.length > 0 ? (
                  groupedTasks[activeTab].map(task => renderTaskCard(task, getRiskStyles(activeTab)))
                ) : (
                  <div className="col-span-full py-12 text-center text-sm font-medium italic text-slate-400">
                    No {activeTab} tasks found in this view.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
    </div>
  );
}
