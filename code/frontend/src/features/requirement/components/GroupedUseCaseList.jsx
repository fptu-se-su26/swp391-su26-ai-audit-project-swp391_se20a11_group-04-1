import React, { useMemo } from 'react';
import useProjectStore from '../../../store/useProjectStore';
import UseCaseItem from './UseCaseItem';
import UseCasePagination from './UseCasePagination';
import { taskService } from '../../kanban/services/taskService';
import { useState, useEffect } from 'react';

const ListHeader = () => (
  <div className="grid grid-cols-12 gap-3 bg-surface-container-low px-stack_md py-2.5 border-b border-outline-variant font-label-md text-label-md text-secondary uppercase tracking-wider rounded-t-xl">
    <div className="col-span-8 sm:col-span-4 md:col-span-4 lg:col-span-4">ID & Title</div>
    <div className="col-span-4 sm:col-span-3 hidden sm:block">Linked Req</div>
    <div className="col-span-2 hidden md:block">Primary Actor</div>
    <div className="col-span-3 lg:col-span-2 hidden lg:flex justify-center">Status</div>
    <div className="col-span-4 sm:col-span-2 lg:col-span-1 flex justify-end pr-2"></div>
  </div>
);

const GroupedUseCaseList = ({
  useCases,
  allUseCases = [],
  diagramData,
  onEdit,
  onDelete,
  onRefresh,
  pagination,
  onPageChange,
  isLeader
}) => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const [moduleTasks, setModuleTasks] = useState([]);

  useEffect(() => {
    if (!activeProject?.id) return;
    taskService.getProjectTasks(activeProject.id)
      .then(tasks => {
        const mt = (tasks || []).filter(t => t.type === 'MODULE_TASK');
        setModuleTasks(mt);
      })
      .catch(() => {});
  }, [activeProject?.id]);

  const getModulePriority = (moduleId) => {
    const task = moduleTasks.find(t => String(t.businessModuleId) === String(moduleId));
    return task?.priority || 'MEDIUM';
  };

  const groupedUseCases = useMemo(() => {
    const groups = {};
    useCases.forEach(uc => {
      const moduleName = uc.moduleName || 'General Module';
      const moduleId = uc.moduleId || 'unknown';
      if (!groups[moduleName]) {
        groups[moduleName] = {
          moduleName,
          moduleId,
          useCases: []
        };
      }
      groups[moduleName].useCases.push(uc);
    });
    
    return Object.values(groups).sort((a, b) => {
      if (a.moduleName === 'General Module') return 1;
      if (b.moduleName === 'General Module') return -1;
      return a.moduleName.localeCompare(b.moduleName);
    });
  }, [useCases]);

  if (!useCases || useCases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-gray-400 text-3xl">list_alt</span>
        </div>
        <h3 className="text-gray-900 font-semibold mb-1">No Use Cases Found</h3>
        <p className="text-gray-500 text-sm text-center">Try adjusting your filters or generate new use cases.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-visible pb-16">
      <ListHeader />
      
      <div className="flex flex-col">
        {groupedUseCases.map((group, groupIdx) => (
          <div key={groupIdx} className="flex flex-col">
            {/* Module Header */}
            <div className="bg-gradient-to-r from-surface-50 to-white px-5 py-3 border-y border-outline-variant flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E707D] to-[#165964] text-white shadow-sm border border-white">
                  <span className="material-symbols-outlined text-[16px]">view_module</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#111827] text-[14px]">{group.moduleName}</h3>
                    {group.moduleId !== 'unknown' && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        getModulePriority(group.moduleId) === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        getModulePriority(group.moduleId) === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        getModulePriority(group.moduleId) === 'LOW' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getModulePriority(group.moduleId)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center bg-[#1E707D]/10 text-[#1E707D] px-2.5 py-1 rounded-md gap-1">
                <span className="text-[12px] font-bold leading-none">{group.useCases.length}</span>
                <span className="text-[10px] font-semibold leading-none uppercase tracking-wider">Use Cases</span>
              </div>
            </div>
            
            {/* Module Items */}
            <div className="flex flex-col">
              {[...group.useCases].sort((a, b) => {
                const aClosed = a.status === 'CLOSED' || a.requirement?.status === 'CLOSED';
                const bClosed = b.status === 'CLOSED' || b.requirement?.status === 'CLOSED';
                if (aClosed && !bClosed) return 1;
                if (!aClosed && bClosed) return -1;
                return 0;
              }).map((uc) => (
                <div key={uc.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors pl-4">
                  <UseCaseItem
                    uc={uc}
                    allUseCases={allUseCases}
                    diagramData={diagramData}
                    onDelete={() => isLeader && onDelete && onDelete(uc.id)}
                    onEdit={() => isLeader && onEdit && onEdit(uc)}
                    onRefresh={onRefresh}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-outline-variant rounded-b-xl z-20">
          <UseCasePagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            totalElements={pagination.totalElements}
            pageSize={pagination.pageSize}
          />
        </div>
      )}
    </div>
  );
};

export default GroupedUseCaseList;
