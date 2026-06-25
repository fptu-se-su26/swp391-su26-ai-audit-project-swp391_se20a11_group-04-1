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
    </section>
  );
};

export default SystemOverviewBanner;
