import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FloatingTopBar from './FloatingTopBar';
import useAuthStore from '@store/useAuthStore';
import useNotificationStore from '@store/useNotificationStore';

/**
 * MainLayout — single layout wrapper for all authenticated routes.
 * Sidebar spacing is driven by CSS custom property --sidebar-offset.
 */
const MainLayout = () => {
  const userId        = useAuthStore((state) => state.userId);
  const initWebSocket = useNotificationStore((state) => state.initWebSocket);

  useEffect(() => {
    if (userId) initWebSocket(userId);
  }, [userId, initWebSocket]);

  return (
    <div className="bg-background text-[#1F2937]" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <FloatingTopBar />
      <div
        id="main-content"
        style={{
          flex:       1,
          minWidth:   0,
          marginLeft: 'var(--sidebar-offset, 296px)',
          transition: 'margin-left 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <main style={{ flex: 1, padding: '28px 32px 32px', overflowX: 'hidden', minHeight: '100vh' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
