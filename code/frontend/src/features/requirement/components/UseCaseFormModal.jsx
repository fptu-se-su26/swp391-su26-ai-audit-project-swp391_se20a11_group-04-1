import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCaseService } from '../services/useCaseService';
import { requirementApi } from '../services/requirementApi';
import useProjectStore from '../../../store/useProjectStore';
import Button from '../../../components/ui/Button';

const UseCaseFormModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    requirementId: '',
    actorsText: '',
    status: 'DRAFT',
    version: 'v1.0',
    precondition: '',
    postcondition: '',
    mainFlowText: '',
    alternativeFlowText: '',
    branchFromStep: ''
  });

  // Dynamically compute available main flow steps for the branchFromStep dropdown
  const mainFlowSteps = formData.mainFlowText
    .split('\n')
    .filter(step => step.trim() !== '');
  const [loading, setLoading] = useState(false);
  
  const activeProject = useProjectStore((state) => state.activeProject);
  const [requirements, setRequirements] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(false);

  useEffect(() => {
    if (isOpen && activeProject?.id) {
      setLoadingReqs(true);
      // Giả sử API requirement search có hỗ trợ projectId
      requirementApi.getAllRequirements({ projectId: activeProject.id })
        .then(res => {
          // Backend returns PaginatedResponse which has an 'items' array
          const reqs = res.items || res.data?.content || res.data || res || [];
          setRequirements(Array.isArray(reqs) ? reqs : []);
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load requirements");
        })
        .finally(() => {
          setLoadingReqs(false);
        });
    }
  }, [isOpen, activeProject?.id]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.requirementId) {
      toast.error('Please select a Linked Requirement');
      return;
    }

    setLoading(true);
    try {
      const mainSteps = formData.mainFlowText.split('\n').filter(step => step.trim() !== '');
      const mainFlowJson = { steps: mainSteps.length > 0 ? mainSteps : [] };

      const altSteps = formData.alternativeFlowText.split('\n').filter(step => step.trim() !== '');
      const branchStep = formData.branchFromStep 
        ? parseInt(formData.branchFromStep) 
        : mainSteps.length; // Default to last step if not specified
      const altFlowJson = altSteps.length > 0 
        ? { flows: [{ branchFromStep: branchStep, condition: "Alternative Scenario", steps: altSteps }] }
        : { flows: [] };

      const payload = {
        name: formData.name,
        requirementId: parseInt(formData.requirementId),
        projectId: activeProject?.id,
        actors: formData.actorsText ? formData.actorsText.split(',').map(a => a.trim()).filter(a => a) : [],
        status: formData.status,
        version: formData.version,
        precondition: formData.precondition,
        postcondition: formData.postcondition,
        mainFlow: mainFlowJson,
        alternativeFlow: altFlowJson,
        completenessScore: 0
      };
      
      // Update useCaseService to pass projectId if needed by backend, though it's typically sent in URL
      // Since useCaseService.createUseCase currently expects just the data, we append it if needed, or if API doesn't need it, we don't.
      await useCaseService.createUseCase(payload);
      toast.success('Use Case created successfully!');
      
      setFormData({
        name: '', requirementId: '', actorsText: '', status: 'DRAFT', version: 'v1.0',
        precondition: '', postcondition: '', mainFlowText: '', alternativeFlowText: '',
        branchFromStep: ''
      });
      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to create Use Case!';
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined">post_add</span>
            </div>
            <div>
              <h2 className="font-display-sm text-display-sm text-on-surface">Create Use Case</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Define system interactions and scenarios</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </button>
        </div>
        
        {/* Form Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="useCaseForm" onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section: Basic Info */}
            <div>
              <h3 className="font-label-lg text-label-lg text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">info</span>
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5">Use Case Name *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">title</span>
                    <input 
                      type="text" name="name" required placeholder="e.g., User Login"
                      value={formData.name} onChange={handleChange}
                      className="w-full h-11 pl-10 pr-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md transition-all" 
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5">
                <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1">
                  Primary Actors
                  <span className="text-xs font-normal text-on-surface-variant">(Comma separated, e.g., Admin, Student)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">group</span>
                  <input 
                    type="text" name="actorsText" placeholder="System User, Admin"
                    value={formData.actorsText} onChange={handleChange}
                    className="w-full h-11 pl-10 pr-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Section: Links & State */}
            <div>
              <h3 className="font-label-lg text-label-lg text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">link</span>
                State & Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5">Linked Requirement *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[20px]">description</span>
                    <select 
                      name="requirementId" required
                      value={formData.requirementId} onChange={handleChange}
                      className="w-full h-11 pl-10 pr-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md appearance-none cursor-pointer transition-all"
                      disabled={loadingReqs}
                    >
                      <option value="" disabled>{loadingReqs ? 'Loading...' : 'Select Requirement'}</option>
                      {requirements.map(req => (
                        <option key={req.id} value={req.id}>{req.code} - {req.title}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant pointer-events-none">arrow_drop_down</span>
                  </div>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5">Status</label>
                  <select 
                    name="status" value={formData.status} onChange={handleChange}
                    className="w-full h-11 px-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md cursor-pointer transition-all"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5">Version</label>
                  <input 
                    type="text" name="version" placeholder="v1.0"
                    value={formData.version} onChange={handleChange}
                    className="w-full h-11 px-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Section: Conditions */}
            <div>
              <h3 className="font-label-lg text-label-lg text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">rule</span>
                Conditions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5">Precondition</label>
                  <textarea 
                    name="precondition" rows="3"
                    value={formData.precondition} onChange={handleChange}
                    placeholder="What must be true before this use case begins?"
                    className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md resize-none transition-all" 
                  ></textarea>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5">Postcondition</label>
                  <textarea 
                    name="postcondition" rows="3"
                    value={formData.postcondition} onChange={handleChange}
                    placeholder="What is the state of the system after this use case ends?"
                    className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md resize-none transition-all" 
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section: Flows */}
            <div>
              <h3 className="font-label-lg text-label-lg text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">account_tree</span>
                Execution Flows
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1">
                    Main Success Scenario
                    <span className="text-xs font-normal text-on-surface-variant">(1 step per line)</span>
                  </label>
                  <textarea 
                    name="mainFlowText" rows="6"
                    value={formData.mainFlowText} onChange={handleChange}
                    placeholder="1. User opens the login page&#10;2. User enters credentials&#10;3. System validates credentials"
                    className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md resize-y transition-all" 
                  ></textarea>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5 flex items-center gap-1">
                    Alternative Flows
                    <span className="text-xs font-normal text-on-surface-variant">(1 step per line)</span>
                  </label>
                  
                  {/* Branch From Step selector */}
                  <div className="mb-3">
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">fork_right</span>
                      Branches from Main Step
                    </label>
                    <select
                      name="branchFromStep"
                      value={formData.branchFromStep}
                      onChange={handleChange}
                      className="w-full h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-sm cursor-pointer transition-all"
                    >
                      <option value="">Auto (last step)</option>
                      {mainFlowSteps.map((step, idx) => (
                        <option key={idx} value={idx + 1}>
                          Step {idx + 1}: {step.length > 50 ? step.substring(0, 50) + '...' : step}
                        </option>
                      ))}
                    </select>
                    {mainFlowSteps.length === 0 && (
                      <p className="text-xs text-on-surface-variant mt-1 italic">Enter Main Scenario steps first to select a branch point.</p>
                    )}
                  </div>

                  <textarea 
                    name="alternativeFlowText" rows="5"
                    value={formData.alternativeFlowText} onChange={handleChange}
                    placeholder="If validation fails:&#10;1. System displays error message&#10;2. User remains on login page"
                    className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md resize-y transition-all" 
                  ></textarea>
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="useCaseForm" variant="primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>progress_activity</span>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>save</span>
                Save Use Case
              </span>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default UseCaseFormModal;
