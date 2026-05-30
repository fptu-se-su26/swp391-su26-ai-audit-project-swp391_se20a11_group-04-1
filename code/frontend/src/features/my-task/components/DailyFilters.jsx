import React, { useState } from 'react';

const DailyFilters = ({ assignees, selectedAssignees, onAssigneesChange, selectedPriorities, onPrioritiesChange }) => {
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const priorities = [
    { value: 'CRITICAL', label: 'Critical', color: 'text-red-600 font-bold' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600 font-bold' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600 font-bold' },
    { value: 'LOW', label: 'Low', color: 'text-green-600 font-bold' }
  ];

  const handleAssigneeToggle = (assigneeId) => {
    if (selectedAssignees.includes(assigneeId)) {
      onAssigneesChange(selectedAssignees.filter(id => id !== assigneeId));
    } else {
      onAssigneesChange([...selectedAssignees, assigneeId]);
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-white px-3 py-2 rounded-lg border border-outline-variant shadow-sm relative">
      <span className="text-[12px] font-bold text-on-surface-variant ml-1 material-symbols-outlined text-[18px]">filter_list</span>

      {/* Thành viên Filter */}
      <div className="relative">
        <button 
          onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
          className="flex items-center space-x-1 px-3 py-1 bg-surface-container rounded-full hover:bg-surface-variant transition-colors text-[11px] font-medium"
        >
          <span>Member ({selectedAssignees.length === 0 ? 'All' : selectedAssignees.length})</span>
          <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
        </button>
        
        {showAssigneeDropdown && (
          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-outline-variant py-2 z-50 max-h-60 overflow-y-auto">
            <label className="flex items-center px-4 py-2 hover:bg-surface cursor-pointer border-b border-outline-variant">
              <input 
                type="checkbox" 
                checked={selectedAssignees.length === 0}
                onChange={() => onAssigneesChange([])}
                className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-[12px] font-bold">All Members</span>
            </label>
            {assignees.map(a => (
              <label key={a.id} className="flex items-center px-4 py-2 hover:bg-surface cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedAssignees.includes(a.id)}
                  onChange={() => handleAssigneeToggle(a.id)}
                  className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-[12px] font-medium">{a.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      
      {/* Priority Filter */}
      <div className="relative">
        <button 
          onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
          className="flex items-center space-x-1 px-3 py-1 bg-surface-container rounded-full hover:bg-surface-variant transition-colors text-[11px] font-medium"
        >
          <span>Priority ({selectedPriorities.length === 0 ? 'All' : selectedPriorities.length})</span>
          <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
        </button>
        
        {showPriorityDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-outline-variant py-2 z-50">
            <label className="flex items-center px-4 py-2 hover:bg-surface cursor-pointer border-b border-outline-variant">
              <input 
                type="checkbox" 
                checked={selectedPriorities.length === 0}
                onChange={() => onPrioritiesChange([])}
                className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-[12px] font-bold">All Priorities</span>
            </label>
            {priorities.map(p => (
              <label key={p.value} className="flex items-center px-4 py-2 hover:bg-surface cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedPriorities.includes(p.value)}
                  onChange={() => {
                    if (selectedPriorities.includes(p.value)) {
                      onPrioritiesChange(selectedPriorities.filter(v => v !== p.value));
                    } else {
                      onPrioritiesChange([...selectedPriorities, p.value]);
                    }
                  }}
                  className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className={`text-[12px] ${p.color}`}>{p.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {(showAssigneeDropdown || showPriorityDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setShowAssigneeDropdown(false); setShowPriorityDropdown(false); }}
        />
      )}
    </div>
  );
};

export default DailyFilters;
