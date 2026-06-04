import React from 'react';
import Input from '../../../components/ui/Input';

const UseCaseToolbar = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange }) => {
  return (
    <div className="px-[32px] mt-[16px] mb-6">
      <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-[12px_16px] flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Search input */}
        <div className="flex-1 w-full relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-[#9CA3AF] text-[18px]">search</span>
          <input 
            type="text"
            placeholder="Search ID or Name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent border-none outline-none pl-10 text-[13px] text-[#111827] placeholder-[#9CA3AF]"
          />
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-[6px] w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-[32px] bg-transparent border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] px-3 outline-none hover:bg-gray-50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
          </select>
          <button className="h-[32px] px-3 flex items-center justify-center gap-1.5 bg-transparent border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[16px]">sort</span>
            Sort
          </button>
          <button className="h-[32px] px-3 flex items-center justify-center gap-1.5 bg-transparent border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#374151] hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined text-[16px]">view_column</span>
            Columns
          </button>
        </div>

      </div>
    </div>
  );
};

export default UseCaseToolbar;
