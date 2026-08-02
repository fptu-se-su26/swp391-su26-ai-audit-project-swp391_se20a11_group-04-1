import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import { useCaseService } from '../services/useCaseService';
import axiosInstance from '../../../api/axiosConfig';

/**
 * AiModulePlanModal
 * Shown when leader runs "Plan Modules Only" (AUTO_PROJECT_MODULES_ONLY).
 * Displays AI-clustered modules, allows editing assignees, then approves
 * to create BusinessModules with member assignments.
 */
const AiModulePlanModal = ({ isOpen, onClose, generationId, onSuccess, projectId }) => {
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [modules, setModules] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [fullPayload, setFullPayload] = useState(null);

  useEffect(() => {
    if (!isOpen || !generationId) return;
    setLoading(true);

    Promise.all([
      useCaseService.getGenerationById(generationId),
      projectId
        ? axiosInstance.get(`/v1/projects/${projectId}`).then(r => r.data?.data || r.data)
        : Promise.resolve(null),
    ])
      .then(([data, proj]) => {
        const members = proj?.members || [];
        setProjectMembers(members);

        let payload = data.payload || {};
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch (e) {}
        }
        setFullPayload(payload);

        const rawModules = payload?.modules || [];
        // Merge suggestedAssignee into each module state
        const enriched = rawModules.map((m, idx) => ({
          ...m,
          // keep temporaryId or fallback
          temporaryId: m.temporaryId || `MOD-${idx + 1}`,
          assigneeId: m.suggestedAssigneeId
            ? String(m.suggestedAssigneeId)
            : (members[idx % Math.max(members.length, 1)]?.id
              ? String(members[idx % Math.max(members.length, 1)].id)
              : ''),
        }));
        setModules(enriched);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load module plan.');
      })
      .finally(() => setLoading(false));
  }, [isOpen, generationId, projectId]);

  const handleAssigneeChange = (idx, memberId) => {
    setModules(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], assigneeId: memberId };
      return updated;
    });
  };

  const handleNameChange = (idx, name) => {
    setModules(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], name };
      return updated;
    });
  };

  const handlePriorityChange = (idx, priority) => {
    setModules(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], priority };
      return updated;
    });
  };

  const handleApprove = async () => {
    if (modules.length === 0) {
      toast.error('No modules to approve.');
      return;
    }
    setApproving(true);
    try {
      // Build the approve payload — schema modules-only
      const updatedPayload = {
        ...fullPayload,
        modules: modules.map(m => ({
          ...m,
          // Pass the edited assignee back
          suggestedAssigneeId: m.assigneeId ? parseInt(m.assigneeId, 10) : null,
        })),
        useCases: [],
        schemaVersion: 'modules-only',
      };

      await useCaseService.approveUseCases(generationId, {
        selectedIndices: [],
        selectedUseCaseIds: [],
        selectedModuleRefs: modules.map(m => m.temporaryId),
        modifiedPayload: updatedPayload,
      });

      toast.success(`${modules.length} modules created and assigned successfully!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to approve module plan.');
    } finally {
      setApproving(false);
    }
  };

  if (!isOpen) return null;

  const PRIORITY_COLORS = {
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-[22px]">view_kanban</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">Module Plan — Review & Assign</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                AI clustered {modules.length} modules. Edit names, priorities, and assignees before approving.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="material-symbols-outlined animate-spin text-amber-500 text-4xl">progress_activity</span>
              <p className="text-gray-500 text-sm">Loading module plan...</p>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="material-symbols-outlined text-5xl mb-2 block">inbox</span>
              <p>No modules were generated.</p>
            </div>
          ) : (
            modules.map((mod, idx) => (
              <div key={mod.temporaryId || idx} className="border border-gray-200 rounded-xl p-4 hover:border-amber-300 transition-colors bg-white shadow-sm">
                <div className="flex items-start gap-3">
                  {/* Module number */}
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  <div className="flex-1 space-y-3">
                    {/* Name + priority row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="text"
                        value={mod.name || ''}
                        onChange={e => handleNameChange(idx, e.target.value)}
                        className="font-bold text-sm text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-amber-500 outline-none flex-1 min-w-[180px] py-0.5"
                        placeholder="Module name"
                      />
                      <select
                        value={mod.priority || 'MEDIUM'}
                        onChange={e => handlePriorityChange(idx, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${PRIORITY_COLORS[mod.priority] || PRIORITY_COLORS.MEDIUM}`}
                      >
                        <option value="CRITICAL">CRITICAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="LOW">LOW</option>
                      </select>
                    </div>

                    {/* Description */}
                    {mod.description && (
                      <p className="text-xs text-gray-500 leading-relaxed">{mod.description}</p>
                    )}

                    {/* Rationale + req count */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">article</span>
                        {mod.requirementIds?.length || 0} requirements
                      </span>
                      {mod.rationale && (
                        <span className="italic truncate max-w-xs" title={mod.rationale}>
                          "{mod.rationale}"
                        </span>
                      )}
                    </div>

                    {/* Assignee */}
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">person_assign</span>
                      <label className="text-xs font-semibold text-gray-500">Assignee:</label>
                      {projectMembers.length === 0 ? (
                        <span className="text-xs text-gray-400">No members found</span>
                      ) : (
                        <select
                          value={mod.assigneeId || ''}
                          onChange={e => handleAssigneeChange(idx, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-2 py-1 outline-none focus:border-amber-400 bg-white cursor-pointer flex-1 max-w-[220px]"
                        >
                          <option value="">-- Unassigned --</option>
                          {projectMembers.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.username || m.email || `Member #${m.id}`}
                            </option>
                          ))}
                        </select>
                      )}
                      {mod.assigneeId && (
                        <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          {projectMembers.find(m => String(m.id) === String(mod.assigneeId))?.username || 'Assigned'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {!loading && modules.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50">
            <p className="text-xs text-gray-400">
              After approving, each assigned member can generate Use Cases for their module.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={approving}>Cancel</Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleApprove}
                disabled={approving}
                className="bg-amber-500 hover:bg-amber-600 border-amber-500"
              >
                {approving ? (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    Creating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Approve {modules.length} Modules
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiModulePlanModal;
