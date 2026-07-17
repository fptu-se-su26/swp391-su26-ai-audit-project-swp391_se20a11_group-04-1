import React from 'react';

const UseCaseStats = ({ useCases = [] }) => {
  const stats = [
    { label: 'Total Active', value: useCases.length, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Completed', value: useCases.filter(uc => uc.status === 'COMPLETED' || uc.status === 'DONE').length, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'In Draft', value: useCases.filter(uc => uc.status === 'DRAFT').length, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'AI Reviewed', value: useCases.filter(uc => uc.aiGenerated).length, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
  ];

  return (
    <div className="mt-4 mb-6">
      <div className="flex flex-wrap gap-3">
        {stats.map((stat, index) => (
          <div key={index} className={`flex-1 min-w-[180px] ${stat.bg} ${stat.border} border rounded-xl p-4 flex flex-col relative overflow-hidden transition-all hover:shadow-sm`}>
            <div className="flex items-baseline gap-2 z-10">
              <span className={`text-3xl font-extrabold ${stat.color}`}>{stat.value}</span>
            </div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1 z-10">{stat.label}</span>
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 bg-current ${stat.color}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UseCaseStats;
