import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import taskService from '../services/taskService';
import { useProjectStore } from '@/store/useProjectStore';
import EditableTaskCard from './EditableTaskCard';
import SplitTaskReviewModal from './SplitTaskReviewModal';
import MergeTaskReviewModal from './MergeTaskReviewModal';
import DuplicationDiffModal from './DuplicationDiffModal';
import ConfirmModal from '../../../components/ui/ConfirmModal';

// Helper for auto-mapping sprints based on task deadline vs sprint dates
const autoMapSprint = (t, sprintList) => {
  let bestSprintId = null;
  const targetDate = t.suggested_deadline || t.deadline || t.start_date;
  if (targetDate && sprintList && sprintList.length > 0) {
     const tDate = new Date(targetDate);
     const matchedSprint = sprintList.find(s => {
       const start = s.startDate ? new Date(s.startDate) : null;
       const end = s.endDate ? new Date(s.endDate) : null;
       if (start && end) return tDate >= start && tDate <= end;
       if (start) return tDate >= start;
       if (end) return tDate <= end;
       return false;
     });
     if (matchedSprint) {
       bestSprintId = matchedSprint.id;
     } else {
       const firstSprint = sprintList[0];
       const lastSprint = sprintList[sprintList.length - 1];
       if (firstSprint.startDate && tDate < new Date(firstSprint.startDate)) {
          bestSprintId = firstSprint.id;
       } else if (lastSprint.endDate && tDate > new Date(lastSprint.endDate)) {
          bestSprintId = lastSprint.id;
       }
     }
  }
  return bestSprintId;
};

const AiTaskReviewBoard = ({ isOpen, onClose, generationId, projectId, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  
  const [tasks, setTasks] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [sprints, setSprints] = useState([]);
  const members = useProjectStore(state => state.activeProject?.members || []);
  
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [globalSprintId, setGlobalSprintId] = useState('');
  
  // Inline Edit State (REMOVED: Now handled by EditableTaskCard)

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

  // Review Modals State
  const [reviewingSplitData, setReviewingSplitData] = useState(null); // { originalTask, subTasks }
  const [reviewingMergeData, setReviewingMergeData] = useState(null); // { originalTasks, mergedTask }

  // Error Popup State
  const [actionError, setActionError] = useState(null); // { title: string, reason: string }
  const [isMerging, setIsMerging] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, action: null, message: '', title: '' });
  
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
      
      if (generatedTasks.length === 0) {
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border-2 border-indigo-100`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-base font-bold text-slate-800">
                    Đã phủ kín tính năng!
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Hệ thống AI nhận thấy các Requirement này đã được các Task hiện tại xử lý đầy đủ. Không cần tạo thêm Task mới để tránh trùng lặp.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-slate-200 bg-slate-50">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-16 border border-transparent flex flex-col items-center justify-center text-xs font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus:outline-none transition-colors"
              >
                <span className="material-symbols-outlined mb-1">close</span>
                Đóng
              </button>
            </div>
          </div>
        ), { duration: Infinity });
        
        onClose();
        return;
      }
      
      let fetchedSprints = [];
      try {
        fetchedSprints = await taskService.getProjectSprints(projectId);
        setSprints(fetchedSprints);
      } catch (err) {
        console.error("Failed to load sprints", err);
      }

      // Auto-map sprints based on task deadline vs sprint dates
      const mappedTasks = generatedTasks.map(t => {
        return { ...t, sprint_id: autoMapSprint(t, fetchedSprints) || t.sprint_id };
      });

      setTasks(mappedTasks);
      setAssessment(payloadData.ai_critical_assessment || null);

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

  // Removed unused edit handlers

  const handleApprove = async () => {
    if (selectedIndices.size === 0) return;
    setApproving(true);
    try {
      const finalTasks = tasks.map((t, idx) => {
        if (selectedIndices.has(idx)) {
          // Sprint logic is now handled per-task or via bulk override, so we just use what's on the task state
          return t;
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

  const handleApproveSplit = (finalSubTasks) => {
    const newTasks = [...tasks];
    newTasks.splice(splitSelectedIndex, 1, ...finalSubTasks);
    setTasks(newTasks);
    
    setSelectedIndices(new Set(Array.from({length: newTasks.length}, (_, i) => i)));
    
    setReviewingSplitData(null);
    setSplitSelectedIndex(null); // Clear after apply
    toast.success("Đã áp dụng Split!");
  };

  const handleApproveMerge = (finalMergedTask) => {
    const newTasks = tasks.filter((_, idx) => !mergeSelectedSet.has(idx));
    newTasks.unshift(finalMergedTask);
    setTasks(newTasks);
    
    setSelectedIndices(new Set(Array.from({length: newTasks.length}, (_, i) => i)));
    
    setReviewingMergeData(null);
    setMergeSelectedSet(new Set()); // Clear after apply
    toast.success("Đã áp dụng Merge!");
  };

  const executeSplit = async () => {
    if (splitSelectedIndex === null) return;
    setIsSplitting(true);
    abortControllerRef.current = new AbortController();
    try {
      const fullTask = tasks[splitSelectedIndex];
      // Clean up payload to avoid confusing the AI with internal metadata
      const taskToSplit = {
        title: fullTask.title,
        description: fullTask.description,
        estimated_hours: fullTask.estimated_hours,
        priority: fullTask.priority,
        task_type: fullTask.task_type
      };
      const result = await taskService.splitAITask(projectId, { task: taskToSplit }, { signal: abortControllerRef.current.signal });
      
      let subTasks = result.data?.sub_tasks || result.sub_tasks;
      // Handle case where Gemini double-wraps the array or puts it in "items"
      if (subTasks && !Array.isArray(subTasks)) {
         if (subTasks.items && Array.isArray(subTasks.items)) subTasks = subTasks.items;
         else if (Object.keys(subTasks).length > 0) subTasks = Object.values(subTasks)[0];
      }

      if (subTasks && Array.isArray(subTasks) && subTasks.length > 0) {
        // Preserve metadata from original task
        const enrichedSubTasks = subTasks.map(st => {
          const newSub = {
            ...fullTask, // keep requirement, use_case, assignees by default
            ...st, // overwrite with AI generated fields
            title: st.title || st.task_title || st.task_name || `${fullTask.title} (Phần nhỏ)`,
            description: st.description || st.task_description || `${fullTask.description}\n\n(Tách từ task gốc)`
          };
          newSub.sprint_id = autoMapSprint(newSub, sprints) || newSub.sprint_id;
          return newSub;
        });

        // Instead of applying immediately, open the review modal
        setReviewingSplitData({
          originalTask: taskToSplit,
          subTasks: enrichedSubTasks
        });
        toast.success("AI đã tách xong, vui lòng kiểm tra lại!");
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
      // DO NOT setSplitSelectedIndex(null) here, handled in onApprove or onClose
      abortControllerRef.current = null;
    }
  };

  const executeMerge = async () => {
    if (mergeSelectedSet.size < 2) return;
    setIsMerging(true);
    abortControllerRef.current = new AbortController();
    try {
      const fullTasksToMerge = Array.from(mergeSelectedSet).map(idx => tasks[idx]);
      // Clean up payload to avoid confusing the AI
      const tasksToMerge = fullTasksToMerge.map(t => ({
        title: t.title,
        description: t.description,
        estimated_hours: t.estimated_hours,
        priority: t.priority,
        task_type: t.task_type
      }));
      const result = await taskService.mergeAITasks(projectId, { tasks: tasksToMerge }, { signal: abortControllerRef.current.signal });
      let mergedTask = result.data?.merged_task || result.merged_task;
      
      // Handle if Gemini wraps it
      if (mergedTask && mergedTask.merged_task) {
         mergedTask = mergedTask.merged_task;
      }

      if (mergedTask && typeof mergedTask === 'object') {
        // Preserve metadata from original tasks
        const baseTask = fullTasksToMerge[0];
        const aiMerged = mergedTask || {};
        mergedTask = {
            ...baseTask, // keep requirement, use_case, assignees by default
            ...aiMerged, // overwrite with AI generated fields
            title: aiMerged.title || aiMerged.task_title || aiMerged.task_name || `${baseTask.title} (Đã gộp)`,
            description: aiMerged.description || aiMerged.task_description || `${baseTask.description}\n\n(Đã gộp từ các task khác)`
        };
        mergedTask.sprint_id = autoMapSprint(mergedTask, sprints) || mergedTask.sprint_id;

        // Instead of applying immediately, open the review modal
        setReviewingMergeData({
          originalTasks: fullTasksToMerge,
          mergedTask: mergedTask
        });
        toast.success("AI đã gộp xong, vui lòng kiểm tra lại!");
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
      // DO NOT setMergeSelectedSet(new Set()) here, handled in onApprove or onClose
      abortControllerRef.current = null;
    }
  };

  const handleResolveDiff = (action) => {
    if (activeDiffTaskIndex === null) return;
    if (action === 'DELETE_GENERATED') {
      setConfirmConfig({
        isOpen: true,
        action: 'DELETE_GENERATED',
        title: 'Xóa Task AI',
        message: 'Bạn có chắc chắn muốn xóa Task AI sinh ra này khỏi danh sách không?'
      });
    } else if (action === 'MERGE_INTO_EXISTING') {
      setConfirmConfig({
        isOpen: true,
        action: 'MERGE_INTO_EXISTING',
        title: 'Xác nhận gộp',
        message: 'Xác nhận gộp? Khi phê duyệt, dữ liệu của Task cũ sẽ bị ghi đè hoàn toàn bởi Task AI này.'
      });
    } else if (action === 'KEEP_BOTH') {
      executeResolveDiff('KEEP_BOTH');
    }
  };

  const executeResolveDiff = (action) => {
    if (activeDiffTaskIndex === null) return;
    if (action === 'DELETE_GENERATED') {
      const updatedTasks = [...tasks];
      updatedTasks.splice(activeDiffTaskIndex, 1);
      setTasks(updatedTasks);
      
      const newSet = new Set();
      selectedIndices.forEach(idx => {
        if (idx < activeDiffTaskIndex) newSet.add(idx);
        else if (idx > activeDiffTaskIndex) newSet.add(idx - 1);
      });
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
      const updatedTasks = [...tasks];
      delete updatedTasks[activeDiffTaskIndex]._syncAction;
      delete updatedTasks[activeDiffTaskIndex]._existingTaskId;
      setTasks(updatedTasks);
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
              onClick={() => {
                if (selectedIndices.size === 1) {
                  setSplitSelectedIndex(Array.from(selectedIndices)[0]);
                }
                setSplitModalOpen(true);
              }}
            >
              <span className="material-symbols-outlined text-[18px] text-yellow-600">bolt</span>
              Tách Task
            </button>
            <button 
              className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
              title="Gộp các task"
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
            <span className="text-sm font-medium text-slate-600 cursor-help" title="Chỉ dùng khi muốn ép toàn bộ task vào chung 1 Sprint">Ghi đè Sprint (Tất cả):</span>
            {sprints.length > 0 ? (
              <select 
                className="border border-slate-300 rounded px-2 py-1.5 text-sm bg-white min-w-[150px] outline-none focus:border-indigo-500"
                value={globalSprintId}
                onChange={(e) => {
                  const val = e.target.value;
                  setGlobalSprintId(val);
                  if (val) {
                    setTasks(tasks.map(t => ({ ...t, sprint_id: val })));
                    toast.success("Đã ghi đè Sprint cho toàn bộ Task.");
                  }
                }}
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
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">check_circle</span>
              <p className="text-xl font-bold text-slate-700 mb-2">Đã phủ kín tính năng!</p>
              <p className="text-base text-center max-w-md">
                Hệ thống AI nhận thấy các Requirement này đã được các Task hiện tại xử lý đầy đủ. Không cần tạo thêm Task mới để tránh trùng lặp.
              </p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto flex flex-col gap-4 pb-10">
              {tasks.map((task, index) => {
                const isSelected = selectedIndices.has(index);
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
                        <EditableTaskCard 
                          task={task}
                          sprints={sprints}
                          members={members}
                          priorityColor={priorityColor}
                          getTypeConfig={getTypeConfig}
                          isMergingToExisting={isMergingToExisting}
                          onUpdate={(updatedTask) => {
                            const newTasks = [...tasks];
                            newTasks[index] = updatedTask;
                            setTasks(newTasks);
                          }}
                          onChangeSprint={(newSprintId) => {
                            const newTasks = [...tasks];
                            newTasks[index] = { ...task, sprint_id: newSprintId };
                            setTasks(newTasks);
                          }}
                        />
                      </div>
                    </div>

                    {/* ROW 4: Warnings */}
                    {(hasWarning || hasDuplication) && (
                      <div className="mt-4 flex flex-col gap-3 pl-9">
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
      <DuplicationDiffModal 
        isOpen={diffModalOpen}
        onClose={() => setDiffModalOpen(false)}
        activeDiffTask={tasks[activeDiffTaskIndex]}
        activeDiffRisk={activeDiffRisk}
        onResolve={handleResolveDiff}
        sprints={sprints}
        members={members}
        priorityColor={priorityColor}
        getTypeConfig={getTypeConfig}
        projectId={projectId}
      />

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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <span className="material-symbols-outlined text-3xl">error</span>
              <h3 className="font-bold text-lg">{actionError.title}</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              {actionError.reason}
            </p>
            <div className="flex justify-end">
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

      <SplitTaskReviewModal 
        isOpen={!!reviewingSplitData}
        onClose={() => {
          setReviewingSplitData(null);
          setSplitSelectedIndex(null);
        }}
        originalTask={reviewingSplitData?.originalTask}
        generatedSubTasks={reviewingSplitData?.subTasks}
        onApprove={handleApproveSplit}
        sprints={sprints}
        members={members}
        priorityColor={priorityColor}
        getTypeConfig={getTypeConfig}
      />

      <MergeTaskReviewModal 
        isOpen={!!reviewingMergeData}
        onClose={() => {
          setReviewingMergeData(null);
          setMergeSelectedSet(new Set());
        }}
        originalTasks={reviewingMergeData?.originalTasks}
        generatedMergedTask={reviewingMergeData?.mergedTask}
        onApprove={handleApproveMerge}
        sprints={sprints}
        members={members}
        priorityColor={priorityColor}
        getTypeConfig={getTypeConfig}
      />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={() => {
          executeResolveDiff(confirmConfig.action);
          setConfirmConfig({ isOpen: false, action: null, message: '', title: '' });
        }}
        onCancel={() => setConfirmConfig({ isOpen: false, action: null, message: '', title: '' })}
      />
    </div>
  );
};

export default AiTaskReviewBoard;
