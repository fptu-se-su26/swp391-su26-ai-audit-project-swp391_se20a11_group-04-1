import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FloatingTopBar from './FloatingTopBar';
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
    <div className="flex min-h-screen" style={{ background: '#F8FAFC', color: '#1F2937' }}>
      <Sidebar />
      {/* Floating top-right controls (notification + avatar) */}
      <FloatingTopBar />
      {/* 280px sidebar + 12px left offset + 12px gap = 304px total offset */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: '304px' }}>
        <main className="flex-1 overflow-x-hidden" style={{ padding: '28px 32px 32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
