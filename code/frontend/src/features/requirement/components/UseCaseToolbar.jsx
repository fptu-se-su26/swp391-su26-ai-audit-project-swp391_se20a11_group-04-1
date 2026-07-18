import React, { useState, useRef, useEffect } from 'react';
import Input from '../../../components/ui/Input';

const UseCaseToolbar = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange, reqFilter, onReqFilterChange, requirements = [], isDraftView, setIsDraftView, resultCount, onResetOrder, hideStatusFilter, hideDraftToggle }) => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statusOptions = ['Draft', 'In Progress', 'In Review', 'Done'];
  
  // Mapping display values to exact backend enum values
  const getDisplayStatus = (val) => {
    if (!val) return 'Status';
    return val.replace('_', ' ').replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  };

  const getBackendStatus = (displayVal) => {
    if (displayVal === 'In Progress') return 'IN_PROGRESS';
    if (displayVal === 'In Review') return 'IN_REVIEW';
    return displayVal.toUpperCase();
  };

  const handleStatusSelect = (displayVal) => {
    if (!displayVal) {
      onStatusFilterChange('');
    } else {
      onStatusFilterChange(getBackendStatus(displayVal));
    }
    setActiveDropdown(null);
  };

  const handleReqSelect = (reqId) => {
    if (!reqId) {
      onReqFilterChange('');
    } else {
      onReqFilterChange(reqId);
    }
    setActiveDropdown(null);
  };

  const getSelectedReqTitle = () => {
    if (!reqFilter) return 'All Requirements';
    const req = requirements.find(r => r.id === reqFilter);
    if (!req) return 'All Requirements';
    const code = req.reqCode || `REQ-${String(req.id).padStart(2, '0')}`;
    return `${code} - ${req.title}`;
  };

  return (
    <div className="px-[32px] mt-[16px] mb-6" ref={containerRef}>
      <div className={`rounded-[12px] p-[16px] flex flex-col md:flex-row items-center justify-between gap-4 transition-colors shadow-sm border ${isDraftView ? 'bg-orange-50/50 border-orange-200' : 'bg-white border-[#E5E7EB]'}`}>
        
        {/* Left: Search input (Distinct bordered box) */}
        <div className="w-full md:w-[450px] relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#9CA3AF] text-[18px]">search</span>
          <input 
            type="text"
            placeholder="Search ID or Name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full border focus:border-[#1E707D] focus:ring-1 focus:ring-[#1E707D] outline-none pl-9 pr-4 py-2 rounded-full text-[13px] text-[#111827] placeholder-[#9CA3AF] transition-all ${isDraftView ? 'bg-white border-orange-200' : 'bg-gray-50 border-gray-200 focus:bg-white'}`}
          />
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center justify-end gap-[8px] w-full md:w-auto">
          {/* Reset Order Button */}
          {onResetOrder && (
            <button 
              onClick={onResetOrder}
              className={`h-[34px] px-3 flex items-center justify-center gap-1.5 border rounded-full text-[12px] font-medium transition-colors ${isDraftView ? 'text-gray-400 bg-gray-50/50 border-gray-200 cursor-not-allowed' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'}`}
              title="Reset Order"
              disabled={isDraftView}
            >
              <span className="material-symbols-outlined text-[16px]">sort</span>
              Sort
            </button>
          )}

          {/* Draft View Toggle */}
          {!hideDraftToggle && (
            <button 
              onClick={() => setIsDraftView(!isDraftView)}
              className={`h-[34px] px-3 flex items-center justify-center gap-1.5 border rounded-full text-[12px] font-medium transition-colors ${isDraftView ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-[16px]">edit_document</span>
              Diagram Drafts
            </button>
          )}
          
          {/* Requirement Filter Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setActiveDropdown(activeDropdown === 'req' ? null : 'req')}
              className={`h-[34px] px-3 flex items-center justify-between gap-2 border rounded-full text-[12px] font-medium transition-colors cursor-pointer min-w-[140px] max-w-[200px] ${
                reqFilter ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/30' : 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                <span className="truncate">{getSelectedReqTitle()}</span>
              </div>
              {reqFilter ? (
                <span className="material-symbols-outlined text-[14px] hover:text-red-500 shrink-0" onClick={(e) => { e.stopPropagation(); handleReqSelect(null); }}>close</span>
              ) : (
                <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">expand_more</span>
              )}
            </div>
            
            {activeDropdown === 'req' && (
              <div className="absolute top-full right-0 mt-2 w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20 max-h-[300px] overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => handleReqSelect('')} 
                  className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors ${!reqFilter ? 'text-[#1E707D] bg-[#1E707D]/5 font-bold' : 'text-gray-700'}`}
                >
                  All Requirements
                </button>
                {requirements.map(req => {
                  const isActive = reqFilter === req.id;
                  const code = req.reqCode || `REQ-${String(req.id).padStart(2, '0')}`;
                  return (
                    <button 
                      key={req.id} 
                      onClick={() => handleReqSelect(req.id)} 
                      className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors truncate ${isActive ? 'text-[#1E707D] bg-[#1E707D]/5 font-bold' : 'text-gray-700'}`}
                      title={`${code} - ${req.title}`}
                    >
                      {code} - {req.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Status Dropdown */}
          {!hideStatusFilter && (
          <div className="relative">
            <div 
              onClick={() => !isDraftView && setActiveDropdown(activeDropdown === 'status' ? null : 'status')}
              className={`h-[34px] px-3 flex items-center justify-between gap-2 border rounded-full text-[12px] font-medium transition-colors cursor-pointer min-w-[110px] ${
                isDraftView ? 'text-gray-400 bg-gray-50/50 border-gray-200 cursor-not-allowed' : 
                statusFilter ? 'bg-[#1E707D]/10 text-[#1E707D] border-[#1E707D]/30' : 
                'bg-white text-[#374151] border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-[14px]">filter_list</span>
                <span className="truncate">{getDisplayStatus(statusFilter)}</span>
              </div>
              {statusFilter && !isDraftView ? (
                <span className="material-symbols-outlined text-[14px] hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleStatusSelect(null); }}>close</span>
              ) : (
                <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
              )}
            </div>
            
            {activeDropdown === 'status' && !isDraftView && (
              <div className="absolute top-full right-0 mt-2 w-[140px] bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20">
                {statusOptions.map(option => {
                  const isActive = statusFilter === getBackendStatus(option);
                  return (
                    <button 
                      key={option} 
                      onClick={() => handleStatusSelect(option)} 
                      className={`w-full text-left px-4 py-2 text-[12px] hover:bg-gray-50 transition-colors ${isActive ? 'text-[#1E707D] bg-[#1E707D]/5 font-bold' : 'text-gray-700'}`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          )}

          <div className="text-[12px] font-bold text-gray-500 ml-1 bg-gray-100 px-2 py-1 rounded-md">
            {resultCount || 0} items
          </div>
        </div>

      </div>
    </div>
  );
};

export default UseCaseToolbar;
