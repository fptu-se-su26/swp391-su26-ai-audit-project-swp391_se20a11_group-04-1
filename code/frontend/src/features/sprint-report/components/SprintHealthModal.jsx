import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosConfig';

import AiEvaluationPanel from './AiEvaluationPanel';

const riskStyles = {
  BREACH: 'bg-rose-50 text-rose-700 border-rose-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  AT_RISK: 'bg-amber-50 text-amber-700 border-amber-200',
  SAFE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function SprintHealthModal({ isOpen, onClose, tasks, loading, onOpenTask, activeProject, activeSprintId }) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [isPinging, setIsPinging] = useState(false);
  const [memberComments, setMemberComments] = useState({});
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleGenerateAiComment = async () => {
    if (!selectedMember || !activeSprintId) return;
    setIsGeneratingAi(true);
    const toastId = toast.loading('Generating AI review...', {
      style: { background: '#1E707D', color: '#fff', borderRadius: '8px' }
    });
    try {
      const response = await axiosInstance.get(
        `/v1/projects/${activeProject.id}/sla/sprints/${activeSprintId}/members/${encodeURIComponent(selectedMember)}/ai-evaluation`
      );
      if (response.data?.data) {
        setMemberComments(prev => ({
          ...prev,
          [selectedMember]: response.data.data
        }));
        toast.success('AI review is ready.', { id: toastId, style: { background: '#1E707D', color: '#fff' } });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate AI review.', { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const uniqueMembers = useMemo(() => {
    if (!tasks) return [];
    const members = new Map();
    tasks.forEach(t => {
      if (t.assigneeName && t.assigneeName !== 'Unassigned') {
        members.set(t.assigneeName, (members.get(t.assigneeName) || 0) + 1);
      }
    });
    return Array.from(members.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return selectedMember 
      ? tasks?.filter(t => t.assigneeName === selectedMember) || []
      : tasks || [];
  }, [tasks, selectedMember]);

  const handlePing = async (task) => {
    if (isPinging) return;
    setIsPinging(true);
    const toastId = toast.loading('Sending reminder...', {
      style: { background: '#1E707D', color: '#fff', borderRadius: '8px' }
    });
    try {
      await axiosInstance.post(`/v1/projects/${activeProject.id}/tasks/${task.taskId}/ping`);
      toast.success(`Reminder sent to ${task.assigneeName}.`, {
        id: toastId,
        style: { background: '#1E707D', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reminder.', { id: toastId });
    } finally {
      setIsPinging(false);
    }
  };

  const handlePingAll = async (member) => {
    if (isPinging) return;
    setIsPinging(true);
    
    if (member === null) {
      const toastId = toast.loading('Sending risk reminders...', {
        style: { background: '#1E707D', color: '#fff', borderRadius: '8px' }
      });
      try {
        if (activeSprintId) {
          await Promise.all(
            uniqueMembers.map(m => 
              axiosInstance.post(`/v1/projects/${activeProject.id}/sla/sprints/${activeSprintId}/ping-risk-member?assigneeName=${encodeURIComponent(m.name)}`)
            )
          );
        }
        toast.success(`Sent ${uniqueMembers.length} risk reminders.`, {
          id: toastId,
          style: { background: '#1E707D', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to send risk reminders.', { id: toastId });
      } finally {
        setIsPinging(false);
      }
      return;
    }

    const memberTasksCount = uniqueMembers.find(m => m.name === member)?.count || 0;
    const toastId = toast.loading('Sending risk reminder...', {
      style: { background: '#1E707D', color: '#fff', borderRadius: '8px' }
    });
    try {
      if (activeSprintId) {
        const comment = memberComments[member] || '';
        await axiosInstance.post(
          `/v1/projects/${activeProject.id}/sla/sprints/${activeSprintId}/ping-risk-member`,
          null,
          { params: { assigneeName: member, aiComment: comment } }
        );
      }
      toast.success(`Sent ${memberTasksCount} risk reminder${memberTasksCount > 1 ? 's' : ''} to ${member}.`, {
        id: toastId,
        style: { background: '#1E707D', color: '#fff', borderRadius: '8px', fontWeight: 'bold' }
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to send risk reminder.', { id: toastId });
    } finally {
      setIsPinging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="flex h-[86vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#D9E7E4] bg-white text-slate-900 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D9E7E4] bg-[#F0F9FA] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-[18px] font-black uppercase tracking-wide text-[#154F59]">
              <span className="material-symbols-outlined text-[21px] text-[#1E707D]">health_and_safety</span>
              Sprint Health
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">Review risky SLA tasks and send focused reminders.</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9E7E4] bg-white text-slate-500 transition-colors hover:text-[#1E707D]">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 p-12 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D9E7E4] border-t-[#1E707D]"></div>
          </div>
        ) : (!tasks || tasks.length === 0) ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-emerald-500">check_circle</span>
            <h3 className="text-xl font-black text-slate-900">All tasks are on track</h3>
            <p className="mt-2 text-sm font-medium text-slate-500">No SLA penalties or high-risk tasks found in this sprint.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#D9E7E4] bg-white px-5 py-3">
              <span className="mr-1 text-[11px] font-black uppercase tracking-wide text-slate-500">Filter</span>
              <button
                onClick={() => setSelectedMember(null)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedMember === null ? 'border border-[#1E707D] bg-[#1E707D] text-white' : 'border border-[#D9E7E4] bg-[#F8FBFC] text-slate-600 hover:text-[#1E707D]'
                }`}
              >
                All Members
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selectedMember === null ? 'bg-white/20' : 'bg-[#D7EEF1] text-[#1E707D]'}`}>
                  {tasks.length}
                </span>
              </button>
              
              {uniqueMembers.map(m => (
                <button
                  key={m.name}
                  onClick={() => setSelectedMember(m.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedMember === m.name ? 'border border-[#1E707D] bg-[#1E707D] text-white' : 'border border-[#D9E7E4] bg-[#F8FBFC] text-slate-600 hover:text-[#1E707D]'
                  }`}
                >
                  <div className={`w-4 h-4 flex items-center justify-center rounded-full text-[8px] ${
                    selectedMember === m.name ? 'bg-white/20' : 'bg-[#D7EEF1] text-[#1E707D]'
                  }`}>
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="max-w-[130px] truncate">{m.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selectedMember === m.name ? 'bg-white/20' : 'bg-rose-50 text-rose-600'}`}>
                    {m.count}
                  </span>
                </button>
              ))}

              {filteredTasks.length > 0 && (
                <button
                  onClick={() => handlePingAll(selectedMember)}
                  disabled={isPinging}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                  {selectedMember ? `Ping ${filteredTasks.length}` : `Ping ${uniqueMembers.length} members`}
                </button>
              )}
            </div>

            {/* AI Evaluation Panel */}
            {selectedMember && (
              <div className="border-b border-[#D9E7E4] bg-[#F8FBFC] px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex min-w-0 items-center gap-2 truncate text-sm font-black text-[#154F59]">
                    <span className="material-symbols-outlined text-[18px] text-[#1E707D]">temp_preferences_custom</span>
                    AI Evaluation for {selectedMember}
                  </h3>
                  <button
                    onClick={handleGenerateAiComment}
                    disabled={isGeneratingAi}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[#B9D8D4] bg-white px-3 py-1.5 text-xs font-black text-[#1E707D] transition-colors hover:bg-[#F0F9FA] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[16px]">{isGeneratingAi ? 'hourglass_empty' : 'auto_awesome'}</span>
                    {isGeneratingAi ? 'Generating...' : 'Generate AI'}
                  </button>
                </div>
                {memberComments[selectedMember] !== undefined && (
                  <AiEvaluationPanel
                    text={memberComments[selectedMember]}
                    onChange={(val) => setMemberComments(prev => ({ ...prev, [selectedMember]: val }))}
                    editable={true}
                  />
                )}
              </div>
            )}

            {/* Table Area */}
            <div className="flex-1 overflow-auto bg-slate-50 p-5">
              <div className="min-w-[820px]">
                {/* Table Header */}
                <div className="grid grid-cols-[110px_minmax(300px,_1fr)_250px_140px] gap-4 border-b border-[#D9E7E4] pb-2 text-[11px] font-black uppercase tracking-wide text-slate-500">
                  <div>Risk</div>
                  <div>Task</div>
                  <div>Metrics</div>
                  <div className="text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="mt-2 space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="py-12 text-center text-sm font-medium text-slate-500">No tasks found for this view.</div>
                  ) : (
                    filteredTasks.map(task => {
                      const riskClass = riskStyles[task.currentRiskLevel] || riskStyles.SAFE;

                      return (
                      <div key={task.taskId} className="grid grid-cols-[110px_minmax(300px,_1fr)_250px_140px] items-center gap-4 rounded-lg border border-[#D9E7E4] bg-white p-3 shadow-sm transition-colors hover:bg-[#F8FBFC]">
                        
                        {/* Status Column */}
                        <div>
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-black ${riskClass}`}>
                            {task.currentRiskLevel || 'SAFE'}
                          </span>
                        </div>

                        {/* Task Details Column */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase text-slate-400">ID-{task.taskId}</span>
                            <span className="max-w-[120px] truncate rounded bg-[#F0F9FA] px-1.5 py-0.5 text-[10px] font-black text-[#1E707D]">{task.assigneeName}</span>
                          </div>
                          <h4 className="truncate text-sm font-bold text-slate-900" title={task.taskTitle}>{task.taskTitle}</h4>
                        </div>

                        {/* Metrics Column */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.overdueDays > 0 && (
                            <span className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">
                              {task.overdueDays}d overdue
                            </span>
                          )}
                          {task.daysUntilDeadline >= 0 && task.overdueDays === 0 && (
                            <span className="rounded border border-[#D9E7E4] bg-[#F8FBFC] px-2 py-0.5 text-[10px] font-black text-slate-500">
                              {task.daysUntilDeadline}d left
                            </span>
                          )}
                          {task.penaltyApplied && (
                            <span className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-700">
                              Penalty Applied
                            </span>
                          )}
                          {task.predictedRiskLevel && task.predictedRiskLevel !== task.currentRiskLevel && (
                            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                              Pred: {task.predictedRiskLevel}
                            </span>
                          )}
                        </div>

                        {/* Actions Column */}
                        <div className="flex items-center justify-end gap-2">
                          {task.assigneeName !== 'Unassigned' && (
                            <button
                              onClick={() => handlePing(task)}
                              title="Ping Assignee"
                              disabled={isPinging}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D9E7E4] bg-white text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              onOpenTask(activeProject?.id, task.taskId);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-[#1E707D] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white transition-colors hover:bg-[#155764]"
                          >
                            View
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </div>

                      </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
