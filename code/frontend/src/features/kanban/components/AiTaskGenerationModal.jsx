import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { requirementService } from '../../requirement/services/requirementService';
import { useCaseService } from '../../requirement/services/useCaseService';
import taskService from '../services/taskService';
import Button from '../../../components/ui/Button';

const AiTaskGenerationModal = ({ isOpen, onClose, projectId, onGenerate }) => {
  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [selectedReqIds, setSelectedReqIds] = useState(new Set());
  const [isInvalidExpanded, setIsInvalidExpanded] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setRequirements([]);
      setSelectedReqIds(new Set());
      fetchData();
    }
  }, [isOpen, projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqs, ucs, allTasks] = await Promise.all([
        requirementService.getRequirements(projectId),
        useCaseService.getAllUseCases(projectId),
        taskService.getProjectTasks(projectId)
      ]);

      const activeReqs = reqs.filter(r => r.status !== 'CLOSED');

      const reqsWithValidation = activeReqs.map(req => {
        const reqUseCases = ucs.filter(uc => uc.requirementId === req.id);
        const reqTasks = allTasks.filter(t => t.requirementId === req.id);
        let isValid = true;
        let warning = '';

        if (req.type && req.type !== 'FUNCTIONAL') {
          isValid = true;
          warning = 'Non-functional requirement. Technical tasks will be automatically inferred from the description.';
        } else if (reqUseCases.length === 0) {
          isValid = false;
          warning = 'Functional requirements must have Use Cases to generate Tasks.';
        } else {
          const hasInvalidUc = reqUseCases.some(uc => {
            const hasName = uc.name && uc.name.trim() !== '';
            
            let hasFlow = false;
            if (uc.mainSuccessScenario && typeof uc.mainSuccessScenario === 'string' && uc.mainSuccessScenario.trim() !== '') {
              hasFlow = true;
            } else if (uc.mainFlow) {
              if (typeof uc.mainFlow === 'string' && uc.mainFlow.trim() !== '') {
                try {
                  const parsedFlow = JSON.parse(uc.mainFlow);
                  if (parsedFlow.steps && parsedFlow.steps.length > 0) {
                    hasFlow = true;
                  }
                } catch (e) {
                  hasFlow = true; 
                }
              } else if (typeof uc.mainFlow === 'object' && uc.mainFlow !== null) {
                if (Array.isArray(uc.mainFlow.steps) && uc.mainFlow.steps.length > 0) {
                  hasFlow = true;
                }
              }
            }

            return !hasName || !hasFlow;
          });

          if (hasInvalidUc) {
            isValid = false;
            warning = 'Child Use Case is missing basic data (name or main flow), please add before generating Tasks.';
          }
        }

        return {
          ...req,
          useCases: reqUseCases,
          taskCount: reqTasks.length,
          isValid,
          warning
        };
      });

      setRequirements(reqsWithValidation);
      // Do NOT auto select valid requirements initially
      setSelectedReqIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('Failed to load Requirements and Use Cases.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedReqIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedReqIds(newSet);
  };

  const handleGenerate = () => {
    if (selectedReqIds.size === 0) {
      toast.error('Please select at least 1 valid Requirement.');
      return;
    }
    onGenerate(Array.from(selectedReqIds));
  };

  if (!isOpen) return null;

  const validReqs = requirements.filter(r => r.isValid);
  const invalidReqs = requirements.filter(r => !r.isValid);

  const getReqTypeBadge = (type) => {
    switch(type) {
      case 'FUNCTIONAL': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'NON_FUNCTIONAL': return 'text-slate-700 bg-slate-50 border-slate-200';
      case 'SECURITY': return 'text-red-700 bg-red-50 border-red-200';
      case 'BUSINESS': return 'text-amber-700 bg-amber-50 border-amber-200';
      default: return 'text-indigo-700 bg-indigo-50 border-indigo-200';
    }
  };

  // Check if all valid items are selected
  const isAllValidSelected = validReqs.length > 0 && selectedReqIds.size === validReqs.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">psychology</span>
              AI Task Generation
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select Requirements for AI to extract into Technical Tasks
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-4xl text-indigo-600 mb-4">progress_activity</span>
              <p className="text-slate-500 font-medium">Analyzing Requirements & Use Cases...</p>
            </div>
          ) : requirements.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No Requirements in this project.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-center gap-6 text-sm font-medium text-slate-700 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="text-green-600">✅</span> {validReqs.length} can generate
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-amber-500">⚠️</span> {invalidReqs.length} invalid
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white px-4 py-2 rounded border border-slate-200">
                  <span className="text-sm font-medium text-slate-700">
                    Selected: <strong className="text-indigo-600">{selectedReqIds.size}</strong> / {validReqs.length} valid
                  </span>
                  <button
                    className="px-3 py-1.5 text-[13px] font-bold text-white bg-[#1D7A85] hover:bg-[#166069] rounded-md transition-colors shadow-sm"
                    onClick={() => {
                      const validIds = validReqs.map(r => r.id);
                      if (selectedReqIds.size === validIds.length) {
                        setSelectedReqIds(new Set());
                      } else {
                        setSelectedReqIds(new Set(validIds));
                      }
                    }}
                  >
                    Select All
                  </button>
                </div>
              </div>

              {/* Valid Requirements Section */}
              {validReqs.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Can generate Task ({validReqs.length})</span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {validReqs.map(req => (
                      <label
                        key={req.id}
                        className={`flex items-center gap-3 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                          selectedReqIds.has(req.id) 
                            ? 'border-indigo-500 bg-indigo-50/30' 
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedReqIds.has(req.id)}
                          onChange={() => toggleSelect(req.id)}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="px-2 py-0.5 bg-[#1D7A85] text-white text-[11px] font-bold rounded shadow-sm tracking-wide shrink-0">
                              {req.reqCode || 'REQ'}
                            </span>
                            <span className="text-slate-800 text-sm font-medium">{req.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                req.taskCount > 0 
                                  ? 'text-teal-600 bg-teal-50 border-teal-200' 
                                  : 'text-slate-400 bg-slate-50 border-slate-100'
                              }`}
                            >
                              {req.taskCount} Tasks
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {req.useCases?.length || 0} UC
                            </span>
                            {req.type && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${getReqTypeBadge(req.type)}`}>
                                {req.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Invalid Requirements Section */}
              {invalidReqs.length > 0 && (
                <div>
                  <div 
                    className="flex items-center gap-3 mb-3 cursor-pointer group"
                    onClick={() => setIsInvalidExpanded(!isInvalidExpanded)}
                  >
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider group-hover:text-slate-600 transition-colors">
                      Invalid ({invalidReqs.length}) {isInvalidExpanded ? '▲' : '▼'}
                    </span>
                    <div className="h-px bg-slate-200 flex-1"></div>
                  </div>
                  
                  {!isInvalidExpanded && (
                    <p className="text-xs text-center text-slate-400 italic mb-2">(collapsed by default, click to view)</p>
                  )}

                  {isInvalidExpanded && (
                    <div className="grid grid-cols-1 gap-2">
                      {invalidReqs.map(req => (
                        <div
                          key={req.id}
                          className="flex items-start gap-3 px-3 py-2 border border-slate-200 bg-slate-50/50 rounded-lg opacity-60"
                        >
                          <input
                            type="checkbox"
                            disabled
                            className="w-4 h-4 mt-0.5 rounded border-slate-200 bg-slate-100 cursor-not-allowed"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-1">
                              <span className="px-2 py-0.5 bg-slate-400 text-white text-[11px] font-bold rounded shadow-sm tracking-wide shrink-0">
                                {req.reqCode || 'REQ'}
                              </span>
                              <span className="text-slate-600 text-sm font-medium">{req.title}</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded">
                              <span>⚠️</span> {req.warning}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <Button variant="outlined" onClick={onClose} className="border-slate-300 text-slate-600 hover:bg-slate-100">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerate} 
            disabled={loading || selectedReqIds.size === 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Generate Tasks ({selectedReqIds.size})
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AiTaskGenerationModal;
