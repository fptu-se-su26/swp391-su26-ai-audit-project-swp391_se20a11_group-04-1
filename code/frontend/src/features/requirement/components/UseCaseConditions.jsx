import React from 'react';

const UseCaseConditions = ({ precondition, postcondition, isEditing, onFieldChange }) => {
  return (
    <>
      {/* Preconditions */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack_md mb-gutter">
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-3 flex items-center gap-2 border-b border-outline-variant pb-2">
          <span className="material-symbols-outlined text-secondary">fact_check</span> Preconditions
        </h2>
        {isEditing ? (
          <textarea
            value={precondition || ''}
            onChange={(e) => onFieldChange('precondition', e.target.value)}
            rows={3}
            placeholder="What must be true before this use case begins?"
            className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md font-body-md resize-y transition-all"
          />
        ) : precondition ? (
          <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap">
            {precondition}
          </p>
        ) : (
          <p className="font-body-md text-body-md text-on-surface-variant italic">None specified.</p>
        )}
      </div>

      {/* Postconditions */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-stack_md">
        <h2 className="font-headline-sm text-headline-sm text-on-surface mb-3 flex items-center gap-2 border-b border-outline-variant pb-2">
          <span className="material-symbols-outlined text-secondary">flag</span> Postconditions
        </h2>
        {isEditing ? (
          <textarea
            value={postcondition || ''}
            onChange={(e) => onFieldChange('postcondition', e.target.value)}
            rows={3}
            placeholder="What is the state of the system after this use case ends?"
            className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none text-body-md font-body-md resize-y transition-all"
          />
        ) : postcondition ? (
          <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap">
            {postcondition}
          </p>
        ) : (
          <p className="font-body-md text-body-md text-on-surface-variant italic">None specified.</p>
        )}
      </div>
    </>
  );
};

export default UseCaseConditions;
