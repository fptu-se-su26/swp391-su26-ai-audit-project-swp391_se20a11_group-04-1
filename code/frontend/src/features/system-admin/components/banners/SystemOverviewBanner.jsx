import React from 'react';

const SystemOverviewBanner = () => {
  return (
    <section className="mb-8 mt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h2 className="text-[28px] font-bold text-on-surface flex items-center gap-2 tracking-tight">
          Welcome back, Admin 👋
        </h2>
        <p className="text-on-surface-variant text-[15px] mt-1">
          Here's what's happening across DevTrack AI today.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <select className="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 text-[13px] text-on-surface font-medium focus:border-primary focus:outline-none cursor-pointer shadow-sm hover:bg-surface-container-low transition-colors">
          <option>Today</option>
          <option>Last 7 days</option>
          <option>Last 30 days</option>
        </select>
        <button className="bg-primary text-on-primary px-4 py-2 rounded-lg text-[13px] font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Report
        </button>
      </div>
    </section>
  );
};

export default SystemOverviewBanner;
