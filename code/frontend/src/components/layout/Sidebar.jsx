import React from 'react';
import { NavLink } from 'react-router-dom';

const NavItem = ({ to, icon, label, defaultIconClass = '' }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ease-in-out group ${
      isActive 
        ? 'bg-secondary-container text-on-secondary-container font-semibold' 
        : 'text-secondary hover:bg-surface-container-low'
    }`}
  >
    {({ isActive }) => (
      <>
        <span className={`material-symbols-outlined text-[20px] transition-colors ${
          isActive 
            ? 'icon-fill' 
            : (defaultIconClass ? defaultIconClass : 'group-hover:text-primary')
        }`}>
          {icon}
        </span>
        <span className="font-body-md text-body-md">{label}</span>
      </>
    )}
  </NavLink>
);

const Sidebar = () => {
  return (
    <nav className="w-full md:w-[280px] bg-surface border-b md:border-b-0 md:border-r border-outline-variant flex flex-col py-6 z-10 shrink-0 hidden md:flex">
      
      {/* Project Info Header */}
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-secondary">folder_special</span>
          </div>
          <div className="overflow-hidden">
            <h2 className="font-body-md text-body-md text-on-surface font-semibold truncate w-full">Student Event Management System</h2>
            <p className="font-label-md text-label-md text-on-surface-variant mt-0.5">Current Project</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        <NavItem to="/dashboard" icon="dashboard" label="Dashboard" />
        <NavItem to="/requirements" icon="description" label="Requirements" />
        <NavItem to="/use-cases" icon="account_tree" label="Use Cases" />
        <NavItem to="/task-board" icon="assignment" label="Task Board" />
        <NavItem to="/sprints" icon="history_toggle_off" label="Sprints" />
        <NavItem to="/test-cases" icon="checklist_rtl" label="Test Cases" />
        <NavItem to="/bugs" icon="bug_report" label="Bugs" />
        <NavItem to="/evidence-vault" icon="inventory_2" label="Evidence Vault" />
        <NavItem to="/traceability-matrix" icon="reorder" label="Traceability Matrix" />

        {/* Intelligence Section */}
        <div className="pt-4 pb-2">
          <div className="h-px bg-outline-variant/50 w-full mb-2"></div>
          <span className="px-3 font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Intelligence</span>
        </div>
        
        <NavItem 
          to="/ai-assistant" 
          icon="smart_toy" 
          label="AI Assistant" 
          defaultIconClass="text-primary-container"
        />
        <NavItem to="/code-insight" icon="code" label="Code Insight" />

        {/* Team Section */}
        <div className="pt-4 pb-2">
          <div className="h-px bg-outline-variant/50 w-full mb-2"></div>
          <span className="px-3 font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Team</span>
        </div>
        
        <NavItem to="/contribution" icon="groups" label="Contribution" />
        <NavItem to="/mentor-view" icon="visibility" label="Mentor View" />

        <div className="mt-2">
          <NavItem to="/project-settings" icon="settings" label="Project Settings" />
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div className="px-4 mt-auto pt-4">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-surface-container-highest hover:bg-outline-variant/40 border border-outline-variant rounded-lg text-on-surface font-body-md transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          AI Assistance
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
