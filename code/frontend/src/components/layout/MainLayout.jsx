import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavBar from './TopNavBar';
import useAuthStore from '@store/useAuthStore';
import useNotificationStore from '@store/useNotificationStore';

const MainLayout = () => {
  const userId = useAuthStore((state) => state.userId);
  const initWebSocket = useNotificationStore((state) => state.initWebSocket);

  useEffect(() => {
    if (userId) {
      initWebSocket(userId);
    }
  }, [userId, initWebSocket]);

  return (
    <div className="flex min-h-screen bg-background text-on-background">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-[280px] min-w-0">
        <TopNavBar />
        <main className="flex-1 mt-topbar_height p-margin_mobile md:p-margin_desktop overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
