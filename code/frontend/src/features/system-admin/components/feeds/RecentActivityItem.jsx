import React from 'react';

const RecentActivityItem = ({ type, titleHTML, time, bgColor, textColor }) => {
  return (
    <div className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
      <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}>
        <span className="material-symbols-outlined text-[18px]">{type}</span>
      </div>
      <div className="flex-1">
        <div className="text-[13px] text-on-surface" dangerouslySetInnerHTML={{ __html: titleHTML }}></div>
        <div className="text-on-surface-variant text-[10px] font-label-md">{time}</div>
      </div>
      <span className="material-symbols-outlined text-on-surface-variant text-[18px] cursor-pointer hover:text-primary transition-colors">
        more_vert
      </span>
    </div>
  );
};

export default RecentActivityItem;
