import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCaseService } from '../services/useCaseService';
import Button from '../../../components/ui/Button';

const AiUseCaseGenerationModal = ({ isOpen, onClose, generationId, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [useCases, setUseCases] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [projectId, setProjectId] = useState(null);
  
  useEffect(() => {
    if (isOpen && generationId) {
      setLoading(true);
      useCaseService.getGenerationById(generationId)
        .then(data => {
          setProjectId(data.project);
          let payloadData = data.payload || [];
          if (typeof payloadData === 'string') {
            try { payloadData = JSON.parse(payloadData); } catch(e) {}
          }
          setUseCases(Array.isArray(payloadData) ? payloadData : []);
          setSelectedIndices(new Set((Array.isArray(payloadData) ? payloadData : []).map((_, i) => i)));
        })
        .catch(err => {
          console.error("Failed to load AI generation data", err);
          toast.error("Failed to load generated Use Cases.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, generationId]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIndices.size === useCases.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(useCases.map((_, i) => i)));
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

  const handleApprove = async () => {
    if (selectedIndices.size === 0) {
      toast.error("Please select at least one Use Case to approve.");
      return;
    }
    
    setApproving(true);
    try {
      await useCaseService.approveUseCases(generationId, {
        selectedIndices: Array.from(selectedIndices),
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

  return (
    <div className="absolute inset-0 z-[200] bg-surface flex flex-col overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#EEEDFE] text-[#6366F1] flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="font-display-md text-display-md text-on-surface font-bold">Review Generated Use Cases</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">Review, edit, and approve the AI-generated Use Cases.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>
        
        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 bg-surface-50">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-full gap-4">
              <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
              <p className="text-secondary font-medium">Loading generation results...</p>
            </div>
          ) : useCases.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-full gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-5xl opacity-50">warning</span>
              <p>No Use Cases found in this generation result.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={selectedIndices.size > 0 && selectedIndices.size === useCases.length}
                    ref={input => {
                      if (input) input.indeterminate = selectedIndices.size > 0 && selectedIndices.size < useCases.length;
                    }}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    Select All ({selectedIndices.size} of {useCases.length} selected)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {useCases.map((uc, index) => (
                  <div key={index} className={`bg-surface-container-lowest border rounded-xl overflow-hidden shadow-sm transition-all ${selectedIndices.has(index) ? 'border-primary ring-1 ring-primary/20' : 'border-outline-variant opacity-80'}`}>
                    <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-50">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input 
                          type="checkbox" 
                          checked={selectedIndices.has(index)}
                          onChange={() => toggleSelect(index)}
                          className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary cursor-pointer mt-1 self-start"
                        />
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={uc.name || ''} 
                            onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
                            className="font-display-sm text-display-sm text-on-surface font-bold bg-transparent border-none p-0 focus:ring-0 w-full outline-none placeholder-gray-400"
                            placeholder="Use Case Name"
                          />
                          <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">link</span>
                            Requirement ID: 
                            <a 
                               href={`/projects/${projectId}/requirements/${uc.requirementCode || `REQ-${uc.requirementId}`}`} 
                               className="font-medium text-primary hover:underline"
                               target="_blank" rel="noreferrer"
                            >
                                {uc.requirementCode || `REQ-${uc.requirementId}`}
                            </a>
                            <span className="mx-2">•</span>
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            Actors: <input type="text" value={uc.primaryActors || ''} onChange={(e) => handleFieldChange(index, 'primaryActors', e.target.value)} className="bg-transparent border-b border-dashed border-gray-300 outline-none w-48 text-xs focus:border-primary px-1" placeholder="Admin, User..." />
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {uc.quality_status && uc.quality_status !== 'OK' && (
                      <div className={`p-4 border-b-2 border-t-2 ${uc.quality_status === 'Error' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                        {uc.errors?.length > 0 && (
                          <div className="mb-2">
                            <h4 className="text-[13px] font-bold text-red-700 flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-[16px]">error</span> AI Critic Errors
                            </h4>
                            <ul className="list-disc pl-5 text-[13px] text-red-900">
                              {uc.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                          </div>
                        )}
                        {uc.warnings?.length > 0 && (
                          <div>
                            <h4 className="text-[13px] font-bold text-yellow-700 flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-[16px]">warning</span> AI Critic Warnings
                            </h4>
                            <ul className="list-disc pl-5 text-[13px] text-yellow-900">
                              {uc.warnings.map((warn, i) => <li key={i}>{warn}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">start</span> Precondition
                          </label>
                          <textarea 
                            value={uc.precondition || ''} 
                            onChange={(e) => handleFieldChange(index, 'precondition', e.target.value)}
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                            placeholder="Preconditions..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">task_alt</span> Postcondition
                          </label>
                          <textarea 
                            value={uc.postcondition || ''} 
                            onChange={(e) => handleFieldChange(index, 'postcondition', e.target.value)}
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                            placeholder="Postconditions..."
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">format_list_numbered</span> Main Success Scenario
                          </label>
                          <textarea 
                            value={uc.mainSuccessScenario || ''} 
                            onChange={(e) => handleFieldChange(index, 'mainSuccessScenario', e.target.value)}
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[120px]"
                            placeholder="1. Step one..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">alt_route</span> Alternative Flows
                          </label>
                          <textarea 
                            value={uc.alternativeFlows || ''} 
                            onChange={(e) => handleFieldChange(index, 'alternativeFlows', e.target.value)}
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px]"
                            placeholder="Alternatives..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-outline-variant bg-surface-container-lowest">
          <Button type="button" variant="outline" onClick={onClose} disabled={approving}>Cancel</Button>
          <Button 
            type="button" 
            variant="primary" 
            onClick={handleApprove} 
            disabled={loading || selectedIndices.size === 0 || approving}
            className="px-6"
          >
            {approving ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                Approving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                Approve {selectedIndices.size} Use Case(s)
              </span>
            )}
          </Button>
        </div>
      </div>
  );
};

export default AiUseCaseGenerationModal;
