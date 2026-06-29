import React, { useState, useEffect } from 'react';
import EditableTaskCard from './EditableTaskCard';
import { toast } from 'react-hot-toast';

const SplitTaskReviewModal = ({
  isOpen,
  onClose,
  originalTask,
  generatedSubTasks,
  onApprove,
  sprints,
  members,
  priorityColor,
  getTypeConfig
}) => {
  const [subTasks, setSubTasks] = useState([]);
  const [editingTaskIndices, setEditingTaskIndices] = useState(new Set());

  useEffect(() => {
    if (generatedSubTasks && generatedSubTasks.length > 0) {
      setSubTasks(generatedSubTasks);
    }
  }, [generatedSubTasks]);

  if (!isOpen || !originalTask) return null;

  const handleSaveSubTask = (index, updatedTask) => {
    const newTasks = [...subTasks];
    newTasks[index] = updatedTask;
    setSubTasks(newTasks);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-50 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">call_split</span>
              AI Split Review
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Review and edit the generated sub-tasks before applying.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* TOP: Original Task (Read Only) */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Original Task (Read-Only)</h3>
            <div className="opacity-70 pointer-events-none">
              <EditableTaskCard 
                task={originalTask}
                priorityColor={priorityColor}
                getTypeConfig={getTypeConfig}
                readOnlyMode={true}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex flex-col items-center justify-center my-4 relative">
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-full border-t border-slate-200 border-dashed"></div>
            </div>
            <div className="relative bg-white px-4 flex flex-col items-center gap-1 text-teal-500">
               <div className="animate-pulse">
                  <span className="material-symbols-outlined text-3xl rotate-180 block">call_split</span>
               </div>
               <span className="text-[10px] font-bold tracking-widest uppercase bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">SPLIT INTO</span>
            </div>
          </div>

          {/* BOTTOM: Generated Sub Tasks */}
          <div>
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Generated Sub Tasks ({subTasks.length})</h3>
            <div className="flex flex-col gap-4">
              {subTasks.map((t, idx) => (
                <EditableTaskCard
                  key={idx}
                  task={t}
                  sprints={sprints}
                  members={members}
                  priorityColor={priorityColor}
                  getTypeConfig={getTypeConfig}
                  onUpdate={(updatedTask) => handleSaveSubTask(idx, updatedTask)}
                  onChangeSprint={(newSprintId) => handleSaveSubTask(idx, { ...t, sprint_id: newSprintId })}
                  onEditStateChange={(editing) => {
                    setEditingTaskIndices(prev => {
                      const newSet = new Set(prev);
                      if (editing) newSet.add(idx);
                      else newSet.delete(idx);
                      return newSet;
                    });
                  }}
                />
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (editingTaskIndices.size > 0) {
                alert("Please click '✓ Save' on editing tasks before splitting!");
                return;
              }
              const invalidDateIdx = subTasks.findIndex(task => {
                if (task.estimated_hours !== undefined && task.estimated_hours !== null && task.estimated_hours !== '') {
                  const hours = Number(task.estimated_hours);
                  if (isNaN(hours) || hours <= 0 || hours > 999) return true;
                }

                const tStart = task.start_date || task.startDate;
                const tEnd = task.deadline || task.suggested_deadline || task.endDate;
                const todayDateStr = new Date().toISOString().split('T')[0];
                if (tStart && tStart < todayDateStr) return true;
                if (tStart && tEnd && tStart > tEnd) return true;

                const sprintId = task.sprint_id || task.sprintId;
                if (sprintId) {
                  const sprint = sprints.find(s => String(s.id) === String(sprintId));
                  if (sprint) {
                    const sStart = sprint.startDate || sprint.start_date;
                    const sEnd = sprint.endDate || sprint.end_date;
                    if (sStart && tStart && tStart < sStart) return true;
                    if (sEnd && tEnd && tEnd > sEnd) return true;
                  }
                }
                return false;
              });
              if (invalidDateIdx !== -1) {
                toast.error(`Sub-task "${subTasks[invalidDateIdx].title}" có ngày tháng hoặc số giờ không hợp lệ. Vui lòng sửa lại!`);
                return;
              }
              onApprove(subTasks);
            }}
            className={`px-6 py-2 font-bold rounded shadow-sm transition-colors flex items-center gap-2 ${editingTaskIndices.size > 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
          >
            {editingTaskIndices.size > 0 ? "Editing..." : "✓ Confirm & Split"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SplitTaskReviewModal;
