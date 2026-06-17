import React from 'react';

const UseCaseMainFlow = ({ mainFlow, isEditing, onFlowChange }) => {
  const steps = mainFlow?.steps || [];

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
          <span className="material-symbols-outlined text-primary">play_circle</span> Main Success Scenario
        </h2>
        {isEditing && (
          <button
            type="button"
            onClick={handleAddStep}
            className="flex items-center gap-1 px-3 py-1.5 text-primary bg-primary-container hover:bg-primary/10 rounded-lg font-label-md text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> Add Step
          </button>
        )}
      </div>
      <div className="p-stack_md">
        {steps.length === 0 ? (
          <p className="text-on-surface-variant italic">No main flow steps defined.</p>
        ) : (
          <ol className="space-y-3 font-body-md text-body-md text-on-surface">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-3 items-start group">
                <span className="font-label-md text-label-md text-secondary bg-surface-container-highest w-7 h-7 flex items-center justify-center rounded-full shrink-0 mt-0.5">
                  {index + 1}
                </span>
                {isEditing ? (
                  <div className="flex-1 flex gap-2 items-start">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleStepChange(index, e.target.value)}
                      placeholder={`Step ${index + 1} description...`}
                      className="flex-1 px-3 py-1.5 border border-outline-variant rounded-lg bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md transition-all"
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
                  <span className="whitespace-pre-wrap py-1">{step}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

export default UseCaseMainFlow;
