import React, { useState } from 'react';
import UseCaseTabContent from './tabs/UseCaseTabContent';
import TaskTabContent from './tabs/TaskTabContent';
import TestTabContent from './tabs/TestTabContent';
import EvidenceTabContent from './tabs/EvidenceTabContent';
import TraceabilityMapModal from './TraceabilityMapModal';

const RequirementDetailRelationships = ({ requirement, onOpenUseCaseModal, onOpenTestCaseModal }) => {
  const [activeTab, setActiveTab] = useState('Use Cases');
  const [isMapOpen, setIsMapOpen] = useState(false);

  const tabs = ['Use Cases', 'Tasks', 'Tests', 'Evidence'];

  // Data processing: Use existing data or empty arrays if undefined
  const data = {
    'Use Cases': requirement?.useCases || [],
    'Tasks': requirement?.tasks || [],
    'Tests': requirement?.tests || [],
    'Evidence': requirement?.evidences || []
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Use Cases': return <UseCaseTabContent useCases={data['Use Cases']} requirement={requirement} onOpenUseCaseModal={onOpenUseCaseModal} />;
      case 'Tasks': return <TaskTabContent tasks={data['Tasks']} requirement={requirement} />;
      case 'Tests': return <TestTabContent tests={data['Tests']} requirement={requirement} onOpenTestCaseModal={onOpenTestCaseModal} />;
      case 'Evidence': return <EvidenceTabContent evidences={data['Evidence']} requirement={requirement} />;
      default: return null;
    }
  };

  return (
    <div className="bg-white border border-outline-variant/50 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px] shadow-sm">
      
      {/* Header section with segmented tabs and Traceability Map button */}
      <div className="px-6 py-3 border-b border-outline-variant/50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Segmented Tabs */}
        <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 overflow-x-auto gap-1 w-fit">
          {tabs.map(tab => {
            const isActive = activeTab === tab;
            const count = data[tab].length;
            
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-1.5 font-medium text-sm transition-all duration-200 whitespace-nowrap rounded-md flex items-center gap-2 ${
                  isActive 
                    ? 'text-[#1E707D] bg-white shadow-sm ring-1 ring-slate-900/5' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab}
                <span className={`text-[10px] py-0.5 px-1.5 rounded-md font-bold transition-colors ${
                  isActive 
                    ? 'bg-[#1E707D]/10 text-[#1E707D]' 
                    : 'bg-slate-200/80 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Traceability Map Button */}
        <button 
          onClick={() => setIsMapOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-sm hover:bg-slate-50 hover:text-[#1E707D] hover:border-[#1E707D]/20 transition-all shrink-0 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
          Traceability Map
        </button>

      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white p-0">
        {renderTabContent()}
      </div>

      <TraceabilityMapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        requirement={requirement} 
        data={data}
      />
    </div>
  );
};

export default RequirementDetailRelationships;
