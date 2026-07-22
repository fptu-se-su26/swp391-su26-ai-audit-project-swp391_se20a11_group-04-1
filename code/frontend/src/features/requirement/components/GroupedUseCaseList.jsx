import React, { useMemo, useState, useEffect } from 'react';
import useProjectStore from '../../../store/useProjectStore';
import UseCaseItem from './UseCaseItem';
import UseCasePagination from './UseCasePagination';
import ModuleFormModal from './ModuleFormModal';
import { useCaseService } from '../services/useCaseService';
import { businessModuleService } from '../services/businessModuleService';
import Button from '../../../components/ui/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';

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
  isLeader,
  onApprove,
  onReject,
  isDraftView,
  hasFilters
}) => {
  const { activeProject } = useProjectStore();
  const [modules, setModules] = useState([]); // BusinessModules from backend
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModule, setDeletingModule] = useState(null);

  useEffect(() => {
    if (!activeProject?.id) return;
    businessModuleService.getModulesByProject(activeProject.id)
      .then(mods => setModules(mods || []))
      .catch(() => {});
  }, [activeProject?.id, useCases]); // refresh modules when useCases change (or trigger refresh)

  const getModulePriority = (moduleId) => {
    const task = modules.find(m => String(m.id) === String(moduleId));
    return task?.priority || 'MEDIUM';
  };

  const groupedUseCases = useMemo(() => {
    const groups = {};
    
    modules.forEach(m => {
      groups[m.name] = {
        moduleName: m.name,
        moduleId: m.id,
        useCases: []
      };
    });

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
    
    return Object.values(groups).filter(g => {
       if (isDraftView) {
          return g.moduleName === 'General Module' || g.useCases.length > 0;
       }
       if (hasFilters) {
          return g.useCases.length > 0;
       }
       // Only show empty modules on the first page
       if (pagination && pagination.currentPage > 0) {
          return g.useCases.length > 0;
       }
       return true;
    }).sort((a, b) => {
      if (a.moduleName === 'General Module') return 1;
      if (b.moduleName === 'General Module') return -1;
      return a.moduleName.localeCompare(b.moduleName);
    });
  }, [useCases, modules, isDraftView]);

  const handleDragStart = (e, ucId, sourceModuleId, sourceModuleName) => {
    if (!isLeader) {
       e.preventDefault();
       return;
    }
    e.dataTransfer.setData("text/plain", JSON.stringify({ ucId, sourceModuleId, sourceModuleName }));
  };

  const handleDragOver = (e) => {
    if (!isLeader) return;
    e.preventDefault();
  };

  const handleDrop = async (e, targetModuleId, targetModuleName) => {
    if (!isLeader) return;
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.sourceModuleName === targetModuleName) return;
      
      const targetUc = useCases.find(u => u.id === data.ucId);
      if (targetUc) {
         const payload = {
             ...targetUc,
             requirementId: targetUc.requirement?.id || targetUc.requirementId || null,
             moduleId: targetModuleId === 'unknown' ? null : targetModuleId,
             moduleName: targetModuleName === 'General Module' ? null : targetModuleName
         };
         delete payload.requirement;
         delete payload.module;
         delete payload.creator;
         delete payload.updater;

         await useCaseService.updateUseCase(targetUc.id, payload, activeProject?.id);
         if (onRefresh) onRefresh();
      }
    } catch(err) {
      console.error(err);
    }
  };

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
      {isLeader && (
        <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-white rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-800">Modules</h2>
          <Button variant="primary" onClick={() => setIsModuleModalOpen(true)} className="py-1.5 px-4 text-sm shadow-sm rounded-lg">
            <span className="material-symbols-outlined text-[16px] mr-1.5">add</span> Create Module
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 p-6 bg-surface-container-lowest">
        {groupedUseCases.map((group, groupIdx) => (
          <div 
            key={groupIdx} 
            className="flex flex-col border border-outline-variant rounded-xl shadow-sm bg-white"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, group.moduleId, group.moduleName)}
          >
            {/* Module Header */}
            <div className="group bg-gradient-to-r from-surface-50 to-white px-5 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
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
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center bg-[#1E707D]/10 text-[#1E707D] px-2.5 py-1 rounded-md gap-1">
                  <span className="text-[12px] font-bold leading-none">{group.useCases.length}</span>
                  <span className="text-[10px] font-semibold leading-none uppercase tracking-wider">Use Cases</span>
                </div>
                {isLeader && group.moduleId !== 'unknown' && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button title="Edit Module" onClick={() => setEditingModule(modules.find(m => m.id === group.moduleId))} className="p-1 flex items-center text-gray-400 hover:text-[#1E707D] rounded hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                     </button>
                     <button title="Delete Module" onClick={() => setDeletingModule(modules.find(m => m.id === group.moduleId))} className="p-1 flex items-center text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                     </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Module Items */}
            <div className="flex flex-col min-h-[40px] p-3 bg-gray-50/30 grow">
              <div className="flex flex-col gap-3">
              {group.useCases.length === 0 ? (
                <div className="flex items-center justify-center p-4 text-sm text-gray-400 italic bg-white rounded-lg border border-dashed border-gray-200">
                  {isLeader ? "Drag and drop Use Cases here" : "No Use Cases in this module"}
                </div>
              ) : (
                [...group.useCases].sort((a, b) => {
                  const aClosed = a.status === 'CLOSED' || a.requirement?.status === 'CLOSED';
                  const bClosed = b.status === 'CLOSED' || b.requirement?.status === 'CLOSED';
                  if (aClosed && !bClosed) return 1;
                  if (!aClosed && bClosed) return -1;
                  return 0;
                }).map((uc) => (
                  <div 
                    key={uc.id} 
                    className={`transition-colors ${isLeader ? "cursor-grab active:cursor-grabbing" : ""}`}
                    draggable={isLeader}
                    onDragStart={(e) => handleDragStart(e, uc.id, group.moduleId, group.moduleName)}
                  >
                    <UseCaseItem
                      uc={uc}
                      allUseCases={allUseCases}
                      diagramData={diagramData}
                      onDelete={() => isLeader && onDelete && onDelete(uc.id)}
                      onEdit={() => isLeader && onEdit && onEdit(uc)}
                      onRefresh={onRefresh}
                      onApprove={isDraftView ? onApprove : undefined}
                      onReject={isDraftView ? onReject : undefined}
                      layoutMode="card"
                    />
                  </div>
                ))
              )}
              </div>
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

      <ModuleFormModal 
        isOpen={isModuleModalOpen || !!editingModule}
        initialData={editingModule}
        onClose={() => {
          setIsModuleModalOpen(false);
          setEditingModule(null);
        }}
        onSuccess={() => {
          setIsModuleModalOpen(false);
          setEditingModule(null);
          businessModuleService.getModulesByProject(activeProject.id).then(mods => setModules(mods || []));
          if (onRefresh) onRefresh();
        }}
      />

      <ConfirmModal
        isOpen={!!deletingModule}
        title="Delete Module"
        message={`Are you sure you want to delete module "${deletingModule?.name}"? Use cases within this module will be moved to the General Module.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={async () => {
          try {
             await businessModuleService.deleteModule(activeProject.id, deletingModule.id);
             toast.success('Module deleted successfully');
             businessModuleService.getModulesByProject(activeProject.id).then(mods => setModules(mods || []));
             if (onRefresh) onRefresh();
          } catch(err) {
             console.error(err);
             toast.error(err.response?.data?.message || 'Failed to delete module');
          } finally {
             setDeletingModule(null);
          }
        }}
        onCancel={() => setDeletingModule(null)}
      />
    </div>
  );
};

export default GroupedUseCaseList;
