import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useCaseService } from '../services/useCaseService';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';

const InlineUseCaseItem = ({ 
  uc, 
  isLeader,
  onRefresh
}) => {
  const activeProject = useProjectStore((state) => state.activeProject);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  const [formData, setFormData] = useState({
    name: uc.name || '',
    requirementId: uc.requirementId || '',
    actorsText: uc.actors ? uc.actors.join(', ') : '',
    status: uc.status || 'DRAFT',
    version: uc.version || 'v1.0',
    precondition: uc.precondition || '',
    postcondition: uc.postcondition || '',
    mainFlowText: uc.mainFlow?.steps ? uc.mainFlow.steps.join('\n') : '',
    alternativeFlowText: uc.alternativeFlow?.flows?.[0]?.steps ? uc.alternativeFlow.flows[0].steps.join('\n') : '',
    branchFromStep: uc.alternativeFlow?.flows?.[0]?.branchFromStep || '',
    startDate: uc.startDate ? uc.startDate.split('T')[0] : '',
    deadline: uc.deadline ? uc.deadline.split('T')[0] : ''
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'DONE': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      case 'IN_REVIEW': return 'bg-purple-100 text-purple-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const loadRequirements = async () => {
    if (!activeProject?.id || requirements.length > 0) return;
    setLoadingReqs(true);
    try {
      const params = { projectId: activeProject.id };
      if (!isLeader) params.mine = true;
      const res = await requirementApi.getAllRequirements(params);
      const reqs = res.items || res.data?.content || res.data || res || [];
      setRequirements(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load requirements");
    } finally {
      setLoadingReqs(false);
    }
  };

  const handleToggleExpand = () => {
    if (!isExpanded) {
      loadRequirements();
    }
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setIsEditing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const mainSteps = formData.mainFlowText.split('\n').filter(step => step.trim() !== '');
      const mainFlowJson = { steps: mainSteps.length > 0 ? mainSteps : [] };

      const altSteps = formData.alternativeFlowText.split('\n').filter(step => step.trim() !== '');
      const branchStep = formData.branchFromStep 
        ? parseInt(formData.branchFromStep) 
        : mainSteps.length;
      const altFlowJson = altSteps.length > 0 
        ? { flows: [{ branchFromStep: branchStep, condition: "Alternative Scenario", steps: altSteps }] }
        : { flows: [] };

      const payload = {
        name: formData.name,
        requirementId: parseInt(formData.requirementId) || null,
        projectId: activeProject?.id,
        actors: formData.actorsText ? formData.actorsText.split(',').map(a => a.trim()).filter(a => a) : [],
        status: formData.status,
        version: formData.version,
        precondition: formData.precondition,
        postcondition: formData.postcondition,
        mainFlow: mainFlowJson,
        alternativeFlow: altFlowJson,
        startDate: formData.startDate || null,
        deadline: formData.deadline || null
      };
      
      await useCaseService.updateUseCase(uc.id, payload, activeProject?.id);
      toast.success('Use Case updated successfully!');
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update Use Case!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this Use Case?')) {
      try {
        await useCaseService.deleteUseCase(uc.id, activeProject.id);
        toast.success('Use Case deleted successfully');
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete Use Case');
      }
    }
  };

  // handleApprove and handleRejectSubmit removed as they are moved to Group level

  const mainFlowSteps = formData.mainFlowText.split('\n').filter(step => step.trim() !== '');

  const isDimmed = uc.status === 'CLOSED' || uc.requirement?.status === 'CLOSED';

  return (
    <div className={`flex flex-col border border-gray-200 rounded-xl shadow-sm transition-all overflow-hidden group/item mb-3 hover:border-primary/40 mx-2 shrink-0 relative ${isDimmed ? 'bg-gray-100' : 'bg-white'}`}>
      {isDimmed && (
        <div className="absolute inset-0 bg-white/40 backdrop-grayscale backdrop-blur-[0.5px] rounded-xl z-0 pointer-events-none" />
      )}
      {/* Compact Header (Always visible) */}
      <div 
        onClick={handleToggleExpand}
        className="flex items-center justify-between p-3 cursor-pointer"
      >
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
              {uc.code}
            </span>
            {uc.aiGenerated && (
              <span className="material-symbols-outlined text-[#8B5CF6] text-[14px] shrink-0" title="AI Generated">auto_awesome</span>
            )}
            {uc.addedFromDiagram && (
              <span className="material-symbols-outlined text-green-600 text-[14px] shrink-0" title="From Diagram">account_tree</span>
            )}
          </div>
          <span className="font-semibold text-gray-800 text-[13px] line-clamp-2 leading-tight group-hover/item:text-primary transition-colors">
            {uc.name}
          </span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(uc.status)}`}>
            {uc.status === 'IN_PROGRESS' ? 'IN PROG' : uc.status}
          </span>
          <span className="material-symbols-outlined text-gray-400 text-[18px]">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
            {isLeader && !isDimmed && (
              <div className="flex items-center">
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (!isExpanded) {
                      loadRequirements();
                      setIsExpanded(true);
                    }
                    setIsEditing(true); 
                  }}
                  className="text-primary hover:text-[#11464f] p-1 hover:bg-primary/10 rounded-full transition-colors ml-1 shrink-0"
                  title="Edit Use Case"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
                <button 
                  onClick={handleDelete}
                  className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-full transition-colors ml-1 shrink-0"
                  title="Delete Use Case"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="flex flex-col border-t border-gray-100 bg-gray-50/50 p-4 text-[13px] overflow-y-auto max-h-[300px] custom-scrollbar">
          
          {/* Editable Form Fields */}
          <div className={`space-y-4 ${isEditing && !isDimmed ? 'opacity-100' : 'opacity-80 pointer-events-none'}`}>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Name *</label>
                <input 
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Linked Req *</label>
                <select 
                  name="requirementId" value={formData.requirementId} onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary bg-white"
                >
                  <option value="">-- Select --</option>
                  {requirements.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">Primary Actors</label>
              <input 
                type="text" name="actorsText" value={formData.actorsText} onChange={handleChange} placeholder="e.g. User, Admin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary bg-white"
              />
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Precondition</label>
                <textarea 
                  name="precondition" value={formData.precondition} onChange={handleChange} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary resize-none bg-white"
                />
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-1">Postcondition</label>
                <textarea 
                  name="postcondition" value={formData.postcondition} onChange={handleChange} rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary resize-none bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-600 font-medium mb-1">Main Flow (One step per line)</label>
              <textarea 
                name="mainFlowText" value={formData.mainFlowText} onChange={handleChange} rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary resize-y bg-white"
              />
            </div>
            
            <div className="border border-gray-200 p-3 rounded-lg bg-white">
              <label className="block text-gray-600 font-medium mb-2">Alternative Flow (One step per line)</label>
              <textarea 
                name="alternativeFlowText" value={formData.alternativeFlowText} onChange={handleChange} rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary resize-y mb-3 bg-white"
              />
              <label className="block text-gray-600 font-medium mb-1 text-xs">Branching from Main Flow step:</label>
              <select 
                name="branchFromStep" value={formData.branchFromStep} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary bg-white text-sm"
              >
                <option value="">Default (Last Step)</option>
                {mainFlowSteps.map((s, i) => (
                  <option key={i} value={i + 1}>Step {i + 1}: {s.substring(0, 30)}{s.length > 30 ? '...' : ''}</option>
                ))}
              </select>
            </div>
            
            {/* Bottom Form Actions (Save/Cancel) */}
            {isEditing && !isDimmed && (
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-md text-gray-600 hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary hover:bg-[#11464f] text-white px-5 py-2 rounded-md font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">save</span>
                  )}
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InlineUseCaseItem;
