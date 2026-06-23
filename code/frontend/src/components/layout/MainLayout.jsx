import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FloatingTopBar from './FloatingTopBar';
import useAuthStore from '@store/useAuthStore';
import useNotificationStore from '@store/useNotificationStore';

/**
 * MainLayout — single layout wrapper for all authenticated routes.
 *
 * Sidebar spacing is driven entirely by the CSS custom property
 * `--sidebar-offset` which Sidebar.jsx updates on every collapse/expand.
 * Neither MainLayout nor any page defines margin-left directly.
 */
const MainLayout = () => {
  const userId        = useAuthStore((state) => state.userId);
  const initWebSocket = useNotificationStore((state) => state.initWebSocket);
  const isSidebarCollapsed = useLayoutStore((state) => state.isSidebarCollapsed);

  useEffect(() => {
    if (userId) initWebSocket(userId);
  }, [userId, initWebSocket]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC', color: '#1F2937' }}>
      {/* Fixed sidebar — manages --sidebar-offset CSS var on collapse/expand */}
      <Sidebar />
      {/* Floating notification + avatar pill */}
      <FloatingTopBar />

      {/*
        Main content area.
        margin-left is driven by --sidebar-offset (set by Sidebar) + transition.
        No page should override this.
      */}
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
