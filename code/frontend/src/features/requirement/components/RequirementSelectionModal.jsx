import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { requirementApi } from '../services/requirementApi';
import { useCaseService } from '../services/useCaseService';
import useProjectStore from '../../../store/useProjectStore';

const RequirementSelectionModal = ({ isOpen, onClose, onConfirm }) => {
  const [requirements, setRequirements] = useState([]);
  const [useCases, setUseCases] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const activeProject = useProjectStore((state) => state.activeProject);

  useEffect(() => {
    if (isOpen && activeProject?.id) {
      setLoading(true);
      Promise.all([
        requirementApi.getAllRequirements({ projectId: activeProject.id, size: 1000 }),
        useCaseService.getAllUseCases(activeProject.id)
      ])
        .then(([reqRes, ucRes]) => {
          const reqs = reqRes.items || reqRes.data?.content || reqRes.data || reqRes || [];
          const ucs = ucRes || [];
          
          setRequirements(Array.isArray(reqs) ? reqs : []);
          setUseCases(Array.isArray(ucs) ? ucs : []);
          
          const reqsWithUcs = new Set(ucs.map(uc => uc.requirementId));
          const toSelect = new Set();
          
          (Array.isArray(reqs) ? reqs : []).forEach(req => {
            if (!reqsWithUcs.has(req.id)) {
              toSelect.add(req.id);
            }
          });
          
          setSelectedIds(toSelect);
        })
        .catch(err => {
          console.error("Failed to load data for selection", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, activeProject?.id]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    const reqsWithoutUcs = requirements.filter(req => !useCases.some(uc => String(uc.requirementId) === String(req.id)));
    if (selectedIds.size === reqsWithoutUcs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reqsWithoutUcs.map(r => r.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleConfirm = () => {
    if (selectedIds.size === 0) return;
    onConfirm(Array.from(selectedIds));
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0f1423]/50 p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-[16px] shadow-xl w-full max-w-[560px] max-h-[80vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-200">
        
        {/* MODAL HEADER */}
        <div className="flex justify-between items-start px-[24px] pt-[20px] pb-0">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-[#EEEDFE] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[#3C3489]" style={{ fontSize: '20px' }}>auto_awesome</span>
            </div>
            <div>
              <h2 className="text-[16px] font-medium text-[#111827] leading-tight">Generate Use Cases (AI)</h2>
              <p className="text-[12px] text-[#6B7280] mt-0.5">Select requirements to generate use cases for</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="w-[28px] h-[28px] rounded-[8px] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:bg-gray-50 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>
        
        {/* SELECT ALL BAR */}
        <div className="px-[24px] pt-[16px] pb-[8px]">
          <div className="w-full bg-[#F8FAFC] border border-[#E5E7EB] rounded-[10px] px-[14px] py-[12px] flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selectedIds.size > 0 && selectedIds.size === requirements.filter(req => !useCases.some(uc => String(uc.requirementId) === String(req.id))).length}
                ref={input => {
                  if (input) {
                    const max = requirements.filter(req => !useCases.some(uc => String(uc.requirementId) === String(req.id))).length;
                    input.indeterminate = selectedIds.size > 0 && selectedIds.size < max;
                  }
                }}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-[#E5E7EB] accent-[#185FA5] cursor-pointer"
              />
              <span className="text-[13px] font-medium text-[#111827]">
                Select All ({selectedIds.size} / {requirements.filter(req => !useCases.some(uc => String(uc.requirementId) === String(req.id))).length} valid)
              </span>
            </label>
            <span className="text-[11px] text-[#9CA3AF] italic">
              *Auto-selected: requirements without use cases
            </span>
          </div>
        </div>

        {/* REQUIREMENT LIST */}
        <div className="overflow-y-auto max-h-[360px] px-[24px] pb-[16px] custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <span className="material-symbols-outlined animate-spin text-[#185FA5] text-3xl">progress_activity</span>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-10 text-[#6B7280] text-[13px]">
              No requirements found in this project.
            </div>
          ) : (
            <div className="flex flex-col">
              {requirements.map(req => {
                const reqUcs = useCases.filter(uc => String(uc.requirementId) === String(req.id));
                const hasUcs = reqUcs.length > 0;
                const isSelected = selectedIds.has(req.id);
                
                return (
                  <label 
                    key={req.id} 
                    className={`flex items-center justify-between py-[10px] px-[14px] border-b border-[#F3F4F6] gap-[12px] 
                      ${hasUcs ? 'bg-gray-50 opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-[#F8FAFC]'} 
                      ${!isSelected && !hasUcs ? 'opacity-75' : ''}`}
                    onClick={(e) => {
                      if (hasUcs) e.preventDefault();
                    }}
                  >
                    <div className="flex items-center gap-[12px] flex-1 min-w-0">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        disabled={hasUcs}
                        onChange={() => {
                          if (!hasUcs) toggleSelect(req.id);
                        }}
                        className={`w-4 h-4 rounded border-[#E5E7EB] accent-[#185FA5] shrink-0 ${hasUcs ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      />
                      <span className="bg-[#185FA5] text-white text-[11px] rounded-[6px] px-[8px] py-[2px] font-mono shrink-0">
                        {req.reqCode || `REQ-${req.id}`}
                      </span>
                      <span className="text-[13px] font-medium text-[#111827] truncate">
                        {req.title}
                      </span>
                    </div>
                    
                    <div className="shrink-0 ml-2">
                      {hasUcs ? (
                        <span className="bg-[#E1F5EE] text-[#085041] border border-[#5DCAA5] text-[12px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          {reqUcs.length} Use Case(s)
                        </span>
                      ) : (
                        <span className="bg-white text-[#6B7280] border border-[#E5E7EB] text-[12px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">add_circle</span>
                          No Use Cases
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
        
        {/* MODAL FOOTER */}
        <div className="px-[24px] py-[16px] border-t border-[#F3F4F6] flex justify-between items-center rounded-b-[16px]">
          <button 
            type="button" 
            onClick={onClose}
            className="border border-[#E5E7EB] text-[#374151] rounded-[8px] px-[18px] py-[8px] text-[14px] font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleConfirm} 
            disabled={loading || selectedIds.size === 0}
            className="bg-[#185FA5] text-white rounded-[8px] px-[20px] py-[8px] text-[14px] font-medium flex items-center gap-2 hover:bg-[#134e8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
            Generate for {selectedIds.size} Requirement(s)
          </button>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E5E7EB;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #D1D5DB;
        }
      `}} />
    </div>,
    document.body
  );
};

export default RequirementSelectionModal;

