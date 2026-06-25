import React, { useEffect, useState } from 'react';
import AlertCard from './AlertCard';
import adminService from '../../services/adminService';

const CriticalAlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await adminService.getAlerts();
        if (res.data?.success) {
          const backendAlerts = res.data.data;
          
          const mappedAlerts = backendAlerts.map(alert => {
            const minutesAgo = Math.floor((Date.now() - alert.timestamp) / 60000);
            
            let timeStr = '';
            if (minutesAgo < 60) timeStr = `${minutesAgo} mins ago`;
            else if (minutesAgo < 1440) timeStr = `${Math.floor(minutesAgo / 60)} hours ago`;
            else timeStr = `${Math.floor(minutesAgo / 1440)} days ago`;

            return {
              id: alert.id,
              priorityLabel: String(alert.severity).toUpperCase(),
              timeLabel: timeStr,
              title: alert.title,
              desc: alert.message,
              details: alert.details || [],
              btnText: 'View Details',
              level: alert.severity
            };
          });
          
          setAlerts(mappedAlerts);
        }
      } catch (err) {
        console.error("Failed to fetch alerts", err);
        setError(true);
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
        {error ? (
          <div className="text-center text-error p-4">Failed to load critical alerts.</div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-on-surface-variant p-4">No critical alerts</div>
        ) : (
          alerts.map(alert => (
            <AlertCard 
              key={alert.id}
              priorityLabel={alert.priorityLabel}
              timeLabel={alert.timeLabel}
              title={alert.title}
              desc={alert.desc}
              details={alert.details}
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
