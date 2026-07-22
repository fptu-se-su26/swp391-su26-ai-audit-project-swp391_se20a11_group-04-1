import React from 'react';

const RequirementDetailCriteria = ({ requirement }) => {
  if (!requirement) return null;

  let criteriaList = [];
  if (requirement.acceptanceCriteria) {
    try {
      criteriaList = typeof requirement.acceptanceCriteria === 'string'
        ? JSON.parse(requirement.acceptanceCriteria)
        : requirement.acceptanceCriteria;
    } catch (e) {
      console.error('Failed to parse acceptance criteria', e);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack_lg">
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 border-b border-surface-container-highest pb-2">Acceptance Criteria</h3>
      
      {criteriaList && criteriaList.length > 0 ? (
        <ul className="space-y-3">
          {criteriaList.map((criteria, index) => {
            const isChecked = requirement.coveredCriteria && requirement.coveredCriteria.includes(criteria);
            return (
              <li key={index} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                <input 
                  className="mt-1 border-outline-variant text-[#1E707D] focus:ring-[#1E707D] rounded" 
                  type="checkbox" 
                  checked={isChecked || false} 
                  readOnly 
                />
                <span className={`font-body-md text-sm font-medium ${isChecked ? 'text-green-700 line-through opacity-80' : 'text-slate-700'}`}>
                  {typeof criteria === 'string' ? criteria.replace(/^[\*\-\s]+/, '') : criteria}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-secondary italic text-sm">
          No acceptance criteria defined for this requirement.
        </div>
      )}
    </div>
  );
};

export default RequirementDetailCriteria;
