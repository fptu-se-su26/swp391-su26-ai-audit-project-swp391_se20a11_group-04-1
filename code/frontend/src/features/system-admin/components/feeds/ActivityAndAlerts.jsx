import React from 'react';
import RecentActivityList from './RecentActivityList';
import CriticalAlertsPanel from './CriticalAlertsPanel';

const ActivityAndAlerts = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <RecentActivityList />
      <CriticalAlertsPanel />
    </div>
  );
};

export default ActivityAndAlerts;
