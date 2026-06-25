import React, { useState } from 'react';

const AlertCard = ({ priorityLabel, timeLabel, title, desc, details, btnText, level }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  let colorConfig = {
    bg: 'bg-surface-container-low',
    border: 'border-outline-variant',
    text: 'text-on-surface-variant',
    btnBg: 'bg-surface-container-highest',
    btnText: 'text-on-surface',
    btnBorder: 'border-outline-variant hover:bg-surface-container-high',
    badgeBg: 'bg-outline-variant/30',
    icon: 'info'
  };

  if (level === 'critical') {
    colorConfig = {
      bg: 'bg-red-50 dark:bg-red-900/10',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      btnBg: 'bg-white dark:bg-transparent',
      btnText: 'text-red-700 dark:text-red-400',
      btnBorder: 'border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20',
      badgeBg: 'bg-red-100 dark:bg-red-900/30',
      icon: 'error'
    };
  } else if (level === 'warning') {
    colorConfig = {
      bg: 'bg-orange-50 dark:bg-orange-900/10',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      btnBg: 'bg-white dark:bg-transparent',
      btnText: 'text-orange-700 dark:text-orange-400',
      btnBorder: 'border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-900/20',
      badgeBg: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'warning'
    };
  } else if (level === 'notice') {
    colorConfig = {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-400',
      btnBg: 'bg-white dark:bg-transparent',
      btnText: 'text-amber-700 dark:text-amber-400',
      btnBorder: 'border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: 'lightbulb'
    };
  }

  return (
    <div className={`p-5 rounded-2xl border ${colorConfig.border} ${colorConfig.bg} relative shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined text-[18px] ${colorConfig.text}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {colorConfig.icon}
          </span>
          <span className={`text-[11px] font-bold uppercase ${colorConfig.text} tracking-wider ${colorConfig.badgeBg} px-2.5 py-1 rounded-md`}>
            {priorityLabel}
          </span>
        </div>
        <span className="text-[11px] font-medium text-on-surface-variant opacity-80 mt-1">{timeLabel}</span>
      </div>
      <h5 className="text-title-sm text-on-surface font-bold mb-2 leading-snug">{title}</h5>
      <p className="text-[13px] text-on-surface-variant leading-relaxed mb-3">{desc}</p>
      
      {details && details.length > 0 && (
        <div className="mb-4">
          <ul className="space-y-1.5">
            {(isExpanded ? details : details.slice(0, 2)).map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-[12px] text-on-surface-variant bg-surface-container/50 px-2.5 py-1.5 rounded-lg border border-outline-variant/30">
                <span className="material-symbols-outlined text-[14px] opacity-70">
                  {title.includes('Users') ? 'person' : 'folder'}
                </span>
                <span className="truncate">{item}</span>
              </li>
            ))}
          </ul>
          
          {details.length > 2 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-[11px] font-bold text-[#1E707D] mt-2 ml-1 hover:underline focus:outline-none transition-all"
            >
              <span className="material-symbols-outlined text-[14px]">
                {isExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
              </span>
              {isExpanded ? 'Thu gọn' : `Xem thêm ${details.length - 2} mục khác`}
            </button>
          )}
        </div>
      )}

      <button className={`w-full py-2.5 rounded-xl font-bold text-[13px] ${colorConfig.btnBg} ${colorConfig.btnText} border ${colorConfig.btnBorder} transition-all active:scale-[0.98]`}>
        {btnText}
      </button>
    </div>
  );
};

export default AlertCard;
