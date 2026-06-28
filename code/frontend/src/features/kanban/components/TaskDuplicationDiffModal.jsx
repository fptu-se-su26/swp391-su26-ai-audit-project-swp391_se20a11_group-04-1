import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import taskService from '../services/taskService';

const TaskDuplicationDiffModal = ({ isOpen, onClose, duplicateRisk, generatedTask, projectId, onResolve }) => {
  const [existingTask, setExistingTask] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && duplicateRisk?.existing_task_id) {
      fetchExistingTask();
    }
  }, [isOpen, duplicateRisk]);

  const fetchExistingTask = async () => {
    setLoading(true);
    try {
      // Clean string if it starts with TASK-
      let taskId = duplicateRisk.existing_task_id;
      if (typeof taskId === 'string' && taskId.startsWith('TASK-')) {
        taskId = taskId.replace('TASK-', '');
      }
      const data = await taskService.getTask(taskId);
      setExistingTask(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !duplicateRisk || !generatedTask) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-error/10 text-error rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">merge</span>
              Resolve Duplication Risk
            </h2>
            <p className="text-sm mt-1 opacity-90">
              {duplicateRisk.similarity_reason}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-error/20 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Side: Existing Task */}
              <div className="border border-outline-variant rounded-lg overflow-hidden flex flex-col">
                <div className="bg-surface-container py-3 px-4 border-b border-outline-variant font-semibold text-on-surface flex items-center justify-between">
                  <span>Existing Task (Database)</span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Keep Existing</span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">Title</label>
                    <div className="text-on-surface bg-error/10 px-3 py-2 rounded border border-error/20">
                      {existingTask?.title || 'Loading...'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">Description</label>
                    <div className="text-on-surface bg-error/10 px-3 py-2 rounded border border-error/20 whitespace-pre-wrap max-h-60 overflow-y-auto text-sm">
                      {existingTask?.description || 'Loading...'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-on-surface-variant block mb-1">Priority</label>
                      <div className="font-medium text-sm">{existingTask?.priority}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-on-surface-variant block mb-1">Estimate</label>
                      <div className="font-medium text-sm">{existingTask?.estimatedHours} hrs</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Generated Task */}
              <div className="border border-outline-variant rounded-lg overflow-hidden flex flex-col">
                <div className="bg-[#D7EEF1] py-3 px-4 border-b border-outline-variant font-semibold text-[#1E707D] flex items-center justify-between">
                  <span>Generated Task (AI)</span>
                  <span className="text-xs bg-white text-[#1E707D] px-2 py-1 rounded shadow-sm border border-[#1E707D]/20">New Draft</span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">Title</label>
                    <div className="text-on-surface bg-[#1E707D]/10 px-3 py-2 rounded border border-[#1E707D]/20">
                      {generatedTask.title}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-on-surface-variant block mb-1">Description</label>
                    <div className="text-on-surface bg-[#1E707D]/10 px-3 py-2 rounded border border-[#1E707D]/20 whitespace-pre-wrap max-h-60 overflow-y-auto text-sm">
                      {generatedTask.description}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-on-surface-variant block mb-1">Priority</label>
                      <div className="font-medium text-sm">{generatedTask.priority}</div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-on-surface-variant block mb-1">Estimate</label>
                      <div className="font-medium text-sm">{generatedTask.estimated_hours} hrs</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-outline-variant bg-surface flex justify-between rounded-b-xl items-center">
          <div className="text-sm text-on-surface-variant">
            <span className="font-semibold text-error mr-1">Recommendation:</span>
            {duplicateRisk.recommendation}
          </div>
          <div className="flex gap-3">
            <Button variant="outlined" onClick={onClose}>Cancel</Button>
            <Button 
              className="bg-error hover:bg-error/90 text-white"
              onClick={() => onResolve('DELETE_GENERATED')}
            >
              Delete AI Task (Keep Existing)
            </Button>
            <Button 
              variant="primary"
              onClick={() => onResolve('MERGE_INTO_EXISTING')}
            >
              Update Existing (Use AI Draft)
            </Button>
            <Button 
              className="bg-surface-variant text-on-surface-variant hover:bg-outline-variant"
              onClick={() => onResolve('KEEP_BOTH')}
            >
              Keep Both (Ignore Risk)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDuplicationDiffModal;
