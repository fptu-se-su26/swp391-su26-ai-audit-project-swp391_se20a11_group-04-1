import React from 'react';

const Badge = ({ status, className = '' }) => {
  const statusStyles = {
    'Complete': 'bg-[#e6f4ea] text-[#137333]',
    'In Review': 'bg-[#fef7e0] text-[#b06000]',
    'Draft': 'bg-surface-variant text-on-surface-variant',
  };

  const defaultStyle = statusStyles[status] || statusStyles['Draft'];

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded font-label-md text-[10px] uppercase font-bold tracking-wider ${defaultStyle} ${className}`}>
      {status}
    </span>
  );
};

export default Badge;
