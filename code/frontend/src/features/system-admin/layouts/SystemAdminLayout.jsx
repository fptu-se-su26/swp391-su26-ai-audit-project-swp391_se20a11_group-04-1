import React, { useEffect } from 'react';
import SideNavBar from './SideNavBar';
import TopNavBar from './TopNavBar';
import useAuthStore from '@store/useAuthStore';
import { useNotificationStore } from '@store/useNotificationStore';

const SystemAdminLayout = ({ children }) => {
  const userId = useAuthStore((state) => state.userId);
  const initWebSocket = useNotificationStore((state) => state.initWebSocket);

  useEffect(() => {
    if (userId) {
      initWebSocket(userId);
    }
  }, [userId, initWebSocket]);

  return (
    <div className="text-on-surface bg-background min-h-screen">
      <SideNavBar />
      <TopNavBar />
      
      <main className="ml-sidebar_width pt-topbar_height min-h-screen">
        <div className="p-margin_desktop max-w-[1600px] mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
};

export default SystemAdminLayout;
