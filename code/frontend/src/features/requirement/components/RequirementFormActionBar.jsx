import React from 'react';

const RequirementFormActionBar = ({ onCancel, onSave, onSaveDraft, loading }) => {
  return (
    <div className="sticky bottom-0 left-0 right-0 w-full bg-surface border-t border-outline-variant px-margin_desktop py-stack_md flex justify-end items-center gap-stack_md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-20">
      <button 
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-6 py-2 rounded-lg font-body-md text-body-md text-on-surface bg-surface-container-high hover:bg-surface-variant transition-colors border border-transparent disabled:opacity-50"
      >
        Cancel
      </button>
      <button 
        type="button" 
        onClick={onSaveDraft}
        className="px-6 py-2 rounded-lg font-body-md text-body-md text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-50" 
        disabled={loading}
      >
        Save Draft
      </button>
      <button 
        type="button"
        onClick={onSave}
        disabled={loading}
        className="px-6 py-2 h-11 rounded-lg font-body-md text-body-md font-medium text-on-primary bg-primary hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
        ) : (
          <span className="material-symbols-outlined text-[18px]">save</span>
        )}
        {loading ? 'Saving...' : 'Save Requirement'}
      </button>
    </div>
  );
};

export default RequirementFormActionBar;
