import React from 'react';

const SystemOverviewBanner = () => {
  return (
    <section className="mb-6">
      <div className="h-[60px] bg-primary/5 border border-primary/10 rounded-xl px-6 flex items-center gap-4">
        <h2 className="text-headline-sm text-primary whitespace-nowrap">System Overview</h2>
        <div className="w-px h-6 bg-primary/20"></div>
        <p className="text-on-surface-variant font-body-md text-sm truncate">
          Monitor users, projects, resources, and overall platform activity across DevTrack AI.
        </p>
      </div>
    </section>
  );
};

export default SystemOverviewBanner;
