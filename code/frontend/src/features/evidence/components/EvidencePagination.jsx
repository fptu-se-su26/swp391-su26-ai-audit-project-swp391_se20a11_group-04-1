import React from 'react';

/**
 * EvidencePagination — Pagination component cho danh sách Evidence
 * Reuse pattern từ UseCasePagination
 */
const EvidencePagination = ({ currentPage, totalPages, totalElements, pageSize, onPageChange }) => {
  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalElements);

  if (totalElements === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant bg-surface-container-lowest">
      <p className="font-body-md text-[13px] text-on-surface-variant">
        Showing <span className="font-semibold text-on-surface">{startItem}</span> –{' '}
        <span className="font-semibold text-on-surface">{endItem}</span> of{' '}
        <span className="font-semibold text-on-surface">{totalElements}</span> results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={currentPage === 0}
          className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="First page"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">first_page</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous page"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_left</span>
        </button>
        <span className="px-3 py-1 font-body-md text-[13px] text-on-surface font-medium">
          {currentPage + 1} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next page"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">chevron_right</span>
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={currentPage >= totalPages - 1}
          className="p-1.5 rounded-lg hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Last page"
        >
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">last_page</span>
        </button>
      </div>
    </div>
  );
};

export default EvidencePagination;
