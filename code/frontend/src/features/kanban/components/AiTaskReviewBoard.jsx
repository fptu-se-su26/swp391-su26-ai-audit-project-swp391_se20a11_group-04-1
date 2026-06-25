import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import taskService from '../services/taskService';
import { useProjectStore } from '@/store/useProjectStore';

const AiTaskReviewBoard = ({ isOpen, onClose, generationId, projectId, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  
  const [tasks, setTasks] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [sprints, setSprints] = useState([]);
  const members = useProjectStore(state => state.activeProject?.members || []);
  
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [globalSprintId, setGlobalSprintId] = useState('');
  
  // Inline Edit State
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [expandedDesc, setExpandedDesc] = useState(new Set()); // indices of expanded descriptions

  // Diff Popup State
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [activeDiffRisk, setActiveDiffRisk] = useState(null);
  const [activeDiffTaskIndex, setActiveDiffTaskIndex] = useState(null);

  // Split Popup State
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitSelectedIndex, setSplitSelectedIndex] = useState(null);
  const [isSplitting, setIsSplitting] = useState(false);

  // Merge Popup State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSelectedSet, setMergeSelectedSet] = useState(new Set());

  // Error Popup State
  const [actionError, setActionError] = useState(null); // { title: string, reason: string }
  const [isMerging, setIsMerging] = useState(false);
  
  const abortControllerRef = useRef(null);

  useEffect(() => {
    if (isOpen && generationId) fetchData();
  }, [isOpen, generationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await taskService.getAIGenerationStatus(generationId);
      if (data.stage !== 'TASK') {
        toast.error("Bản nháp này không phải là Task.");
        onClose();
        return;
      }
      let payloadData = data.payload || {};
      if (typeof payloadData === 'string') {
        try { payloadData = JSON.parse(payloadData); } catch(e) {}
      }
      const generatedTasks = payloadData.tasks || [];
      setTasks(generatedTasks);
      setAssessment(payloadData.ai_critical_assessment || null);

      try {
        const sprintData = await taskService.getProjectSprints(projectId);
        setSprints(sprintData);
      } catch (err) {
        console.error("Failed to load sprints", err);
      }
      // Do NOT auto select generated tasks initially
      setSelectedIndices(new Set());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load generated Tasks.");
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleSelectAll = () => {
    if (selectedIndices.size === tasks.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(tasks.map((_, i) => i)));
    }
  };

  const toggleTaskSelection = (index) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const toggleDesc = (index) => {
    const newSet = new Set(expandedDesc);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setExpandedDesc(newSet);
  };

  const handleSaveEdit = () => {
    if (editingTaskIndex === null) return;
    const newTasks = [...tasks];
    newTasks[editingTaskIndex] = { ...newTasks[editingTaskIndex], ...editForm };
    setTasks(newTasks);
    setEditingTaskIndex(null);
    setEditForm({});
  };

  const handleCancelEdit = () => {
    setEditingTaskIndex(null);
    setEditForm({});
  };

  const handleApprove = async () => {
    if (selectedIndices.size === 0) return;
    setApproving(true);
    try {
      const finalTasks = tasks.map((t, idx) => {
        if (selectedIndices.has(idx) && globalSprintId && !t.sprint_id) {
          return { ...t, sprint_id: globalSprintId };
        }
        return t;
      });
      await taskService.approveAITasks(projectId, generationId, {
        selectedIndices: Array.from(selectedIndices),
        modifiedPayload: finalTasks
      });
      toast.success("Duyệt Tasks thành công! Các Task đã được thêm vào Kanban.");
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Lỗi khi duyệt Tasks.");
    } finally {
      setApproving(false);
    }
  };

  const executeSplit = async () => {
    if (splitSelectedIndex === null) return;
    setIsSplitting(true);
    abortControllerRef.current = new AbortController();
    try {
      const taskToSplit = tasks[splitSelectedIndex];
      const result = await taskService.splitAITask(projectId, { task: taskToSplit }, { signal: abortControllerRef.current.signal });
      const subTasks = result.data?.sub_tasks || result.sub_tasks;
      if (subTasks && subTasks.length > 0) {
        const newTasks = [...tasks];
        newTasks.splice(splitSelectedIndex, 1, ...subTasks);
        setTasks(newTasks);
        // Re-select all
        setSelectedIndices(new Set(newTasks.map((_, i) => i)));
        toast.success("Tách Task thành công!");
      } else {
        const reason = result.data?.reason || result.reason || "Task này đã đạt mức tối thiểu hoặc không thể phân tách hợp lý theo logic nghiệp vụ.";
        setActionError({
          title: "Không thể tách Task",
          reason: reason
        });
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        toast('Đã hủy tiến trình tách Task.', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.error || "Lỗi khi Split task.");
      }
    } finally {
      setIsSplitting(false);
      setSplitModalOpen(false);
      setSplitSelectedIndex(null);
      abortControllerRef.current = null;
    }
  };

  const executeMerge = async () => {
    if (mergeSelectedSet.size < 2) return;
    setIsMerging(true);
    abortControllerRef.current = new AbortController();
    try {
      const tasksToMerge = Array.from(mergeSelectedSet).map(idx => tasks[idx]);
      const result = await taskService.mergeAITasks(projectId, { tasks: tasksToMerge }, { signal: abortControllerRef.current.signal });
      const mergedTask = result.data?.merged_task || result.merged_task;
      if (mergedTask) {
        // Remove old tasks
        const newTasks = tasks.filter((_, idx) => !mergeSelectedSet.has(idx));
        // Add merged task at top
        newTasks.unshift(mergedTask);
        setTasks(newTasks);
        setSelectedIndices(new Set(newTasks.map((_, i) => i)));
        toast.success("Gộp Task thành công!");
      } else {
        const reason = result.data?.reason || result.reason || "Các task này không có sự liên quan logic hoặc mâu thuẫn về phạm vi công việc.";
        setActionError({
          title: "Không thể gộp Task",
          reason: reason
        });
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.message === 'canceled') {
        toast('Đã hủy tiến trình gộp Task.', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.error || "Lỗi khi Merge task.");
      }
    } finally {
      setIsMerging(false);
      setMergeModalOpen(false);
      setMergeSelectedSet(new Set());
      abortControllerRef.current = null;
    }
  };

  const handleResolveDiff = (action) => {
    if (activeDiffTaskIndex === null) return;
    if (action === 'DELETE_GENERATED') {
      const newSet = new Set(selectedIndices);
      newSet.delete(activeDiffTaskIndex);
      setSelectedIndices(newSet);
    } else if (action === 'MERGE_INTO_EXISTING') {
      const updatedTasks = [...tasks];
      updatedTasks[activeDiffTaskIndex] = {
        ...updatedTasks[activeDiffTaskIndex],
        _syncAction: 'MERGE_INTO_EXISTING',
        _existingTaskId: activeDiffRisk.existing_task_id
      };
      setTasks(updatedTasks);
      const newSet = new Set(selectedIndices);
      newSet.add(activeDiffTaskIndex);
      setSelectedIndices(newSet);
    } else if (action === 'KEEP_BOTH') {
      const newSet = new Set(selectedIndices);
      newSet.add(activeDiffTaskIndex);
      setSelectedIndices(newSet);
    }
    setDiffModalOpen(false);
    setActiveDiffRisk(null);
    setActiveDiffTaskIndex(null);
  };

  // --- HELPERS ---

  const duplicationRisks = assessment?.duplication_risks || [];
  const coverageGaps = assessment?.coverage_gaps || [];
  const reqCount = new Set(tasks.map(t => t.requirement_code).filter(Boolean)).size;

  const getTaskGaps = (task) => {
    const gaps = [];
    coverageGaps.forEach(gap => {
      if (task.use_case_code && gap.use_case_code && gap.use_case_code === task.use_case_code) {
        gaps.push({ severity: 'HIGH', message: `${gap.use_case_code}: ${gap.missing_step}` });
      }
    });
    return gaps;
  };

  const priorityColor = (priority) => {
    switch(priority) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-amber-400 text-slate-900';
      case 'LOW': return 'bg-blue-400 text-white';
      default: return 'bg-slate-300 text-slate-800';
    }
  };

  const getTypeConfig = (type) => {
    switch(type) {
      case 'DEVELOPMENT': return { label: 'Development', icon: '💻', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'TESTING': return { label: 'Testing', icon: '🧪', color: 'bg-green-50 text-green-700 border-green-200' };
      case 'DOCUMENTATION': return { label: 'Documentation', icon: '📄', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'UI_UX': return { label: 'UI/UX', icon: '🎨', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' };
      case 'RESEARCH': return { label: 'Research', icon: '🔍', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'DEPLOYMENT': return { label: 'Deployment', icon: '🚀', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'BUG_FIX': return { label: 'Bug Fix', icon: '🐛', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'REVIEW': return { label: 'Review', icon: '👁️', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      default: return { label: type || 'Unknown', icon: '📌', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        
        {/* 1. MODAL HEADER */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">psychology</span>
              AI Task Review Board
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Kiểm duyệt {tasks.length} Tasks từ {reqCount} Requirements · AI Audit: {coverageGaps.length} gaps, {duplicationRisks.length} risks
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 2. TOOLBAR */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 text-sm hover:text-indigo-600 transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                checked={tasks.length > 0 && selectedIndices.size === tasks.length}
                onChange={handleSelectAll}
              />
              Chọn tất cả
            </label>
            <span className="text-slate-300">|</span>
            <span className="font-semibold text-slate-800">Generated Tasks ({tasks.length})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
              onClick={() => setSplitModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px] text-yellow-600">bolt</span>
              Tách Task
            </button>
            <button 
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
              onClick={() => {
                setMergeSelectedSet(new Set(selectedIndices));
                setMergeModalOpen(true);
              }}
            >
              <span className="material-symbols-outlined text-[18px] text-indigo-600">shuffle</span>
              Gộp Task
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600">Sprint:</span>
            {sprints.length > 0 ? (
              <select 
                className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white min-w-[150px] outline-none focus:border-indigo-500"
                value={globalSprintId}
                onChange={(e) => setGlobalSprintId(e.target.value)}
              >
                <option value="">-- Chọn Sprint --</option>
                {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <span className="text-sm text-slate-400 italic">No sprints</span>
            )}
            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-bold ml-2">
              Đã chọn: {selectedIndices.size}
            </span>
          </div>
        </div>

        {/* 3. TASK LIST */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="material-symbols-outlined animate-spin text-4xl text-indigo-600">progress_activity</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <span className="material-symbols-outlined text-6xl opacity-20 mb-4">scan_delete</span>
              <p className="text-lg font-medium">Không có Task nào được tạo</p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex flex-col gap-4 pb-10">
              {tasks.map((task, index) => {
                const isSelected = selectedIndices.has(index);
                const isEditing = editingTaskIndex === index;
                const isExpanded = expandedDesc.has(index);
                const duplication = duplicationRisks.find(r => r.generated_task_temp_id === task.temp_id);
                const isMergingToExisting = task._syncAction === 'MERGE_INTO_EXISTING';
                const gaps = getTaskGaps(task);
                
                const hasWarning = gaps.length > 0;
                const hasDuplication = !!duplication && !isMergingToExisting;

                // Card styling
                let cardClass = "bg-white rounded-xl border-2 p-5 transition-shadow shadow-sm hover:shadow-md ";
                if (hasDuplication) cardClass += "border-orange-400 shadow-[0_0_8px_rgba(253,186,116,0.4)]";
                else if (hasWarning) cardClass += "border-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]";
                else if (isSelected) cardClass += "border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)] bg-emerald-50/10";
                else cardClass += "border-emerald-200 opacity-90";

                return (
                  <div key={task.temp_id || index} className={cardClass}>
                    
                    {/* ROW 1: Header */}
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTaskSelection(index)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="flex flex-col gap-3">
                            <input 
                              className="w-full border border-slate-300 rounded p-2 text-base font-bold outline-none focus:border-indigo-500"
                              value={editForm.title || ''}
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              placeholder="Task Title"
                            />
                            <textarea 
                              className="w-full border border-slate-300 rounded p-2 text-sm outline-none focus:border-indigo-500"
                              rows={3}
                              value={editForm.description || ''}
                              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                              placeholder="Task Description"
                            />
                            <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded border border-slate-100">
                              <div className="flex flex-wrap items-center gap-3 w-full">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Giờ:</span>
                                  <input 
                                    type="number"
                                    className="border border-slate-300 rounded px-2 py-1 text-sm w-16 outline-none focus:border-indigo-500"
                                    value={editForm.estimated_hours || ''}
                                    onChange={(e) => setEditForm({...editForm, estimated_hours: e.target.value})}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Weight:</span>
                                  <input 
                                    type="number"
                                    step="0.1"
                                    min="1.0"
                                    max="2.0"
                                    className="border border-slate-300 rounded px-2 py-1 text-sm w-16 outline-none focus:border-indigo-500"
                                    value={editForm.weight || ''}
                                    onChange={(e) => setEditForm({...editForm, weight: e.target.value})}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Ưu tiên:</span>
                                  <select 
                                    className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                                    value={editForm.priority || ''}
                                    onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                                  >
                                    <option value="LOW">LOW</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="CRITICAL">CRITICAL</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Loại:</span>
                                  <select 
                                    className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                                    value={editForm.task_type || ''}
                                    onChange={(e) => setEditForm({...editForm, task_type: e.target.value})}
                                  >
                                    <option value="DEVELOPMENT">Development</option>
                                    <option value="TESTING">Testing</option>
                                    <option value="DOCUMENTATION">Documentation</option>
                                    <option value="UI_UX">UI/UX</option>
                                    <option value="RESEARCH">Research</option>
                                    <option value="DEPLOYMENT">Deployment</option>
                                    <option value="BUG_FIX">Bug Fix</option>
                                    <option value="REVIEW">Review</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-3 w-full">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Bắt đầu:</span>
                                  <input 
                                    type="date"
                                    className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                                    value={editForm.start_date || ''}
                                    onChange={(e) => setEditForm({...editForm, start_date: e.target.value})}
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Deadline:</span>
                                  <input 
                                    type="date"
                                    className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                                    value={editForm.suggested_deadline || ''}
                                    onChange={(e) => setEditForm({...editForm, suggested_deadline: e.target.value})}
                                  />
                                </div>
                              </div>
                              {sprints.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Sprint:</span>
                                  <select 
                                    className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500"
                                    value={editForm.sprint_id || ''}
                                    onChange={(e) => setEditForm({...editForm, sprint_id: e.target.value})}
                                  >
                                    <option value="">-- No Sprint --</option>
                                    {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                  </select>
                                </div>
                              )}
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-slate-500">Người làm:</span>
                                  <select 
                                    className="border border-slate-300 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 max-w-[200px]"
                                    value={editForm.suggested_assignee?.member_name || ''}
                                    onChange={(e) => setEditForm({
                                      ...editForm, 
                                      suggested_assignee: { 
                                        ...editForm.suggested_assignee, 
                                        member_name: e.target.value 
                                      }
                                    })}
                                  >
                                    <option value="">-- Chưa gán --</option>
                                    {members.map(m => {
                                      const username = m.user?.username || m.username || m.name;
                                      const displayName = m.user?.fullName || m.fullName || m.name || username;
                                      return <option key={m.userId || m.id || username} value={username}>{displayName}</option>
                                    })}
                                  </select>
                                </div>
                              <div className="ml-auto flex gap-2">
                                <button onClick={handleCancelEdit} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors">
                                  ✕ Hủy
                                </button>
                                <button onClick={handleSaveEdit} className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors">
                                  ✓ Lưu
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Read-only Content */}
                            <div className="flex justify-between items-start gap-4">
                              <h4 className="font-bold text-slate-800 text-lg leading-snug">
                                {task.title}
                              </h4>
                              <button 
                                onClick={() => { setEditingTaskIndex(index); setEditForm(task); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                                title="Edit Task"
                              >
                                ✏️
                              </button>
                            </div>

                            {/* ROW 2: Description */}
                            <div className="mt-2 text-sm text-slate-600">
                              <p className={isExpanded ? "" : "line-clamp-2"}>
                                {task.description}
                              </p>
                              {(task.description?.length > 120) && (
                                <button 
                                  onClick={() => toggleDesc(index)}
                                  className="text-indigo-600 hover:underline text-xs font-medium mt-1 inline-flex items-center"
                                >
                                  {isExpanded ? "thu gọn ▴" : "xem thêm ▾"}
                                </button>
                              )}
                            </div>

                            {/* ROW 3: Badges */}
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wider ${priorityColor(task.priority)}`}>
                                {task.priority}
                              </span>

                              {task.task_type && (
                                <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border ${getTypeConfig(task.task_type).color}`}>
                                  {getTypeConfig(task.task_type).label}
                                </span>
                              )}
                              
                              <span className="text-[12px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-slate-200">
                                {task.estimated_hours}h
                              </span>

                              {task.weight && (
                                <span className="text-[12px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-amber-200" title="Cognitive Complexity Weight">
                                  Weight: {task.weight}
                                </span>
                              )}

                              {task.start_date && (
                                <span className="text-[12px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-indigo-200" title="Timeline">
                                  {task.start_date} → {task.suggested_deadline}
                                </span>
                              )}

                              {isMergingToExisting && (
                                <span className="text-[12px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium border border-teal-200">
                                  Merge to {task._existingTaskId}
                                </span>
                              )}
                            </div>

                            {/* ROW 4: References & Assignee */}
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-[13px] text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">Requirement:</span>
                                <span className="text-indigo-600 font-medium">{task.requirement_code || 'N/A'}</span>
                              </div>
                              <div className="w-px h-3 bg-slate-300"></div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-500">Use Case:</span>
                                <span className="text-indigo-600 font-medium">{task.use_case_code || 'N/A'}</span>
                              </div>
                              <div className="w-px h-3 bg-slate-300"></div>
                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                  <span className="font-semibold text-slate-500">Assignee:</span>
                                  <select 
                                    className="text-slate-800 font-medium bg-transparent border-b border-dashed border-slate-300 outline-none hover:bg-slate-50 cursor-pointer max-w-[150px] truncate"
                                    value={task.suggested_assignee?.member_name || ''}
                                    onChange={(e) => {
                                      const newTasks = [...tasks];
                                      newTasks[idx] = {
                                        ...newTasks[idx],
                                        suggested_assignee: {
                                          ...(newTasks[idx].suggested_assignee || {}),
                                          member_name: e.target.value
                                        }
                                      };
                                      setTasks(newTasks);
                                    }}
                                  >
                                    <option value="">-- Chưa gán --</option>
                                    {members.map(m => {
                                      const username = m.user?.username || m.username || m.name;
                                      const displayName = m.user?.fullName || m.fullName || m.name || username;
                                      return <option key={m.userId || m.id || username} value={username}>{displayName}</option>
                                    })}
                                  </select>
                                </div>
                              
                              {task.sprint_id && sprints.find(s => s.id == task.sprint_id) && (
                                <>
                                  <div className="w-px h-3 bg-slate-300"></div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-slate-500">Sprint:</span>
                                    <span className="text-indigo-600 font-medium">{sprints.find(s => s.id == task.sprint_id).name}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* ROW 4: Warnings */}
                            {(hasWarning || hasDuplication) && (
                              <div className="mt-4 flex flex-col gap-3">
                                {hasWarning && (
                                  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                                    <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-1">
                                      ⚠️ Cảnh báo (Coverage Gaps)
                                    </div>
                                    <ul className="list-disc pl-5 text-sm text-red-600 space-y-1">
                                      {gaps.map((g, i) => <li key={i}>{g.message}</li>)}
                                    </ul>
                                  </div>
                                )}

                                {hasDuplication && (
                                  <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start sm:items-center gap-2 text-orange-800 text-sm font-bold">
                                      🔴 Trùng lặp với {duplication.existing_task_id} "{duplication.existing_task_title || 'Task cũ'}"
                                    </div>
                                    <button 
                                      className="shrink-0 px-3 py-1.5 bg-white border border-orange-300 text-orange-700 text-sm font-semibold rounded hover:bg-orange-100 transition-colors shadow-sm"
                                      onClick={() => {
                                        setActiveDiffRisk(duplication);
                                        setActiveDiffTaskIndex(index);
                                        setDiffModalOpen(true);
                                      }}
                                    >
                                      So sánh & Xử lý →
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. MODAL FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
          <button 
            onClick={onClose} 
            disabled={approving}
            className="px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          
          <button 
            onClick={handleApprove} 
            disabled={loading || approving || selectedIndices.size === 0}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded shadow-sm transition-colors flex items-center gap-2"
          >
            {approving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                Đang phê duyệt...
              </>
            ) : (
              <>
                ✅ Phê duyệt & Đưa vào Kanban ({selectedIndices.size})
              </>
            )}
          </button>
        </div>
      </div>

      {/* --- POPUPS --- */}

      {/* DIFF POPUP */}
      {diffModalOpen && activeDiffRisk && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h3 className="text-lg font-bold text-slate-800">🔍 So sánh Task</h3>
              <button onClick={() => setDiffModalOpen(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              {/* Left Column: Generated */}
              <div className="flex-1 border rounded-lg p-4 bg-blue-50/50 border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 pb-2 border-b border-blue-200 flex items-center gap-2">
                  ✨ Task AI vừa sinh
                </h4>
                <div className="font-bold text-lg mb-2 text-slate-800">{tasks[activeDiffTaskIndex]?.title}</div>
                <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{tasks[activeDiffTaskIndex]?.description}</p>
                <div className="flex gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wider ${priorityColor(tasks[activeDiffTaskIndex]?.priority)}`}>
                    {tasks[activeDiffTaskIndex]?.priority}
                  </span>
                  <span className="text-[12px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                    ⏱ {tasks[activeDiffTaskIndex]?.estimated_hours}h
                  </span>
                </div>
              </div>

              {/* Right Column: Existing */}
              <div className="flex-1 border rounded-lg p-4 bg-orange-50/50 border-orange-200">
                <h4 className="font-bold text-orange-800 mb-3 pb-2 border-b border-orange-200 flex items-center gap-2">
                  📋 {activeDiffRisk.existing_task_id} đã tồn tại
                </h4>
                <div className="font-bold text-lg mb-2 text-slate-800">{activeDiffRisk.existing_task_title || "Unknown Title"}</div>
                <p className="text-sm text-slate-600 mb-4 whitespace-pre-wrap">{activeDiffRisk.recommendation}</p>
                <div className="flex gap-2">
                   <span className="text-[12px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold border border-orange-200">
                     Trùng lặp Hệ thống
                   </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-slate-50 rounded-b-xl flex justify-center gap-4 flex-wrap">
              <button onClick={() => handleResolveDiff('MERGE_INTO_EXISTING')} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded shadow-sm">
                Gộp vào Task cũ
              </button>
              <button onClick={() => handleResolveDiff('KEEP_BOTH')} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded shadow-sm">
                Giữ cả hai
              </button>
              <button onClick={() => handleResolveDiff('DELETE_GENERATED')} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow-sm">
                Xóa Task AI này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPLIT POPUP */}
      {splitModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50 rounded-t-xl flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-800">⚡ Chọn Task muốn Tách</h3>
                <p className="text-sm text-slate-500">Chọn 1 task phức tạp để AI tách thành sub-tasks nhỏ hơn</p>
              </div>
              <button onClick={() => !isSplitting && setSplitModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {tasks.map((task, idx) => (
                <label key={task.temp_id || idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${splitSelectedIndex === idx ? 'bg-yellow-50 border-yellow-400' : 'hover:bg-slate-50 border-slate-200'}`}>
                  <input 
                    type="radio" 
                    name="splitRadio" 
                    className="w-4 h-4 text-yellow-600"
                    checked={splitSelectedIndex === idx}
                    onChange={() => setSplitSelectedIndex(idx)}
                    disabled={isSplitting}
                  />
                  <span className="flex-1 text-sm font-medium text-slate-800 line-clamp-1">{task.title}</span>
                  <span className="text-xs font-bold text-slate-500 shrink-0">· {task.estimated_hours}h</span>
                </label>
              ))}
            </div>

            <div className="px-6 py-4 border-t flex justify-between items-center bg-slate-50 rounded-b-xl">
              <button onClick={() => setSplitModalOpen(false)} disabled={isSplitting} className="px-4 py-2 border rounded font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
              <button 
                onClick={executeSplit} 
                disabled={splitSelectedIndex === null || isSplitting}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-300 text-white font-bold rounded shadow-sm flex items-center gap-2"
              >
                {isSplitting ? 'Đang tách...' : '⚡ Tách Task này →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MERGE POPUP */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b bg-slate-50 rounded-t-xl flex justify-between items-start">
              <div className="flex-1 mr-4">
                <h3 className="text-lg font-bold text-slate-800">🔀 Chọn Tasks muốn Gộp</h3>
                <p className="text-sm text-slate-500 mb-3">Chọn từ 2 task trở lên để AI gộp thành 1 task tổng hợp</p>
                
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">
                    Đã chọn: <strong className="text-indigo-600">{mergeSelectedSet.size}</strong> / {tasks.length} tasks
                  </span>
                  <button
                    className="px-3 py-1.5 text-[13px] font-bold text-white bg-[#1D7A85] hover:bg-[#166069] rounded-md transition-colors shadow-sm disabled:opacity-50"
                    disabled={isMerging}
                    onClick={() => {
                      if (mergeSelectedSet.size === tasks.length) {
                        setMergeSelectedSet(new Set());
                      } else {
                        setMergeSelectedSet(new Set(tasks.map((_, i) => i)));
                      }
                    }}
                  >
                    Chọn tất cả
                  </button>
                </div>
              </div>
              <button onClick={() => !isMerging && setMergeModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {tasks.map((task, idx) => (
                <label key={task.temp_id || idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeSelectedSet.has(idx) ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-slate-50 border-slate-200'}`}>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300"
                    checked={mergeSelectedSet.has(idx)}
                    onChange={() => {
                      const newSet = new Set(mergeSelectedSet);
                      if (newSet.has(idx)) newSet.delete(idx);
                      else newSet.add(idx);
                      setMergeSelectedSet(newSet);
                    }}
                    disabled={isMerging}
                  />
                  <span className="flex-1 text-sm font-medium text-slate-800 line-clamp-1">{task.title}</span>
                  <span className="text-xs font-bold text-slate-500 shrink-0">· {task.estimated_hours}h</span>
                </label>
              ))}
            </div>

            <div className="px-6 py-4 border-t flex justify-between items-center bg-slate-50 rounded-b-xl">
              <span className="text-sm font-bold text-indigo-700">Đã chọn: {mergeSelectedSet.size} tasks</span>
              <div className="flex gap-3">
                <button onClick={() => setMergeModalOpen(false)} disabled={isMerging} className="px-4 py-2 border rounded font-medium text-slate-700 hover:bg-slate-100">Hủy</button>
                <button 
                  onClick={executeMerge} 
                  disabled={mergeSelectedSet.size < 2 || isMerging}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded shadow-sm flex items-center gap-2"
                >
                  {isMerging ? 'Đang gộp...' : `🔀 Gộp ${mergeSelectedSet.size} Tasks →`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI LOADING POPUP OVERLAY */}
      {(isSplitting || isMerging) && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white px-8 py-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center relative">
            <button 
              onClick={() => {
                if (abortControllerRef.current) {
                  abortControllerRef.current.abort();
                } else {
                  setIsSplitting(false);
                  setIsMerging(false);
                }
              }}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              title="Hủy tiến trình"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <span className="material-symbols-outlined text-5xl text-indigo-600 animate-spin mb-4 mt-2">progress_activity</span>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {isSplitting ? '⚡ AI đang phân tích...' : '🔀 AI đang gộp...'}
            </h3>
            <p className="text-sm text-slate-500">
              {isSplitting 
                ? `Đang xé nhỏ "${tasks[splitSelectedIndex]?.title}"...` 
                : `Đang tóm tắt và hợp nhất ${mergeSelectedSet.size} tasks...`}
            </p>
          </div>
        </div>
      )}

      {/* ERROR POPUP */}
      {actionError && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-[pulse_0.3s_ease-out_1]">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500 text-3xl">error</span>
              <h3 className="text-lg font-bold text-red-800">{actionError.title}</h3>
            </div>
            <div className="p-6 bg-white">
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                AI phản hồi: <br />
                <span className="font-normal italic text-slate-500 mt-2 block px-4 border-l-4 border-red-200">
                  "{actionError.reason}"
                </span>
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
              <button 
                onClick={() => setActionError(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AiTaskReviewBoard;
