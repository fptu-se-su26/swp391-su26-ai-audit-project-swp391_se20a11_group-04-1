import React from 'react';

const AlertCard = ({ priorityLabel, timeLabel, title, desc, btnText, level }) => {
  if (level === 'high') {
    return (
      <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 relative shadow-md">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase text-primary tracking-wider bg-primary/10 px-2 py-0.5 rounded">
            {priorityLabel}
          </span>
          <span className="text-[10px] font-label-md text-on-surface-variant">{timeLabel}</span>
        </div>
        <h5 className="text-body-md text-on-surface font-bold mb-1">{title}</h5>
        <p className="text-[12px] text-on-surface-variant leading-relaxed">{desc}</p>
        <button className="mt-4 w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-[12px] hover:shadow-lg transition-all active:scale-[0.98] font-bold">
          {btnText}
        </button>
      </div>
    );
  }

  if (level === 'ai') {
    return (
      <div className="p-4 rounded-xl border border-tertiary/30 bg-tertiary/5">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-bold uppercase text-tertiary tracking-wider bg-tertiary/10 px-2 py-0.5 rounded">
            {priorityLabel}
          </span>
          <span className="text-[10px] font-label-md text-on-surface-variant">{timeLabel}</span>
        </div>
        <h5 className="text-body-md text-on-surface font-bold mb-1">{title}</h5>
        <p className="text-[12px] text-on-surface-variant leading-relaxed">{desc}</p>
        <button className="mt-3 w-full py-2 bg-tertiary text-on-tertiary rounded-lg font-label-md text-[11px] hover:opacity-90 transition-all font-bold">
          {btnText}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-low hover:bg-surface-container-high transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold uppercase text-on-surface-variant tracking-wider bg-outline-variant/30 px-2 py-0.5 rounded">
          {priorityLabel}
        </span>
        <span className="text-[10px] font-label-md text-on-surface-variant">{timeLabel}</span>
      </div>
      <h5 className="text-body-md text-on-surface font-bold mb-1">{title}</h5>
      <p className="text-[12px] text-on-surface-variant leading-relaxed">{desc}</p>
      <button className="mt-3 w-full py-2 bg-surface-container-highest text-on-surface border border-outline-variant rounded-lg font-label-md text-[11px] hover:bg-white transition-all">
        {btnText}
      </button>
    </div>
  );
};

export default AlertCard;
