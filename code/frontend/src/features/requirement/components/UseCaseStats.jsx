import React from 'react';

const UseCaseStats = ({ useCases = [] }) => {
  const stats = [
    { label: 'TOTAL ACTIVE', value: useCases.length, bg: 'bg-[#1E707D/10]', icon: 'grid_view', iconColor: 'text-[#1E707D]' },
    { label: 'COMPLETED', value: useCases.filter(uc => uc.status === 'COMPLETED' || uc.status === 'DONE').length, bg: 'bg-[#E1F5EE]', icon: 'check_circle', iconColor: 'text-[#1D9E75]' },
    { label: 'IN DRAFT', value: useCases.filter(uc => uc.status === 'DRAFT').length, bg: 'bg-[#F3F4F6]', icon: 'edit_document', iconColor: 'text-[#9CA3AF]' },
    { label: 'AI REVIEWED', value: useCases.filter(uc => uc.aiGenerated).length, bg: 'bg-[#1E707D]/10', icon: 'smart_toy', iconColor: 'text-[#1E707D]' },
  ];

  return (
    <div className="px-[32px] mt-[20px]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-[12px]">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white border border-[#E5E7EB] rounded-[12px] p-[16px_20px] flex items-center justify-between">
            <div>
              <p className="text-[24px] font-[600] text-[#111827] leading-none">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-[0.05em] text-[#9CA3AF] mt-2 font-medium">{stat.label}</p>
            </div>
            <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center ${stat.bg} ${stat.iconColor}`}>
              <span className="material-symbols-outlined text-[20px]">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UseCaseStats;
