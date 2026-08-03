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

const AssigneeAvatar = ({ user, size = 24 }) => {
  if (!user) return null;
  const name = user.name || user.fullName || user.username || '?';
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarUrl = user.avatarUrl || user.avatar || null;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling?.style?.removeProperty('display'); }}
      />
    );
  }
  return (
    <div
      title={name}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-primary text-white flex items-center justify-center font-bold border-2 border-white shadow-sm flex-shrink-0"
    >
      {initials}
    </div>
  );
};


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
  hasFilters,
  currentUserId,
  projectMembers = [],
  onAddUseCase,
  moduleRefreshTrigger = 0
}) => {
  const { activeProject } = useProjectStore();
  const [modules, setModules] = useState([]); // BusinessModules from backend
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModule, setDeletingModule] = useState(null);
  // deleteMode: 'confirm' = show choice dialog, 'deleteUCs' = confirmed delete UCs too, 'keepUCs' = keep UCs in General
  const [deleteMode, setDeleteMode] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    if (!activeProject?.id) return;
    businessModuleService.getModulesByProject(activeProject.id)
      .then(mods => setModules(mods || []))
      .catch(() => {});
  }, [activeProject?.id, useCases, moduleRefreshTrigger]); // refresh modules khi useCases thay đổi hoặc trigger từ parent

  const getModulePriority = (moduleId) => {
    const task = modules.find(m => String(m.id) === String(moduleId));
    return task?.priority || 'MEDIUM';
  };

  const groupedUseCases = useMemo(() => {
    const groups = {};

    modules.forEach(m => {
      // Ensure moduleId is always a clean number/string, never an object
      const cleanId = m.id != null ? parseInt(String(m.id), 10) : 'unknown';
      groups[m.name] = {
        moduleName: m.name,
        moduleId: isNaN(cleanId) ? 'unknown' : cleanId,
        useCases: []
      };
    });

    useCases.forEach(uc => {
      const moduleName = uc.moduleName || 'General Module';
      const rawId = uc.moduleId;
      const cleanId = rawId != null ? parseInt(String(rawId), 10) : NaN;
      const moduleId = isNaN(cleanId) ? 'unknown' : cleanId;
      if (!groups[moduleName]) {
        groups[moduleName] = { moduleName, moduleId, useCases: [] };
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

  // Get assignee for each module
  const getModuleAssignee = (moduleId) => {
    const mod = modules.find(m => String(m.id) === String(moduleId));
    if (mod && mod.assigneeId) {
      return { id: mod.assigneeId, name: mod.assigneeName, username: mod.assigneeUsername, avatarUrl: mod.assigneeAvatar };
    }
    return null;
  };

  // Check if current user is the assignee for a module
  const isModuleAssignee = (moduleId) => {
    const assignee = getModuleAssignee(moduleId);
    return assignee && String(assignee.id) === String(currentUserId);
  };

  // Can edit a module: Leader always can, assignee of that module can, others cannot
  const canEditModule = (moduleId) => {
    return isLeader || isModuleAssignee(moduleId);
  };

  const handleAssignMember = async (moduleId, memberId, e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    try {
      if (moduleId === 'unknown') {
         toast.error("Cannot assign member to General Module");
         return;
      }
      await businessModuleService.assignMember(activeProject?.id, moduleId, memberId);
      if (onRefresh) onRefresh(); // Refresh the list
      toast.success("Assigned member successfully");
    } catch (err) {
      console.error("Failed to assign member", err);
      toast.error("Failed to assign member");
    }
  };

  const handleDragStart = (e, ucId, sourceModuleId, sourceModuleName) => {
    if (!canEditModule(sourceModuleId)) {
       e.preventDefault();
       return;
    }
    e.dataTransfer.setData("text/plain", JSON.stringify({ ucId, sourceModuleId, sourceModuleName }));
  };

  const handleDragOver = (e, targetModuleId) => {
    if (!canEditModule(targetModuleId)) return;
    e.preventDefault();
  };

  const handleDrop = async (e, targetModuleId, targetModuleName) => {
    if (!canEditModule(targetModuleId)) return;
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


  if ((!useCases || useCases.length === 0) && modules.length === 0) {
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
            <div className="group bg-gradient-to-r from-surface-50 to-white px-5 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
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
                {/* Module Assignee Dropdown */}
                {group.moduleId !== 'unknown' && (
                  <div className="z-10 flex-shrink-0 ml-2 relative assignee-dropdown-container">
                    <div 
                      className={`flex items-center gap-1.5 ${isLeader ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 rounded-full transition-all' : ''}`}
                      title={getModuleAssignee(group.moduleId) ? `Assigned to: ${getModuleAssignee(group.moduleId).name || getModuleAssignee(group.moduleId).username}` : "No assignee"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLeader) {
                          setActiveDropdown(activeDropdown === group.moduleId ? null : group.moduleId);
                        }
                      }}
                    >
                      {getModuleAssignee(group.moduleId) ? (
                        <AssigneeAvatar user={getModuleAssignee(group.moduleId)} size={28} />
                      ) : (
                        <div className="w-[28px] h-[28px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px] text-gray-400">person</span>
                        </div>
                      )}
                      {isLeader && (
                        <span className="material-symbols-outlined text-[12px] text-gray-400 bg-white rounded-full absolute -bottom-1 -right-1 shadow-sm">arrow_drop_down</span>
                      )}
                    </div>

                    {activeDropdown === group.moduleId && isLeader && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden py-1" onClick={e => e.stopPropagation()}>
                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">Assign to...</div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                          <button
                            onClick={(e) => handleAssignMember(group.moduleId, null, e)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <div className="w-[24px] h-[24px] rounded-full border border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                              <span className="material-symbols-outlined text-[12px] text-gray-400">close</span>
                            </div>
                            <span className="text-gray-500 italic">Unassigned</span>
                          </button>
                          {projectMembers.map(member => (
                            <button
                              key={member.id}
                              onClick={(e) => handleAssignMember(group.moduleId, member.id, e)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <AssigneeAvatar user={member} size={24} />
                              <span className="truncate flex-1">{member.name || member.username}</span>
                              {getModuleAssignee(group.moduleId)?.id === member.id && (
                                <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {canEditModule(group.moduleId) && group.moduleId !== 'unknown' && (
                  <button 
                    title="Add Use Case" 
                    onClick={() => onAddUseCase && onAddUseCase(group.moduleId)} 
                    className="flex items-center gap-1 bg-[#1E707D] text-white px-2 py-1 rounded-md text-[11px] font-semibold shadow-sm hover:bg-[#165964] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Add UC
                  </button>
                )}

                {/* Delete button: leaders can delete any module, including General Module */}
                {isLeader && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     {group.moduleId !== 'unknown' && (
                       <button title="Edit Module" onClick={() => setEditingModule(modules.find(m => String(m.id) === String(group.moduleId)))} className="p-1 flex items-center text-gray-400 hover:text-[#1E707D] rounded hover:bg-gray-100 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                       </button>
                     )}
                     <button
                       title="Delete Module"
                       onClick={() => {
                         if (group.moduleId === 'unknown') {
                           setDeletingModule({ id: 'unknown', name: 'General Module', isGeneral: true });
                         } else {
                           const found = modules.find(m => String(m.id) === String(group.moduleId));
                           if (!found) { toast.error('Module not found'); return; }
                           setDeletingModule(found);
                         }
                         setDeleteMode('confirm');
                       }}
                       className="p-1 flex items-center text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                     >
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
                  {canEditModule(group.moduleId) ? "Drag and drop Use Cases here" : "No Use Cases in this module"}
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
                    className={`transition-colors ${canEditModule(group.moduleId) ? "cursor-grab active:cursor-grabbing" : ""}`}
                    draggable={canEditModule(group.moduleId)}
                    onDragStart={(e) => handleDragStart(e, uc.id, group.moduleId, group.moduleName)}
                  >
                    <UseCaseItem
                      uc={uc}
                      allUseCases={allUseCases}
                      diagramData={diagramData}
                      onDelete={() => canEditModule(group.moduleId) && onDelete && onDelete(uc.id)}
                      onEdit={() => canEditModule(group.moduleId) && onEdit && onEdit(uc)}
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

      {/* Delete Module compact choice dialog */}
      {deletingModule && deleteMode === 'confirm' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">

            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-500 text-[18px]">delete</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm leading-tight truncate">
                  Delete "{deletingModule.name}"
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {deletingModule.isGeneral ? 'Choose what to do with unassigned Use Cases' : 'Choose what to do with its Use Cases'}
                </p>
              </div>
              <button onClick={() => { setDeletingModule(null); setDeleteMode(null); }} className="text-gray-400 hover:text-gray-600 shrink-0">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Options */}
            <div className="px-4 pb-4 space-y-2">
              {/* Delete UCs too */}
              <button
                onClick={async () => {
                  setDeleteMode(null);
                  try {
                    if (deletingModule.isGeneral) {
                      // Fetch ALL UCs for project (including addedFromDiagram ones) to avoid missing any
                      const allProjectUCs = await useCaseService.getAllUseCases(activeProject.id);
                      const generalUCs = allProjectUCs.filter(uc => !uc.moduleId);
                      if (generalUCs.length === 0) {
                        toast.success('No Use Cases to delete');
                      } else {
                        await Promise.all(generalUCs.map(uc => useCaseService.deleteUseCase(uc.id, activeProject.id)));
                        toast.success(`Deleted ${generalUCs.length} Use Case(s)`);
                      }
                    } else {
                      await businessModuleService.deleteModule(activeProject.id, deletingModule.id);
                      toast.success('Module deleted');
                    }
                    businessModuleService.getModulesByProject(activeProject.id).then(mods => setModules(mods || []));
                    if (onRefresh) onRefresh();
                  } catch (err) {
                    console.error(err);
                    toast.error(err.response?.data?.message || 'Failed to delete');
                  } finally { setDeletingModule(null); }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all text-left"
              >
                <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0">delete_sweep</span>
                <div>
                  <p className="text-sm font-semibold text-red-700 leading-none">Delete all Use Cases</p>
                  <p className="text-[11px] text-red-400 mt-0.5">Cannot be undone</p>
                </div>
              </button>

              {/* Keep in General (only for real modules) */}
              {!deletingModule.isGeneral && (
                <button
                  onClick={async () => {
                    setDeleteMode(null);
                    try {
                      const moduleUCs = useCases.filter(uc => String(uc.moduleId) === String(deletingModule.id));
                      await Promise.all(moduleUCs.map(uc =>
                        useCaseService.updateUseCase(uc.id, {
                          ...uc,
                          requirementId: uc.requirement?.id || uc.requirementId || null,
                          moduleId: null, moduleName: null,
                        }, activeProject.id)
                      ));
                      await businessModuleService.deleteModule(activeProject.id, deletingModule.id);
                      toast.success('Module deleted, Use Cases kept in General');
                      businessModuleService.getModulesByProject(activeProject.id).then(mods => setModules(mods || []));
                      if (onRefresh) onRefresh();
                    } catch (err) {
                      console.error(err);
                      toast.error(err.response?.data?.message || 'Failed');
                    } finally { setDeletingModule(null); }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all text-left"
                >
                  <span className="material-symbols-outlined text-gray-500 text-[18px] shrink-0">move_down</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 leading-none">Move to General Module</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Keep Use Cases, remove module</p>
                  </div>
                </button>
              )}

              <button
                onClick={() => { setDeletingModule(null); setDeleteMode(null); }}
                className="w-full text-center py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupedUseCaseList;
