import React, { useState, useEffect } from 'react';
import { normalizeFlowToText } from '../../../utils/flowFormatter';
import { FiX, FiCheck, FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../api/axiosConfig';

const formatFlow = (flow) => normalizeFlowToText(flow);

const AiSmartSyncAllModal = ({ requirementId, existingUseCases, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // Sets to track which use cases the user wants to apply
  const [selectedUpdated, setSelectedUpdated] = useState(new Set());
  const [selectedNew, setSelectedNew] = useState(new Set());
  
  // Track expanded accordion items
  const [expandedUpdated, setExpandedUpdated] = useState(new Set());
  
  const toggleExpanded = (id) => {
    const next = new Set(expandedUpdated);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedUpdated(next);
  };

  const toggleUpdatedSelect = (id) => {
    const next = new Set(selectedUpdated);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedUpdated(next);
  };

  const toggleNewSelect = (index) => {
    const next = new Set(selectedNew);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedNew(next);
  };

  useEffect(() => {
    let controller = new AbortController();
    let isMounted = true;

    const fetchPreview = async () => {
      setLoading(true);
      setPreviewData(null);
      try {
        const response = await api.post(`/ai/requirements/${requirementId}/sync-use-cases-preview`, null, {
          signal: controller.signal
        });
        if (!isMounted) return;
        const data = response.data;
        if (data.updatedUseCases) {
          data.updatedUseCases = data.updatedUseCases.map(uc => ({
            ...uc,
            mainFlows: formatFlow(uc.mainFlows),
            alternativeFlows: formatFlow(uc.alternativeFlows)
          }));
          setSelectedUpdated(new Set(data.updatedUseCases.filter(uc => !uc.isDuplicate).map(uc => uc.id)));
        }
        if (data.newUseCases) {
          data.newUseCases = data.newUseCases.map(uc => ({
            ...uc,
            mainFlows: formatFlow(uc.mainFlows),
            alternativeFlows: formatFlow(uc.alternativeFlows)
          }));
          const validNewIndices = data.newUseCases.map((uc, i) => ({uc, i})).filter(({uc}) => !uc.isDuplicate).map(({i}) => i);
          setSelectedNew(new Set(validNewIndices));
        }
        setPreviewData(data);
      } catch (error) {
        if (!isMounted || error.name === 'CanceledError' || error.message === 'canceled') {
          console.log('AI Smart Sync request canceled');
          return;
        }
        console.error(error);
        toast.error('Failed to generate smart sync preview.');
        onClose();
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isOpen && requirementId) {
      fetchPreview();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [isOpen, requirementId]);


  const handleUpdatedChange = (id, field, value) => {
    setPreviewData(prev => ({
      ...prev,
      updatedUseCases: prev.updatedUseCases.map(uc => uc.id === id ? { ...uc, [field]: value } : uc)
    }));
  };

  const handleNewChange = (index, field, value) => {
    setPreviewData(prev => ({
      ...prev,
      newUseCases: prev.newUseCases.map((uc, i) => i === index ? { ...uc, [field]: value } : uc)
    }));
  };

  const handleApprove = async () => {
    if (!previewData) return;
    
    // Filter out unselected ones
    const finalPayload = {
      updatedUseCases: (previewData.updatedUseCases || []).filter(uc => selectedUpdated.has(uc.id)),
      newUseCases: (previewData.newUseCases || []).filter((_, i) => selectedNew.has(i))
    };
    
    if (finalPayload.updatedUseCases.length === 0 && finalPayload.newUseCases.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 Use Case để cập nhật.');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/ai/requirements/${requirementId}/apply-use-case-sync`, finalPayload);
      toast.success('Đã cập nhật toàn bộ Use Case thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Lỗi khi lưu Use Case.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#0f1423]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E707D]-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1E707D] text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-title-md font-bold text-on-surface">AI Smart Sync All Use Cases</h2>
              <p className="text-body-sm text-secondary">Review changes and new discoveries</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <FiRefreshCw className="w-10 h-10 text-[#1E707D] animate-spin mb-4" />
              <p className="text-title-md font-medium text-on-surface">AI is analyzing Requirement & Use Cases...</p>
              <p className="text-body-md text-secondary mt-2">This may take a minute.</p>
            </div>
          ) : previewData ? (
            <div className="space-y-8">
              
              {/* Updated Use Cases */}
              {previewData.updatedUseCases && previewData.updatedUseCases.length > 0 && (
                <div>
                  <h3 className="text-title-md font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">update</span>
                    Updates to Existing Use Cases
                  </h3>
                  <div className="space-y-3">
                    {previewData.updatedUseCases.map((uc) => (
                      <div key={uc.id} className={`border border-outline-variant rounded-xl overflow-hidden bg-surface-container-lowest transition-all ${uc.isDuplicate ? 'opacity-50 grayscale-[50%] pointer-events-none' : ''}`}>
                        {/* Accordion Header */}
                        <div 
                          className="flex items-center gap-3 p-4 cursor-pointer hover:bg-surface-variant transition-colors"
                          onClick={() => toggleExpanded(uc.id)}
                        >
                          <input 
                            type="checkbox"
                            className="w-5 h-5 rounded border-outline-variant text-[#1E707D] focus:ring-[#1E707D] cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            checked={selectedUpdated.has(uc.id)}
                            disabled={uc.isDuplicate}
                            onChange={(e) => {
                              e.stopPropagation();
                              if (!uc.isDuplicate) toggleUpdatedSelect(uc.id);
                            }}
                          />
                          <div className="flex-1 font-medium text-on-surface">
                            {uc.name} <span className="text-secondary text-sm font-normal">(ID: {uc.id})</span>
                          </div>
                          <span className={`material-symbols-outlined text-secondary transition-transform ${expandedUpdated.has(uc.id) ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </div>
                        
                        {/* Accordion Body (Diff) */}
                        {expandedUpdated.has(uc.id) && (() => {
                          const oldUc = existingUseCases?.find(e => e.id === uc.id);
                          return (
                            <div className="p-4 border-t border-outline-variant bg-surface-container-low flex flex-col gap-4">
                              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100 flex items-center gap-2 text-amber-800 text-sm">
                                <FiAlertTriangle className="shrink-0" />
                                <span>This is the new AI-generated version. It will REPLACE the existing content of Use Case #{uc.id} if you select it. Uncheck the box above if you don't want to apply this update.</span>
                              </div>

                              {/* AI Critic Section */}
                              {(uc.quality_status || uc.isDuplicate) && (
                                <div className={`p-4 rounded-xl border ${
                                  uc.quality_status === 'Error' || uc.isDuplicate ? 'bg-red-50 text-red-900 border-red-200' :
                                  uc.quality_status === 'Warning' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                                  'bg-emerald-50 text-emerald-900 border-emerald-200'
                                }`}>
                                  <h3 className="font-bold flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-[18px]">
                                      {uc.isDuplicate ? 'content_copy' : uc.quality_status === 'Error' ? 'error' : uc.quality_status === 'Warning' ? 'warning' : 'check_circle'}
                                    </span>
                                    {uc.isDuplicate ? 'Duplicate Detected' : `AI Critic: ${uc.quality_status}`}
                                  </h3>
                                  {uc.isDuplicate && (
                                    <p className="text-sm text-red-800 mb-2 font-medium">This Use Case is a semantic duplicate of an existing Use Case in the project.</p>
                                  )}
                                  {uc.errors && uc.errors.length > 0 && (
                                    <div className="mb-2 text-sm">
                                      <strong className="text-red-800">Errors:</strong>
                                      <ul className="list-disc pl-5 space-y-1 mt-1">
                                        {uc.errors.map((e, i) => <li key={i}>{e}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                  {uc.warnings && uc.warnings.length > 0 && (
                                    <div className="text-sm">
                                      <strong className="text-amber-800">Warnings:</strong>
                                      <ul className="list-disc pl-5 space-y-1 mt-1">
                                        {uc.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <h4 className="font-bold text-sm text-secondary uppercase tracking-wider mb-2">Current Version</h4>
                                  <div><strong className="text-xs">Precondition:</strong> <div className="text-sm p-2 bg-surface rounded border border-outline-variant">{oldUc?.precondition || <span className="italic opacity-50">Empty</span>}</div></div>
                                  <div><strong className="text-xs">Postcondition:</strong> <div className="text-sm p-2 bg-surface rounded border border-outline-variant">{oldUc?.postcondition || <span className="italic opacity-50">Empty</span>}</div></div>
                                  <div><strong className="text-xs">Main Flows:</strong> <pre className="text-sm font-sans whitespace-pre-wrap p-2 bg-surface rounded border border-outline-variant">{oldUc?.mainFlow ? formatFlow(oldUc.mainFlow) : <span className="italic opacity-50">Empty</span>}</pre></div>
                                  <div><strong className="text-xs">Alternative Flows:</strong> <pre className="text-sm font-sans whitespace-pre-wrap p-2 bg-surface rounded border border-outline-variant">{oldUc?.alternativeFlow ? formatFlow(oldUc.alternativeFlow) : <span className="italic opacity-50">Empty</span>}</pre></div>
                                </div>
                                <div className="space-y-3">
                                  <h4 className="font-bold text-sm text-[#1E707D] uppercase tracking-wider mb-2">AI Proposed Version (Editable)</h4>
                                  <div>
                                    <strong className="text-xs text-[#1E707D]">Precondition:</strong> 
                                    <textarea value={uc.precondition || ''} onChange={(e) => handleUpdatedChange(uc.id, 'precondition', e.target.value)} rows={2} className="w-full text-sm p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y" />
                                  </div>
                                  <div>
                                    <strong className="text-xs text-[#1E707D]">Postcondition:</strong> 
                                    <textarea value={uc.postcondition || ''} onChange={(e) => handleUpdatedChange(uc.id, 'postcondition', e.target.value)} rows={2} className="w-full text-sm p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y" />
                                  </div>
                                  <div>
                                    <strong className="text-xs text-[#1E707D]">Main Flows:</strong> 
                                    <textarea value={uc.mainFlows || ''} onChange={(e) => handleUpdatedChange(uc.id, 'mainFlows', e.target.value)} rows={5} className="w-full text-sm font-sans p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y custom-scrollbar" />
                                  </div>
                                  <div>
                                    <strong className="text-xs text-[#1E707D]">Alternative Flows:</strong> 
                                    <textarea value={uc.alternativeFlows || ''} onChange={(e) => handleUpdatedChange(uc.id, 'alternativeFlows', e.target.value)} rows={4} className="w-full text-sm font-sans p-2 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y custom-scrollbar" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completely New Use Cases */}
              {previewData.newUseCases && previewData.newUseCases.length > 0 && (
                <div>
                  <h3 className="text-title-md font-bold text-on-surface mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500">add_box</span>
                    New Discovered Use Cases
                  </h3>
                  <div className="space-y-3">
                    {previewData.newUseCases.map((uc, idx) => (
                      <div key={idx} className={`border border-emerald-200 bg-emerald-50/30 rounded-xl overflow-hidden p-4 transition-all ${uc.isDuplicate ? 'opacity-50 grayscale-[50%] pointer-events-none' : ''}`}>
                        <div className="flex items-start gap-3">
                          <input 
                            type="checkbox"
                            className="w-5 h-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            checked={selectedNew.has(idx)}
                            disabled={uc.isDuplicate}
                            onChange={() => !uc.isDuplicate && toggleNewSelect(idx)}
                          />
                          <div className="flex-1">
                            <input 
                              value={uc.name || ''} 
                              onChange={(e) => handleNewChange(idx, 'name', e.target.value)} 
                              className="font-bold text-lg text-emerald-900 mb-2 w-full bg-transparent border-b border-emerald-200 focus:border-[#1E707D] focus:outline-none px-1 py-0.5" 
                              placeholder="Use Case Name"
                            />
                            {/* AI Critic Section */}
                            {(uc.quality_status || uc.isDuplicate) && (
                              <div className={`mb-3 p-3 rounded-xl border text-sm ${
                                uc.quality_status === 'Error' || uc.isDuplicate ? 'bg-red-50 text-red-900 border-red-200' :
                                uc.quality_status === 'Warning' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                                'bg-emerald-100/50 text-emerald-900 border-emerald-300'
                              }`}>
                                <h3 className="font-bold flex items-center gap-2 mb-1">
                                  <span className="material-symbols-outlined text-[16px]">
                                    {uc.isDuplicate ? 'content_copy' : uc.quality_status === 'Error' ? 'error' : uc.quality_status === 'Warning' ? 'warning' : 'check_circle'}
                                  </span>
                                  {uc.isDuplicate ? 'Duplicate Detected' : `Critic: ${uc.quality_status}`}
                                </h3>
                                {uc.isDuplicate && (
                                  <p className="text-xs text-red-800 mb-2">This Use Case is a semantic duplicate of an existing Use Case in the project.</p>
                                )}
                                {uc.errors && uc.errors.length > 0 && (
                                  <div className="mb-1 text-xs">
                                    <strong className="text-red-800">Errors:</strong>
                                    <ul className="list-disc pl-5 mt-1">
                                      {uc.errors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {uc.warnings && uc.warnings.length > 0 && (
                                  <div className="text-xs">
                                    <strong className="text-amber-800">Warnings:</strong>
                                    <ul className="list-disc pl-5 mt-1">
                                      {uc.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="space-y-3 mt-3 text-sm">
                              <div>
                                <strong className="text-emerald-900 block mb-1">Precondition:</strong> 
                                <textarea value={uc.precondition || ''} onChange={(e) => handleNewChange(idx, 'precondition', e.target.value)} rows={2} className="w-full text-sm p-2 bg-white/50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y" />
                              </div>
                              <div>
                                <strong className="text-emerald-900 block mb-1">Postcondition:</strong> 
                                <textarea value={uc.postcondition || ''} onChange={(e) => handleNewChange(idx, 'postcondition', e.target.value)} rows={2} className="w-full text-sm p-2 bg-white/50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y" />
                              </div>
                              <div>
                                <strong className="text-emerald-900 block mb-1">Main Flows:</strong> 
                                <textarea value={uc.mainFlows || ''} onChange={(e) => handleNewChange(idx, 'mainFlows', e.target.value)} rows={4} className="w-full text-sm font-sans p-2 bg-white/50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y custom-scrollbar" />
                              </div>
                              <div>
                                <strong className="text-emerald-900 block mb-1">Alternative Flows:</strong> 
                                <textarea value={uc.alternativeFlows || ''} onChange={(e) => handleNewChange(idx, 'alternativeFlows', e.target.value)} rows={3} className="w-full text-sm font-sans p-2 bg-white/50 rounded border border-emerald-200 text-emerald-900 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D] resize-y custom-scrollbar" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!previewData.updatedUseCases?.length && !previewData.newUseCases?.length) && (
                <div className="text-center py-10 text-secondary">
                  No changes or new Use Cases detected.
                </div>
              )}

            </div>
          ) : (
            <div className="flex justify-center items-center h-full text-error">Failed to load preview.</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
          <button 
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl font-label-lg font-medium text-secondary hover:bg-surface-variant transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleApprove}
            disabled={loading || submitting || (!previewData)}
            className="px-6 py-2.5 rounded-xl font-label-lg font-medium bg-[#1E707D] text-white hover:bg-[#165964] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            {submitting ? <FiRefreshCw className="w-5 h-5 animate-spin" /> : <FiCheck className="w-5 h-5" />}
            {submitting ? 'Applying...' : `Approve ${selectedUpdated.size + selectedNew.size} Use Cases`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AiSmartSyncAllModal;
