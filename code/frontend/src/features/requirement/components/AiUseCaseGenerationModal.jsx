import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { normalizeFlowToText } from '../../../utils/flowFormatter';
import { useCaseService } from '../services/useCaseService';
import { requirementService } from '../services/requirementService';
import Button from '../../../components/ui/Button';
import axiosInstance from '../../../api/axiosConfig';
import ConfirmModal from '../../../components/ui/ConfirmModal';

const today = new Date().toISOString().split('T')[0];

const AiUseCaseGenerationModal = ({ isOpen, onClose, generationId, onSuccess, onFullyCovered }) => {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [useCases, setUseCases] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  const [projectId, setProjectId] = useState(null);
  const [viewMode, setViewMode] = useState('grouped'); // 'list' or 'grouped'
  const [requirements, setRequirements] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState(null);
  const [moduleDefs, setModuleDefs] = useState([]);
  const [existingUseCases, setExistingUseCases] = useState([]);
  
  const activeMembers = projectMembers;

  const handleScrollOnDrag = (e) => {
    if (!e.clientY) return;
    const container = document.getElementById('ai-gen-scroll-container');
    if (!container) return;
    const { top, bottom } = container.getBoundingClientRect();
    const threshold = 100;
    if (e.clientY - top < threshold) {
      container.scrollTop -= 20;
    } else if (bottom - e.clientY < threshold) {
      container.scrollTop += 20;
    }
  };

  useEffect(() => {
    if (isOpen && generationId) {
      setLoading(true);
        useCaseService.getGenerationById(generationId)
        .then(async data => {
          if (data.stage !== 'USE_CASE') {
            toast.error("Không thể hiển thị do bản nháp này không phải là Use Case.");
            onClose();
            return;
          }
          const pId = data.project;
          setProjectId(pId);
          
          let existingUcs = [];

          // Fetch requirements for mapping IDs
          if (pId) {
            try {
              const reqs = await requirementService.getRequirements(pId);
              setRequirements(reqs || []);
            } catch (err) {
              console.error("Failed to fetch requirements", err);
            }
            
            // Fetch project members
            try {
              const res = await axiosInstance.get(`/v1/projects/${pId}`);
              const proj = res.data?.data || res.data;
              if (proj && proj.members) {
                 setProjectMembers(proj.members);
              }
            } catch (err) {
              console.error("Failed to fetch project members", err);
            }
            
            // Fetch existing Use Cases for duplicate check
            try {
              existingUcs = await useCaseService.getAllUseCases(pId);
              setExistingUseCases(existingUcs || []);
            } catch (err) {
              console.error("Failed to fetch existing use cases", err);
            }

          }

          let payloadData = data.payload || [];
          if (typeof payloadData === 'string') {
            try { payloadData = JSON.parse(payloadData); } catch(e) {}
          }

          if (!Array.isArray(payloadData) && typeof payloadData === 'object' && payloadData !== null) {
            for (const key in payloadData) {
              if (Array.isArray(payloadData[key])) {
                payloadData = payloadData[key];
                break;
              }
            }
          }

          if (Array.isArray(payloadData)) {
            // Check duplicates and format flows
            const existingNames = new Set((existingUcs || []).map(u => u.name.trim().toLowerCase()));
            payloadData = payloadData.map(uc => ({
              ...(uc || {}),
              isDuplicate: uc?.name ? existingNames.has(uc.name.trim().toLowerCase()) : false,
              mainSuccessScenario: normalizeFlowToText(uc?.mainSuccessScenario || uc?.mainFlow || uc?.mainFlows),
              alternativeFlows: normalizeFlowToText(uc?.alternativeFlows || uc?.alternativeFlow)
            }));
          }
          setUseCases(Array.isArray(payloadData) ? payloadData : []);
          
          const initialModules = [];
          const moduleSet = new Set();
          (Array.isArray(payloadData) ? payloadData : []).forEach(uc => {
            const mName = uc.moduleName || 'General Module';
            if (!moduleSet.has(mName)) {
              moduleSet.add(mName);
              initialModules.push({
                moduleName: mName,
                priority: uc.modulePriority || 'MEDIUM',
                assignee: uc.moduleAssignee || 'System'
              });
            }
          });
          setModuleDefs(initialModules);

          const validIndices = (Array.isArray(payloadData) ? payloadData : [])
            .map((uc, i) => ({uc, i}))
            .filter(({uc}) => uc && !uc.isDuplicate && !uc.isDeleted)
            .map(({i}) => i);
          
          setSelectedIndices(new Set(validIndices));

          // If AI produced nothing new → close and notify parent
          if (validIndices.length === 0) {
            onClose();
            onFullyCovered?.();
          }
          setLoading(false);
        })
        .catch(err => {
          const detail = err.response?.data?.details || err.response?.data?.error || err.message;
          console.error("Failed to load AI generation data. Detail:", detail);
          toast.error("Lỗi tải Use Case: " + (err.response?.data?.error || ""));
          setLoading(false);
        });
    }
  }, [isOpen, generationId]);

  const reqMap = useMemo(() => {
    const m = new Map();
    requirements.forEach(r => m.set(r.id, r.reqCode || `REQ-${r.id}`));
    requirements.forEach(r => m.set(String(r.id), r.reqCode || `REQ-${r.id}`));
    return m;
  }, [requirements]);

  const getReqDisplay = (ids, singleId) => {
    if (ids && ids.length > 0) {
      return ids.map(id => reqMap.get(id) || reqMap.get(String(id)) || `REQ-${id}`).join(', ');
    }
    if (singleId) {
      return reqMap.get(singleId) || reqMap.get(String(singleId)) || `REQ-${singleId}`;
    }
    return 'Unlinked';
  };

  const groupedUseCases = useMemo(() => {
    const groups = {};
    moduleDefs.forEach(md => {
      groups[md.moduleName] = { ...md, items: [] };
    });

    useCases.forEach((uc, originalIndex) => {
      if (uc.isDeleted) return;
      const moduleName = uc.moduleName || 'General Module';
      if (!groups[moduleName]) {
        groups[moduleName] = { 
          moduleName, 
          priority: uc.modulePriority || 'MEDIUM',
          assignee: uc.moduleAssignee || 'System',
          items: [] 
        };
      }
      groups[moduleName].items.push({ uc, originalIndex });
    });

    return Object.values(groups).map(g => {
      g.items.sort((a, b) => {
        if (a?.isDuplicate && !b?.isDuplicate) return 1;
        if (!a?.isDuplicate && b?.isDuplicate) return -1;
        return 0;
      });
      return g;
    });
  }, [useCases, moduleDefs]);

  const totalModules = groupedUseCases.length;
  const totalUseCases = groupedUseCases.reduce((acc, g) => acc + g.items.length, 0);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    const validIndices = useCases.map((uc, i) => ({uc, i})).filter(({uc}) => uc && !uc.isDuplicate && !uc.isDeleted).map(({i}) => i);
    const allSelected = validIndices.length > 0 && validIndices.every(i => selectedIndices.has(i));
    
    if (allSelected) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(validIndices));
    }
  };

  const toggleSelect = (index) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = [...useCases];
    updated[index] = { ...updated[index], [field]: value };
    setUseCases(updated);
  };

  const handleUpdateModuleName = (oldName, newName) => {
    if(oldName === newName || !newName.trim()) return;
    setModuleDefs(prev => prev.map(m => m.moduleName === oldName ? { ...m, moduleName: newName } : m));
    setUseCases(prev => prev.map(uc => 
       (uc.moduleName || 'General Module') === oldName 
          ? { ...uc, moduleName: newName } 
          : uc
    ));
  };

  const handleUpdateModuleField = (moduleName, field, value) => {
    setModuleDefs(prev => prev.map(m => m.moduleName === moduleName ? { ...m, [field]: value } : m));
    setUseCases(prev => prev.map(uc => 
       (uc.moduleName || 'General Module') === moduleName 
          ? { ...uc, [field]: value } 
          : uc
    ));
  };

  const handleDeleteModule = (moduleName) => {
    setDeleteModuleTarget(moduleName);
  };

  const confirmDeleteModule = () => {
    if (!deleteModuleTarget) return;
    
    let fallbackModule;
    setModuleDefs(prev => {
      const remaining = prev.filter(m => m.moduleName !== deleteModuleTarget);
      if (remaining.length > 0) {
        fallbackModule = remaining[0].moduleName;
        return remaining;
      } else {
        fallbackModule = 'Unassigned Use Cases';
        return [{ moduleName: fallbackModule, priority: 'MEDIUM', assignee: 'System' }];
      }
    });
    
    setUseCases(prev => {
      return prev.map(uc => 
         (uc.moduleName || 'General Module') === deleteModuleTarget 
            ? { ...uc, moduleName: fallbackModule } 
            : uc
      );
    });
    setDeleteModuleTarget(null);
  };

  const handleAddModule = () => {
    const newName = `New Module ${moduleDefs.length + 1}`;
    setModuleDefs(prev => [...prev, { moduleName: newName, priority: 'MEDIUM', assignee: 'System' }]);
    
    setTimeout(() => {
      const container = document.getElementById('ai-gen-scroll-container');
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDeleteUC = (index, e) => {
    e.stopPropagation();
    const updated = [...useCases];
    updated[index] = { ...updated[index], isDeleted: true };
    setUseCases(updated);
    if (selectedIndices.has(index)) {
      toggleSelect(index);
    }
  };

  const handleDragStart = (e, originalIndex, fromModule) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ originalIndex, fromModule }));
  };

  const handleDrop = (e, toModule) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { originalIndex, fromModule } = data;
      
      if (fromModule !== toModule) {
        setUseCases(prev => {
          const updated = [...prev];
          updated[originalIndex] = { ...updated[originalIndex], moduleName: toModule };
          const destGroup = groupedUseCases.find(g => g.moduleName === toModule);
          if (destGroup) {
            updated[originalIndex].modulePriority = destGroup.priority;
            updated[originalIndex].moduleAssignee = destGroup.assignee;
          }
          return updated;
        });
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    const validSelectedIndices = Array.from(selectedIndices).filter(i => !useCases[i].isDeleted);
    if (validSelectedIndices.length === 0) {
      toast.error("Please select at least one Use Case to approve.");
      return;
    }
    setApproving(true);
    try {
      await useCaseService.approveUseCases(generationId, {
        selectedIndices: validSelectedIndices,
        modifiedPayload: useCases
      });
      toast.success("Use Cases approved successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Failed to approve Use Cases.");
    } finally {
      setApproving(false);
    }
  };

  const renderUseCaseCard = (uc, index, isDuplicate, moduleName) => {
    if (!uc) return null;
    return (
      <div 
        key={index} 
        draggable={viewMode === 'grouped'}
        onDragStart={(e) => viewMode === 'grouped' && handleDragStart(e, index, moduleName)}
        className={`bg-surface-container-lowest border rounded-lg overflow-hidden shadow-sm transition-all flex flex-col 
          ${viewMode === 'grouped' ? 'cursor-move' : ''}
          ${isDuplicate ? 'opacity-50 grayscale-[50%] pointer-events-none' : ''} 
          ${selectedIndices.has(index) ? 'border-primary ring-1 ring-[#1E707D]/20' : 'border-outline-variant'}`}
      >
        <div className="flex items-center justify-between p-2 border-b border-outline-variant bg-surface-50 gap-2 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => !isDuplicate && toggleSelect(index)}>
            {viewMode === 'grouped' && <span className="material-symbols-outlined text-gray-400 cursor-grab active:cursor-grabbing text-[16px]">drag_indicator</span>}
            <input 
              type="checkbox" 
              checked={selectedIndices.has(index)}
              onChange={() => {}}
              disabled={isDuplicate}
              className="w-3.5 h-3.5 rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pointer-events-none"
            />
            {isDuplicate && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-red-200">
                Dup
              </span>
            )}
            {uc.quality_status === 'Error' && (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-red-200">
                Critical Error
              </span>
            )}
            {uc.quality_status === 'Warning' && (
              <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-orange-200">
                Warning
              </span>
            )}
            <input 
              type="text" 
              value={uc.name || ''} 
              onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
              className="font-bold text-on-surface bg-transparent border-b border-dashed border-transparent hover:border-gray-300 w-full p-0.5 focus:border-[#1E707D] focus:ring-0 outline-none placeholder-gray-400 text-xs ml-1 truncate"
              placeholder="Use Case Name"
              onClick={e => e.stopPropagation()}
            />
            <button 
              type="button"
              onClick={(e) => handleDeleteUC(index, e)}
              className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0 ml-1"
              title="Delete Use Case"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
        
        <div className="p-3 space-y-3 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Display Critic Errors & Warnings */}
          {(uc.errors?.length > 0 || uc.warnings?.length > 0) && (
            <div className="flex flex-col gap-1 shrink-0 mb-1 text-xs bg-orange-50 border border-orange-100 rounded p-2">
              {uc.errors?.map((err, i) => (
                <div key={`err-${i}`} className="flex items-start gap-1.5 text-red-700">
                  <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0">error</span>
                  <span>{err}</span>
                </div>
              ))}
              {uc.warnings?.map((warn, i) => (
                <div key={`warn-${i}`} className="flex items-start gap-1.5 text-orange-700">
                  <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0">warning</span>
                  <span>{warn}</span>
                </div>
              ))}
            </div>
          )}

          <input 
            type="text" 
            value={uc.description || ''} 
            onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
            className="text-[11px] text-on-surface-variant w-full bg-transparent border-none p-0 focus:ring-0 outline-none placeholder-gray-400 shrink-0"
            placeholder="Brief description..."
          />

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                Actors
              </label>
              <input 
                type="text" 
                value={uc.primaryActors || ''} 
                onChange={(e) => handleFieldChange(index, 'primaryActors', e.target.value)}
                className="w-full text-[11px] p-1.5 bg-surface border border-outline-variant rounded focus:border-[#1E707D] outline-none"
                placeholder="e.g. Admin"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                Req IDs
              </label>
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100 w-full truncate h-[26px]" title={getReqDisplay(uc.requirementIds, uc.requirementId)}>
                {getReqDisplay(uc.requirementIds, uc.requirementId)}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                 <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                    Precondition
                  </label>
                  <textarea 
                    value={uc.precondition || ''} 
                    onChange={(e) => handleFieldChange(index, 'precondition', e.target.value)}
                    className="w-full text-[11px] p-1.5 bg-surface border border-outline-variant rounded focus:border-[#1E707D] outline-none min-h-[40px] resize-y"
                  />
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                    Postcondition
                  </label>
                  <textarea 
                    value={uc.postcondition || ''} 
                    onChange={(e) => handleFieldChange(index, 'postcondition', e.target.value)}
                    className="w-full text-[11px] p-1.5 bg-surface border border-outline-variant rounded focus:border-[#1E707D] outline-none min-h-[40px] resize-y"
                  />
              </div>
            </div>

            <div className="flex-none">
               <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                  Main Flow
                </label>
                <textarea 
                  value={uc.mainSuccessScenario || ''} 
                  onChange={(e) => handleFieldChange(index, 'mainSuccessScenario', e.target.value)}
                  className="w-full min-h-[80px] text-[11px] p-1.5 bg-surface border border-outline-variant rounded focus:border-[#1E707D] outline-none resize-y"
                />
            </div>
            
            <div className="flex-none">
               <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">
                  Alternative / Exception Flows
                </label>
                <textarea 
                  value={uc.alternativeFlows || ''} 
                  onChange={(e) => handleFieldChange(index, 'alternativeFlows', e.target.value)}
                  className="w-full min-h-[60px] text-[11px] p-1.5 bg-surface border border-outline-variant rounded focus:border-[#1E707D] outline-none resize-y placeholder-gray-400"
                  placeholder="e.g. AF1: Invalid credentials..."
                />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl w-full max-w-[95vw] h-[95vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant bg-surface-container-lowest shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#1E707D]/10 flex items-center justify-center text-[#1E707D]">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-on-surface">Generate Use Cases (AI)</h2>
              <div className="flex gap-4 mt-0.5">
                <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Total Modules: {totalModules}
                </span>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Total Use Cases: {totalUseCases}
                </span>
                <button
                  type="button"
                  onClick={handleAddModule}
                  className="text-xs font-bold text-white bg-[#1E707D] hover:bg-[#165964] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ml-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add Module
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-surface-variant/50 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'list' 
                    ? 'bg-surface text-[#1E707D] shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
                List View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grouped' 
                    ? 'bg-surface text-[#1E707D] shadow-sm' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">view_module</span>
                Module View
              </button>
            </div>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>
          </div>
        </div>
        
        {/* Body */}
        <div 
          id="ai-gen-scroll-container"
          className="overflow-y-auto flex-1 p-4 bg-surface-50"
          onDragOver={handleScrollOnDrag}
        >
          {loading ? (
            <div className="flex flex-col justify-center items-center h-full gap-4">
              <span className="material-symbols-outlined animate-spin text-[#1E707D] text-4xl">progress_activity</span>
              <p className="text-secondary font-medium">Loading generation results...</p>
            </div>
          ) : useCases.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full gap-2 text-on-surface-variant max-w-sm mx-auto text-center py-12">
                <span className="material-symbols-outlined text-5xl text-amber-500 mb-2">info</span>
                <p className="font-bold text-[16px] text-slate-800">No Use Cases Generated</p>
              </div>
          ) : (
            <div className="space-y-6 max-w-[1600px] mx-auto">
              <div className="flex justify-between items-center bg-surface-container-lowest p-3 rounded-lg border border-outline-variant shadow-sm sticky top-0 z-20">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedIndices.size > 0 && selectedIndices.size === useCases.filter(uc => uc && !uc.isDuplicate && !uc.isDeleted).length}
                    ref={input => {
                      if (input) input.indeterminate = selectedIndices.size > 0 && selectedIndices.size < useCases.filter(uc => uc && !uc.isDuplicate && !uc.isDeleted).length;
                    }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D] cursor-pointer"
                  />
                  <span className="font-bold text-sm text-on-surface">
                    Select All ({selectedIndices.size} selected)
                  </span>
                </label>
                {viewMode === 'grouped' && (
                  <div className="text-[11px] text-on-surface-variant italic">
                    Drag and drop Use Cases to move them between modules
                  </div>
                )}
              </div>

              {viewMode === 'grouped' ? (
                <div className="space-y-6">
                  {groupedUseCases.map((group, groupIdx) => (
                    <div 
                      key={groupIdx} 
                      className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden flex flex-col"
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDrop(e, group.moduleName)}
                    >
                      {/* Module Header */}
                      <div className="bg-gradient-to-r from-surface-container-lowest to-surface-50 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between border-b border-outline-variant">
                        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E707D] to-[#165964] flex items-center justify-center text-white shadow-sm shrink-0">
                            <span className="material-symbols-outlined text-[16px]">view_module</span>
                          </div>
                          <input 
                            type="text"
                            defaultValue={group.moduleName}
                            onBlur={(e) => {
                              const newName = e.target.value.trim();
                              if (newName && newName !== group.moduleName) {
                                handleUpdateModuleName(group.moduleName, newName);
                              } else {
                                e.target.value = group.moduleName; // Revert
                              }
                            }}
                            className="font-bold text-[#111827] text-sm bg-transparent border-b border-dashed border-gray-400 focus:border-[#1E707D] outline-none flex-1 truncate max-w-md"
                          />
                        </div>

                        <div className="flex items-center gap-3 mt-2 md:mt-0 flex-wrap">
                          {/* Priority */}
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Priority:</label>
                            <select 
                              value={group.priority}
                              onChange={(e) => handleUpdateModuleField(group.moduleName, 'modulePriority', e.target.value)}
                              className="text-xs border border-gray-300 rounded p-1 outline-none focus:border-[#1E707D] bg-white cursor-pointer"
                            >
                              <option value="CRITICAL">CRITICAL</option>
                              <option value="HIGH">HIGH</option>
                              <option value="MEDIUM">MEDIUM</option>
                              <option value="LOW">LOW</option>
                            </select>
                          </div>
                          {/* Assignee */}
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Assignee:</label>
                            <select 
                              value={group.assignee}
                              onChange={(e) => handleUpdateModuleField(group.moduleName, 'moduleAssignee', e.target.value)}
                              className="text-xs border border-gray-300 rounded p-1 outline-none focus:border-[#1E707D] bg-white cursor-pointer max-w-[120px] truncate"
                            >
                              <option value="System">System</option>
                              {activeMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.username}</option>
                              ))}
                            </select>
                          </div>
                          {/* Delete Module */}
                          <button 
                            onClick={() => handleDeleteModule(group.moduleName)}
                            className="w-7 h-7 rounded flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shrink-0"
                            title="Delete Module"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Module Body: 2 Columns Grid */}
                      <div className="p-4 bg-gray-50/50 flex-1 min-h-[120px]">
                        {group.items.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg p-6 text-xs">
                            Drag and drop Use Cases here
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
                            {group.items.map(({ uc, originalIndex }) => 
                              renderUseCaseCard(uc, originalIndex, uc?.isDuplicate === true, group.moduleName)
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View - Flat Grid */
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
                  {useCases.map((uc, index) => {
                    if (uc?.isDeleted) return null;
                    return renderUseCaseCard(uc, index, uc?.isDuplicate === true, uc?.moduleName);
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="w-full bg-surface-50 pb-4 pt-2 flex justify-center border-t-0 shrink-0">
          <div className="flex items-center justify-center gap-3 px-6 py-2.5 border border-outline-variant bg-surface shadow-lg rounded-xl">
            <Button type="button" variant="outline" onClick={onClose} disabled={approving} className="min-w-[100px] text-sm py-1.5">Cancel</Button>
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleApprove} 
              disabled={loading || selectedIndices.size === 0 || approving}
              className="px-6 shadow-sm text-sm py-1.5"
            >
              {approving ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>progress_activity</span>
                  Approving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  Approve {selectedIndices.size} Use Case(s)
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={!!deleteModuleTarget}
        title="Delete Module"
        message={`Are you sure you want to delete module "${deleteModuleTarget}"? All Use Cases inside it will be moved to another available module.`}
        confirmText="Delete"
        onConfirm={confirmDeleteModule}
        onCancel={() => setDeleteModuleTarget(null)}
        type="danger"
      />

    </div>
    </>
  );
};

export default AiUseCaseGenerationModal;
