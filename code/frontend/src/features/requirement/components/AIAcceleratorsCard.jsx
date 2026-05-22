import React from 'react';

const AIAcceleratorsCard = () => {
  return (
    <div className="bg-gradient-to-br from-surface-container-lowest to-primary-fixed/20 border border-primary-fixed-dim rounded-xl shadow-sm p-stack_lg relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-container rounded-full opacity-10 blur-xl"></div>
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary">auto_awesome</span>
        <h2 className="font-headline-sm text-headline-sm text-on-surface">AI Accelerators</h2>
      </div>
      <p className="font-body-md text-[13px] text-on-surface-variant mb-6">
        Leverage DevTrack AI to automatically breakdown this requirement into actionable items based on your description.
      </p>
      <div className="flex flex-col gap-3 relative z-10">
        <button className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container-lowest border border-outline-variant hover:border-primary hover:shadow-sm rounded-lg font-body-md text-body-md text-on-surface transition-all group">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">task</span>
            Suggest Tasks
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
        </button>
        <button className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container-lowest border border-outline-variant hover:border-primary hover:shadow-sm rounded-lg font-body-md text-body-md text-on-surface transition-all group">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">science</span>
            Generate Test Cases
          </div>
          <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default AIAcceleratorsCard;
