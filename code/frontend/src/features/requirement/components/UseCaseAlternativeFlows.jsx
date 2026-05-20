import React, { useMemo } from 'react';

/**
 * Generates dynamic alternative flow labels based on branchFromStep.
 */
const computeFlowLabels = (flows, totalMainSteps) => {
  const stepCounters = {};

  return flows.map((flow) => {
    let stepNum = flow.branchFromStep;

    if (stepNum === undefined || stepNum === null) {
      stepNum = totalMainSteps > 0 ? totalMainSteps : 1;
    }

    if (totalMainSteps > 0) {
      stepNum = Math.max(1, Math.min(stepNum, totalMainSteps));
    }

    if (!stepCounters[stepNum]) {
      stepCounters[stepNum] = 0;
    }
    const alphaSuffix = String.fromCharCode(97 + stepCounters[stepNum]); // 97 = 'a'
    stepCounters[stepNum]++;

    return {
      label: `${stepNum}${alphaSuffix}`,
      stepNum,
    };
  });
};

const UseCaseAlternativeFlows = ({ alternativeFlow, mainFlow, isEditing, onFlowChange }) => {
  const flows = alternativeFlow?.flows || [];
  const totalMainSteps = mainFlow?.steps?.length || 0;

  const flowLabels = useMemo(
    () => computeFlowLabels(flows, totalMainSteps),
    [flows, totalMainSteps]
  );

  const handleAddFlow = () => {
    const newFlows = [...flows, { condition: '', branchFromStep: totalMainSteps || 1, steps: [''] }];
    onFlowChange({ ...alternativeFlow, flows: newFlows });
  };

  const handleRemoveFlow = (index) => {
    const newFlows = flows.filter((_, i) => i !== index);
    onFlowChange({ ...alternativeFlow, flows: newFlows });
  };

  const handleFlowFieldChange = (index, field, value) => {
    const newFlows = [...flows];
    newFlows[index] = { ...newFlows[index], [field]: value };
    onFlowChange({ ...alternativeFlow, flows: newFlows });
  };

  const handleAddStep = (flowIndex) => {
    const newFlows = [...flows];
    const steps = [...(newFlows[flowIndex].steps || []), ''];
    newFlows[flowIndex] = { ...newFlows[flowIndex], steps };
    onFlowChange({ ...alternativeFlow, flows: newFlows });
  };

  const handleRemoveStep = (flowIndex, stepIndex) => {
    const newFlows = [...flows];
    const steps = newFlows[flowIndex].steps.filter((_, i) => i !== stepIndex);
    newFlows[flowIndex] = { ...newFlows[flowIndex], steps };
    onFlowChange({ ...alternativeFlow, flows: newFlows });
  };

  const handleStepChange = (flowIndex, stepIndex, value) => {
    const newFlows = [...flows];
    const steps = [...newFlows[flowIndex].steps];
    steps[stepIndex] = value;
    newFlows[flowIndex] = { ...newFlows[flowIndex], steps };
    onFlowChange({ ...alternativeFlow, flows: newFlows });
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-stack_md py-3 border-b border-outline-variant flex justify-between items-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">alt_route</span> Alternative Flows
        </h2>
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md px-2 py-1 bg-surface-variant text-on-surface-variant rounded-DEFAULT">
            {flows.length} Flow{flows.length !== 1 ? 's' : ''}
          </span>
          {isEditing && (
            <button
              type="button"
              onClick={handleAddFlow}
              className="flex items-center gap-1 px-3 py-1 text-tertiary bg-tertiary-container hover:bg-tertiary/10 rounded-lg font-label-md text-label-md transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add</span> Add Flow
            </button>
          )}
        </div>
      </div>
      <div className="p-0">
        {flows.length === 0 ? (
          <div className="p-stack_md text-on-surface-variant italic">No alternative flows defined.</div>
        ) : (
          flows.map((flow, index) => (
            <div key={index} className={`p-stack_md hover:bg-surface-container-lowest transition-colors ${index !== flows.length - 1 ? 'border-b border-outline-variant' : ''}`}>
              {isEditing ? (
                <div className="mb-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Branches from step:</span>
                        <select
                          value={flow.branchFromStep || (totalMainSteps > 0 ? totalMainSteps : 1)}
                          onChange={(e) => handleFlowFieldChange(index, 'branchFromStep', parseInt(e.target.value))}
                          className="px-2 py-1 border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-sm transition-all"
                        >
                          {Array.from({ length: totalMainSteps || 1 }, (_, i) => i + 1).map(stepNum => (
                            <option key={stepNum} value={stepNum}>Step {stepNum}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        value={flow.condition || ''}
                        onChange={(e) => handleFlowFieldChange(index, 'condition', e.target.value)}
                        placeholder="Condition (e.g. If validation fails)"
                        className="w-full px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md font-semibold transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFlow(index)}
                      className="w-8 h-8 flex items-center justify-center text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors shrink-0 mt-1"
                      title="Remove Flow"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  
                  <div className="pl-4 border-l-2 border-outline-variant ml-2 space-y-2 mt-3">
                    {flow.steps?.map((step, stepIndex) => (
                      <div key={stepIndex} className="flex gap-2 items-start">
                        <span className="text-on-surface-variant text-sm mt-1 shrink-0">•</span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => handleStepChange(index, stepIndex, e.target.value)}
                          placeholder="Step description"
                          className="flex-1 px-3 py-1 border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-sm transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(index, stepIndex)}
                          className="w-7 h-7 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors shrink-0"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddStep(index)}
                      className="text-xs flex items-center gap-1 text-primary hover:bg-primary/5 px-2 py-1 rounded transition-colors ml-2"
                    >
                      <span className="material-symbols-outlined text-[14px]">add</span> Add Flow Step
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="font-body-lg text-body-lg text-on-surface font-semibold mb-2">
                    {flowLabels[index]?.label || `${index + 1}a`}. {flow.condition || 'Alternative Condition'}
                  </h3>
                  <ul className="list-disc list-inside space-y-1 font-body-md text-body-md text-on-surface ml-2">
                    {flow.steps?.map((step, idx) => (
                      <li key={idx} className="whitespace-pre-wrap">{step}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UseCaseAlternativeFlows;
