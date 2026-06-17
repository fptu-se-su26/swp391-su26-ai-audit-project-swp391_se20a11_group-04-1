import React, { useState, useRef, useEffect } from 'react';

const RequirementFilters = ({ onFilterChange, resultCount = 0 }) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'status', 'priority', 'tag', or null
  
  // States for selected values
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);

  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleSelect = (type, value) => {
    let newStatus = selectedStatus;
    let newPriority = selectedPriority;
    let newTag = selectedTag;

    if (type === 'status') {
      newStatus = selectedStatus === value ? null : value;
      setSelectedStatus(newStatus);
    }
    if (type === 'priority') {
      newPriority = selectedPriority === value ? null : value;
      setSelectedPriority(newPriority);
    }
    if (type === 'tag') {
      newTag = selectedTag === value ? null : value;
      setSelectedTag(newTag);
    }

    setActiveDropdown(null); // Close after select
    if (onFilterChange) {
      onFilterChange({ status: newStatus, priority: newPriority, tag: newTag });
    }
  };

  const statusOptions = ['Draft', 'In Progress', 'Done', 'Deprecated'];
  const priorityOptions = ['Critical', 'High', 'Medium', 'Low'];
  const tagOptions = ['Auth', 'Event', 'Database', 'UI', 'Backend'];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack_sm mb-stack_lg flex flex-wrap items-center gap-3" ref={containerRef}>
      
      {/* Status Filter */}
      <div className="relative">
        <div 
          onClick={() => toggleDropdown('status')}
          className={`flex items-center gap-2 px-3 py-1.5 border ${(selectedStatus || activeDropdown === 'status') ? 'border-primary bg-primary-fixed/20 text-primary' : 'border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant'} rounded-lg cursor-pointer transition-colors text-body-md font-body-md min-w-[130px] justify-between`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span className="truncate">{selectedStatus ? `Status: ${selectedStatus}` : 'Status'}</span>
          </div>
          {selectedStatus ? (
            <span 
              className="material-symbols-outlined text-[16px] hover:text-error transition-colors"
              onClick={(e) => { e.stopPropagation(); handleSelect('status', null); }}
            >
              close
            </span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          )}
        </div>
        {activeDropdown === 'status' && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-[130px] bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-20">
            {statusOptions.map(option => (
              <button 
                key={option} 
                onClick={() => handleSelect('status', option)}
                className={`w-full text-left px-3 py-2 hover:bg-surface-container-low text-body-md font-body-md transition-colors ${selectedStatus === option ? 'text-primary bg-surface-container font-medium' : 'text-on-surface'}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Priority Filter */}
      <div className="relative">
        <div 
          onClick={() => toggleDropdown('priority')}
          className={`flex items-center gap-2 px-3 py-1.5 border ${(selectedPriority || activeDropdown === 'priority') ? 'border-primary bg-primary-fixed/20 text-primary' : 'border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant'} rounded-lg cursor-pointer transition-colors text-body-md font-body-md min-w-[120px] justify-between`}
        >
          <span className="truncate">{selectedPriority ? `Priority: ${selectedPriority}` : 'Priority'}</span>
          {selectedPriority ? (
            <span 
              className="material-symbols-outlined text-[16px] hover:text-error transition-colors"
              onClick={(e) => { e.stopPropagation(); handleSelect('priority', null); }}
            >
              close
            </span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          )}
        </div>
        {activeDropdown === 'priority' && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-[120px] bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-20">
            {priorityOptions.map(option => (
              <button 
                key={option} 
                onClick={() => handleSelect('priority', option)}
                className={`w-full text-left px-3 py-2 hover:bg-surface-container-low text-body-md font-body-md transition-colors ${selectedPriority === option ? 'text-primary bg-surface-container font-medium' : 'text-on-surface'}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tag Filter */}
      <div className="relative">
        <div 
          onClick={() => toggleDropdown('tag')}
          className={`flex items-center gap-2 px-3 py-1.5 border ${(selectedTag || activeDropdown === 'tag') ? 'border-primary bg-primary-fixed/20 text-primary' : 'border-outline-variant bg-surface hover:bg-surface-container-low text-on-surface-variant'} rounded-lg cursor-pointer transition-colors text-body-md font-body-md min-w-[110px] justify-between`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">sell</span>
            <span className="truncate">{selectedTag ? `Tag: ${selectedTag}` : 'Tag'}</span>
          </div>
          {selectedTag ? (
            <span 
              className="material-symbols-outlined text-[16px] hover:text-error transition-colors"
              onClick={(e) => { e.stopPropagation(); handleSelect('tag', null); }}
            >
              close
            </span>
          ) : (
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          )}
        </div>
        {activeDropdown === 'tag' && (
          <div className="absolute top-full left-0 mt-1 w-full min-w-[110px] bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-20">
            {tagOptions.map(option => (
              <button 
                key={option} 
                onClick={() => handleSelect('tag', option)}
                className={`w-full text-left px-3 py-2 hover:bg-surface-container-low text-body-md font-body-md transition-colors ${selectedTag === option ? 'text-primary bg-surface-container font-medium' : 'text-on-surface'}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1"></div>
      <div className="text-body-md font-body-md text-secondary px-2">
        {resultCount} items found
      </div>
    </div>
  );
};

export default RequirementFilters;
