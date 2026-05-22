import React from 'react';

const RequirementFormHeader = ({ onClose }) => {
  return (
    <div className="flex items-center justify-between gap-4 mb-stack_lg pb-4 border-b border-outline-variant/50">
      <div className="flex items-center gap-4">
        <h1 className="font-display-lg text-display-lg text-on-surface">Create Requirement</h1>
        <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-md text-label-md border border-outline-variant">DRAFT</span>
      </div>
      <button 
        onClick={onClose}
        className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors active:scale-95 duration-150"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
};

export default RequirementFormHeader;
