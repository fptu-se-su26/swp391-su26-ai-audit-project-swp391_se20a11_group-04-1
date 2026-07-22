import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiCheckCircle, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { requirementApi } from '../services/requirementApi';
import { useCaseService } from '../services/useCaseService';
import { taskService } from '../../kanban/services/taskService';
import useProjectStore from '../../../store/useProjectStore';

const RequirementReviewModal = ({ requirement, onClose }) => {
  const { activeProject } = useProjectStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [useCases, setUseCases] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    fetchTreeData();
  }, []);

  const fetchTreeData = async () => {
    try {
      setLoading(true);
      // Fetch Use Cases
      const ucRes = await useCaseService.getAllUseCases(activeProject.id);
      // Filter Use Cases for this Requirement
      const filteredUc = (ucRes || []).filter(uc => uc.requirementId === requirement.id);
      setUseCases(filteredUc);

      // Fetch Tasks
      const tasksRes = await taskService.getProjectTasks(activeProject.id);
      // We only care about tasks that belong to the use cases of this requirement
      const ucIds = filteredUc.map(u => u.id);
      const filteredTasks = (tasksRes || []).filter(t => ucIds.includes(t.useCaseId) || t.requirementId === requirement.id);
      setTasks(filteredTasks);
    } catch (error) {
      console.error("Error fetching review data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const handleViewDetail = () => {
    onClose(false);
    navigate(`/projects/${activeProject?.id}/requirements/${requirement.id}`);
  };

  const progress = calculateProgress();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white w-[800px] max-h-[90vh] rounded-[16px] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-[24px] py-[20px] border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-[16px]">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1E707D]">assignment_turned_in</span>
              Leader Review: {requirement.reqCode}
            </h2>
            <p className="text-[13px] text-gray-500 mt-1">{requirement.title}</p>
          </div>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-[24px] bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <FiRefreshCw className="animate-spin text-[#1E707D] text-3xl mb-4" />
              <p className="text-gray-500">Loading requirement hierarchy...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Progress Summary */}
              <div className="bg-gray-50 rounded-[12px] p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-semibold text-gray-700">Implementation Progress</span>
                  <span className={`text-[14px] font-bold ${progress === 100 ? 'text-emerald-600' : 'text-[#1E707D]'}`}>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-[#1E707D]'}`} style={{ width: `${progress}%` }}></div>
                </div>
                <div className="mt-3 flex gap-4">
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <span className="material-symbols-outlined text-[16px] text-[#1E707D]">account_tree</span>
                    {useCases.length} Use Cases
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                    <span className="material-symbols-outlined text-[16px] text-blue-500">task_alt</span>
                    {tasks.length} Tasks
                  </div>
                </div>
              </div>

              {/* Hierarchy Tree */}
              <div>
                <h3 className="text-[15px] font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">account_tree</span>
                  Hierarchy Trace
                </h3>
                
                {useCases.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="text-gray-500 text-[13px]">No Use Cases found for this Requirement.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 pl-2">
                    {useCases.map(uc => {
                      const ucTasks = tasks.filter(t => t.useCaseId === uc.id);
                      const ucCompletedTasks = ucTasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
                      
                      return (
                        <div key={uc.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[11px] font-bold">{uc.ucCode || 'UC'}</span>
                              <span className="text-[14px] font-semibold text-gray-800">{uc.name}</span>
                            </div>
                            <div className="text-[12px] text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                              {ucCompletedTasks} / {ucTasks.length} Tasks Done
                            </div>
                          </div>
                          
                          <div className="p-3 bg-white flex flex-col gap-2">
                            {ucTasks.length === 0 ? (
                              <p className="text-[12px] text-gray-400 italic pl-2">No tasks created yet.</p>
                            ) : (
                              ucTasks.map(task => (
                                <div key={task.id} className="flex items-center gap-3 pl-4 py-1">
                                  <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0">
                                    {(task.status === 'DONE' || task.status === 'COMPLETED') ? (
                                      <FiCheckCircle className="text-emerald-500" size={14} />
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                    )}
                                  </div>
                                  <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 rounded font-bold shrink-0">
                                    {task.taskCode || 'TASK'}
                                  </span>
                                  <span className={`text-[13px] truncate ${task.status === 'DONE' || task.status === 'COMPLETED' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                    {task.title}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-[24px] py-[16px] border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-[16px]">
          <button 
            onClick={handleViewDetail}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#1E707D] bg-white border border-[#1E707D] rounded-lg hover:bg-gray-50 shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            View Detail
          </button>
          <button 
            onClick={() => onClose(false)}
            className="px-5 py-2 text-[13px] font-medium text-white bg-[#1E707D] rounded-lg hover:bg-[#15545e] shadow-sm transition-colors"
          >
            Close Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequirementReviewModal;
