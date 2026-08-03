import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Button from '../../../components/ui/Button';
import { useCaseService } from '../services/useCaseService';
import axiosInstance from '../../../api/axiosConfig';

const PRIORITY_STYLE = {
  CRITICAL: 'bg-red-50 text-red-600 border-red-200',
  HIGH:     'bg-orange-50 text-orange-600 border-orange-200',
  MEDIUM:   'bg-yellow-50 text-yellow-600 border-yellow-200',
  LOW:      'bg-gray-50 text-gray-500 border-gray-200',
};

const AiModulePlanModal = ({ isOpen, onClose, generationId, onSuccess, projectId }) => {
  const [loading, setLoading]       = useState(true);
  const [approving, setApproving]   = useState(false);
  const [modules, setModules]       = useState([]);
  const [members, setMembers]       = useState([]);
  const [fullPayload, setFullPayload] = useState(null);

  useEffect(() => {
    if (!isOpen || !generationId) return;
    setLoading(true);
    Promise.all([
      useCaseService.getGenerationById(generationId),
      projectId
        ? axiosInstance.get(`/v1/projects/${projectId}`).then(r => r.data?.data || r.data)
        : Promise.resolve(null),
    ]).then(([data, proj]) => {
      const memberList = proj?.members || [];
      setMembers(memberList);
      let payload = data.payload || {};
      if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch (_) {} }
      setFullPayload(payload);
      setModules((payload?.modules || []).map((m, i) => ({
        ...m,
        temporaryId: m.temporaryId || `MOD-${i + 1}`,
        assigneeId: m.suggestedAssigneeId
          ? String(m.suggestedAssigneeId)
          : String(memberList[i % Math.max(memberList.length, 1)]?.id || ''),
      })));
    }).catch(() => toast.error('Failed to load module plan.'))
      .finally(() => setLoading(false));
  }, [isOpen, generationId, projectId]);

  const update = (idx, patch) =>
    setModules(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));

  const handleApprove = async () => {
    if (!modules.length) return;
    setApproving(true);
    try {
      const requestPayload = {
        selectedIndices: [],
        selectedUseCaseIds: [],
        selectedModuleRefs: modules.map(m => m.temporaryId),
        modifiedPayload: {
          ...fullPayload,
          schemaVersion: 'modules-only',
          useCases: [],
          modules: modules.map(m => ({
            ...m,
            suggestedAssigneeId: m.assigneeId ? parseInt(m.assigneeId, 10) : null,
          })),
        },
      };
      console.log('[AiModulePlanModal] Sending approve request:', JSON.stringify(requestPayload, null, 2));
      const response = await useCaseService.approveUseCases(generationId, requestPayload);
      console.log('[AiModulePlanModal] Approve success response:', response);
      toast.success(`${modules.length} modules created successfully!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[AiModulePlanModal] Approve failed:', err);
      console.error('[AiModulePlanModal] Response data:', err.response?.data);
      const errMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to approve module plan.';
      toast.error(errMsg);
    } finally {
      setApproving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-amber-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-[18px]">view_kanban</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-800">Module Plan — Review & Assign</h2>
              <p className="text-[11px] text-gray-400">
                AI suggested {modules.length} modules · Edit names, priorities and assignees before approving
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-gray-400">
              <span className="material-symbols-outlined animate-spin text-amber-500">progress_activity</span>
              <span className="text-sm">Loading...</span>
            </div>
          ) : !modules.length ? (
            <div className="text-center py-12 text-gray-400 text-sm">No modules found.</div>
          ) : modules.map((mod, idx) => (
            <div key={mod.temporaryId} className="border border-gray-200 rounded-xl p-3.5 hover:border-amber-300 transition-colors bg-white">
              <div className="flex items-center gap-2.5">

                {/* Number badge */}
                <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 text-[11px] font-black flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>

                {/* Name */}
                <input
                  type="text"
                  value={mod.name || ''}
                  onChange={e => update(idx, { name: e.target.value })}
                  className="font-semibold text-[13px] text-gray-800 flex-1 bg-transparent border-b border-dashed border-gray-200 focus:border-amber-400 outline-none py-0.5"
                  placeholder="Module name"
                />

                {/* Priority */}
                <select
                  value={mod.priority || 'MEDIUM'}
                  onChange={e => update(idx, { priority: e.target.value })}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer shrink-0 ${PRIORITY_STYLE[mod.priority] || PRIORITY_STYLE.MEDIUM}`}
                >
                  {['CRITICAL','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Description */}
              {mod.description && (
                <p className="text-[11px] text-gray-400 mt-1.5 ml-8 leading-relaxed">{mod.description}</p>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-2 ml-8">
                <span className="flex items-center gap-1 text-[11px] text-gray-400">
                  <span className="material-symbols-outlined text-[12px]">article</span>
                  {mod.requirementIds?.length || 0} req
                </span>

                {/* Assignee */}
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-[11px] text-gray-400 shrink-0">Assignee:</span>
                  <select
                    value={mod.assigneeId || ''}
                    onChange={e => update(idx, { assigneeId: e.target.value })}
                    className="text-[12px] border border-gray-200 rounded-lg px-2 py-0.5 outline-none focus:border-amber-400 bg-white cursor-pointer flex-1 max-w-[200px]"
                  >
                    <option value="">-- Unassigned --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.username || m.email || `#${m.id}`}
                      </option>
                    ))}
                  </select>
                  {mod.assigneeId && (
                    <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                      {members.find(m => String(m.id) === String(mod.assigneeId))?.username || '—'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {!loading && modules.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 px-5 py-3 flex items-center justify-between bg-gray-50">
            <p className="text-[11px] text-gray-400">After approving, each assigned member can generate Use Cases for their module.</p>
            <div className="flex gap-2 ml-4 shrink-0">
              <Button variant="outline" onClick={onClose} disabled={approving}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={approving}
                className="bg-amber-500 hover:bg-amber-600 border-amber-500"
              >
                {approving
                  ? <><span className="material-symbols-outlined animate-spin text-[14px] mr-1">progress_activity</span>Creating...</>
                  : <><span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>Approve {modules.length} Modules</>
                }
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiModulePlanModal;
