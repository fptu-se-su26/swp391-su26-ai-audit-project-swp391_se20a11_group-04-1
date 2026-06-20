import React from 'react';

const MetricCard = ({ label, value, trend, trendUp, icon, iconColor, valueColor }) => {
  const finalValueColor = valueColor || 'text-on-surface';
  
  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-4 rounded-xl card-hover shadow-sm flex flex-col justify-between h-[110px]">
      <div>
        <div className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider">
          {label}
        </div>
        <div className={`text-headline-md font-bold ${finalValueColor}`}>
          {value}
        </div>
      </div>
      <div className={`${iconColor} font-label-md text-[10px] flex items-center gap-1 ${valueColor ? 'font-bold' : ''}`}>
        <span className="material-symbols-outlined text-xs">{icon}</span> {trend}
      </div>
    </div>
  );
};

export default MetricCard;
