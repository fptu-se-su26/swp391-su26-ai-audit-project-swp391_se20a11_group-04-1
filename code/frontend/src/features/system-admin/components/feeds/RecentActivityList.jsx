import React, { useEffect, useState } from 'react';
import RecentActivityItem from './RecentActivityItem';
import adminService from '../../services/adminService';
import { MOCK_RECENT_ACTIVITY } from '../../utils/adminMockData';

const RecentActivityList = () => {
  const [activities, setActivities] = useState(MOCK_RECENT_ACTIVITY);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await adminService.getActivities();
        if (res.data?.success) {
          const backendActivities = res.data.data;
          
          const mappedActivities = backendActivities.map(act => {
            const minutesAgo = Math.floor((Date.now() - act.timestamp) / 60000);
            const timeStr = minutesAgo < 60 ? `${minutesAgo} mins ago` : `${Math.floor(minutesAgo / 60)} hours ago`;
            
            // Map types to colors
            let bgColor = 'bg-surface-container-high';
            let textColor = 'text-on-surface-variant';
            let titleHTML = `<span>${act.message}</span>`;

            if (act.type === 'school') {
              bgColor = 'bg-primary-container/10';
              textColor = 'text-primary';
              titleHTML = `<span class="font-semibold">${act.message.split('created')[0]}</span> created successfully`;
            } else if (act.type === 'person_add') {
              bgColor = 'bg-tertiary-fixed';
              textColor = 'text-tertiary';
              titleHTML = `<span class="font-semibold">New Mentor assigned</span>: ${act.message.split(':')[1] || act.message}`;
            } else if (act.type === 'how_to_reg') {
              bgColor = 'bg-green-500/10';
              textColor = 'text-green-600';
              titleHTML = `<span class="font-semibold">User approved</span>: ${act.message.split(':')[1] || act.message}`;
            }

            return {
              id: act.id,
              type: act.type,
              titleHTML: titleHTML,
              time: timeStr,
              bgColor: bgColor,
              textColor: textColor
            };
          });
          
          setActivities(mappedActivities);
        }
      } catch (err) {
        console.error("Failed to load activities", err);
      }
    };
    fetchActivities();
  }, []);

  return (
    <div className="xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-headline-sm text-body-lg">Recent Activity</h3>
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-lg">
            <button className="px-3 py-1 text-[11px] font-label-md bg-surface-container-lowest text-primary shadow-sm rounded-md">All</button>
            <button className="px-3 py-1 text-[11px] font-label-md text-on-surface-variant hover:text-primary transition-colors">Users</button>
            <button className="px-3 py-1 text-[11px] font-label-md text-on-surface-variant hover:text-primary transition-colors">Projects</button>
            <button className="px-3 py-1 text-[11px] font-label-md text-on-surface-variant hover:text-primary transition-colors">AI</button>
            <button className="px-3 py-1 text-[11px] font-label-md text-on-surface-variant hover:text-primary transition-colors">System</button>
          </div>
        </div>
        <button className="text-primary font-label-md text-[11px] hover:underline">Full History</button>
      </div>
      
      <div className="divide-y divide-outline-variant custom-scrollbar overflow-y-auto max-h-[460px]">
        {activities.map(activity => (
          <RecentActivityItem 
            key={activity.id}
            type={activity.type}
            titleHTML={activity.titleHTML}
            time={activity.time}
            bgColor={activity.bgColor}
            textColor={activity.textColor}
          />
        ))}
      </div>
    </div>
  );
};

export default RecentActivityList;
