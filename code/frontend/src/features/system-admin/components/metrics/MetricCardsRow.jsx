import React, { useEffect, useState } from 'react';
import MetricCard from './MetricCard';
import adminService from '../../services/adminService';

const MetricCardsRow = () => {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, alertsRes] = await Promise.all([
          adminService.getMetrics(),
          adminService.getAlerts()
        ]);
        
        if (metricsRes.data?.success) {
          setMetrics(metricsRes.data.data);
        }
        if (alertsRes.data?.success) {
          setAlerts(alertsRes.data.data);
        }
      } catch (err) {
        console.error("Failed to load metrics or alerts", err);
      }
    };
    fetchData();
  }, []);

  const totalAlerts = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* 1. Total Users */}
      <MetricCard 
        label="Total Users" 
        value={metrics.totalUsers?.toLocaleString() || '0'} 
        icon="group" 
        iconColor="text-[#1E707D]"
        iconBg="bg-[#1E707D]/10"
      >
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span className="text-on-surface text-[12px] font-semibold">{metrics.activeUsers || 0}</span>
            <span className="text-on-surface-variant text-[11px]">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
            <span className="text-on-surface-variant text-[12px] font-semibold">{(metrics.totalUsers || 0) - (metrics.activeUsers || 0)}</span>
          </div>
        </div>
      </MetricCard>

      {/* 2. Total Projects */}
      <MetricCard 
        label="Total Projects" 
        value={metrics.totalProjects?.toLocaleString() || '0'} 
        icon="folder_open" 
        iconColor="text-purple-500"
        iconBg="bg-purple-500/10"
      >
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <span className="text-on-surface text-[12px] font-semibold">{metrics.activeProjects || 0}</span>
            <span className="text-on-surface-variant text-[11px]">Active</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-emerald-600 text-[10px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">↑ 12% M/M</span>
          </div>
        </div>
      </MetricCard>

      {/* 3. Active Mentors */}
      <MetricCard 
        label="Active Mentors" 
        value={metrics.activeMentors?.toLocaleString() || '0'} 
        icon="school" 
        iconColor="text-amber-500"
        iconBg="bg-amber-500/10"
      >
        <div className="mt-5 flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full bg-surface-container border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold text-on-surface-variant shadow-sm relative z-10 hover:z-20 hover:-translate-y-1 transition-transform cursor-pointer">
                <span className="material-symbols-outlined text-[12px]">person</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">Experts</span>
        </div>
      </MetricCard>

      {/* 4. System Alerts */}
      <MetricCard 
        label="System Alerts" 
        value={totalAlerts.toString()} 
        icon={totalAlerts > 0 ? "warning_amber" : "notifications_active"} 
        iconColor={totalAlerts > 0 ? "text-error" : "text-emerald-500"}
        iconBg={totalAlerts > 0 ? "bg-error/10" : "bg-emerald-500/10"}
        valueColor={totalAlerts > 0 ? "text-error" : "text-emerald-600"}
      >
        <div className="mt-5 flex items-center gap-2">
          {totalAlerts === 0 ? (
            <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-medium">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              System healthy
            </div>
          ) : (
            <>
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5 bg-error/10 px-2 py-0.5 rounded-full text-error text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span> {criticalCount} Critical
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-0.5 rounded-full text-amber-700 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> {warningCount} Warn
                </div>
              )}
            </>
          )}
        </div>
      </MetricCard>
    </section>
  );
};

export default MetricCardsRow;
