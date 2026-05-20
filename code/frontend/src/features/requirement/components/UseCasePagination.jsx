import React from 'react';

const UseCasePagination = ({ currentPage, totalPages, totalElements, onPageChange, pageSize }) => {
  if (totalElements === 0) return null;

  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalElements);
  
  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="p-4 border-t border-outline-variant bg-[#f8fafc] flex items-center justify-between">
      <span className="font-body-md text-body-md text-on-surface-variant">
        Showing {start} to {end} of {totalElements} results
      </span>
      <div className="flex gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-outline hover:bg-surface-container-low transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
        </button>
        
        {generatePageNumbers().map(page => (
          <button 
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded flex items-center justify-center font-label-md text-label-md ${
              currentPage === page 
                ? 'bg-primary text-on-primary' 
                : 'border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors'
            }`}
          >
            {page + 1}
          </button>
        ))}

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages - 1 || totalPages === 0}
          className="w-8 h-8 rounded flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default UseCasePagination;
