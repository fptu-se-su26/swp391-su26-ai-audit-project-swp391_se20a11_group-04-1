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
          {criteriaList.map((criteria, index) => (
            <li key={index} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <input className="mt-1 border-outline-variant text-primary focus:ring-primary rounded" type="checkbox" readOnly />
              <span className="font-body-md text-sm text-slate-700 font-medium">{criteria}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-secondary italic text-sm">
          Chưa có tiêu chí nghiệm thu nào được định nghĩa cho Requirement này.
        </div>
      )}
    </div>
  );
};

export default RequirementDetailCriteria;
