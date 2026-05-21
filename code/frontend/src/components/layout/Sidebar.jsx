import React from 'react';

const Sidebar = () => {
  return (
    <nav className="hidden md:flex flex-col py-stack_lg bg-surface dark:bg-on-secondary-fixed text-primary dark:text-primary-fixed font-body-md text-body-md fixed left-0 top-0 h-screen w-sidebar_width border-r border-outline-variant dark:border-outline z-40 transition-all duration-200 ease-in-out">
      <div className="px-margin_desktop mb-stack_lg">
        <h1 className="font-headline-sm text-headline-sm text-primary dark:text-primary-fixed mb-stack_sm">Student Event Management System</h1>
        <p className="text-secondary dark:text-secondary-fixed-dim text-body-md font-body-md">Current Project</p>
      </div>
      <div className="flex-1 overflow-y-auto px-stack_md flex flex-col gap-1">
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          Dashboard
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary-container dark:bg-primary-container text-on-secondary-container dark:text-on-primary-container font-semibold transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">description</span>
          Requirements
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">account_tree</span>
          Use Cases
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">assignment</span>
          Task Board
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
          Sprints
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">checklist_rtl</span>
          Test Cases
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">bug_report</span>
          Bugs
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          Evidence Vault
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">reorder</span>
          Traceability Matrix
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          AI Assistant
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">code</span>
          Code Insight
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">groups</span>
          Contribution
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">visibility</span>
          Mentor View
        </a>
        <a className="flex items-center gap-3 px-3 py-2 rounded-lg text-secondary dark:text-secondary-fixed-dim hover:bg-surface-container-low dark:hover:bg-on-secondary-fixed-variant transition-colors group" href="#">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          Project Settings
        </a>
      </div>
      <div className="px-stack_md mt-auto pt-stack_md">
        <button className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary h-[36px] rounded-lg font-body-md text-body-md hover:bg-on-primary-fixed-variant transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          AI Assistance
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
