import React from 'react';

const QuickActions = () => {
  return (
    <section className="mb-6 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">add_circle</span> Create Academic Context
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">person_add</span> Assign Mentor
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">how_to_reg</span> Approve Pending Users
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">lock_reset</span> Reset User Password
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">analytics</span> View AI Usage
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">settings_suggest</span> Configure AI Features
        </button>
        <button className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-surface-container-low transition-colors shadow-sm">
          <span className="material-symbols-outlined text-sm">terminal</span> View System Logs
        </button>
      </div>
    </section>
  );
};

export default QuickActions;
