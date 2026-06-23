import React from 'react';

const UseCaseMainFlow = ({ mainFlow, isEditing, onFlowChange }) => {
  const steps = Array.isArray(mainFlow?.steps) ? mainFlow.steps : [];

  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    onFlowChange({ ...mainFlow, steps: newSteps });
  };

  const handleAddStep = () => {
    onFlowChange({ ...mainFlow, steps: [...steps, ''] });
  };

  const handleRemoveStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index);
    onFlowChange({ ...mainFlow, steps: newSteps });
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-stack_md py-3 border-b border-outline-variant flex justify-between items-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[#1E707D]">play_circle</span> Main Success Scenario
        </h2>
        {isEditing && (
          <button
            type="button"
            onClick={handleAddStep}
            className="flex items-center gap-1 px-3 py-1.5 text-[#1E707D] bg-[#1E707D]-container hover:bg-[#1E707D]/10 rounded-lg font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Step
          </button>
        )}
      </div>
      <div className="p-stack_md">
        {steps.length === 0 ? (
          <p className="text-on-surface-variant italic">No main flow steps defined.</p>
        ) : (
          <div className="flex flex-col gap-3 font-body-md text-body-md text-on-surface px-2">
            {steps.map((step, index) => (
              <div key={index} className="group flex items-start gap-2">
                {isEditing ? (
                  <div className="flex-1 flex gap-2 items-start mt-[-4px]">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Step ${index + 1} description...`}
                      className="flex-1 px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none text-body-md transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(index)}
                      className="w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors shrink-0"
                      title="Remove step"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{step}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UseCaseMainFlow;
