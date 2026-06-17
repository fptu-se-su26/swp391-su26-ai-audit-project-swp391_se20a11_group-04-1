import React from 'react';
import RequirementItem from './RequirementItem';
import RequirementPagination from './RequirementPagination';

const RequirementList = ({
  requirements,
  onDelete,
  onEdit,
  onRefresh,
  pagination,
  onPageChange
}) => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="grid grid-cols-12 gap-3 bg-surface-container-low px-stack_md py-2.5 border-b border-outline-variant font-label-md text-label-md text-secondary uppercase tracking-wider">
        <div className="col-span-4 sm:col-span-3 lg:col-span-4">ID & Title</div>
        <div className="col-span-3 sm:col-span-2 hidden sm:block">Status & Priority</div>
        <div className="col-span-2 hidden lg:block">Tags</div>
        <div className="col-span-3 lg:col-span-2 hidden md:block">Metrics</div>
        <div className="col-span-4 sm:col-span-3 lg:col-span-2 flex items-center pr-2">
          <div className="flex-1 flex justify-center">Owner</div>
          <div className="w-8 shrink-0" />
        </div>
      </div>

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

      {pagination && (
        <RequirementPagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default RequirementList;
