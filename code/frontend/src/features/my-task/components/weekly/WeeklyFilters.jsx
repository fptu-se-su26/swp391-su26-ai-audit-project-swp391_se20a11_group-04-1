import React, { useState } from 'react';

const WeeklyFilters = ({ 
  assignees, 
  selectedAssignees, 
  onAssigneesChange, 
  selectedStatuses, 
  onStatusesChange,
  selectedPriorities,
  onPrioritiesChange
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const statuses = [
    { value: 'OVERDUE', label: 'Overdue', color: 'text-red-600' },
    { value: 'BLOCKED', label: 'Blocked', color: 'text-rose-700' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-600' },
    { value: 'IN_REVIEW', label: 'In Review', color: 'text-blue-500' },
    { value: 'TODO', label: 'To Do', color: 'text-gray-500' },
    { value: 'DONE', label: 'Done', color: 'text-green-600' }
  ];

  const priorities = [
    { value: 'CRITICAL', label: 'Critical', color: 'text-red-600 font-bold' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600 font-bold' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600 font-bold' },
    { value: 'LOW', label: 'Low', color: 'text-green-600 font-bold' }
  ];

  const handleStatusToggle = (status) => {
    if (selectedStatuses.includes(status)) {
      onStatusesChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusesChange([...selectedStatuses, status]);
    }
  };

  const handleAssigneeToggle = (assigneeId) => {
    if (selectedAssignees.includes(assigneeId)) {
      onAssigneesChange(selectedAssignees.filter(id => id !== assigneeId));
    } else {
      onAssigneesChange([...selectedAssignees, assigneeId]);
    }
  };

  return (
    <div className="flex items-center space-x-3 mb-4 bg-white p-2 rounded-lg border border-outline-variant shadow-sm relative">
      <span className="text-[12px] font-bold text-on-surface-variant ml-2 material-symbols-outlined text-[18px]">filter_list</span>
      
      {/* Trạng thái Filter */}
      <div className="relative">
          <button 
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-surface-container rounded-full hover:bg-surface-variant transition-colors text-[11px] font-medium"
        >
          <span>Status ({selectedStatuses.length === 0 ? 'All' : selectedStatuses.length})</span>
          <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
        </button>
        
        {showStatusDropdown && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-outline-variant py-2 z-50">
            <label className="flex items-center px-4 py-2 hover:bg-surface cursor-pointer border-b border-outline-variant">
              <input 
                type="checkbox" 
                checked={selectedStatuses.length === 0}
                onChange={() => onStatusesChange([])}
                className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-[12px] font-bold">All Statuses</span>
            </label>
            {statuses.map(s => (
              <label key={s.value} className="flex items-center px-4 py-2 hover:bg-surface cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedStatuses.includes(s.value)}
                  onChange={() => handleStatusToggle(s.value)}
                  className="mr-2 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className={`text-[12px] font-medium ${s.color}`}>{s.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Thành viên Filter */}
      <div className="relative">
        <button 
          onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
          className="flex items-center space-x-1 px-3 py-1.5 bg-surface-container rounded-full hover:bg-surface-variant transition-colors text-[11px] font-medium"
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
          className="flex items-center space-x-1 px-3 py-1.5 bg-surface-container rounded-full hover:bg-surface-variant transition-colors text-[11px] font-medium"
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

      {/* Backdrop to close dropdowns */}
      {(showStatusDropdown || showAssigneeDropdown || showPriorityDropdown) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setShowStatusDropdown(false); setShowAssigneeDropdown(false); setShowPriorityDropdown(false); }}
        />
      )}
    </div>
  );
};

export default WeeklyFilters;
