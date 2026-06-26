import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const SideNavBar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="fixed left-0 top-0 w-sidebar_width h-full bg-surface-container-low border-r border-outline-variant flex flex-col z-50">
      <div className="h-topbar_height flex items-center px-stack_lg border-b border-outline-variant">
        <span className="text-headline-sm font-headline-md text-[#1E707D]">DevTrack AI</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-stack_md flex flex-col gap-stack_sm custom-scrollbar">
        <div className="mb-stack_lg px-stack_sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D7EEF1] flex items-center justify-center text-white">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
            </div>
            <div>
              <div className="font-headline-sm text-label-md text-[#1E707D]">System Admin</div>
              <div className="text-on-surface-variant font-label-md text-[10px] uppercase">Global Control</div>
            </div>
          </div>
        </div>
        
        {/* Nav Items */}
        <nav className="space-y-1">
          <Link 
            className={`flex items-center gap-3 px-stack_md py-2.5 rounded-lg transition-all ${
              currentPath === '/admin' 
                ? 'bg-[#D7EEF1] text-[#1E707D] font-semibold' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`} 
            to="/admin"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="font-label-md text-body-md">Dashboard</span>
          </Link>
          <Link 
            className={`flex items-center gap-3 px-stack_md py-2.5 rounded-lg transition-all ${
              currentPath === '/admin/users' 
                ? 'bg-[#D7EEF1] text-[#1E707D] font-semibold' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`} 
            to="/admin/users"
          >
            <span className="material-symbols-outlined">people</span>
            <span className="font-label-md text-body-md">User Management</span>
          </Link>
          <a className="flex items-center gap-3 px-stack_md py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">folder_shared</span>
            <span className="font-label-md text-body-md">Project Management</span>
          </a>
          <a className="flex items-center gap-3 px-stack_md py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">school</span>
            <span className="font-label-md text-body-md">Academic Contexts</span>
          </a>
          <Link 
            className={`flex items-center gap-3 px-stack_md py-2.5 rounded-lg transition-all ${
              currentPath === '/admin/mentor-verifications' 
                ? 'bg-[#D7EEF1] text-[#1E707D] font-semibold' 
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`} 
            to="/admin/mentor-verifications"
          >
            <span className="material-symbols-outlined">supervisor_account</span>
            <span className="font-label-md text-body-md">Mentor Management</span>
          </Link>
          <a className="flex items-center gap-3 px-stack_md py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="font-label-md text-body-md">Resource Management</span>
          </a>
          <a className="flex items-center gap-3 px-stack_md py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">smart_toy</span>
            <span className="font-label-md text-body-md">AI Usage Monitor</span>
          </a>
          <a className="flex items-center gap-3 px-stack_md py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span className="font-label-md text-body-md">Reports</span>
          </a>
          <a className="flex items-center gap-3 px-stack_md py-2.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="font-label-md text-body-md">Settings</span>
          </a>
        </nav>
      </div>
      
      <div className="p-stack_md border-t border-outline-variant bg-surface-container-lowest">
        <div className="flex items-center gap-3 px-stack_sm">
          <img 
            className="w-8 h-8 rounded-full bg-surface-variant object-cover" 
            alt="Professional studio portrait of a senior system administrator, neutral background, soft corporate lighting, high-resolution photography." 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjJxeAIkYSxzwtSBKlde0ia51B7XOv-u7Ky1zd_uoEiNZVITo3qG959S7J1BushDqM3AT0Lo4JkVF8s6q_TSwmz_EC48txxBz5r7koJA2C7ZpbaD127ZIuf1fbIFS0TrCVT-9VuDF_9E6LjiMqKMlyrulx2Z2bJ_i_WR8s2kK3Id29HGYf8a0ZI37qlSZkK7GiBVO8gN__T-WS3jMlvOKe7LBz_QiUcTlzA7-IkZEi55XVXIDw177QjsdrlTJ-vMz2YLzsfYUWDZy9"
          />
          <div className="flex-1 min-w-0">
            <div className="font-label-md text-body-md truncate">Admin User</div>
            <div className="text-on-surface-variant font-label-md text-[10px] truncate">admin@devtrack.ai</div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-sm cursor-pointer hover:text-[#1E707D] transition-colors">logout</span>
        </div>
      </div>
    </aside>
  );
};

export default SideNavBar;
