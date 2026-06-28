import React, { useState } from 'react';
import ActorTab from './ActorTab';
import UseCaseTab from './UseCaseTab';
import RelationTab from './RelationTab';

const DiagramSidePanel = ({ projectId, systemName, setSystemName }) => {
  const [activeTab, setActiveTab] = useState('actors');

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold text-gray-800">Diagram Elements</h2>
        <p className="text-xs text-gray-500 mt-1 mb-3">Manage actors, use cases, and relations.</p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">System Name</label>
          <input
            type="text"
            className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E707D] focus:border-[#1E707D]"
            value={systemName || ''}
            onChange={(e) => setSystemName && setSystemName(e.target.value)}
            placeholder="e.g. E-Commerce System"
          />
        </div>
      </div>
      
      <div className="flex w-full border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('actors')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'actors' ? 'text-[#1E707D] border-b-2 border-[#1E707D] bg-[#1E707D]/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Actors
        </button>
        <button 
          onClick={() => setActiveTab('usecases')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'usecases' ? 'text-[#1E707D] border-b-2 border-[#1E707D] bg-[#1E707D]/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Use Cases
        </button>
        <button 
          onClick={() => setActiveTab('relations')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'relations' ? 'text-[#1E707D] border-b-2 border-[#1E707D] bg-[#1E707D]/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
        >
          Relations
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'actors' && <ActorTab />}
        {activeTab === 'usecases' && <UseCaseTab />}
        {activeTab === 'relations' && <RelationTab />}
      </div>
    </div>
  );
};

export default DiagramSidePanel;
