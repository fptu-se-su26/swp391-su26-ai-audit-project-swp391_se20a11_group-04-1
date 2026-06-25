import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../api/axiosConfig';
import { normalizeFlowToText } from '../../../utils/flowFormatter';

const AiSyncUseCaseModal = ({ useCase, useCaseId, projectId, onClose, onApprove }) => {
  const [loading, setLoading] = useState(true);
  const [syncData, setSyncData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let controller = new AbortController();
    let isMounted = true;
    
    const fetchSyncPreview = async () => {
      try {
        setLoading(true);
        const response = await api.post(`/ai/use-cases/${useCaseId}/sync-preview`, null, {
          signal: controller.signal
        });
        if (!isMounted) return;
        setSyncData(response.data);
      } catch (error) {
        if (!isMounted || error.name === 'CanceledError' || error.message === 'canceled') {
          console.log('AI Sync Use Case request canceled');
          return;
        }
        console.error(error);
        toast.error(error.response?.data?.error || 'Failed to generate sync preview from AI');
        onClose();
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSyncPreview();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [useCaseId, onClose]);

  const handleApprove = async () => {
    try {
      setSaving(true);
      const cleanFlowArray = (text) => {
        if (!text) return [];
        const lines = text.split('\n');
        const steps = [];
        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed) return;
          if (trimmed.startsWith('*') || trimmed.startsWith('-') || /^[a-z]\)/.test(trimmed)) {
            if (steps.length > 0) {
              steps[steps.length - 1] += '\n  ' + trimmed;
            } else {
              steps.push(trimmed.replace(/^[-*]\s*/, ''));
            }
          } else {
            steps.push(trimmed);
          }
        });
        return steps;
      };

      const parseMainFlow = (data) => {
        const text = normalizeFlowToText(data);
        const steps = cleanFlowArray(text);
        return { steps: steps };
      };

      const parseAltFlow = (data) => {
        const text = normalizeFlowToText(data);
        const steps = cleanFlowArray(text);
        return { flows: [{ condition: "AI Synced Alternative Flows", steps: steps }] };
      };

      const payload = {
        name: syncData.name,
        precondition: syncData.precondition,
        postcondition: syncData.postcondition,
        mainFlow: parseMainFlow(syncData.mainFlows),
        alternativeFlow: parseAltFlow(syncData.alternativeFlows),
        // Since actors are complicated (requires IDs), we might just pass string and let backend handle, 
        // or just skip updating actors automatically for now to keep it safe.
      };

      await api.put(`/v1/use-cases/${useCaseId}?projectId=${projectId}`, payload);
      toast.success('Use Case synchronized successfully!');
      onApprove();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to save synchronized Use Case');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-[#1E707D]/10 rounded-full flex items-center justify-center animate-pulse">
            <FiRefreshCw className="text-[#1E707D] text-xl animate-spin" />
          </div>
          <div className="text-center">
            <h3 className="font-bold text-gray-900 text-lg">AI is syncing...</h3>
            <p className="text-sm text-gray-500 mt-1">Analyzing the latest Requirement changes to update your Use Case.</p>
          </div>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const formatFlow = (flow) => normalizeFlowToText(flow);

  const handleFieldChange = (field, value) => {
    setSyncData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Extract initial values to handle fallbacks seamlessly in inputs
  const newName = syncData?.name || syncData?.Name || syncData?.UseCaseName || '';
  const newPre = syncData?.precondition || syncData?.Precondition || syncData?.Preconditions || syncData?.preconditions || '';
  const newPost = syncData?.postcondition || syncData?.Postcondition || syncData?.Postconditions || syncData?.postconditions || '';
  const rawMain = syncData?.mainFlows || syncData?.MainFlows || syncData?.mainFlow || syncData?.MainFlow;
  const newMain = formatFlow(rawMain);
  const rawAlt = syncData?.alternativeFlows || syncData?.AlternativeFlows || syncData?.alternativeFlow || syncData?.AlternativeFlow;
  const newAlt = formatFlow(rawAlt);

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl shadow-2xl flex flex-col max-w-6xl w-full max-h-[90vh] overflow-hidden border border-outline-variant">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1E707D]-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px] text-[#1E707D]">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-title-md font-bold text-on-surface leading-tight">AI Sync Preview</h2>
              <p className="text-body-sm text-secondary">Review and edit the AI-suggested updates before applying.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-secondary hover:text-on-surface transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Content Diff */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface custom-scrollbar">
          {syncData && (
            <div className="space-y-6">
              
              {/* AI Critic Section */}
              {syncData.quality_status && (
                <div className={`p-4 rounded-xl border ${
                  syncData.quality_status === 'Error' ? 'bg-red-50 text-red-900 border-red-200' :
                  syncData.quality_status === 'Warning' ? 'bg-amber-50 text-amber-900 border-amber-200' :
                  'bg-emerald-50 text-emerald-900 border-emerald-200'
                }`}>
                  <h3 className="font-bold flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[18px]">
                      {syncData.quality_status === 'Error' ? 'error' : syncData.quality_status === 'Warning' ? 'warning' : 'check_circle'}
                    </span>
                    AI Critic Status: {syncData.quality_status}
                  </h3>
                  {syncData.errors && syncData.errors.length > 0 && (
                    <div className="mb-2 text-sm">
                      <strong className="text-red-800">Errors:</strong>
                      <ul className="list-disc pl-5 space-y-1 mt-1">
                        {syncData.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                  {syncData.warnings && syncData.warnings.length > 0 && (
                    <div className="text-sm">
                      <strong className="text-amber-800">Warnings:</strong>
                      <ul className="list-disc pl-5 space-y-1 mt-1">
                        {syncData.warnings.map((w, i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}
                  {(!syncData.errors?.length && !syncData.warnings?.length && syncData.quality_status === 'OK') && (
                    <p className="text-sm">This Use Case is perfectly synced with the requirement.</p>
                  )}
                </div>
              )}
              
              {/* Header Info */}
              <div className="bg-surface-container-low rounded-xl border border-outline-variant p-4">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-bold text-on-surface">Review Changes</h3>
                  <span className="text-secondary text-sm px-2 py-1 bg-surface-variant rounded-md">ID: {useCase?.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-secondary uppercase tracking-wider">Current Version</div>
                    <div className="p-3 bg-surface rounded border border-outline-variant text-sm text-on-surface opacity-70">
                      {useCase?.name}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-[#1E707D] uppercase tracking-wider">AI Proposed Version (Editable)</div>
                    <input 
                      type="text"
                      value={newName}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full p-2.5 bg-[#1E707D]-container/10 rounded border border-[#1E707D]/30 text-sm text-on-surface font-medium focus:ring-1 focus:ring-[#1E707D] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Fields Comparison */}
              <div className="space-y-4">
                
                {/* Precondition */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-secondary mb-1">Current Precondition</h4>
                    <p className="flex-1 text-sm p-3 bg-surface-container-lowest rounded border border-outline-variant text-secondary whitespace-pre-wrap">
                      {useCase?.precondition || <span className="italic opacity-50">Empty</span>}
                    </p>
                  </div>
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-[#1E707D] mb-1">New Precondition</h4>
                    <textarea 
                      value={newPre}
                      onChange={(e) => handleFieldChange('precondition', e.target.value)}
                      className="flex-1 w-full text-sm p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 whitespace-pre-wrap resize-y min-h-[80px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Postcondition */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-secondary mb-1">Current Postcondition</h4>
                    <p className="flex-1 text-sm p-3 bg-surface-container-lowest rounded border border-outline-variant text-secondary whitespace-pre-wrap">
                      {useCase?.postcondition || <span className="italic opacity-50">Empty</span>}
                    </p>
                  </div>
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-[#1E707D] mb-1">New Postcondition</h4>
                    <textarea 
                      value={newPost}
                      onChange={(e) => handleFieldChange('postcondition', e.target.value)}
                      className="flex-1 w-full text-sm p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 whitespace-pre-wrap resize-y min-h-[80px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Main Flows */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-secondary mb-1">Current Main Flows</h4>
                    <pre className="flex-1 text-sm p-3 bg-surface-container-lowest rounded border border-outline-variant text-secondary whitespace-pre-wrap font-sans">
                      {useCase?.mainFlow ? formatFlow(useCase.mainFlow) : <span className="italic opacity-50">Empty</span>}
                    </pre>
                  </div>
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-[#1E707D] mb-1">New Main Flows</h4>
                    <textarea 
                      value={newMain}
                      onChange={(e) => handleFieldChange('mainFlows', e.target.value)}
                      className="flex-1 w-full text-sm p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 whitespace-pre-wrap font-sans resize-y min-h-[150px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Alternative Flows */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-secondary mb-1">Current Alternative Flows</h4>
                    <pre className="flex-1 text-sm p-3 bg-surface-container-lowest rounded border border-outline-variant text-secondary whitespace-pre-wrap font-sans">
                      {useCase?.alternativeFlow ? formatFlow(useCase.alternativeFlow) : <span className="italic opacity-50">Empty</span>}
                    </pre>
                  </div>
                  <div className="flex flex-col h-full">
                    <h4 className="text-xs font-bold text-[#1E707D] mb-1">New Alternative Flows</h4>
                    <textarea 
                      value={newAlt}
                      onChange={(e) => handleFieldChange('alternativeFlows', e.target.value)}
                      className="flex-1 w-full text-sm p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-900 whitespace-pre-wrap font-sans resize-y min-h-[150px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white">
          <button 
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Discard
          </button>
          <button 
            onClick={handleApprove}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium text-white bg-[#1E707D] rounded-lg hover:bg-[#1E707D] transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
            Approve & Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiSyncUseCaseModal;
