import React from 'react';
import RequirementItem from './RequirementItem';

const RequirementList = ({ requirements, onDelete, onEdit, onRefresh }) => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm pb-1">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 bg-surface-container-low px-stack_md py-3 border-b border-outline-variant font-label-md text-label-md text-secondary uppercase tracking-wider rounded-t-xl">
        <div className="col-span-4 sm:col-span-3 lg:col-span-4">ID & Title</div>
        <div className="col-span-3 sm:col-span-2 hidden sm:block">Status & Priority</div>
        <div className="col-span-2 hidden lg:block">Tags</div>
        <div className="col-span-3 lg:col-span-2 hidden md:block">Metrics</div>
        <div className="col-span-4 sm:col-span-3 lg:col-span-2 flex items-center pr-2">
          <div className="flex-1 flex justify-center">Owner</div>
          <div className="w-8 flex-shrink-0"></div>
        </div>
      </div>
      
      {/* Table Rows */}
      <div className="divide-y divide-outline-variant">
        {requirements.map((req) => (
          <RequirementItem 
            key={req.id} 
            req={req} 
            onDelete={() => onDelete(req.id)}
            onEdit={() => onEdit(req)}
            onRefresh={onRefresh}
          />
        ))}
      </div>
    </div>
  );
};

export default RequirementList;
