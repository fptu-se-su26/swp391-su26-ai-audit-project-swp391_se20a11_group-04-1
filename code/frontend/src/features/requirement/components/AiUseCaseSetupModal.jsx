import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import { businessModuleService } from '../services/businessModuleService';

const AiUseCaseSetupModal = ({ isOpen, onClose, onGenerate, projectId }) => {
  const [generationMode, setGenerationMode] = useState('MODULE');
  const [moduleId, setModuleId] = useState('');
  const [allowProposedActors, setAllowProposedActors] = useState(true);
  const [regenerateMissingOnly, setRegenerateMissingOnly] = useState(false);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      businessModuleService.getModulesByProject(projectId)
        .then(data => {
          setModules(data || []);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      generationMode,
      moduleId: generationMode === 'MODULE' ? parseInt(moduleId) : null,
      allowProposedActors,
      regenerateMissingOnly
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-use-case-setup-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="ai-use-case-setup-title" className="text-xl font-bold text-gray-800">
            Setup AI Generation
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Generation Mode</label>
            <select
              value={generationMode}
              onChange={(e) => setGenerationMode(e.target.value)}
              className="w-full border rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="MODULE">Module Level (Recommended)</option>
              <option value="AUTO_PROJECT">Project Level (Auto-cluster Modules)</option>
            </select>
          </div>

          {generationMode === 'MODULE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Module</label>
              {loading ? (
                <div className="text-sm text-gray-500">Loading modules...</div>
              ) : (
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Select Module --</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="allowActors"
              checked={allowProposedActors}
              onChange={(e) => setAllowProposedActors(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="allowActors" className="text-sm text-gray-700">Allow AI to propose new Actors</label>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="regenMissing"
              checked={regenerateMissingOnly}
              onChange={(e) => setRegenerateMissingOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="regenMissing" className="text-sm text-gray-700">Only generate missing Use Cases</label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={generationMode === 'MODULE' && !moduleId}>Continue to Generate</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiUseCaseSetupModal;
