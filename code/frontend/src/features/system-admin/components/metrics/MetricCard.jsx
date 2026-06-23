import React from 'react';

const MetricCard = ({ label, value, icon, iconColor, iconBg, valueColor, children }) => {
  const finalValueColor = valueColor || 'text-on-surface';
  
  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-5 rounded-2xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
      {/* Subtle background glow on hover */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${iconBg?.split('/')[0]}`}></div>

      <div className="flex justify-between items-start">
        <div>
          <div className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className={`text-headline-lg font-bold tracking-tight ${finalValueColor}`}>
            {value}
          </div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} shadow-inner`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
      </div>
      
      {/* Custom rich content (progress bars, badges, etc) */}
      <div className="mt-auto">
        {children}
      </div>
    </div>
  );
};

export default MetricCard;
