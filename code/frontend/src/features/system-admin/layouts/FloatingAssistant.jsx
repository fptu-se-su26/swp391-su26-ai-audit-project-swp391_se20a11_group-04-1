import React from 'react';

const FloatingAssistant = () => {
  return (
    <button className="fixed bottom-margin_desktop right-margin_desktop w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50 group">
      <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">smart_toy</span>
      <div className="absolute right-16 px-4 py-2 bg-surface-container-highest text-on-surface rounded-lg text-sm font-label-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
        System Assistant
      </div>
    </button>
  );
};

export default FloatingAssistant;
