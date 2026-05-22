import React from 'react';

const RequirementDetailAIActions = ({ requirement }) => {
  if (!requirement) return null;

  return (
    <>
      <div className="bg-[#dcfce7] border-l-4 border-[#16a34a] p-4 rounded mb-gutter flex items-start gap-3 shadow-sm">
        <span className="material-symbols-outlined text-[#16a34a] filled mt-0.5">check_circle</span>
        <div>
          <h4 className="font-body-md text-body-md font-semibold text-[#166534]">AI Insight</h4>
          <p className="font-body-md text-body-md text-[#166534] mt-1">Mọi thứ đang diễn ra rất tốt! Hiện tại chưa phát hiện thiếu sót Evidence nào.</p>
        </div>
      </div>

      {/* Quick Actions / Suggestions */}
      <div className="bg-primary-fixed/30 border border-primary-fixed-dim rounded-xl p-stack_lg">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary filled">smart_toy</span> AI Actions
        </h3>
        <div className="space-y-2">
          <button className="w-full text-left px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded hover:border-primary hover:shadow-sm transition-all font-body-md text-body-md text-on-surface flex justify-between items-center">
            Suggest Missing Tests <span className="material-symbols-outlined text-[18px] text-secondary">chevron_right</span>
          </button>
          <button className="w-full text-left px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded hover:border-primary hover:shadow-sm transition-all font-body-md text-body-md text-on-surface flex justify-between items-center">
            Review Acceptance Criteria <span className="material-symbols-outlined text-[18px] text-secondary">chevron_right</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default RequirementDetailAIActions;
