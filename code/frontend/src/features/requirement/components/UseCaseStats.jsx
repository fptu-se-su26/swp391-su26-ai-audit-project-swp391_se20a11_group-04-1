import React from 'react';

const UseCaseStats = () => {
  const stats = [
    { label: 'Total Active', value: 24, icon: 'account_tree', iconBg: 'bg-secondary-container', iconColor: 'text-on-secondary-container' },
    { label: 'Completed', value: 12, icon: 'check_circle', iconBg: 'bg-[#e6f4ea]', iconColor: 'text-[#137333]' },
    { label: 'In Draft', value: 8, icon: 'edit_document', iconBg: 'bg-surface-container-highest', iconColor: 'text-on-surface-variant' },
    { label: 'AI Reviewed', value: 18, icon: 'smart_toy', iconBg: 'bg-primary-container', iconColor: 'text-on-primary-container' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-stack_lg">
      {stats.map((stat, index) => (
        <div key={index} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack_md flex items-center justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">{stat.label}</p>
            <p className="font-headline-md text-headline-md text-on-surface mt-1">{stat.value}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}>
            <span className="material-symbols-outlined">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UseCaseStats;
