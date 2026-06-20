import React from 'react';
import SystemAdminLayout from '../layouts/SystemAdminLayout';
import QuickActions from '../components/actions/QuickActions';
import SystemOverviewBanner from '../components/banners/SystemOverviewBanner';
import MetricCardsRow from '../components/metrics/MetricCardsRow';
import PlatformGrowthChart from '../components/analytics/PlatformGrowthChart';
import ProjectHealthHeatmap from '../components/analytics/ProjectHealthHeatmap';
import ActivityAndAlerts from '../components/feeds/ActivityAndAlerts';

const AdminDashboardPage = () => {
  return (
    <SystemAdminLayout>
      <QuickActions />
      <SystemOverviewBanner />
      <MetricCardsRow />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PlatformGrowthChart />
        <ProjectHealthHeatmap />
      </div>
      
      <ActivityAndAlerts />
    </SystemAdminLayout>
  );
};

export default AdminDashboardPage;
