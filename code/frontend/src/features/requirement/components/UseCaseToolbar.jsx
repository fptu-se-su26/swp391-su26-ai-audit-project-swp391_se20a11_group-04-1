import React from 'react';
import Input from '../../../components/ui/Input';

const UseCaseToolbar = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange, isDraftView, setIsDraftView }) => {
  return (
    <div className="px-[32px] mt-[16px] mb-6">
      <div className={`border rounded-[12px] p-[12px_16px] flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${isDraftView ? 'bg-orange-50 border-orange-200' : 'bg-white border-[#E5E7EB]'}`}>
        
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
          <button 
            onClick={() => setIsDraftView(!isDraftView)}
            className={`h-[32px] px-3 flex items-center justify-center gap-1.5 border rounded-[8px] text-[12px] font-medium transition-colors ${isDraftView ? 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200' : 'bg-transparent text-[#374151] border-[#E5E7EB] hover:bg-gray-50'}`}
          >
            <span className="material-symbols-outlined text-[16px]">edit_document</span>
            Diagram Drafts
          </button>
          <select 
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            disabled={isDraftView}
            className={`h-[32px] bg-transparent border border-[#E5E7EB] rounded-[8px] text-[12px] px-3 outline-none transition-colors appearance-none ${isDraftView ? 'text-gray-400 cursor-not-allowed bg-gray-50/50' : 'text-[#374151] hover:bg-gray-50 cursor-pointer'}`}
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
