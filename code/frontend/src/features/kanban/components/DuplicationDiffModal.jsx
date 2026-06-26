import React, { useState, useEffect } from 'react';
import EditableTaskCard from './EditableTaskCard';
import taskService from '../services/taskService';

const DuplicationDiffModal = ({
  isOpen,
  onClose,
  activeDiffTask,
  activeDiffRisk,
  onResolve,
  sprints,
  members,
  priorityColor,
  getTypeConfig,
  projectId
}) => {
  const [existingTaskData, setExistingTaskData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeDiffRisk?.existing_task_id) {
      const fetchExistingTask = async () => {
        setIsLoading(true);
        try {
          const existingIdStr = String(activeDiffRisk.existing_task_id).replace("TASK-", "");
          const parsedId = parseInt(existingIdStr, 10);
          if (!isNaN(parsedId)) {
            const data = await taskService.getTask(parsedId);
            
            if (projectId && String(data.projectId) !== String(projectId)) {
               setExistingTaskData({ title: "Task này thuộc về Project khác hoặc không tồn tại trong Project hiện tại." });
               setIsLoading(false);
               return;
            }

            if (data && data.checklist) {
              data.checklists = data.checklist.map(item => item.content);
            } else if (data && !data.checklists) {
              data.checklists = [];
            }
            
            // Map camelCase fields from TaskResponse to snake_case for EditableTaskCard
            data.estimated_hours = data.estimatedHours;
            data.task_type = data.type;
            data.requirement_code = data.requirementCode;
            data.use_case_code = data.useCaseCode;
            data.start_date = data.startDate;
            data.suggested_deadline = data.deadline;
            data.assignee = data.primaryAssignee ? (data.primaryAssignee.fullName || data.primaryAssignee.username) : null;
            
            setExistingTaskData(data);
          } else {
             // If we can't parse it, just create a dummy task
             setExistingTaskData({ title: activeDiffRisk.existing_task_title || "N/A" });
          }
        } catch (error) {
          console.error("Failed to fetch existing task", error);
          setExistingTaskData({ title: "Không tìm thấy dữ liệu (N/A)" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchExistingTask();
    } else {
        setExistingTaskData(null);
    }
  }, [isOpen, activeDiffRisk]);

  if (!isOpen || !activeDiffRisk || !activeDiffTask) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col animate-fade-in-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-teal-600">difference</span>
            So sánh & Xử lý Trùng lặp
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 bg-slate-50/50">
          
          {/* Left Side: Generated Task */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-blue-200 shadow-sm">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              Task AI vừa sinh
            </div>
            <EditableTaskCard 
              task={activeDiffTask}
              sprints={sprints}
              members={members}
              priorityColor={priorityColor}
              getTypeConfig={getTypeConfig}
              readOnlyMode={true}
            />
          </div>

          {/* VS Divider */}
          <div className="hidden md:flex flex-col items-center justify-center pt-10">
             <div className="w-10 h-10 bg-white border shadow-sm rounded-full flex items-center justify-center text-slate-400 font-bold text-sm">VS</div>
          </div>

          {/* Right Side: Existing Task */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-bold flex items-center justify-between border border-orange-200 shadow-sm">
              <div className="flex items-center gap-2">
                 <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                 Task đã tồn tại
              </div>
              <span className="text-[11px] bg-white text-orange-600 px-2 py-0.5 rounded-full font-bold shadow-sm">
                 Ghi nhận từ Hệ thống
              </span>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center p-12 bg-white rounded-lg border border-slate-200 border-dashed">
                 <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-orange-500 rounded-full"></div>
              </div>
            ) : existingTaskData ? (
              <EditableTaskCard 
                task={existingTaskData}
                sprints={sprints}
                members={members}
                priorityColor={priorityColor}
                getTypeConfig={getTypeConfig}
                readOnlyMode={true}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 bg-white rounded-lg border border-slate-200 border-dashed text-slate-400">
                 Không thể tải dữ liệu Task cũ
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t bg-white rounded-b-xl flex justify-end gap-3 flex-wrap">
           <button 
              onClick={() => onResolve('DELETE_GENERATED')} 
              className="px-5 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium rounded-lg transition-colors flex items-center gap-2"
           >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Xóa Task AI
           </button>
           
           <button 
              onClick={() => onResolve('KEEP_BOTH')} 
              className="px-5 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium rounded-lg transition-colors flex items-center gap-2 ml-auto"
           >
              <span className="material-symbols-outlined text-[18px]">call_split</span>
              Giữ cả hai (Tạo mới)
           </button>
           
           <button 
              onClick={() => onResolve('MERGE_INTO_EXISTING')} 
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
           >
              <span className="material-symbols-outlined text-[18px]">merge</span>
              Gộp vào Task cũ (Ghi đè)
           </button>
        </div>
      </div>
    </div>
  );
};

export default DuplicationDiffModal;
