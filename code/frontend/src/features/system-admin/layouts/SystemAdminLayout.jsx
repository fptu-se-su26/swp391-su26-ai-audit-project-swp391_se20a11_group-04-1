import React from 'react';
import SideNavBar from './SideNavBar';
import TopNavBar from './TopNavBar';
import FloatingAssistant from './FloatingAssistant';

const SystemAdminLayout = ({ children }) => {
  return (
    <div className="text-on-surface bg-background min-h-screen">
      <SideNavBar />
      <TopNavBar />
      
      <main className="ml-sidebar_width pt-topbar_height min-h-screen">
        <div className="p-margin_desktop max-w-[1600px] mx-auto">
            {children}
        </div>
      </main>
      
      <FloatingAssistant />
    </div>
  );
};

export default SystemAdminLayout;
