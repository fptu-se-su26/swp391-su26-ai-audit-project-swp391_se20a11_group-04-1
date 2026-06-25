import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import RecentActivityItem from './RecentActivityItem';
import adminService from '../../services/adminService';
import { MOCK_RECENT_ACTIVITY } from '../../utils/adminMockData';

const RecentActivityList = () => {
  const [activities, setActivities] = useState(MOCK_RECENT_ACTIVITY);
  const [totalActivities, setTotalActivities] = useState({
    All: MOCK_RECENT_ACTIVITY.length,
    Users: MOCK_RECENT_ACTIVITY.filter(a => a.rawType === 'person_add' || a.rawType === 'how_to_reg').length,
    Projects: MOCK_RECENT_ACTIVITY.filter(a => a.rawType === 'school').length
  });
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await adminService.getActivities();
        if (res.data?.success) {
          const backendData = res.data.data;
          const backendActivities = backendData.activities || [];
          
          if (backendData.totalAll !== undefined) {
            setTotalActivities({
              All: backendData.totalAll,
              Users: backendData.totalUsers,
              Projects: backendData.totalProjects
            });
          }
          
          const mappedActivities = backendActivities.map(act => {
            const minutesAgo = Math.floor((Date.now() - act.timestamp) / 60000);
            let timeStr = '';
            if (minutesAgo < 60) timeStr = `${minutesAgo} mins ago`;
            else if (minutesAgo < 1440) timeStr = `${Math.floor(minutesAgo / 60)} hours ago`;
            else timeStr = `${Math.floor(minutesAgo / 1440)} days ago`;
            
            // Map types to colors
            let bgColor = 'bg-surface-container-high';
            let textColor = 'text-on-surface-variant';
            let titleHTML = act.message;
            let iconType = act.type;

            if (act.type === 'school') {
              bgColor = 'bg-transparent';
              textColor = 'text-purple-500';
              titleHTML = act.message;
              iconType = 'school';
            } else if (act.type === 'person_add' || act.type === 'how_to_reg') {
              bgColor = 'bg-transparent';
              textColor = 'text-[#1E707D]';
              titleHTML = act.message;
              iconType = 'person';
            }

            return {
              id: act.id,
              type: iconType,
              rawType: act.type,
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

  const filteredActivities = activities.filter(activity => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Users') return activity.rawType === 'person_add' || activity.rawType === 'how_to_reg';
    if (activeTab === 'Projects') return activity.rawType === 'school';
    return true;
  });

  return (
    <div className="xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-headline-sm text-body-lg">Recent Activity</h3>
          <div className="flex gap-2 bg-surface-container-low p-1 rounded-lg">
            {['All', 'Users', 'Projects'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-[11px] font-label-md rounded-md transition-colors ${activeTab === tab ? 'bg-surface-container-lowest text-[#1E707D] shadow-sm' : 'text-on-surface-variant hover:text-[#1E707D]'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-outline-variant custom-scrollbar overflow-y-auto max-h-[460px]">
        {filteredActivities.map(activity => (
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

      <div className="px-6 py-4 border-t border-outline-variant flex justify-between items-center bg-surface-container-lowest">
        <span className="text-[13px] text-on-surface-variant">
          Hiển thị {filteredActivities.length} trên {totalActivities[activeTab]} hoạt động
        </span>
        <Link to="/admin/audit-logs" className="text-[13px] text-[#1E707D] font-medium hover:underline">
          Xem toàn bộ log &rarr;
        </Link>
      </div>
    </div>
  );
};

export default RecentActivityList;
