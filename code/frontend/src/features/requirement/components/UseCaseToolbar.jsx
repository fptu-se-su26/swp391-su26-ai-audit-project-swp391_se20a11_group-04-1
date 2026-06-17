import React from 'react';
import Input from '../../../components/ui/Input';

const UseCaseToolbar = ({ searchTerm, onSearchChange, statusFilter, onStatusFilterChange }) => {
  return (
    <div className="p-stack_md border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-50">
      <div className="w-full sm:w-72">
        <Input 
          icon="search" 
          placeholder="Search ID or Name..." 
          className="bg-surface-container-lowest"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <select 
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="bg-surface-container-lowest border border-outline-variant text-on-surface px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-body-md font-body-md focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant text-on-surface px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-body-md font-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sort</span>
          Sort
        </button>
        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-surface-container-lowest border border-outline-variant text-on-surface px-3 py-2 rounded-lg hover:bg-surface-container-low transition-colors text-body-md font-body-md">
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_column</span>
          Columns
        </button>
      </div>
    </div>
  );
};

export default UseCaseToolbar;
