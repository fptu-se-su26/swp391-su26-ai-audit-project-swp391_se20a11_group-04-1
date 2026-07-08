import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
  const location      = useLocation();

  useEffect(() => {
    if (userId) initWebSocket(userId);
  }, [userId, initWebSocket]);

  useEffect(() => {
    const path = location.pathname;
    let pageTitle = 'DevTrack AI';

    if (path.includes('/kanban') || path.includes('/task-board')) {
      pageTitle = 'Task Board - DevTrack AI';
    } else if (path.includes('/issues') || path.includes('/discuss') || path.includes('/issue-tracker')) {
      pageTitle = 'Issue Tracker - DevTrack AI';
    } else if (path.includes('/sprints') || path.includes('/sprint')) {
      pageTitle = 'Sprints - DevTrack AI';
    } else if (path.includes('/requirements') || path.includes('/requirement') || path.includes('/use-case')) {
      pageTitle = 'Requirements - DevTrack AI';
    } else if (path.includes('/test-cases') || path.includes('/testing')) {
      pageTitle = 'Test Cases - DevTrack AI';
    } else if (path.includes('/evidence')) {
      pageTitle = 'Evidence - DevTrack AI';
    } else if (path.includes('/sla') || path.includes('/recovery-plan')) {
      pageTitle = 'SLA Dashboard - DevTrack AI';
    } else if (path.includes('/profile')) {
      pageTitle = 'Profile - DevTrack AI';
    } else if (path.includes('/classrooms') || path.includes('/classroom')) {
      pageTitle = 'Classrooms - DevTrack AI';
    } else if (path.includes('/dashboard')) {
      pageTitle = 'Dashboard - DevTrack AI';
    }

    document.title = pageTitle;
  }, [location]);

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
