import React from 'react';

const UseCaseAIAnalysis = () => {
  return (
    <div className="bg-[#1E707D/5] border border-[#1E707D/10] rounded-lg p-stack_md relative overflow-hidden mt-gutter">
      <div className="absolute -right-4 -top-4 opacity-10">
        <span className="material-symbols-outlined text-[100px] text-[#1E707D]">smart_toy</span>
      </div>
      <h3 className="font-label-md text-label-md text-[#1E707D] uppercase mb-2 relative z-10 font-bold">AI Analysis</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mb-4 relative z-10 text-sm">
        This use case is well-defined. Consider adding an alternative flow for "Password Reset Request" directly from the login screen to improve coverage.
      </p>
      <button className="text-[#1E707D] font-label-md text-label-md hover:underline flex items-center gap-1 relative z-10">
        Generate missing flows <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
      </button>
    </div>
  );
};

export default UseCaseAIAnalysis;
