import React, { useEffect, useState } from 'react';
import MetricCard from './MetricCard';
import adminService from '../../services/adminService';
import { MOCK_METRICS } from '../../utils/adminMockData';

const MetricCardsRow = () => {
  const [metrics, setMetrics] = useState(MOCK_METRICS);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await adminService.getMetrics();
        if (res.data?.success) {
          const data = res.data.data;
          
          // Map backend data to frontend card format matching exactly the 6 original cards
          setMetrics([
            { id: 1, label: 'Total Users', value: data.totalUsers.toLocaleString(), trend: `${data.activeUsers} active`, trendUp: true, icon: 'trending_up', iconColor: 'text-green-600' },
            { id: 2, label: 'Active Projects', value: data.activeProjects.toLocaleString(), trend: `${data.totalProjects} total`, trendUp: true, icon: 'assignment_late', iconColor: 'text-primary' },
            { id: 3, label: 'Active Mentors', value: data.activeMentors.toLocaleString(), trend: '24 assigned', trendUp: true, icon: 'group', iconColor: 'text-on-surface-variant' },
            { id: 4, label: 'AI Requests', value: (data.aiRequestsThisWeek / 1000).toFixed(1) + 'K', trend: '+12% this week', trendUp: true, icon: 'auto_awesome', iconColor: 'text-green-600' },
            { id: 5, label: 'Storage Used', value: `${data.storageUsedGb} GB`, trend: '68% of 500 GB', trendUp: true, icon: 'cloud', iconColor: 'text-on-surface-variant' },
            { id: 6, label: 'System Alerts', value: '3', trend: '1 high priority', trendUp: false, icon: 'warning', iconColor: 'text-error', valueColor: 'text-error' }
          ]);
        }
      } catch (err) {
        console.error("Failed to load metrics", err);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {metrics.map(metric => (
        <MetricCard 
          key={metric.id}
          label={metric.label}
          value={metric.value}
          trend={metric.trend}
          trendUp={metric.trendUp}
          icon={metric.icon}
          iconColor={metric.iconColor}
          valueColor={metric.valueColor}
        />
      ))}
    </section>
  );
};

export default MetricCardsRow;
