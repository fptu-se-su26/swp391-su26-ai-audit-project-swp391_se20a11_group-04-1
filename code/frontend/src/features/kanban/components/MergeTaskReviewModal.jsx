import React, { useState, useEffect } from 'react';
import EditableTaskCard from './EditableTaskCard';
import { toast } from 'react-hot-toast';

const MergeTaskReviewModal = ({
  isOpen,
  onClose,
  originalTasks,
  generatedMergedTask,
  onApprove,
  sprints,
  members,
  priorityColor,
  getTypeConfig
}) => {
  const [mergedTask, setMergedTask] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);

  useEffect(() => {
    if (generatedMergedTask) {
      setMergedTask(generatedMergedTask);
    }
  }, [generatedMergedTask]);

  if (!isOpen || !originalTasks || originalTasks.length === 0 || !mergedTask) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">merge</span>
              AI Merge Review
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review and edit the merged task before applying.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* TOP: Original Tasks (Read Only) */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Original Tasks ({originalTasks.length})</h3>
            <div className="flex flex-col gap-2 opacity-70 pointer-events-none">
              {originalTasks.map((t, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg flex items-center justify-between shadow-sm">
                  <span className="font-semibold text-slate-800 text-sm line-clamp-1">{t.title}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityColor(t.priority)}`}>{t.priority}</span>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">{t.estimated_hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center justify-center my-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-full border-t border-slate-200 border-dashed"></div>
            </div>
            <div className="relative bg-white px-4 flex flex-col items-center gap-1 text-indigo-500">
               <span className="material-symbols-outlined text-3xl animate-bounce">keyboard_double_arrow_down</span>
               <span className="text-[10px] font-bold tracking-widest uppercase bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">MERGED INTO</span>
            </div>
          </div>

          {/* BOTTOM: Merged Task */}
          <div>
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Generated Merged Task</h3>
            <EditableTaskCard
              task={mergedTask}
              sprints={sprints}
              members={members}
              priorityColor={priorityColor}
              getTypeConfig={getTypeConfig}
              maxAllowedDate={useProjectStore.getState().activeProject?.deadline}
              onUpdate={(updatedTask) => setMergedTask(updatedTask)}
              onChangeSprint={(newSprintId) => setMergedTask({ ...mergedTask, sprint_id: newSprintId })}
              onEditStateChange={(editing) => setIsEditingTask(editing)}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (isEditingTask) {
                alert("Please click '✓ Save' on editing task before merging!");
                return;
              }
              if (mergedTask.estimated_hours !== undefined && mergedTask.estimated_hours !== null && mergedTask.estimated_hours !== '') {
                const hours = Number(mergedTask.estimated_hours);
                if (isNaN(hours) || hours <= 0 || hours > 999) {
                  toast.error("Task has invalid estimated hours. Please fix it!");
                  return;
                }
              }

              const tStart = mergedTask.start_date || mergedTask.startDate;
              const tEnd = mergedTask.deadline || mergedTask.suggested_deadline || mergedTask.endDate;
              const todayDateStr = new Date().toISOString().split('T')[0];
              if (tStart && tStart < todayDateStr) {
                toast.error("Task start date is in the past. Please fix it!");
                return;
              }
              if (tStart && tEnd && tStart > tEnd) {
                toast.error("Task start date is after Deadline. Please fix it!");
                return;
              }

              const sprintId = mergedTask.sprint_id || mergedTask.sprintId;
              if (sprintId) {
                const sprint = sprints.find(s => String(s.id) === String(sprintId));
                if (sprint) {
                  const sStart = sprint.startDate || sprint.start_date;
                  const sEnd = sprint.endDate || sprint.end_date;
                  if (sStart && tStart && tStart < sStart) {
                    toast.error("Task date is outside the Sprint timeframe. Please fix it!");
                    return;
                  }
                  if (sEnd && tEnd && tEnd > sEnd) {
                    toast.error("Task date is outside the Sprint timeframe. Please fix it!");
                    return;
                  }
                }
              }
              onApprove(mergedTask);
            }}
            className={`px-6 py-2 font-bold rounded shadow-sm transition-colors flex items-center gap-2 ${isEditingTask ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
          >
            {isEditingTask ? "Editing..." : "✓ Confirm & Merge"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default MergeTaskReviewModal;
