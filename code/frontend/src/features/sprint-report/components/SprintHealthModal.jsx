import React, { useState, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '@api/axiosConfig';

const SECTION_META = {
  'Performance Summary': { icon: 'bar_chart', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  'Strengths':           { icon: 'thumb_up',  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
  'Areas for Improvement': { icon: 'edit_note', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  'Potential Risks':     { icon: 'warning',   color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200' },
};

function AiEvaluationPanel({ text, onChange }) {
  const [isEditing, setIsEditing] = useState(false);

  const sections = useMemo(() => {
    const result = [];
    const lines = text.split('\n');
    let current = null;
    for (const line of lines) {
      if (line.startsWith('## ')) {
        if (current) result.push(current);
        current = { title: line.replace('## ', '').trim(), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    }
    if (current) result.push(current);
    return result;
  }, [text]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-48 p-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-all shadow-inner font-mono"
        />
        <button onClick={() => setIsEditing(false)} className="text-xs font-bold text-primary hover:underline">
          ← Back to preview
        </button>
      </div>
    );
  }

  if (sections.length === 0) {
    return <p className="text-sm text-on-surface-variant italic">{text}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {sections.map((section) => {
          const meta = SECTION_META[section.title] || { icon: 'info', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
          const bodyLines = section.lines.filter(l => l.trim());
          return (
            <div key={section.title} className={`rounded-lg border p-3 ${meta.bg}`}>
              <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 ${meta.color}`}>
                <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                {section.title}
              </p>
              <ul className="space-y-1">
                {bodyLines.map((line, i) => (
                  <li key={i} className="text-xs text-on-surface leading-relaxed">
                    {line.startsWith('- ') ? (
                      <span className="flex gap-1.5"><span className={`mt-1 shrink-0 ${meta.color}`}>•</span>{line.slice(2)}</span>
                    ) : line}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-on-surface-variant hover:text-primary hover:underline">
        ✏ Edit before pinging
      </button>
    </div>
  );
}

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
    const toastId = toast.loading('AI đang phân tích và viết nhận xét...', {
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
        toast.success('AI đã viết xong nhận xét!', { id: toastId, style: { background: '#1E707D', color: '#fff' } });
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi gọi AI.', { id: toastId });
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
    const toastId = toast.loading('Đang gửi thông báo...', {
      style: { background: '#1E707D', color: '#fff', borderRadius: '8px' }
    });
    try {
      await axiosInstance.post(`/v1/projects/${activeProject.id}/tasks/${task.taskId}/ping`);
      toast.success(`Đã gửi thông báo nhắc nhở rủi ro cho ${task.assigneeName}!`, {
        id: toastId,
        style: { background: '#1E707D', color: '#fff', borderRadius: '8px', fontWeight: 'bold' },
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
    
    if (member === null) {
      const toastId = toast.loading('Đang gom lỗi và gửi email cho tất cả...', {
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
        toast.success(`Đã gửi thông báo khẩn cho tất cả ${uniqueMembers.length} thành viên!`, {
          id: toastId,
          style: { background: '#1E707D', color: '#fff', borderRadius: '8px', fontWeight: 'bold' },
          icon: '🚨'
        });
      } catch (err) {
        console.error(err);
        toast.error('Gửi thông báo khẩn thất bại.', { id: toastId });
      } finally {
        setIsPinging(false);
      }
      return;
    }

    const memberTasksCount = uniqueMembers.find(m => m.name === member)?.count || 0;
    const toastId = toast.loading('Đang gom lỗi và gửi email...', {
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
      toast.success(`Đã gộp ${memberTasksCount} lỗi và gửi thông báo khẩn cho ${member}!`, {
        id: toastId,
        style: { background: '#1E707D', color: '#fff', borderRadius: '8px', fontWeight: 'bold' },
        icon: '🚨'
      });
    } catch (err) {
      console.error(err);
      toast.error('Gửi thông báo khẩn thất bại.', { id: toastId });
    } finally {
      setIsPinging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[85vh] bg-surface-container-lowest border border-outline-variant shadow-2xl rounded-2xl flex flex-col overflow-hidden text-on-surface">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant bg-surface">
          <div>
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-danger">health_and_safety</span>
              Sprint Health Tasks
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">Review SLA penalty risks and critical issues.</p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-highest rounded-lg transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {loading ? (
          <div className="flex-1 p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-outline-variant border-t-primary"></div>
          </div>
        ) : (!tasks || tasks.length === 0) ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined mb-4 text-6xl text-success">check_circle</span>
            <h3 className="text-xl font-bold text-success">All tasks are on track</h3>
            <p className="text-sm font-medium text-on-surface-variant mt-2">No SLA penalties or high-risk tasks found in this sprint.</p>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filter Row */}
            <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-2">Filter:</span>
              <button
                onClick={() => setSelectedMember(null)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedMember === null ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                }`}
              >
                All Members
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedMember === null ? 'bg-on-primary/20' : 'bg-surface-elevated'}`}>
                  {tasks.length}
                </span>
              </button>
              
              {uniqueMembers.map(m => (
                <button
                  key={m.name}
                  onClick={() => setSelectedMember(m.name)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    selectedMember === m.name ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                  }`}
                >
                  <div className={`w-4 h-4 flex items-center justify-center rounded-full text-[8px] ${
                    selectedMember === m.name ? 'bg-on-primary/20' : 'bg-surface-elevated text-on-surface-variant'
                  }`}>
                    {m.name.substring(0, 2).toUpperCase()}
                  </div>
                  {m.name}
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${selectedMember === m.name ? 'bg-on-primary/20' : 'bg-danger-bg text-danger'}`}>
                    {m.count}
                  </span>
                </button>
              ))}

              {filteredTasks.length > 0 && (
                <button
                  onClick={() => handlePingAll(selectedMember)}
                  className="ml-auto flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-xs font-bold text-danger hover:bg-danger/10 transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                  Ping All ({selectedMember ? filteredTasks.length : uniqueMembers.length})
                </button>
              )}
            </div>

            {/* AI Evaluation Panel */}
            {selectedMember && (
              <div className="bg-surface-bright px-5 py-4 border-b border-outline-variant">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[18px]">temp_preferences_custom</span>
                    AI Evaluation for {selectedMember}
                  </h3>
                  <button
                    onClick={handleGenerateAiComment}
                    disabled={isGeneratingAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[16px]">{isGeneratingAi ? 'hourglass_empty' : 'auto_awesome'}</span>
                    {isGeneratingAi ? 'Generating...' : 'Generate AI Review'}
                  </button>
                </div>
                {memberComments[selectedMember] !== undefined && (
                  <AiEvaluationPanel
                    text={memberComments[selectedMember]}
                    onChange={(val) => setMemberComments(prev => ({ ...prev, [selectedMember]: val }))}
                  />
                )}
              </div>
            )}

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-5 bg-background">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-[100px_minmax(300px,_1fr)_250px_150px] gap-4 pb-3 border-b border-outline-variant text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <div>Status</div>
                  <div>Task Details</div>
                  <div>Metrics & Tags</div>
                  <div className="text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="mt-2 space-y-2">
                  {filteredTasks.length === 0 ? (
                    <div className="py-12 text-center text-on-surface-variant italic">No tasks found for this view.</div>
                  ) : (
                    filteredTasks.map(task => (
                      <div key={task.taskId} className="grid grid-cols-[100px_minmax(300px,_1fr)_250px_150px] items-center gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 hover:bg-surface-container-low transition-colors shadow-sm">
                        
                        {/* Status Column */}
                        <div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            task.currentRiskLevel === 'CRITICAL' ? 'bg-danger-bg text-danger border-danger-border' :
                            task.currentRiskLevel === 'HIGH' ? 'bg-warning-bg text-warning border-warning-border' :
                            task.currentRiskLevel === 'MEDIUM' ? 'bg-warning-bg text-warning border-warning-border' :
                            'bg-success-bg text-success border-success-border'
                          }`}>
                            {task.currentRiskLevel}
                          </span>
                        </div>

                        {/* Task Details Column */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">ID-{task.taskId}</span>
                            <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded truncate max-w-[120px]">{task.assigneeName}</span>
                          </div>
                          <h4 className="truncate text-sm font-semibold text-on-surface" title={task.taskTitle}>{task.taskTitle}</h4>
                        </div>

                        {/* Metrics Column */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {task.overdueDays > 0 && (
                            <span className="rounded bg-danger-bg border border-danger-border px-2 py-0.5 text-[10px] font-bold text-danger flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">warning</span> {task.overdueDays}d overdue
                            </span>
                          )}
                          {task.daysUntilDeadline >= 0 && task.overdueDays === 0 && (
                            <span className="rounded bg-surface-container border border-outline-variant px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                              {task.daysUntilDeadline}d left
                            </span>
                          )}
                          {task.penaltyApplied && (
                            <span className="rounded bg-info-bg border border-info-border px-2 py-0.5 text-[10px] font-bold text-info">
                              Penalty Applied
                            </span>
                          )}
                          {task.predictedRiskLevel && task.predictedRiskLevel !== task.currentRiskLevel && (
                            <span className="rounded bg-warning-bg border border-warning-border px-2 py-0.5 text-[10px] font-bold text-warning">
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
                              className="flex h-7 w-7 items-center justify-center rounded bg-surface-container text-on-surface-variant hover:bg-danger hover:text-white transition-colors"
                            >
                              <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              onClose();
                              onOpenTask(activeProject?.id, task.taskId);
                            }}
                            className="flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-[10px] font-bold text-on-primary hover:bg-primary-hover transition-colors uppercase tracking-wider"
                          >
                            View
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </button>
                        </div>

                      </div>
                    ))
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
