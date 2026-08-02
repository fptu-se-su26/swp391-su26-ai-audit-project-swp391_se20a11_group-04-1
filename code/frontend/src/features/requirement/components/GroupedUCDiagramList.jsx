import React, { useMemo, useState, useEffect } from 'react';
import UCDiagramEditorPage from '../pages/UCDiagramEditorPage';
import { useCaseService } from '../services/useCaseService';
import { businessModuleService } from '../services/businessModuleService';
import { diagramService } from '../services/diagramService';
import toast from 'react-hot-toast';

// --- Avatar component (real avatar URL or initials fallback) ---
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

  const colors = ['#1E707D', '#2D9CDB', '#6C63FF', '#E84393', '#F97316', '#10B981'];
  const colorIndex = name.charCodeAt(0) % colors.length;
  return (
    <div
      title={name}
      style={{ width: size, height: size, background: colors[colorIndex], fontSize: size * 0.38 }}
      className="rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm flex-shrink-0 select-none"
    >
      {initials}
    </div>
  );
};

// --- Module Thumbnail ---
const ModuleThumbnail = ({ projectId, moduleId, refreshKey }) => {
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setImageBase64(null);
    const fetchLayout = async () => {
      try {
        const layoutData = await diagramService.getDiagramLayout(projectId, moduleId);
        if (isMounted && layoutData && layoutData.imageBase64) {
          setImageBase64(layoutData.imageBase64);
        }
      } catch {
        // no preview, silent fail
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchLayout();
    return () => { isMounted = false; };
  }, [projectId, moduleId, refreshKey]);

  if (loading) {
    return (
      <div className="w-full h-28 bg-gray-50 animate-pulse border-t border-gray-100 flex items-center justify-center">
        <div className="text-gray-300 text-[10px] uppercase tracking-widest font-semibold">Loading...</div>
      </div>
    );
  }

  if (!imageBase64) {
    return (
      <div className="w-full h-28 border-t border-gray-100 bg-gray-50/40 flex flex-col items-center justify-center gap-1 opacity-50">
        <span className="material-symbols-outlined text-[28px] text-gray-400">schema</span>
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">No Preview</span>
      </div>
    );
  }

  return (
    <div className="w-full h-28 border-t border-gray-100 overflow-hidden bg-white relative">
      <img
        src={imageBase64}
        alt="Diagram Preview"
        className="w-full h-full object-contain p-1.5 opacity-90 group-hover/card:opacity-100 group-hover/card:scale-105 transition-all duration-500 origin-center"
      />
    </div>
  );
};

// --- Main Component ---
const GroupedUCDiagramList = ({
  projectId,
  allUseCases = [],
  isLeader,
  currentUserId,
  projectMembers = [],
  onApproveUseCase,
  onRejectUseCase,
  onRefresh,
  diagramTab,           // 'module' | 'overview'
  onDiagramTabChange    // callback(tab)
}) => {
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [editorMode, setEditorMode] = useState('view');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [modules, setModules] = useState([]); // BusinessModules from backend
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.assignee-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!projectId) return;
    businessModuleService.getModulesByProject(projectId)
      .then(mods => setModules(mods || []))
      .catch(() => {});
  }, [projectId, refreshKey, allUseCases]); // refresh when allUseCases changes (e.g. after module delete)

  // Group use cases by module
  const groupedModules = useMemo(() => {
    const groups = {};
    
    modules.forEach(m => {
      groups[m.id] = {
        moduleId: m.id,
        moduleName: m.name,
        useCases: []
      };
    });

    allUseCases.forEach(uc => {
      const moduleId = uc.moduleId || 'unknown';
      if (!groups[moduleId]) {
        groups[moduleId] = {
          moduleId,
          moduleName: uc.moduleName || 'General Module',
          useCases: []
        };
      }
      groups[moduleId].useCases.push(uc);
    });
    return Object.values(groups).sort((a, b) => {
      if (a.moduleName === 'General Module') return 1;
      if (b.moduleName === 'General Module') return -1;
      return a.moduleName.localeCompare(b.moduleName);
    });
  }, [allUseCases, modules]);

  // Get assignee for each module
  const getModuleAssignee = (moduleId) => {
    const mod = modules.find(m => String(m.id) === String(moduleId));
    if (mod && mod.assigneeId) {
      return { id: mod.assigneeId, name: mod.assigneeName, username: mod.assigneeUsername, avatarUrl: mod.assigneeAvatar };
    }
    return null;
  };

  // Get priority for each module (not applicable for BusinessModule anymore, just return MEDIUM for now)
  const getModulePriority = (moduleId) => {
    return 'MEDIUM';
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

  const handleAssignMember = async (moduleId, moduleName, memberId, e) => {
    e.stopPropagation();
    setActiveDropdown(null);
    try {
      if (moduleId === 'unknown') {
         toast.error("Cannot assign member to General Module");
         return;
      }
      await businessModuleService.assignMember(projectId, moduleId, memberId);
      setRefreshKey(k => k + 1); // Refresh modules
      toast.success("Assigned member successfully");
    } catch (err) {
      console.error("Failed to assign member", err);
      toast.error("Failed to assign member");
    }
  };

  const handleClose = () => {
    setActiveModuleId(null);
    setRefreshKey(k => k + 1); // refresh thumbnails after editing
  };

  // --- Diagram view when a module is opened ---
  if (activeModuleId) {
    const activeGroup = groupedModules.find(g => g.moduleId === activeModuleId);

    return (
      <div className="flex flex-col h-full bg-surface-container-lowest">
        <div className="flex-1 overflow-hidden">
          <UCDiagramEditorPage
            projectId={projectId}
            mode={editorMode}
            onClose={handleClose}
            onEdit={canEditModule(activeModuleId) ? () => setEditorMode('edit') : undefined}
            onView={() => setEditorMode('view')}
            activeView="module"
            currentModuleId={activeModuleId}
            currentModuleName={activeGroup?.moduleName || 'System'}
            isLeader={isLeader}
          />
        </div>


      </div>
    );
  }

  // --- Module card list view ---
  return (
    <div className="flex flex-col h-full">
      {/* Sub-tabs: Module | Overview */}
      <div className="flex items-center gap-1 px-6 pt-5 pb-3 border-b border-gray-100">
        <button
          onClick={() => onDiagramTabChange?.('module')}
          className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold transition-all ${
            diagramTab === 'module'
              ? 'text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-primary hover:bg-primary/5'
          }`}
          style={diagramTab === 'module' ? { background: 'linear-gradient(135deg, #278A99 0%, #1E707D 60%, #165964 100%)' } : {}}
        >
          <span className="material-symbols-outlined text-[16px]">view_module</span>
          Module
        </button>
        <button
          onClick={() => onDiagramTabChange?.('overview')}
          className={`flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-semibold transition-all ${
            diagramTab === 'overview'
              ? 'text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-primary hover:bg-primary/5'
          }`}
          style={diagramTab === 'overview' ? { background: 'linear-gradient(135deg, #278A99 0%, #1E707D 60%, #165964 100%)' } : {}}
        >
          <span className="material-symbols-outlined text-[16px]">hub</span>
          Overview
        </button>
        <span className="ml-2 text-[11px] text-gray-400 font-medium">
          {diagramTab === 'module' ? 'Click a module to view / edit its diagram' : 'Full project overview — read-only for members'}
        </span>
      </div>

      {/* Module Cards Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {groupedModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-outline-variant rounded-2xl shadow-sm">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-[40px]">architecture</span>
            </div>
            <span className="text-on-surface font-semibold text-lg mb-1">No Diagrams Found</span>
            <span className="text-on-surface-variant text-sm text-center max-w-md">
              There are no use cases to display in the diagram viewer yet.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupedModules.map(group => {
              const assignee = getModuleAssignee(group.moduleId);
              const editable = canEditModule(group.moduleId);

              return (
                <div
                  key={group.moduleId}
                  onClick={() => {
                    setActiveModuleId(group.moduleId);
                    setEditorMode('view');
                  }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-primary/40 transition-all duration-300 overflow-hidden flex flex-col group/card cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between p-4 bg-gradient-to-br from-[#f0fafa] to-white border-b border-gray-100 relative z-20">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -z-0 transition-transform duration-500 group-hover/card:scale-125" />
                    <div className="flex items-center gap-3 z-10 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#165964] text-white shadow-md border-2 border-white flex-shrink-0">
                        <span className="material-symbols-outlined text-[20px]">view_module</span>
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-gray-800 text-[14px] truncate block">{group.moduleName}</span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            editable
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-50 text-gray-500 border border-gray-200'
                          }`}>
                            <span className="material-symbols-outlined text-[10px]">{editable ? 'edit' : 'visibility'}</span>
                            {editable ? 'Editable' : 'View only'}
                          </span>
                          
                          {/* Priority Badge */}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            getModulePriority(group.moduleId) === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                            getModulePriority(group.moduleId) === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                            getModulePriority(group.moduleId) === 'LOW' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {getModulePriority(group.moduleId)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Assignee Avatar */}
                    <div className="z-10 flex-shrink-0 ml-2 relative assignee-dropdown-container">
                      <div 
                        className={`flex items-center gap-1.5 ${isLeader ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 rounded-full transition-all' : ''}`}
                        title={assignee ? `Assigned to: ${assignee.name || assignee.username}` : "No assignee"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isLeader) {
                            setActiveDropdown(activeDropdown === group.moduleId ? null : group.moduleId);
                          }
                        }}
                      >
                        {assignee ? (
                          <AssigneeAvatar user={assignee} size={30} />
                        ) : (
                          <div className="w-[30px] h-[30px] rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px] text-gray-400">person</span>
                          </div>
                        )}
                        {isLeader && (
                          <span className="material-symbols-outlined text-[12px] text-gray-400 bg-white rounded-full absolute -bottom-1 -right-1 shadow-sm">arrow_drop_down</span>
                        )}
                      </div>

                      {/* Dropdown Menu */}
                      {activeDropdown === group.moduleId && isLeader && (
                        <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden py-1" onClick={e => e.stopPropagation()}>
                          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">Assign to...</div>
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            <button
                              onClick={(e) => handleAssignMember(group.moduleId, group.moduleName, null, e)}
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
                                onClick={(e) => handleAssignMember(group.moduleId, group.moduleName, member.id, e)}
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                <AssigneeAvatar user={member} size={24} />
                                <span className="truncate flex-1">{member.name || member.username}</span>
                                {assignee?.id === member.id && (
                                  <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail (preview image saved from diagram) */}
                  <ModuleThumbnail projectId={projectId} moduleId={group.moduleId} refreshKey={refreshKey} />

                  {/* Footer Stats */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/60 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="material-symbols-outlined text-[14px]">account_tree</span>
                      <span className="text-[12px] font-medium">Use Case Diagram</span>
                    </div>
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/10">
                      <span className="text-[12px] font-bold leading-none">{group.useCases.length}</span>
                      <span className="text-[10px] font-semibold leading-none">Nodes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupedUCDiagramList;
