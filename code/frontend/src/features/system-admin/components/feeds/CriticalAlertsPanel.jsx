import React, { useEffect, useState } from 'react';
import AlertCard from './AlertCard';
import adminService from '../../services/adminService';
import { MOCK_CRITICAL_ALERTS } from '../../utils/adminMockData';

const CriticalAlertsPanel = () => {
  const [alerts, setAlerts] = useState(MOCK_CRITICAL_ALERTS);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await adminService.getAlerts();
        if (res.data?.success) {
          const backendAlerts = res.data.data;
          
          const mappedAlerts = backendAlerts.map(alert => {
            const minutesAgo = Math.floor((Date.now() - alert.timestamp) / 60000);
            
            let priorityLabel = 'WARNING';
            let title = 'System Notice';
            if (alert.severity === 'high') {
              priorityLabel = 'CRITICAL';
              title = 'Security Alert';
            } else if (alert.severity === 'ai') {
              priorityLabel = 'AI INSIGHT';
              title = 'AI Behavior Analysis';
            }

            return {
              id: alert.id,
              priorityLabel: priorityLabel,
              timeLabel: minutesAgo < 60 ? `${minutesAgo} mins ago` : `${Math.floor(minutesAgo / 60)} hours ago`,
              title: title,
              desc: alert.message,
              btnText: 'View Details',
              level: alert.severity
            };
          });
          
          setAlerts(mappedAlerts);
        }
      } catch (err) {
        console.error("Failed to fetch alerts", err);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="xl:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline-sm text-body-lg flex items-center gap-2 text-error">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span> Critical Alerts
        </h3>
        <span className="bg-error-container text-on-error-container px-2.5 py-0.5 rounded-full text-[10px] font-bold">
          {alerts.length} PENDING
        </span>
      </div>
      
      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[460px]">
        {alerts.length === 0 ? (
          <div className="text-center text-on-surface-variant p-4">No critical alerts</div>
        ) : (
          alerts.map(alert => (
            <AlertCard 
              key={alert.id}
              priorityLabel={alert.priorityLabel}
              timeLabel={alert.timeLabel}
              title={alert.title}
              desc={alert.desc}
              btnText={alert.btnText}
              level={alert.level}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CriticalAlertsPanel;
