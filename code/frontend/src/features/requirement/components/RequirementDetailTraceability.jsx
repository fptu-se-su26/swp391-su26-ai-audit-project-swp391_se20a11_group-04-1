import React from 'react';

const RequirementDetailTraceability = ({ requirement }) => {
  if (!requirement) return null;

  // Temporary mock logic since API doesn't return these metrics yet
  const tasksCount = 0;
  const tasksTotal = 0;
  
  const testsCount = 0;
  const testsTotal = 0;

  const evidenceCount = 0;
  const evidenceTotal = 0;

  const bugsCount = 0;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack_lg">
      <div className="flex justify-between items-center mb-4 border-b border-surface-container-highest pb-2">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">Traceability Status</h3>
        <button className="text-primary hover:text-on-primary-fixed-variant text-sm font-medium">View RTM</button>
      </div>
      <div className="space-y-4">
        {/* Tasks Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-body-md text-body-md text-secondary">Tasks</span>
            <span className="font-label-md text-label-md font-medium text-secondary">{tasksCount}/{tasksTotal} Done</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2">
            <div className="bg-outline-variant h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
        {/* Tests Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-body-md text-body-md text-secondary">Tests</span>
            <span className="font-label-md text-label-md font-medium text-secondary">{testsCount}/{testsTotal} Pass</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2">
            <div className="bg-outline-variant h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
        {/* Evidence Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-body-md text-body-md text-secondary">Evidence</span>
            <span className="font-label-md text-label-md font-medium text-secondary">{evidenceCount}/{evidenceTotal} Accepted</span>
          </div>
          <div className="w-full bg-surface-container-high rounded-full h-2">
            <div className="bg-outline-variant h-2 rounded-full" style={{ width: '0%' }}></div>
          </div>
        </div>
        {/* Bugs */}
        <div className="pt-2 border-t border-outline-variant">
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">bug_report</span> Active Bugs
            </span>
            <span className="font-label-md text-label-md bg-surface-container-high text-secondary px-2 py-1 rounded">{bugsCount} Open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementDetailTraceability;
