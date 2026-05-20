import React, { useState } from 'react';

const RequirementFormCriteria = ({ formData, onChange }) => {
  const [newCriterion, setNewCriterion] = useState('');

  const addCriterion = () => {
    if (newCriterion.trim() !== '') {
      onChange('acceptanceCriteria', [...formData.acceptanceCriteria, newCriterion.trim()]);
      setNewCriterion('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCriterion();
    }
  };

  const removeCriterion = (index) => {
    const newCriteria = [...formData.acceptanceCriteria];
    newCriteria.splice(index, 1);
    onChange('acceptanceCriteria', newCriteria);
  };

  const updateCriterion = (index, value) => {
    const newCriteria = [...formData.acceptanceCriteria];
    newCriteria[index] = value;
    onChange('acceptanceCriteria', newCriteria);
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
      <div className="px-stack_lg py-stack_md border-b border-surface-container-high flex justify-between items-center">
        <h2 className="font-headline-sm text-headline-sm text-on-surface">Acceptance Criteria</h2>
        <button 
          type="button"
          onClick={addCriterion}
          className="flex items-center gap-1 text-primary hover:text-on-primary-fixed-variant font-label-md text-label-md transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> Add Criterion
        </button>
      </div>
      <div className="p-stack_lg flex flex-col gap-stack_sm">
        {formData.acceptanceCriteria.map((criterion, index) => (
          <div key={index} className="flex items-start gap-3 group">
            <input className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-fixed-dim bg-surface-bright cursor-pointer" type="checkbox" />
            <input 
              className="flex-1 bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary focus:outline-none font-body-md text-body-md py-1 transition-colors" 
              type="text" 
              value={criterion}
              onChange={(e) => updateCriterion(index, e.target.value)}
            />
            <button type="button" onClick={() => removeCriterion(index)} className="opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ))}
        {/* New Criterion Input */}
        <div className="flex items-start gap-3 group">
          <input className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary-fixed-dim bg-surface-bright cursor-pointer" type="checkbox" disabled />
          <input 
            className="flex-1 bg-transparent border-b border-outline-variant focus:border-primary focus:outline-none font-body-md text-body-md py-1 transition-colors" 
            placeholder="Enter new criterion..." 
            type="text"
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addCriterion}
          />
        </div>
      </div>
    </div>
  );
};

export default RequirementFormCriteria;
