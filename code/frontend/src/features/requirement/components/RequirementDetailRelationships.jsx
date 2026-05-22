import React, { useState } from 'react';

const RequirementDetailRelationships = ({ requirement }) => {
  const [activeTab, setActiveTab] = useState('Use Cases');

  const tabs = ['Use Cases', 'Tasks', 'Tests', 'Evidence'];

  // Temporary mock data. In real app, requirement would have .useCases, .tasks, etc. arrays
  const data = {
    'Use Cases': [],
    'Tasks': [],
    'Tests': [],
    'Evidence': []
  };

  const renderEmptyState = (tabName) => {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-secondary">
        <span className="material-symbols-outlined text-[48px] mb-3 opacity-50">
          {tabName === 'Use Cases' ? 'account_tree' : tabName === 'Tasks' ? 'task' : tabName === 'Tests' ? 'science' : 'inventory_2'}
        </span>
        <p className="font-body-md text-sm italic">Chưa có {tabName} nào được liên kết.</p>
      </div>
    );
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col h-full min-h-[300px]">
      <div className="flex border-b border-outline-variant bg-surface-container-low overflow-x-auto">
        {tabs.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-body-md text-body-md font-medium transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'text-primary border-b-2 border-primary bg-surface-container-lowest' 
                : 'text-secondary hover:text-on-surface hover:bg-surface-container-lowest'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="p-stack_lg flex-1">
        {data[activeTab].length > 0 ? (
          <div className="space-y-3">
            {/* List items will go here when there is data */}
          </div>
        ) : (
          renderEmptyState(activeTab)
        )}
      </div>
    </div>
  );
};

export default RequirementDetailRelationships;
