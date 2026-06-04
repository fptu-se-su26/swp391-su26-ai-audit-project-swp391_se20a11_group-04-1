import React, { useState, useEffect } from 'react';
import { useCaseService } from '../services/useCaseService';
import Button from '../../../components/ui/Button';

const UseCaseSidePanel = ({ useCaseId, onClose, activeProjectId }) => {
  const [useCase, setUseCase] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (useCaseId) {
      fetchUseCaseDetail();
    } else {
      setUseCase(null);
    }
  }, [useCaseId]);

  const fetchUseCaseDetail = async () => {
    setLoading(true);
    try {
      const data = await useCaseService.getUseCaseById(useCaseId);
      setUseCase(data);
    } catch (error) {
      console.error('Failed to load use case', error);
    } finally {
      setLoading(false);
    }
  };

  if (!useCaseId) return null;

  const handleEdit = () => {
    window.location.href = `/projects/${activeProjectId}/use-cases/${useCaseId}`;
  };

  return (
    <>
      <div 
        className="absolute inset-0 z-[150] bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="absolute top-0 right-0 h-full w-[500px] max-w-full bg-surface shadow-2xl z-[160] border-l border-outline-variant flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
            <div>
              <h2 className="font-title-md text-title-md text-on-surface font-bold">Use Case Details</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{useCase?.code || 'Loading...'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <span className="material-symbols-outlined animate-spin text-primary text-[32px] mb-2">progress_activity</span>
            </div>
          ) : useCase ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-on-surface text-lg">{useCase.name}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 bg-surface-variant text-on-surface-variant rounded text-xs font-medium">
                    {useCase.status}
                  </span>
                  <span className="px-2 py-1 bg-[#EEEDFE] text-[#6366F1] rounded text-xs font-medium">
                    {useCase.actors?.join(', ')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Preconditions</label>
                <div className="p-3 bg-surface-50 border border-outline-variant rounded-lg text-sm text-on-surface">
                  {useCase.precondition || 'None'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Main Success Scenario</label>
                <div className="p-3 bg-surface-50 border border-outline-variant rounded-lg text-sm text-on-surface whitespace-pre-wrap">
                  {useCase.mainFlow?.description || 'None'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Alternative Flows</label>
                <div className="p-3 bg-surface-50 border border-outline-variant rounded-lg text-sm text-on-surface whitespace-pre-wrap">
                  {useCase.alternativeFlow?.description || 'None'}
                </div>
              </div>

              {(useCase.includes?.length > 0 || useCase.extendsList?.length > 0) && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Relationships</label>
                  <div className="flex flex-col gap-2">
                    {useCase.includes?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-secondary bg-secondary-container px-2 py-1 rounded">Includes</span>
                        <span className="text-sm text-on-surface">{useCase.includes.join(', ')}</span>
                      </div>
                    )}
                    {useCase.extendsList?.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-error bg-error-container px-2 py-1 rounded">Extends</span>
                        <span className="text-sm text-on-surface">{useCase.extendsList.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-on-surface-variant mt-10">Use Case not found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handleEdit} disabled={!useCase}>
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Full Edit
          </Button>
        </div>
      </div>
    </>
  );
};

export default UseCaseSidePanel;
