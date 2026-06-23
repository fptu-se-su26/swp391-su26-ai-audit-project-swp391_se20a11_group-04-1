import React from 'react';

const RecentActivityItem = ({ type, titleHTML, time, bgColor, textColor }) => {
  return (
    <div className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}>
        <span className="material-symbols-outlined text-[18px]">{type}</span>
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div className="text-[13px] text-on-surface">{titleHTML}</div>
        <div className="text-on-surface-variant text-[12px] font-normal">{time}</div>
      </div>
    </div>
  );
};

export default RecentActivityItem;
