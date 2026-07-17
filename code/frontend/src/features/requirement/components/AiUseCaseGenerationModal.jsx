import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { normalizeFlowToText } from '../../../utils/flowFormatter';
import { useCaseService } from '../services/useCaseService';
import Button from '../../../components/ui/Button';

const today = new Date().toISOString().split('T')[0];

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
          if (data.stage !== 'USE_CASE') {
            toast.error("Không thể hiển thị do bản nháp này không phải là Use Case.");
            onClose();
            return;
          }
          setProjectId(data.project);
          let payloadData = data.payload || [];
          if (typeof payloadData === 'string') {
            try { payloadData = JSON.parse(payloadData); } catch(e) {}
          }
          if (Array.isArray(payloadData)) {
            payloadData = payloadData.map(uc => ({
              ...uc,
              mainSuccessScenario: normalizeFlowToText(uc.mainSuccessScenario || uc.mainFlow || uc.mainFlows),
              alternativeFlows: normalizeFlowToText(uc.alternativeFlows || uc.alternativeFlow)
            }));
          }
          setUseCases(Array.isArray(payloadData) ? payloadData : []);
          const validIndices = (Array.isArray(payloadData) ? payloadData : [])
            .map((uc, i) => ({uc, i}))
            .filter(({uc}) => !uc.isDuplicate)
            .map(({i}) => i);
          setSelectedIndices(new Set(validIndices));
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
    const validIndices = useCases.map((uc, i) => ({uc, i})).filter(({uc}) => !uc.isDuplicate).map(({i}) => i);
    if (selectedIndices.size === validIndices.length) {
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl w-full max-w-7xl max-h-full flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1E707D]/10 text-[#1E707D] flex items-center justify-center">
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
              <span className="material-symbols-outlined animate-spin text-[#1E707D] text-4xl">progress_activity</span>
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
                    checked={selectedIndices.size > 0 && selectedIndices.size === useCases.filter(uc => !uc.isDuplicate).length}
                    ref={input => {
                      if (input) input.indeterminate = selectedIndices.size > 0 && selectedIndices.size < useCases.filter(uc => !uc.isDuplicate).length;
                    }}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D] cursor-pointer"
                  />
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    Select All ({selectedIndices.size} of {useCases.filter(uc => !uc.isDuplicate).length} valid use cases selected)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {useCases.map((uc, index) => {
                  const status = uc.quality_status || 'Unassessed';
                  const isDuplicate = uc.isDuplicate === true;
                  let isOk = status === 'OK' || status === 'ok';
                  let isWarning = status === 'Warning' || status === 'warning';
                  let isError = status === 'Error' || status === 'error';
                  const isUnassessed = status === 'Unassessed';
                  
                  if (isDuplicate) {
                    isError = true;
                    isOk = false;
                    isWarning = false;
                  }
                  
                  let statusColorClass = 'border-l-4 border-l-gray-400';
                  if (isOk) statusColorClass = 'border-l-4 border-l-emerald-500';
                  if (isWarning) statusColorClass = 'border-l-4 border-l-yellow-500';
                  if (isError) statusColorClass = 'border-l-4 border-l-red-500';

                  return (
                  <div key={index} className={`bg-surface-container-lowest border rounded-xl overflow-hidden shadow-sm transition-all ${isDuplicate ? 'opacity-50 grayscale-[50%] pointer-events-none' : ''} ${selectedIndices.has(index) ? 'border-r-primary border-t-primary border-b-primary ring-1 ring-[#1E707D]/20' : 'border-outline-variant opacity-80'} ${statusColorClass}`}>
                    <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-50">
                      <label className="flex items-center gap-3 flex-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedIndices.has(index)}
                          onChange={() => !isDuplicate && toggleSelect(index)}
                          disabled={isDuplicate}
                          className="w-5 h-5 rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D] cursor-pointer mt-1 self-start disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="flex-1">
                          {isDuplicate && (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 border border-red-200">
                              <span className="material-symbols-outlined text-[12px]">content_copy</span> Duplicate
                            </span>
                          )}
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
                               href={`/projects/${projectId}/requirements/${uc.requirementId}`} 
                               className="font-medium text-[#1E707D] hover:underline"
                               target="_blank" rel="noreferrer"
                            >
                                {uc.requirementCode || `REQ-${uc.requirementId}`}
                            </a>
                            <span className="mx-2">•</span>
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            Actors: <input type="text" value={uc.primaryActors || ''} onChange={(e) => handleFieldChange(index, 'primaryActors', e.target.value)} className="bg-transparent border-b border-dashed border-gray-300 outline-none w-48 text-xs focus:border-[#1E707D] px-1" placeholder="Admin, User..." />
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {status && (
                      <div className={`p-4 border-b-2 border-t-2 ${isError ? 'bg-red-50 border-red-500' : isWarning ? 'bg-yellow-50 border-yellow-500' : isOk ? 'bg-emerald-50 border-emerald-500' : 'bg-gray-50 border-gray-300'}`}>
                        {isOk && (
                          <div>
                            <h4 className="text-[13px] font-bold text-emerald-700 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">check_circle</span> AI Critic: Good Quality
                            </h4>
                          </div>
                        )}
                        {isUnassessed && (
                          <div className="mb-2">
                            <h4 className="text-[13px] font-bold text-gray-600 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">pending</span> AI Critic: Unassessed / Evaluation Failed
                            </h4>
                          </div>
                        )}
                        {isDuplicate && (
                          <div className="mb-2">
                            <h4 className="text-[13px] font-bold text-red-700 flex items-center gap-1 mb-1">
                              <span className="material-symbols-outlined text-[16px]">content_copy</span> Duplicate Detected
                            </h4>
                            <p className="text-[13px] text-red-900 pl-5">This Use Case is functionally identical to an existing Use Case in the project.</p>
                          </div>
                        )}
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
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">calendar_today</span> Start Date
                            </label>
                            <input 
                              type="date"
                              value={uc.startDate || ''}
                              min={today}
                              max={uc.deadline || undefined}
                              onChange={(e) => handleFieldChange(index, 'startDate', e.target.value)}
                              className="w-full text-sm p-2 bg-surface border border-outline-variant rounded-lg focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px]">event</span> Deadline
                            </label>
                            <input 
                              type="date"
                              value={uc.deadline || ''}
                              min={uc.startDate || today}
                              onChange={(e) => handleFieldChange(index, 'deadline', e.target.value)}
                              className="w-full text-sm p-2 bg-surface border border-outline-variant rounded-lg focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">start</span> Precondition
                          </label>
                          <textarea 
                            value={uc.precondition || ''} 
                            onChange={(e) => handleFieldChange(index, 'precondition', e.target.value)}
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none min-h-[80px]"
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
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none min-h-[80px]"
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
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none min-h-[120px]"
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
                            className="w-full text-sm p-3 bg-surface border border-outline-variant rounded-lg focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none min-h-[80px]"
                            placeholder="Alternatives..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="w-full bg-surface-50 pb-6 flex justify-center border-t-0">
          <div className="flex items-center justify-center gap-3 px-6 py-3 border border-outline-variant bg-surface shadow-lg rounded-2xl">
            <Button type="button" variant="outline" onClick={onClose} disabled={approving} className="min-w-[100px]">Cancel</Button>
            <Button 
              type="button" 
              variant="primary" 
              onClick={handleApprove} 
              disabled={loading || selectedIndices.size === 0 || approving}
              className="px-6 shadow-sm"
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
      </div>
    </div>
  );
};

export default AiUseCaseGenerationModal;
