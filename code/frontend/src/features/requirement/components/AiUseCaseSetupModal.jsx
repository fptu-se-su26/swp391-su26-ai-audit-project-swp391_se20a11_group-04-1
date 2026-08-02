import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import { businessModuleService } from '../services/businessModuleService';

/**
 * AI Generation Setup Modal
 *
 * LEADER sees 3 modes:
 *   1. "Plan Modules Only"  → AUTO_PROJECT_MODULES_ONLY (cluster + assign members, no UCs)
 *   2. "Generate Modules + Use Cases" → AUTO_PROJECT (full gen)
 *   3. (hidden, used when leader picks a specific module) → MODULE
 *
 * MEMBER sees 1 mode:
 *   - Gen Use Cases for their assigned module → MODULE
 */
const AiUseCaseSetupModal = ({
  isOpen,
  onClose,
  onGenerate,
  projectId,
  isLeader = false,
  projectMembers = [],
  currentUserId,
}) => {
  // ── leader mode selection ──────────────────────────────────────────────────
  // 'plan'   → AUTO_PROJECT_MODULES_ONLY
  // 'full'   → AUTO_PROJECT
  // 'module' → MODULE (leader picks one module manually)
  const [leaderMode, setLeaderMode] = useState('full');

  // ── shared state ──────────────────────────────────────────────────────────
  const [moduleId, setModuleId] = useState('');
  const [allowProposedActors, setAllowProposedActors] = useState(true);
  const [regenerateMissingOnly, setRegenerateMissingOnly] = useState(false);
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);

  // ── my assigned modules (for members) ─────────────────────────────────────
  const [myModules, setMyModules] = useState([]);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    setLoadingModules(true);
    businessModuleService.getModulesByProject(projectId)
      .then(data => {
        const all = data || [];
        setModules(all);
        // Member only sees modules assigned to them
        if (!isLeader && currentUserId) {
          const mine = all.filter(m => {
            // assignee can be userId (number) or username string
            const a = m.assignee;
            return String(a) === String(currentUserId) || a === currentUserId;
          });
          setMyModules(mine);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoadingModules(false));
  }, [isOpen, projectId, isLeader, currentUserId]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setLeaderMode('full');
      setModuleId('');
      setAllowProposedActors(true);
      setRegenerateMissingOnly(false);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isLeader) {
      if (leaderMode === 'plan') {
        onGenerate({
          generationMode: 'AUTO_PROJECT_MODULES_ONLY',
          moduleId: null,
          allowProposedActors,
          regenerateMissingOnly: false,
        });
      } else if (leaderMode === 'full') {
        onGenerate({
          generationMode: 'AUTO_PROJECT',
          moduleId: null,
          allowProposedActors,
          regenerateMissingOnly: false,
        });
      } else {
        // leaderMode === 'module'
        onGenerate({
          generationMode: 'MODULE',
          moduleId: parseInt(moduleId),
          allowProposedActors,
          regenerateMissingOnly,
        });
      }
    } else {
      // member
      onGenerate({
        generationMode: 'MODULE',
        moduleId: parseInt(moduleId),
        allowProposedActors,
        regenerateMissingOnly,
      });
    }
  };

  const isSubmitDisabled = () => {
    if (isLeader) {
      if (leaderMode === 'module' && !moduleId) return true;
      return false;
    }
    // member
    return !moduleId;
  };

  if (!isOpen) return null;

  // ── shared advanced options ────────────────────────────────────────────────
  const AdvancedOptions = ({ showRegenMissing = false }) => (
    <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Advanced Options</p>
      <label className="flex items-start gap-2.5 cursor-pointer group">
        <input
          type="checkbox"
          checked={allowProposedActors}
          onChange={e => setAllowProposedActors(e.target.checked)}
          className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
          Allow AI to propose new Actors
          <span className="block text-xs text-gray-400 font-normal mt-0.5">
            AI can suggest actors not yet in the project (e.g. PayOS, System Scheduler)
          </span>
        </span>
      </label>
      {showRegenMissing && (
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={regenerateMissingOnly}
            onChange={e => setRegenerateMissingOnly(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700 group-hover:text-gray-900 leading-snug">
            Only generate missing Use Cases
            <span className="block text-xs text-gray-400 font-normal mt-0.5">
              Skip requirements that already have Use Cases
            </span>
          </span>
        </label>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-setup-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-[#1E707D]/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E707D]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#1E707D] text-[20px]">auto_awesome</span>
            </div>
            <div>
              <h2 id="ai-setup-title" className="text-base font-bold text-gray-800">
                {isLeader ? 'AI Generation Setup' : 'Generate Use Cases (AI)'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isLeader ? 'Configure how AI will generate content for your project' : 'Generate Use Cases for your assigned module'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-0 overflow-y-auto max-h-[75vh]">

          {/* ── LEADER UI ──────────────────────────────────────────────────── */}
          {isLeader && (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                What do you want AI to do?
              </p>

              {/* Mode cards */}
              <div className="space-y-2.5">

                {/* Card: full gen */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    leaderMode === 'full'
                      ? 'border-[#1E707D] bg-[#1E707D]/5'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="leaderMode"
                    value="full"
                    checked={leaderMode === 'full'}
                    onChange={() => setLeaderMode('full')}
                    className="mt-0.5 text-[#1E707D] focus:ring-[#1E707D]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#1E707D]">layers</span>
                      <span className="font-semibold text-sm text-gray-800">Generate Modules + Use Cases</span>
                      <span className="text-[10px] bg-[#1E707D] text-white px-1.5 py-0.5 rounded font-bold">Recommended</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      AI clusters requirements into Business Modules, assigns team members, then generates detailed Use Cases for each module — all in one step.
                    </p>
                  </div>
                </label>

                {/* Card: plan modules only */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    leaderMode === 'plan'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="leaderMode"
                    value="plan"
                    checked={leaderMode === 'plan'}
                    onChange={() => setLeaderMode('plan')}
                    className="mt-0.5 text-amber-500 focus:ring-amber-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-amber-500">view_kanban</span>
                      <span className="font-semibold text-sm text-gray-800">Plan Modules Only</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      AI clusters requirements into Business Modules and suggests a member assignee for each. You review and adjust assignments before approving — no Use Cases are generated yet.
                    </p>
                    <p className="text-xs text-amber-600 mt-1.5 font-medium">
                      ↳ After approval, each member can generate Use Cases for their own module.
                    </p>
                  </div>
                </label>

                {/* Card: single module */}
                <label
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                    leaderMode === 'module'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="leaderMode"
                    value="module"
                    checked={leaderMode === 'module'}
                    onChange={() => setLeaderMode('module')}
                    className="mt-0.5 text-indigo-500 focus:ring-indigo-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-indigo-500">folder_special</span>
                      <span className="font-semibold text-sm text-gray-800">Generate for a Specific Module</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Select one existing module and generate Use Cases for it specifically.
                    </p>
                  </div>
                </label>

              </div>

              {/* Module picker (only when 'module' mode) */}
              {leaderMode === 'module' && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Module</label>
                  {loadingModules ? (
                    <div className="text-sm text-gray-400 animate-pulse">Loading modules...</div>
                  ) : modules.length === 0 ? (
                    <div className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-2.5">
                      No modules found. Generate modules first using "Plan Modules Only".
                    </div>
                  ) : (
                    <select
                      value={moduleId}
                      onChange={e => setModuleId(e.target.value)}
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                    >
                      <option value="">-- Select Module --</option>
                      {modules.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Advanced options */}
              <AdvancedOptions showRegenMissing={leaderMode === 'module'} />
            </>
          )}

          {/* ── MEMBER UI ──────────────────────────────────────────────────── */}
          {!isLeader && (
            <>
              {loadingModules ? (
                <div className="py-6 text-center text-gray-400 animate-pulse text-sm">Loading your assigned modules...</div>
              ) : myModules.length === 0 ? (
                <div className="py-6 text-center">
                  <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">assignment_ind</span>
                  <p className="text-sm font-semibold text-gray-600">No modules assigned to you yet</p>
                  <p className="text-xs text-gray-400 mt-1">Ask your Project Leader to assign a module to you first.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Your Assigned Modules
                  </p>
                  <div className="space-y-2 mb-1">
                    {myModules.map(m => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          String(moduleId) === String(m.id)
                            ? 'border-[#1E707D] bg-[#1E707D]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="memberModule"
                          value={m.id}
                          checked={String(moduleId) === String(m.id)}
                          onChange={() => setModuleId(m.id)}
                          className="text-[#1E707D] focus:ring-[#1E707D]"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{m.name}</p>
                          {m.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{m.description}</p>
                          )}
                        </div>
                        <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          m.priority === 'HIGH' || m.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-600'
                            : m.priority === 'MEDIUM'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {m.priority || 'MEDIUM'}
                        </span>
                      </label>
                    ))}
                  </div>

                  <AdvancedOptions showRegenMissing />
                </>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-5 mt-1 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitDisabled() || (!isLeader && myModules.length === 0)}
            >
              <span className="material-symbols-outlined text-[16px] mr-1">
                {isLeader && leaderMode === 'plan' ? 'view_kanban' : 'auto_awesome'}
              </span>
              {isLeader && leaderMode === 'plan' ? 'Plan Modules' : 'Generate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiUseCaseSetupModal;
