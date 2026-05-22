import React from 'react';

const RequirementPagination = ({ currentPage, totalPages, totalItems, pageSize, onPageChange }) => {
  if (totalItems === 0) return null;

  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index);

  return (
    <div className="flex flex-col gap-3 border-t border-outline-variant bg-surface-container-low px-stack_md py-3 sm:flex-row sm:items-center sm:justify-between rounded-b-xl">
      <p className="font-body-md text-body-md text-on-surface-variant">
        Showing {start}-{end} of {totalItems} requirements
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="h-8 rounded-md border border-outline-variant bg-surface px-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-45"
        >
          Previous
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-8 min-w-8 rounded-md px-2 font-label-md text-label-md transition-colors ${
              currentPage === page
                ? 'bg-primary text-on-primary shadow-sm'
                : 'border border-outline-variant bg-surface text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {page + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="h-8 rounded-md border border-outline-variant bg-surface px-3 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-45"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RequirementPagination;
