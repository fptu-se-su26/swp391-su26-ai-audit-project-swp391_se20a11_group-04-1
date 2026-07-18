import React, { useState, useRef, useEffect } from 'react';
import { requirementApi } from '../services/requirementApi';

const RequirementFilters = ({ onFilterChange, resultCount = 0, projectId, refreshTrigger, onResetOrder, isLeader, members = [] }) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'status', 'priority', 'tag', or null
  const [tagOptions, setTagOptions] = useState([]);
  
  // States for selected values
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchValue, setSearchValue] = useState('');

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

  useEffect(() => {
    const fetchTags = async () => {
      if (!projectId) return;
      try {
        const tags = await requirementApi.getTags(projectId);
        setTagOptions(tags || []);
      } catch (error) {
        console.error("Failed to load tags:", error);
      }
    };
    fetchTags();
  }, [projectId, refreshTrigger]);

  const toggleDropdown = (dropdownName) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const handleSelect = (type, value) => {
    let newStatus = selectedStatus;
    let newPriority = selectedPriority;
    let newTag = selectedTag;
    let newMember = selectedMember;

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
    if (type === 'member') {
      newMember = selectedMember === value ? null : value;
      setSelectedMember(newMember);
    }

    setActiveDropdown(null); // Close after select
    if (onFilterChange) {
      onFilterChange({ status: newStatus, priority: newPriority, tag: newTag, member: newMember });
    }
  };

  const statusOptions = ['Draft', 'In Progress', 'In Review', 'Done'];
  const priorityOptions = ['Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="px-4 md:px-[32px] mt-[16px] mb-6">
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[16px] flex flex-col md:flex-row items-center justify-between gap-4 transition-colors shadow-sm" ref={containerRef}>
        
        {/* Left: Search input (Distinct bordered box) */}
        <div className="w-full md:w-[450px] relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#9CA3AF] text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Search by ID, title..." 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none pl-9 pr-4 py-2 rounded-full text-[13px] text-[#111827] placeholder-[#9CA3AF] transition-all"
          />
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center justify-end gap-3 w-full md:w-auto">
          {/* Reset Order Button */}
          {onResetOrder && (
            <button 
              onClick={onResetOrder}
              className="h-[34px] px-3 flex items-center justify-center gap-1.5 border rounded-full text-[12px] font-medium transition-colors bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50"
              title="Reset Order"
            >
              <span className="material-symbols-outlined text-[16px]">sort</span>
              Sort
            </button>
          )}

          {/* Status Filter */}
          <div className="relative">
            <div 
              onClick={() => toggleDropdown('status')}
              className={`h-[34px] px-3 flex items-center justify-between gap-2 border rounded-full text-[12px] font-medium transition-colors cursor-pointer min-w-[110px] ${selectedStatus ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/30' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">filter_list</span>
                <span className="truncate">{selectedStatus ? selectedStatus : 'Status'}</span>
              </div>
              {selectedStatus ? (
                <span className="material-symbols-outlined text-[14px] hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleSelect('status', null); }}>close</span>
              ) : (
                <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
              )}
            </div>
            {activeDropdown === 'status' && (
              <div className="absolute top-full right-0 mt-2 w-[140px] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                {statusOptions.map(option => (
                  <button key={option} onClick={() => handleSelect('status', option)} className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors ${selectedStatus === option ? 'text-[#1E707D] bg-[#1E707D]/5 font-bold' : 'text-gray-700'}`}>
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
              className={`h-[34px] px-3 flex items-center justify-between gap-2 border rounded-full text-[12px] font-medium transition-colors cursor-pointer min-w-[110px] ${selectedPriority ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/30' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">flag</span>
                <span className="truncate">{selectedPriority ? selectedPriority : 'Priority'}</span>
              </div>
              {selectedPriority ? (
                <span className="material-symbols-outlined text-[14px] hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleSelect('priority', null); }}>close</span>
              ) : (
                <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
              )}
            </div>
            {activeDropdown === 'priority' && (
              <div className="absolute top-full right-0 mt-2 w-[140px] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                {priorityOptions.map(option => (
                  <button key={option} onClick={() => handleSelect('priority', option)} className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors ${selectedPriority === option ? 'text-[#1E707D] bg-[#1E707D]/5 font-bold' : 'text-gray-700'}`}>
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
              className={`h-[34px] px-3 flex items-center justify-between gap-2 border rounded-full text-[12px] font-medium transition-colors cursor-pointer min-w-[110px] ${selectedTag ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/30' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">sell</span>
                <span className="truncate">{selectedTag ? selectedTag : 'Tag'}</span>
              </div>
              {selectedTag ? (
                <span className="material-symbols-outlined text-[14px] hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleSelect('tag', null); }}>close</span>
              ) : (
                <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
              )}
            </div>
            {activeDropdown === 'tag' && (
              <div className="absolute top-full right-0 mt-2 w-[140px] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20 max-h-[200px] overflow-y-auto">
                {tagOptions.length === 0 ? (
                   <div className="px-4 py-2 text-gray-400 text-[12px] italic">No tags</div>
                ) : (
                  tagOptions.map(option => (
                    <button key={option} onClick={() => handleSelect('tag', option)} className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors ${selectedTag === option ? 'text-[#1E707D] bg-[#1E707D]/5 font-bold' : 'text-gray-700'}`}>
                      {option}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Member Filter (Leader Only) */}
          {isLeader && (
            <div className="relative">
              <div 
                onClick={() => toggleDropdown('member')}
                className={`h-[34px] px-3 flex items-center justify-between gap-2 border rounded-full text-[12px] font-medium transition-colors cursor-pointer min-w-[110px] ${selectedMember ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/30' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[14px]">person_search</span>
                  <span className="truncate">
                    {selectedMember ? members.find(m => m.id === selectedMember)?.name || 'Unknown' : 'Member'}
                  </span>
                </div>
                {selectedMember ? (
                  <span className="material-symbols-outlined text-[14px] hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleSelect('member', null); }}>close</span>
                ) : (
                  <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
                )}
              </div>
              {activeDropdown === 'member' && (
                <div className="absolute top-full right-0 mt-2 w-[160px] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20 max-h-[200px] overflow-y-auto">
                  {members.length === 0 ? (
                     <div className="px-4 py-2 text-gray-400 text-[12px] italic">No members</div>
                  ) : (
                    members.map(option => (
                      <button key={option.id} onClick={() => handleSelect('member', option.id)} className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors ${selectedMember === option.id ? 'text-[#1E707D] bg-[#1E707D]/5 font-bold' : 'text-gray-700'}`}>
                        {option.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="text-[12px] font-bold text-gray-500 ml-1 bg-gray-100 px-2 py-1 rounded-md">
            {resultCount} items
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementFilters;
